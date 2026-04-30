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

  // Voice collector — recorded all four NPCs at least once. Gated on win
  // so the chip is a reward, not consolation.
  const recordedNpcs = new Set(state.voiceInventory.map((c) => c.npcId));
  if (won && ALL_NPCS.every((id) => recordedNpcs.has(id))) {
    out.push({
      id: "collector",
      label: "Voice Collector",
      detail: "Stole a voice from every suspect",
    });
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

  // Solution-specific. These are additive now because the shippable route is
  // intentionally layered: a good win can combine a diversion, a cleared
  // records desk, and the back exit.
  if (won) {
    if (state.bankBackExitUnlocked) {
      out.push({
        id: "solution-d",
        label: "Beat-Cop Bluff",
        detail: "Eddie's voice opened the alley gate",
      });
    }
    if (state.patrolLogForged) {
      out.push({
        id: "solution-f",
        label: "Signed Beat",
        detail: "Forged Cole's patrol log at the guard desk",
      });
    }
    if (state.npcs.secretary.branch === "runningErrand") {
      out.push({
        id: "solution-c",
        label: "Counter Clearance",
        detail: "Moved Lillian off the closing ledger",
      });
    }
    if (state.auditLedgerForged) {
      out.push({
        id: "solution-e",
        label: "Forged Ledger",
        detail: "Filed a false records clearance",
      });
    }
    if (state.npcs.bankManager.branch === "atCafe") {
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
    }
    if (
      state.npcs.bankManager.branch === "default" &&
      state.npcs.secretary.branch === "default" &&
      !state.bankBackExitUnlocked
    ) {
      out.push({
        id: "solution-a",
        label: "Two-Voice Lift",
        detail: "Solved the bank with clean voiceprints alone",
      });
    }
  }

  return out;
}
