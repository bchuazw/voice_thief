"use client";

import { useEffect } from "react";
import { useGame } from "./store";
import { stepNpcSchedules } from "./npcSchedules";
import { inGameTimeFromClock } from "./timeFormat";
import { distance } from "./pathfinding";
import { GAME_END_SECONDS, REAL_SECONDS_PER_GAME_SECOND, type NpcId } from "./types";
import { endRecording } from "./recordingManager";
import { evaluateLossConditions } from "./winLose";

const TICK_MS = 200;
// Bank front locks at 7:30 (was 7:00 — too brutal for first-run players).
const BANK_CLOSE_TIME = inGameTimeFromClock(19, 30);
// Late-game pressure ticks. Each fires once and increases suspicion if the
// player is still inside the bank without major progress. Creates a "city
// is closing in" feeling without being a hard clock.
const PRESSURE_8PM = inGameTimeFromClock(20, 0);
const PRESSURE_830PM = inGameTimeFromClock(20, 30);

export function useGameTick(): void {
  const phase = useGame((s) => s.phase);

  useEffect(() => {
    if (phase !== "playing") return;
    let lastTickAt = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSec = Math.max(TICK_MS / 1000, (now - lastTickAt) / 1000);
      const clockDtSec = Math.min(1, elapsedSec);
      const awarenessDtSec = Math.min(10, elapsedSec);
      lastTickAt = now;
      const state = useGame.getState();
      // Accessibility + tension: full pause for reading/menu surfaces; slow
      // time for phone/auth so the heist still breathes while you bluff.
      const paused = state.notebookOpen || state.menuOpen;
      const slowed = state.phoneOpen || state.activeAuth !== null;
      const prevTime = state.inGameTime;
      if (!paused) {
        const deltaInGame = (clockDtSec / REAL_SECONDS_PER_GAME_SECOND) * (slowed ? 0.25 : 1);
        state.advanceTime(deltaInGame);
      }
      state.pruneToasts(now);

      const next = useGame.getState();
      if (prevTime < BANK_CLOSE_TIME && next.inGameTime >= BANK_CLOSE_TIME && next.bankFrontUnlocked) {
        next.openBankFront(false);
        next.pushToast("7:30 PM — bank doors lock for the night.");
      }

      const insideBank =
        next.player.currentLocation === "bankLobby" ||
        next.player.currentLocation === "bankHallway" ||
        next.player.currentLocation === "vault";

      // 8:00 PM — guard radio check. If you're inside the bank and the
      // vault still isn't open, Cole notices the lobby's gone too quiet.
      if (
        prevTime < PRESSURE_8PM &&
        next.inGameTime >= PRESSURE_8PM &&
        insideBank &&
        !next.vaultOpen
      ) {
        next.raiseSuspicion(15, "Cole called in to base — odd quiet inside");
      }
      // 8:30 PM — last-call detective. If you have the briefcase but are
      // still standing inside, somebody starts asking questions.
      if (
        prevTime < PRESSURE_830PM &&
        next.inGameTime >= PRESSURE_830PM &&
        insideBank &&
        next.briefcaseTaken
      ) {
        next.raiseSuspicion(20, "8:30 PM — questions about the case");
      }

      // Recording awareness — fills if any non-target NPC is in the same scene
      // and within ~6 units of the player while recording. Drains otherwise.
      // Skip entirely while a modal is open (otherwise standing still reading
      // the notebook can bust the recording silently).
      if (next.player.isRecording && !paused) {
        const targetId = next.player.recordingTargetNpc;
        const playerLoc = next.player.currentLocation;
        let nearestOther = Infinity;
        for (const id of Object.keys(next.npcs) as NpcId[]) {
          if (id === targetId) continue;
          const npc = next.npcs[id];
          if (npc.currentLocation !== playerLoc) continue;
          const d = distance(npc.location, next.player.position);
          if (d < nearestOther) nearestOther = d;
        }
        // Fill rate scales with closeness. <3 units = full alarm in ~5s.
        let delta = 0;
        if (nearestOther < 6) {
          const closeness = Math.max(0, (6 - nearestOther) / 6); // 0..1
          delta = closeness * awarenessDtSec * 0.4;
        } else {
          delta = -awarenessDtSec * 0.25; // drain when nobody close
        }
        const newAwareness = Math.max(0, Math.min(1, next.player.recordingAwareness + delta));
        next.setRecordingAwareness(newAwareness);
        if (newAwareness >= 0.999) {
          // Bust — heat spike, increment counter, cancel recording. Reset
          // awareness to 0 immediately so the next tick can't double-fire
          // before endRecording() resolves async.
          next.raiseSuspicion(25, "someone watched you record");
          useGame.setState((s) => ({ recordingsBust: s.recordingsBust + 1 }));
          next.setRecordingAwareness(0);
          endRecording().catch(() => {});
        }
      }

      stepNpcSchedules(next.inGameTime);

      const after = useGame.getState();
      const loss = evaluateLossConditions(after);
      if (loss) {
        useGame.setState({ phase: "lost" });
        return;
      }
      if (after.inGameTime >= GAME_END_SECONDS) {
        useGame.setState({ phase: "lost" });
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [phase]);
}
