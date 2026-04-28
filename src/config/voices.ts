import type { NpcId } from "@/game/types";

/**
 * Pre-pinned voice IDs from the ElevenLabs Voice Library.
 * Read from env so we can swap without redeploying.
 * In mock mode (VT_MOCK_AI=1) these are unused.
 */
export function npcVoiceId(npcId: NpcId): string | undefined {
  switch (npcId) {
    case "bankManager":
      return process.env.ELEVENLABS_VOICE_ID_BANK_MANAGER;
    case "secretary":
      return process.env.ELEVENLABS_VOICE_ID_SECRETARY;
    case "bankGuard":
      return process.env.ELEVENLABS_VOICE_ID_BANK_GUARD;
    case "wife":
      return process.env.ELEVENLABS_VOICE_ID_WIFE;
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
