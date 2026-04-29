"use client";

import { useGame } from "@/game/store";

const activeAudio = new Set<HTMLAudioElement>();

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
    const cleanup = () => activeAudio.delete(audio);
    audio.volume = audioVolume;
    activeAudio.add(audio);
    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });
    audio.play().catch(() => {});
    return audio;
  } catch {
    return null;
  }
}

export function stopAllUiAudio(): void {
  for (const audio of activeAudio) {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {}
  }
  activeAudio.clear();
}
