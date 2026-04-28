"use client";

import { useEffect, useRef } from "react";
import { useGame } from "./store";
import { distance } from "./pathfinding";
import { findActiveMoment } from "./npcSchedules";
import { makeMockRecordingBlob } from "@/audio/mockRecorder";
import type { Emotion, NpcId, VoiceCard } from "./types";

const MAX_DURATION_MS = 30_000;

interface ActiveRecorder {
  recorder: MediaRecorder | null;
  stream: MediaStream | null;
  startedAt: number;
  npcId: NpcId;
  momentId: string;
  emotion: Emotion;
  chunks: Blob[];
  mock: boolean;
}

let active: ActiveRecorder | null = null;

function eligibleNpcNearPlayer(): {
  npcId: NpcId;
  momentId: string;
  emotion: Emotion;
} | null {
  const s = useGame.getState();
  for (const id of Object.keys(s.npcs) as NpcId[]) {
    const npc = s.npcs[id];
    if (!npc.isSpeaking) continue;
    if (npc.currentLocation !== s.player.currentLocation) continue;
    if (distance(npc.location, s.player.position) > 4.5) continue;
    const moment = findActiveMoment(id, s.inGameTime, npc.branch);
    if (!moment?.recordable) continue;
    return { npcId: id, momentId: moment.id, emotion: moment.emotion };
  }
  return null;
}

async function startMicRecorder(): Promise<{ recorder: MediaRecorder; stream: MediaStream } | null> {
  if (typeof navigator === "undefined") return null;
  if (!navigator.mediaDevices?.getUserMedia) return null;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    recorder.start(250);
    return { recorder, stream };
  } catch {
    return null;
  }
}

export async function beginRecording(): Promise<void> {
  if (active) return;
  const target = eligibleNpcNearPlayer();
  if (!target) {
    useGame.getState().pushToast("Nothing to record here.");
    return;
  }
  useGame.getState().startRecording(target.npcId);

  const mic = await startMicRecorder();
  active = {
    recorder: mic?.recorder ?? null,
    stream: mic?.stream ?? null,
    startedAt: Date.now(),
    npcId: target.npcId,
    momentId: target.momentId,
    emotion: target.emotion,
    chunks: [],
    mock: !mic,
  };

  if (mic) {
    mic.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) active?.chunks.push(e.data);
    };
  }

  setTimeout(() => {
    if (active && Date.now() - active.startedAt >= MAX_DURATION_MS) endRecording().catch(() => {});
  }, MAX_DURATION_MS + 200);
}

export async function endRecording(): Promise<void> {
  if (!active) return;
  const local = active;
  active = null;
  useGame.getState().stopRecording();

  const durationMs = Date.now() - local.startedAt;
  if (durationMs < 600) {
    useGame.getState().pushToast("Recording too short. Hold longer.");
    if (local.recorder) {
      local.recorder.stop();
      local.stream?.getTracks().forEach((t) => t.stop());
    }
    return;
  }

  let blob: Blob;
  if (local.recorder && local.recorder.state !== "inactive") {
    await new Promise<void>((resolve) => {
      local.recorder!.onstop = () => resolve();
      local.recorder!.stop();
    });
    blob = new Blob(local.chunks, { type: local.recorder.mimeType });
    local.stream?.getTracks().forEach((t) => t.stop());
  } else {
    blob = makeMockRecordingBlob(durationMs);
  }

  const form = new FormData();
  form.append("audio", blob, "sample.webm");
  form.append("npcId", local.npcId);
  form.append("sourceMomentId", local.momentId);
  form.append("emotion", local.emotion);

  try {
    const res = await fetch("/api/clone", { method: "POST", body: form });
    if (!res.ok) throw new Error(`clone failed: ${res.status}`);
    const json = (await res.json()) as { voiceId: string; mock: boolean };

    const card: VoiceCard = {
      id: `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      npcId: local.npcId,
      elevenLabsVoiceId: json.voiceId,
      capturedAtInGameTime: useGame.getState().inGameTime,
      emotionalState: local.emotion,
      durationSeconds: Math.min(30, durationMs / 1000),
      sourceMomentId: local.momentId,
      mock: json.mock,
    };
    useGame.getState().addVoiceCard(card);
    useGame.getState().pushToast(`Voice captured: ${local.npcId} (${local.emotion}).`);

    const npc = useGame.getState().npcs[local.npcId];
    if (npc.noticedRecording === false && Math.random() < 0.18) {
      useGame.getState().updateNpc(local.npcId, { noticedRecording: true });
      useGame.getState().raiseSuspicion(5, "noticed during recording");
    }
  } catch (err) {
    useGame.getState().pushToast(`Recording failed: ${(err as Error).message}`);
  }
}

export function useRecordingHotkey(): void {
  const heldRef = useRef(false);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat) return;
      if (e.key !== "e" && e.key !== "E") return;
      heldRef.current = true;
      beginRecording().catch(() => {});
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key !== "e" && e.key !== "E") return;
      if (!heldRef.current) return;
      heldRef.current = false;
      endRecording().catch(() => {});
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}
