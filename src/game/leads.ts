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

/**
 * Notebook leads. These are observations and overheard fragments — never
 * imperatives. The player still has to figure out what to actually do.
 */
export function buildLeads(state: GameState): Lead[] {
  const leads: Lead[] = [];
  const hasCalmManager = hasVoice(state, "bankManager", "calm");
  const hasCalmSecretary = hasVoice(state, "secretary", "calm");
  const hasAnyVoice = state.voiceInventory.length > 0;
  const hasWife = hasVoice(state, "wife");
  const hasSecretary = hasVoice(state, "secretary");
  const hasGuard = hasVoice(state, "bankGuard");

  if (!hasAnyVoice) {
    leads.push({
      id: "first-voice",
      title: "Heard at the cafe counter",
      body: "Lillian - the bank's secretary - takes black coffee here every Thursday at six sharp. Her records voice opens the inner hallway.",
      urgency: state.inGameTime >= inGameTimeFromClock(18, 8) ? "active" : "note",
    });
    leads.push({
      id: "manager-habit",
      title: "Harold's habit",
      body: "The manager smokes behind the bank around quarter past six. Mutters numbers to himself. Same routine for years.",
      urgency: state.inGameTime >= inGameTimeFromClock(18, 15) ? "active" : "note",
    });
  }

  if (!hasCalmManager && hasAnyVoice) {
    leads.push({
      id: "calm-manager",
      title: "The vault has a temperament",
      body: "An auditor mentioned the new intercom won't trust a recording that sounds rattled. Hard to fake calm under pressure.",
      urgency: "active",
    });
  } else if (hasCalmManager) {
    leads.push({
      id: "calm-manager-done",
      title: "Harold's calm voice is in the notebook",
      body: "The kind of voice the vault might believe.",
      urgency: "solved",
    });
  }

  if (!hasCalmSecretary && hasCalmManager) {
    leads.push({
      id: "records-voice",
      title: "The records desk",
      body: "The hallway intercom carries Lillian Park's nameplate. If her cafe window is gone, Harold can still send her outside on an errand.",
      urgency: "active",
    });
  } else if (hasCalmSecretary && !state.bankHallwayUnlocked) {
    leads.push({
      id: "records-voice-ready",
      title: "Lillian's records voice is in the notebook",
      body: "Good for the inner hallway. The vault is Harold's problem.",
      urgency: "solved",
    });
  }

  if (hasWife && state.npcs.bankManager.branch === "default") {
    leads.push({
      id: "wife-diversion",
      title: `${NPC_PROFILES.wife.displayName} on the phone`,
      body: "Margaret says Harold leaves work early on Thursdays only when she's rattled. \"He drops everything if I sound scared.\"",
      urgency: "active",
    });
  }

  if (hasSecretary && state.npcs.bankManager.branch === "default") {
    leads.push({
      id: "secretary-diversion",
      title: "Lillian's complaint",
      body: "She sighs about Harold making her run errands for him. He'll come fetch his own paperwork if pressed about it.",
      urgency: "active",
    });
  }

  if (hasGuard) {
    leads.push({
      id: "guard-back-exit",
      title: "Eddie's beat",
      body: "Cole hums to himself about the alley door. \"Only thing back there's the dumpster and the back gate, and the gate listens for me.\"",
      urgency: "active",
    });
  }

  if (hasCalmManager && !state.vaultOpen) {
    leads.push({
      id: "use-manager",
      title: "The vault remembers Harold",
      body:
        state.npcs.secretary.branch !== "runningErrand"
          ? "Harold's voice can fool the vault, but Lillian's closing ledger will flag the clunk. Move her off the counter first."
          : state.bankHallwayUnlocked
            ? "Lillian is out and the hallway is open. Harold's calm voice is the final key."
            : "Lillian is out. Use her records voice on the hallway, then Harold's calm voice at the vault.",
      urgency: "active",
    });
  }

  if (state.vaultOpen && !state.briefcaseTaken) {
    leads.push({
      id: "take-case",
      title: "The briefcase",
      body: "Inside the vault. Wood and brass. Heavier than it looks.",
      urgency: "active",
    });
  }

  if (state.briefcaseTaken) {
    leads.push({
      id: "escape",
      title: "Last train at nine",
      body: "Union Station — the archway at the east end of Main Street.",
      urgency: "active",
    });
  }

  if (state.suspicion >= 40) {
    leads.push({
      id: "suspicion",
      title: "Eyes on you",
      body: "A patrol car drove past slow. Voices behind windows getting quieter when you walk by.",
      urgency: "active",
    });
  }

  if (state.suspicion >= 70) {
    leads.push({
      id: "suspicion-high",
      title: "The city is listening",
      body: "Stick to one more move. Anything dramatic and the alarm goes for sure.",
      urgency: "active",
    });
  }

  // Mute-protagonist beat — fires once after the player's first phone call
  // (or any branch flip). Reminds them the silence is the whole game.
  const flippedAny =
    state.npcs.bankManager.branch !== "default" ||
    state.npcs.secretary.branch !== "default" ||
    state.bankBackExitUnlocked;
  if (flippedAny) {
    leads.push({
      id: "old-habit",
      title: "Old habit",
      body: "You almost answered the receiver. Old habit. Nothing came. You hung up before the dial tone.",
      urgency: "note",
    });
  }

  return leads;
}
