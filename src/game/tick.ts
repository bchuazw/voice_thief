"use client";

import { useEffect } from "react";
import { useGame } from "./store";
import { stepNpcSchedules } from "./npcSchedules";
import { inGameTimeFromClock } from "./timeFormat";
import { GAME_END_SECONDS, REAL_SECONDS_PER_GAME_SECOND } from "./types";
import { evaluateLossConditions } from "./winLose";

const TICK_MS = 200;
// Bank front locks at 7:30 (was 7:00 — too brutal for first-run players).
const BANK_CLOSE_TIME = inGameTimeFromClock(19, 30);

export function useGameTick(): void {
  const phase = useGame((s) => s.phase);

  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => {
      const state = useGame.getState();
      // Accessibility: pause the in-game clock while any modal is open so
      // slow readers (or screen-reader users) can study the notebook,
      // phone, or auth dialog without losing real-time.
      const paused =
        state.notebookOpen || state.phoneOpen || state.activeAuth !== null;
      const prevTime = state.inGameTime;
      if (!paused) {
        const deltaInGame = (TICK_MS / 1000) / REAL_SECONDS_PER_GAME_SECOND;
        state.advanceTime(deltaInGame);
      }
      state.pruneToasts(Date.now());

      const next = useGame.getState();
      if (prevTime < BANK_CLOSE_TIME && next.inGameTime >= BANK_CLOSE_TIME && next.bankFrontUnlocked) {
        next.openBankFront(false);
        next.pushToast("7:30 PM — bank doors lock for the night.");
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
