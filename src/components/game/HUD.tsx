"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { clockLabel } from "@/game/timeFormat";
import { GAME_END_SECONDS } from "@/game/types";
import { distance } from "@/game/pathfinding";
import { findActiveMoment } from "@/game/npcSchedules";
import { beginRecording, endRecording, useRecordingHotkey } from "@/game/recordingManager";
import { suspicionTier } from "@/game/emotionDisplay";
import { NPC_PROFILES } from "@/config/voices";
import type { NpcId } from "@/game/types";

const RECORD_GOOD_MS = 5000;
const RECORD_MAX_MS = 30000;

export default function HUD() {
  const time = useGame((s) => s.inGameTime);
  const suspicion = useGame((s) => s.suspicion);
  const playerPos = useGame((s) => s.player.position);
  const npcs = useGame((s) => s.npcs);
  const inventory = useGame((s) => s.voiceInventory);
  const toggleNotebook = useGame((s) => s.toggleNotebook);
  const togglePhone = useGame((s) => s.togglePhone);
  const isRecording = useGame((s) => s.player.isRecording);
  const recordingStartedAt = useGame((s) => s.player.recordingStartedAt);
  const notebookOpen = useGame((s) => s.notebookOpen);
  const phoneOpen = useGame((s) => s.phoneOpen);
  const activeAuth = useGame((s) => s.activeAuth);
  const isPaused = notebookOpen || phoneOpen || activeAuth !== null;

  useRecordingHotkey();

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [isRecording]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "n" || e.key === "N") toggleNotebook();
      if (e.key === "p" || e.key === "P") togglePhone();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleNotebook, togglePhone]);

  let recordableNpc: NpcId | null = null;
  for (const id of Object.keys(npcs) as NpcId[]) {
    const npc = npcs[id];
    if (!npc.isSpeaking) continue;
    const moment = findActiveMoment(id, time, npc.branch);
    if (!moment?.recordable) continue;
    if (distance(npc.location, playerPos) < 4.5) {
      recordableNpc = id;
      break;
    }
  }

  const minutesLeft = Math.max(0, (GAME_END_SECONDS - time) / 60);
  const timeUrgent = minutesLeft < 30;

  const recordedMs = isRecording && recordingStartedAt ? now - recordingStartedAt : 0;
  const recordPct = Math.min(1, recordedMs / RECORD_MAX_MS);
  const recordGood = recordedMs >= RECORD_GOOD_MS;

  const tier = suspicionTier(suspicion);
  const suspColor = tier.color;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      <div className="absolute left-4 top-4 flex items-baseline gap-3 rounded bg-black/60 px-3 py-2 text-noir-paper backdrop-blur">
        <span className="text-[11px] uppercase tracking-[0.4em] text-noir-fog">Now</span>
        <span
          className={`font-mono text-2xl ${timeUrgent ? "animate-neon-flicker text-noir-neon" : ""}`}
        >
          {clockLabel(time)}
        </span>
        {isPaused && (
          <span className="ml-1 rounded border border-noir-amber/60 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.3em] text-noir-amber">
            paused
          </span>
        )}
      </div>

      <div className="absolute right-4 top-4 flex flex-col items-end gap-1 rounded bg-black/60 px-3 py-2 backdrop-blur">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] uppercase tracking-[0.4em] text-noir-fog">Suspicion</span>
          <span
            className="font-mono text-xs"
            style={{ color: suspColor }}
            title="At 100, the alarm goes off."
          >
            {Math.round(suspicion)} / 100 · {tier.label}
          </span>
        </div>
        <div
          className="h-2.5 w-44 overflow-hidden rounded bg-noir-ash"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(suspicion)}
          aria-label={`Suspicion ${Math.round(suspicion)} of 100`}
        >
          <div
            className="h-full transition-all"
            style={{ width: `${suspicion}%`, background: suspColor }}
          />
        </div>
      </div>

      <div className="pointer-events-auto absolute bottom-4 left-4 flex flex-col gap-2">
        <button
          onClick={() => toggleNotebook()}
          aria-label="Open notebook"
          className="rounded border border-noir-paper/30 bg-black/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-noir-paper hover:bg-noir-paper hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-noir-amber"
        >
          Notebook ({inventory.length}) · N
        </button>
        <button
          onClick={() => togglePhone()}
          aria-label="Open phone"
          className="rounded border border-noir-paper/30 bg-black/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-noir-paper hover:bg-noir-paper hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-noir-amber"
        >
          Phone · P
        </button>
      </div>

      {/* Persistent control strip — first-time players never miss this */}
      <div className="pointer-events-none absolute bottom-2 right-4 text-right">
        <p className="text-[11px] uppercase tracking-[0.3em] text-noir-fog">
          Click to walk · Hold <kbd className="text-noir-amber">E</kbd> to record · <kbd className="text-noir-amber">N</kbd> notebook · <kbd className="text-noir-amber">P</kbd> phone · <kbd className="text-noir-amber">Esc</kbd> close
        </p>
      </div>

      {/* Recording indicator + accessible on-screen Record button */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 transform">
        {recordableNpc && (
          <button
            type="button"
            onPointerDown={() => beginRecording()}
            onPointerUp={() => endRecording()}
            onPointerLeave={() => isRecording && endRecording()}
            onKeyDown={(e) => {
              if ((e.key === "e" || e.key === "E" || e.key === " " || e.key === "Enter") && !e.repeat) {
                e.preventDefault();
                beginRecording();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === "e" || e.key === "E" || e.key === " " || e.key === "Enter") {
                e.preventDefault();
                endRecording();
              }
            }}
            aria-label={`Record ${NPC_PROFILES[recordableNpc].displayName}, hold to capture`}
            className={`pointer-events-auto flex flex-col items-center gap-1 rounded border bg-black/75 px-4 py-2 text-xs uppercase tracking-[0.3em] backdrop-blur transition focus:outline-none focus-visible:ring-2 focus-visible:ring-noir-amber ${
              isRecording
                ? "border-noir-neon text-noir-neon animate-pulse"
                : "border-noir-amber/60 text-noir-paper hover:bg-noir-paper hover:text-black"
            }`}
            aria-live="polite"
          >
            <span>
              {isRecording
                ? `● Recording ${(recordedMs / 1000).toFixed(1)}s`
                : "Hold to record · E"}
            </span>
            {isRecording && (
              <div
                className="h-1.5 w-44 overflow-hidden rounded bg-noir-ash"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={30}
                aria-valuenow={recordedMs / 1000}
                aria-label="Recording progress"
              >
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${recordPct * 100}%`,
                    background: recordGood ? "#3affa6" : "#f5a623",
                  }}
                />
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
