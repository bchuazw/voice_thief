"use client";

import { Howl } from "howler";
import { useGame } from "@/game/store";
import bankManagerScripts from "@/config/scripts/bankManager.json";
import secretaryScripts from "@/config/scripts/secretary.json";
import bankGuardScripts from "@/config/scripts/bankGuard.json";
import wifeScripts from "@/config/scripts/wife.json";
import type { Emotion, NpcId } from "@/game/types";

const activeSounds = new Map<NpcId, Howl>();
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

for (const file of SCRIPT_FILES) {
  for (const moment of file.moments) {
    SPEECH_MOMENTS.set(moment.id, {
      npcId: file.npc,
      emotion: moment.emotion,
      lines: moment.lines,
    });
  }
}

let speechToken = 0;
let activeSpeech: ActiveSpeech | null = null;

function urlForMoment(momentId: string): string {
  return `/audio/npc-scripts/${momentId}.mp3`;
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
}

export function speakStolenText(npcId: NpcId, text: string, emotion: Emotion = "calm"): boolean {
  return speakLines(npcId, [{ text, pause: 0.2 }], emotion);
}

export function speakLines(npcId: NpcId, lines: ScriptLine[], emotion: Emotion = "calm"): boolean {
  if (!canSpeakInBrowser() || lines.length === 0) return false;

  const { audioMuted, audioVolume } = useGame.getState();
  if (audioMuted) return true;

  stopSpeech();

  const synth = window.speechSynthesis;
  const token = ++speechToken;
  const active: ActiveSpeech = { npcId, token, timers: [] };
  activeSpeech = active;
  const voice = chooseVoice(npcId);
  const settings = speechSettings(npcId, emotion);

  const speakAt = (index: number) => {
    if (!activeSpeech || activeSpeech.token !== token) return;
    const line = lines[index];
    if (!line) {
      activeSpeech = null;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.volume = audioVolume;
    utterance.pitch = settings.pitch;
    utterance.rate = settings.rate;
    try {
      if (voice) utterance.voice = voice;
    } catch {}
    utterance.onend = () => {
      if (!activeSpeech || activeSpeech.token !== token) return;
      const timer = window.setTimeout(
        () => speakAt(index + 1),
        Math.max(120, line.pause * 1000),
      );
      activeSpeech.timers.push(timer);
    };
    utterance.onerror = () => {
      if (activeSpeech?.token === token) activeSpeech = null;
    };
    synth.speak(utterance);
    synth.resume();
  };

  speakAt(0);
  return true;
}

export function startNpcAudio(npcId: NpcId, momentId: string): void {
  stopNpcAudio(npcId);
  const { audioMuted, audioVolume } = useGame.getState();
  if (audioMuted) return;
  const speechMoment = SPEECH_MOMENTS.get(momentId);
  if (FORCE_BROWSER_SPEECH && speechMoment) {
    speakLines(speechMoment.npcId, speechMoment.lines, speechMoment.emotion);
    return;
  }
  const url = urlForMoment(momentId);
  const sound = new Howl({
    src: [url],
    volume: audioVolume,
    html5: true,
    onloaderror: () => {
      if (speechMoment) speakLines(speechMoment.npcId, speechMoment.lines, speechMoment.emotion);
    },
    onplayerror: () => {
      if (speechMoment) speakLines(speechMoment.npcId, speechMoment.lines, speechMoment.emotion);
    },
  });
  sound.play();
  activeSounds.set(npcId, sound);
}

export function stopNpcAudio(npcId: NpcId): void {
  stopSpeech(npcId);
  const existing = activeSounds.get(npcId);
  if (existing) {
    try {
      existing.stop();
      existing.unload();
    } catch {}
    activeSounds.delete(npcId);
  }
}

export function stopAllNpcAudio(): void {
  stopSpeech();
  for (const [k] of activeSounds) stopNpcAudio(k);
}
