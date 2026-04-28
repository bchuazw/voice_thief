"use client";

import { Howl } from "howler";
import { useGame } from "@/game/store";
import type { NpcId } from "@/game/types";

const activeSounds = new Map<NpcId, Howl>();

function urlForMoment(momentId: string): string {
  return `/audio/npc-scripts/${momentId}.mp3`;
}

export function startNpcAudio(npcId: NpcId, momentId: string): void {
  stopNpcAudio(npcId);
  const { audioMuted, audioVolume } = useGame.getState();
  if (audioMuted) return;
  const url = urlForMoment(momentId);
  const sound = new Howl({
    src: [url],
    volume: audioVolume,
    html5: true,
    onloaderror: () => {},
    onplayerror: () => {},
  });
  sound.play();
  activeSounds.set(npcId, sound);
}

export function stopNpcAudio(npcId: NpcId): void {
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
  for (const [k] of activeSounds) stopNpcAudio(k);
}
