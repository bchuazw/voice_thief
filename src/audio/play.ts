"use client";

import { useGame } from "@/game/store";

/**
 * Play a base64 data: URL (or any audio src) respecting the global mute
 * + volume settings from the store. No-op when muted.
 */
export function playAudio(src: string | null): HTMLAudioElement | null {
  if (!src) return null;
  const { audioMuted, audioVolume } = useGame.getState();
  if (audioMuted) return null;
  try {
    const audio = new Audio(src);
    audio.volume = audioVolume;
    audio.play().catch(() => {});
    return audio;
  } catch {
    return null;
  }
}
