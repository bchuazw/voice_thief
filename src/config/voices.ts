import type { NpcId } from "@/game/types";

export const DEFAULT_NPC_VOICE_IDS: Record<NpcId, string> = {
  bankManager: "pqHfZKP75CvOlQylNhV4", // Bill - wise, mature, balanced
  secretary: "hpp4J3VqNfWAUOO0d1Us", // Bella - professional, bright, warm
  bankGuard: "CwhRBWXzGAHq8TQ4Fs17", // Roger - laid-back, resonant
  wife: "XrExE9yKIg1WjnnlVkGX", // Matilda - mature, upbeat
};

/**
 * Pre-pinned voice IDs from the ElevenLabs Voice Library.
 * Read from env so we can swap without redeploying; falls back to
 * production-safe premade voices so a real API key sounds human immediately.
 * In mock mode (VT_MOCK_AI=1) these are unused.
 */
export function npcVoiceId(npcId: NpcId): string | undefined {
  switch (npcId) {
    case "bankManager":
      return process.env.ELEVENLABS_VOICE_ID_BANK_MANAGER || DEFAULT_NPC_VOICE_IDS.bankManager;
    case "secretary":
      return process.env.ELEVENLABS_VOICE_ID_SECRETARY || DEFAULT_NPC_VOICE_IDS.secretary;
    case "bankGuard":
      return process.env.ELEVENLABS_VOICE_ID_BANK_GUARD || DEFAULT_NPC_VOICE_IDS.bankGuard;
    case "wife":
      return process.env.ELEVENLABS_VOICE_ID_WIFE || DEFAULT_NPC_VOICE_IDS.wife;
  }
}

export const NPC_PROFILES: Record<NpcId, { displayName: string; description: string }> = {
  bankManager: {
    displayName: "Harold Vance",
    description: "Bank manager, late 50s. Weary, methodical. Wife calls him 'Harry'.",
  },
  secretary: {
    displayName: "Lillian Park",
    description: "Bank secretary, late 30s. Crisp, dry humor.",
  },
  bankGuard: {
    displayName: "Eddie Cole",
    description: "Bank guard, 40s. Bored, hums on patrol.",
  },
  wife: {
    displayName: "Margaret Vance",
    description: "Manager's wife, 50s. Animated, social, talks to the neighbor.",
  },
};
