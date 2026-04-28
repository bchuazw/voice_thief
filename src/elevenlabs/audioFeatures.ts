import type { Emotion } from "./tts";

export interface StressScore {
  score: number;
  emotion: Emotion;
  passes: boolean;
}

const VAULT_AUTH_THRESHOLD = 0.4;

export function scoreStressFromSourceTag(emotion: Emotion): StressScore {
  const score = emotion === "calm" ? 0.15 : emotion === "stressed" ? 0.6 : 0.92;
  return { score, emotion, passes: score < VAULT_AUTH_THRESHOLD };
}

export function vaultAuthThreshold(): number {
  return VAULT_AUTH_THRESHOLD;
}
