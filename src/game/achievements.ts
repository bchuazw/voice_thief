import type { GameState, NpcId } from "./types";

export interface Achievement {
  id: string;
  label: string;
  detail: string;
}

const ALL_NPCS: NpcId[] = ["bankManager", "secretary", "bankGuard", "wife"];

export function evaluateAchievements(state: GameState): Achievement[] {
  const out: Achievement[] = [];
  const won = state.phase === "won";
  const realRunMs = state.runStartedAt > 0 ? Date.now() - state.runStartedAt : 0;
  const realRunMin = realRunMs / 60_000;

  // Speedrun — only if won and under 12 real-min
  if (won && state.runStartedAt > 0 && realRunMin < 12) {
    out.push({
      id: "speedrun",
      label: "Last Train Out",
      detail: `Won in ${realRunMin.toFixed(1)} min`,
    });
  }

  // Clean conscience — won with no failed auths or recording busts
  if (won && state.failedAuthCount === 0 && state.recordingsBust === 0) {
    out.push({
      id: "no-mistakes",
      label: "Clean Conscience",
      detail: "Zero failed auths, zero busted recordings",
    });
  }

  // Voice collector — recorded all four NPCs at least once
  const recordedNpcs = new Set(state.voiceInventory.map((c) => c.npcId));
  if (ALL_NPCS.every((id) => recordedNpcs.has(id))) {
    out.push({
      id: "collector",
      label: "Voice Collector",
      detail: "Stole a voice from every suspect",
    });
  }

  // Cold call — won without making a single phone call
  // (best heuristic available: no NPC branches were flipped from default)
  if (won) {
    const noBranchFlips =
      state.npcs.bankManager.branch === "default" &&
      state.npcs.secretary.branch === "default";
    if (noBranchFlips) {
      out.push({
        id: "cold-call",
        label: "Cold Call",
        detail: "Won without dialing a single number",
      });
    }
  }

  // Hot collar — won with heat ≥ 60 (sweaty finish)
  if (won && state.suspicion >= 60) {
    out.push({
      id: "hot-collar",
      label: "Hot Collar",
      detail: `Walked out at ${Math.round(state.suspicion)} heat`,
    });
  }

  // Ghost — won with heat = 0
  if (won && state.suspicion === 0) {
    out.push({
      id: "ghost",
      label: "Ghost",
      detail: "Nobody noticed a thing",
    });
  }

  // Solution-specific — only one fires
  if (won) {
    if (state.bankBackExitUnlocked) {
      out.push({
        id: "solution-d",
        label: "Beat-Cop Bluff",
        detail: "Eddie's voice opened the alley gate",
      });
    } else if (state.npcs.secretary.branch === "runningErrand") {
      out.push({
        id: "solution-c",
        label: "Insider Job",
        detail: "Lillian ran the errand. Bank empty.",
      });
    } else if (state.npcs.bankManager.branch === "atCafe") {
      out.push({
        id: "solution-b1",
        label: "Lost Ledger",
        detail: "Lured Harold to the cafe with the ledger",
      });
    } else if (state.npcs.bankManager.branch === "rushedHome") {
      out.push({
        id: "solution-b2",
        label: "Family Emergency",
        detail: "Margaret's voice sent Harold flying",
      });
    } else {
      out.push({
        id: "solution-a",
        label: "Direct Lift",
        detail: "Walked right in. Walked right out.",
      });
    }
  }

  return out;
}
