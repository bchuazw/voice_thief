"use client";

import { Howl } from "howler";
import type { NpcId } from "@/game/types";

const activeSounds = new Map<NpcId, Howl>();

function urlForMoment(momentId: string): string {
  return `/audio/npc-scripts/${momentId}.mp3`;
}

export function startNpcAudio(npcId: NpcId, momentId: string): void {
  stopNpcAudio(npcId);
  const url = urlForMoment(momentId);
  const sound = new Howl({
    src: [url],
    volume: 0.85,
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
