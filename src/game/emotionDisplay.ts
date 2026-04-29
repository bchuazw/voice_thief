import type { Emotion } from "./types";

/**
 * Color-blind-safe display for emotion tags. The glyph is the primary
 * differentiator; color is a secondary cue.
 */
export function emotionGlyph(e: Emotion): string {
  if (e === "calm") return "○";
  if (e === "stressed") return "◐";
  return "●";
}

export function emotionColorClass(e: Emotion): string {
  if (e === "calm") return "text-[#3affa6]";
  if (e === "stressed") return "text-noir-amber";
  return "text-noir-neon";
}

export function suspicionTier(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "hunted", color: "#ff3c3c" };
  if (score >= 40) return { label: "noticed", color: "#f5a623" };
  if (score > 0) return { label: "watched", color: "#f5a623" };
  return { label: "clean", color: "#3affa6" };
}
