"use client";

import { Howl } from "howler";
import { useGame } from "@/game/store";
import { NPC_SCHEDULES } from "@/game/npcSchedules";
import { distance } from "@/game/pathfinding";
import bankManagerScripts from "@/config/scripts/bankManager.json";
import secretaryScripts from "@/config/scripts/secretary.json";
import bankGuardScripts from "@/config/scripts/bankGuard.json";
import wifeScripts from "@/config/scripts/wife.json";
import type { Emotion, NpcId } from "@/game/types";

const PROXIMITY_FULL_VOLUME_DISTANCE = 2.5;
const PROXIMITY_FADE_DISTANCE = 16;

interface ActiveSound {
  sound: Howl;
  spatial: boolean;
}

interface NpcAudioOptions {
  spatial?: boolean;
}

const activeSounds = new Map<NpcId, ActiveSound>();
const FORCE_BROWSER_SPEECH = process.env.NEXT_PUBLIC_VT_NPC_AUDIO === "speech";

interface ScriptLine {
  text: string;
  pause: number;
}

interface ScriptMoment {
  id: string;
  emotion: Emotion;
  lines: ScriptLine[];
}

interface ScriptFile {
  npc: NpcId;
  moments: ScriptMoment[];
}

interface ActiveSpeech {
  npcId: NpcId;
  token: number;
  timers: number[];
  spatial: boolean;
  utterance: SpeechSynthesisUtterance | null;
}

const SCRIPT_FILES = [
  bankManagerScripts,
  secretaryScripts,
  bankGuardScripts,
  wifeScripts,
] as ScriptFile[];

const SPEECH_MOMENTS = new Map<
  string,
  { npcId: NpcId; emotion: Emotion; lines: ScriptLine[] }
>();
const AUDIO_ID_BY_MOMENT_ID = new Map<string, string>();

for (const file of SCRIPT_FILES) {
  for (const moment of file.moments) {
    SPEECH_MOMENTS.set(moment.id, {
      npcId: file.npc,
      emotion: moment.emotion,
      lines: moment.lines,
    });
  }
}

for (const moments of Object.values(NPC_SCHEDULES)) {
  for (const moment of moments) {
    AUDIO_ID_BY_MOMENT_ID.set(moment.id, moment.scriptId);
  }
}

let speechToken = 0;
let activeSpeech: ActiveSpeech | null = null;
let proximityTimer: number | null = null;

export function npcDistanceGain(distanceUnits: number): number {
  if (!Number.isFinite(distanceUnits)) return 0;
  if (distanceUnits <= PROXIMITY_FULL_VOLUME_DISTANCE) return 1;
  if (distanceUnits >= PROXIMITY_FADE_DISTANCE) return 0;
  const t =
    (PROXIMITY_FADE_DISTANCE - distanceUnits) /
    (PROXIMITY_FADE_DISTANCE - PROXIMITY_FULL_VOLUME_DISTANCE);
  return Math.max(0, Math.min(1, 0.08 + 0.92 * t * t));
}

function npcProximityGain(npcId: NpcId, spatial: boolean): number {
  if (!spatial) return 1;
  const state = useGame.getState();
  const npc = state.npcs[npcId];
  if (!npc || npc.currentLocation !== state.player.currentLocation) return 0;
  return npcDistanceGain(distance(npc.location, state.player.position));
}

function npcEffectiveVolume(npcId: NpcId, spatial: boolean): number {
  const { audioMuted, audioVolume } = useGame.getState();
  if (audioMuted) return 0;
  return Math.max(0, Math.min(1, audioVolume * npcProximityGain(npcId, spatial)));
}

function hasActiveSpatialAudio(): boolean {
  if (activeSpeech?.spatial) return true;
  for (const active of activeSounds.values()) {
    if (active.spatial) return true;
  }
  return false;
}

function stopProximityLoopIfIdle(): void {
  if (activeSounds.size > 0 || activeSpeech) return;
  if (typeof window === "undefined") {
    proximityTimer = null;
    return;
  }
  if (proximityTimer !== null) {
    window.clearInterval(proximityTimer);
    proximityTimer = null;
  }
}

function updateActiveNpcVolumes(): void {
  for (const [npcId, active] of activeSounds) {
    active.sound.volume(npcEffectiveVolume(npcId, active.spatial));
  }
  if (activeSpeech?.utterance) {
    activeSpeech.utterance.volume = npcEffectiveVolume(activeSpeech.npcId, activeSpeech.spatial);
  }
}

function ensureProximityLoop(): void {
  if (typeof window === "undefined" || proximityTimer !== null || !hasActiveSpatialAudio()) return;
  updateActiveNpcVolumes();
  proximityTimer = window.setInterval(updateActiveNpcVolumes, 120);
}

function audioIdForMoment(momentId: string): string {
  return AUDIO_ID_BY_MOMENT_ID.get(momentId) ?? momentId;
}

function urlForMoment(momentId: string): string {
  return `/audio/npc-scripts/${audioIdForMoment(momentId)}.mp3`;
}

function canSpeakInBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

function chooseVoice(npcId: NpcId): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const pool = englishVoices.length > 0 ? englishVoices : voices;
  const preferences: Record<NpcId, RegExp[]> = {
    bankManager: [/david/i, /mark/i, /george/i, /daniel/i, /guy/i, /male/i],
    bankGuard: [/guy/i, /david/i, /mark/i, /george/i, /male/i],
    secretary: [/zira/i, /jenny/i, /aria/i, /samantha/i, /hazel/i, /female/i],
    wife: [/samantha/i, /zira/i, /jenny/i, /susan/i, /female/i],
  };

  for (const pattern of preferences[npcId]) {
    const match = pool.find((voice) => pattern.test(voice.name));
    if (match) return match;
  }

  return pool[0] ?? null;
}

function speechSettings(npcId: NpcId, emotion: Emotion): { pitch: number; rate: number } {
  const base: Record<NpcId, { pitch: number; rate: number }> = {
    bankManager: { pitch: 0.78, rate: 0.9 },
    bankGuard: { pitch: 0.82, rate: 0.86 },
    secretary: { pitch: 1.08, rate: 1 },
    wife: { pitch: 1.12, rate: 0.94 },
  };
  const emotionRate: Record<Emotion, number> = {
    calm: 1,
    stressed: 1.12,
    panicked: 1.24,
  };
  const emotionPitch: Record<Emotion, number> = {
    calm: 1,
    stressed: 1.05,
    panicked: 1.12,
  };

  return {
    pitch: Math.max(0.1, Math.min(2, base[npcId].pitch * emotionPitch[emotion])),
    rate: Math.max(0.1, Math.min(2, base[npcId].rate * emotionRate[emotion])),
  };
}

function stopSpeech(npcId?: NpcId): void {
  if (!activeSpeech || (npcId && activeSpeech.npcId !== npcId)) return;
  for (const timer of activeSpeech.timers) window.clearTimeout(timer);
  activeSpeech = null;
  if (canSpeakInBrowser()) window.speechSynthesis.cancel();
  stopProximityLoopIfIdle();
}

export function speakStolenText(npcId: NpcId, text: string, emotion: Emotion = "calm"): boolean {
  return speakLines(npcId, [{ text, pause: 0.2 }], emotion, { spatial: false });
}

export function speakLines(
  npcId: NpcId,
  lines: ScriptLine[],
  emotion: Emotion = "calm",
  options: NpcAudioOptions = {},
): boolean {
  if (!canSpeakInBrowser() || lines.length === 0) return false;

  const { audioMuted } = useGame.getState();
  if (audioMuted) return true;

  stopSpeech();

  const synth = window.speechSynthesis;
  const token = ++speechToken;
  const spatial = options.spatial ?? false;
  const active: ActiveSpeech = { npcId, token, timers: [], spatial, utterance: null };
  activeSpeech = active;
  const voice = chooseVoice(npcId);
  const settings = speechSettings(npcId, emotion);
  ensureProximityLoop();

  const speakAt = (index: number) => {
    if (!activeSpeech || activeSpeech.token !== token) return;
    const line = lines[index];
    if (!line) {
      activeSpeech.utterance = null;
      activeSpeech = null;
      stopProximityLoopIfIdle();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.volume = npcEffectiveVolume(npcId, spatial);
    utterance.pitch = settings.pitch;
    utterance.rate = settings.rate;
    activeSpeech.utterance = utterance;
    try {
      if (voice) utterance.voice = voice;
    } catch {}
    utterance.onend = () => {
      if (!activeSpeech || activeSpeech.token !== token) return;
      activeSpeech.utterance = null;
      const timer = window.setTimeout(
        () => speakAt(index + 1),
        Math.max(120, line.pause * 1000),
      );
      activeSpeech.timers.push(timer);
    };
    utterance.onerror = () => {
      if (activeSpeech?.token === token) activeSpeech = null;
      stopProximityLoopIfIdle();
    };
    synth.speak(utterance);
    synth.resume();
  };

  speakAt(0);
  return true;
}

export function startNpcAudio(
  npcId: NpcId,
  momentId: string,
  options: NpcAudioOptions = {},
): void {
  stopNpcAudio(npcId);
  const { audioMuted } = useGame.getState();
  if (audioMuted) return;
  const spatial = options.spatial ?? true;
  const speechMoment = SPEECH_MOMENTS.get(audioIdForMoment(momentId));
  if (FORCE_BROWSER_SPEECH && speechMoment) {
    speakLines(speechMoment.npcId, speechMoment.lines, speechMoment.emotion, { spatial });
    return;
  }
  const url = urlForMoment(momentId);
  const sound = new Howl({
    src: [url],
    volume: npcEffectiveVolume(npcId, spatial),
    html5: true,
    onloaderror: () => {
      activeSounds.delete(npcId);
      try {
        sound.unload();
      } catch {}
      if (speechMoment) {
        speakLines(speechMoment.npcId, speechMoment.lines, speechMoment.emotion, { spatial });
      }
      stopProximityLoopIfIdle();
    },
    onplayerror: () => {
      activeSounds.delete(npcId);
      try {
        sound.unload();
      } catch {}
      if (speechMoment) {
        speakLines(speechMoment.npcId, speechMoment.lines, speechMoment.emotion, { spatial });
      }
      stopProximityLoopIfIdle();
    },
    onend: () => {
      activeSounds.delete(npcId);
      try {
        sound.unload();
      } catch {}
      stopProximityLoopIfIdle();
    },
  });
  sound.play();
  activeSounds.set(npcId, { sound, spatial });
  ensureProximityLoop();
}

export function stopNpcAudio(npcId: NpcId): void {
  stopSpeech(npcId);
  const existing = activeSounds.get(npcId)?.sound;
  if (existing) {
    try {
      existing.stop();
      existing.unload();
    } catch {}
    activeSounds.delete(npcId);
  }
  stopProximityLoopIfIdle();
}

export function stopAllNpcAudio(): void {
  stopSpeech();
  for (const [k] of activeSounds) stopNpcAudio(k);
}
