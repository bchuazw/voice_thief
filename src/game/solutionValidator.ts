import { distance } from "./pathfinding";
import { scoreStressFromSourceTag } from "@/elevenlabs/audioFeatures";
import type { AuthAttempt, GameState, NpcId, VoiceCard } from "./types";

export interface AuthRequirement {
  device: AuthAttempt["device"];
  expectedNpc: NpcId;
  requiredEmotion: "calm";
  phrase: string;
}

export const AUTH_REQUIREMENTS: Record<AuthAttempt["device"], AuthRequirement> = {
  bankFront: {
    device: "bankFront",
    expectedNpc: "bankManager",
    requiredEmotion: "calm",
    phrase: "Closing for the night, code 7-7-1",
  },
  bankHallway: {
    device: "bankHallway",
    expectedNpc: "secretary",
    requiredEmotion: "calm",
    phrase: "Records access, Lillian Park",
  },
  vault: {
    device: "vault",
    expectedNpc: "bankManager",
    requiredEmotion: "calm",
    phrase: "Authorize vault, code 7-7-1",
  },
};

export interface AuthVerdict {
  passes: boolean;
  reason: string;
  stressScore: number;
}

export function evaluateAuth(card: VoiceCard, requirement: AuthRequirement): AuthVerdict {
  if (card.npcId !== requirement.expectedNpc) {
    return {
      passes: false,
      reason: `Voice mismatch — system expects ${requirement.expectedNpc}.`,
      stressScore: 1,
    };
  }
  const score = scoreStressFromSourceTag(card.emotionalState);
  if (!score.passes) {
    return {
      passes: false,
      reason: `Voice too ${card.emotionalState} — try a calmer recording.`,
      stressScore: score.score,
    };
  }
  return {
    passes: true,
    reason: "Voiceprint accepted.",
    stressScore: score.score,
  };
}

export function validateVaultOpening(state: GameState, card: VoiceCard): AuthVerdict {
  const verdict = evaluateAuth(card, AUTH_REQUIREMENTS.vault);
  if (!verdict.passes) return verdict;
  if (state.suspicion >= 100) {
    return { passes: false, reason: "Alarm already raised.", stressScore: verdict.stressScore };
  }
  const secretary = state.npcs.secretary;
  if (secretary.branch !== "runningErrand") {
    return {
      passes: false,
      reason: "Lillian's closing ledger is still active - clear her from the counter first.",
      stressScore: verdict.stressScore,
    };
  }
  const guard = state.npcs.bankGuard;
  if (
    guard.currentLocation === "bankLobby" &&
    distance(guard.location, state.player.position) < 5
  ) {
    return {
      passes: false,
      reason: "Guard is too close — he'll hear the vault clunk.",
      stressScore: verdict.stressScore,
    };
  }
  return verdict;
}
