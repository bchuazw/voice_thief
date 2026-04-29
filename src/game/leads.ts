import { NPC_PROFILES } from "@/config/voices";
import { inGameTimeFromClock } from "./timeFormat";
import type { GameState, NpcId } from "./types";

export interface Lead {
  id: string;
  title: string;
  body: string;
  urgency: "note" | "active" | "solved";
}

function hasVoice(state: GameState, npcId: NpcId, emotion?: string): boolean {
  return state.voiceInventory.some(
    (card) => card.npcId === npcId && (!emotion || card.emotionalState === emotion),
  );
}

export function buildLeads(state: GameState): Lead[] {
  const leads: Lead[] = [];
  const hasCalmManager = hasVoice(state, "bankManager", "calm");
  const hasAnyVoice = state.voiceInventory.length > 0;
  const hasWife = hasVoice(state, "wife");
  const hasSecretary = hasVoice(state, "secretary");

  if (!hasAnyVoice) {
    leads.push({
      id: "first-voice",
      title: "Find a voice worth stealing",
      body: "People only give you clean material when they are relaxed and talking. Watch the first half hour carefully.",
      urgency: state.inGameTime >= inGameTimeFromClock(18, 8) ? "active" : "note",
    });
  }

  if (!hasCalmManager) {
    leads.push({
      id: "calm-manager",
      title: "The vault wants calm",
      body: "Harold's stressed phone fight might fool a person, but not the vault. You need him calm, away from the counter noise.",
      urgency: state.inGameTime >= inGameTimeFromClock(18, 15) ? "active" : "note",
    });
  } else {
    leads.push({
      id: "calm-manager-done",
      title: "Harold's calm voice is in the notebook",
      body: "That is the voice the hallway and vault intercoms are listening for.",
      urgency: "solved",
    });
  }

  if (hasWife && state.npcs.bankManager.branch === "default") {
    leads.push({
      id: "wife-diversion",
      title: `${NPC_PROFILES.wife.displayName} can move Harold`,
      body: "Call Harold as Margaret and make the emergency sound domestic. He knows her voice better than anyone.",
      urgency: "active",
    });
  }

  if (hasSecretary && state.npcs.bankManager.branch === "default") {
    leads.push({
      id: "secretary-diversion",
      title: "Lillian can pull Harold to the cafe",
      body: "A lost ledger gives Harold a reason to leave the bank without panic.",
      urgency: "active",
    });
  }

  if (hasCalmManager && !state.vaultOpen) {
    leads.push({
      id: "use-manager",
      title: "Use Harold's voice at the intercoms",
      body: state.bankFrontUnlocked
        ? "The bank is still open. Get inside, reach the hallway, and let Harold's voice do the talking."
        : "The front door has locked. Harold's calm voice can still open the bank, hallway, and vault.",
      urgency: "active",
    });
  }

  if (state.vaultOpen && !state.briefcaseTaken) {
    leads.push({
      id: "take-case",
      title: "The briefcase is exposed",
      body: "Take it from the vault and leave before the city decides to listen harder.",
      urgency: "active",
    });
  }

  if (state.briefcaseTaken) {
    leads.push({
      id: "escape",
      title: "Get to the train",
      body: "Union Station is on Main Street. The briefcase only matters if you leave with it.",
      urgency: "active",
    });
  }

  if (state.suspicion >= 40) {
    leads.push({
      id: "suspicion",
      title: "Too many people are listening",
      body: "Failed auth and strange calls raise suspicion. At 100, the alarm ends the job.",
      urgency: "active",
    });
  }

  return leads;
}
