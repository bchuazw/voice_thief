"use client";

import { useEffect } from "react";
import { useGame } from "./store";
import { stepNpcSchedules } from "./npcSchedules";
import { GAME_END_SECONDS, REAL_SECONDS_PER_GAME_SECOND } from "./types";
import { evaluateLossConditions } from "./winLose";

const TICK_MS = 200;

export function useGameTick(): void {
  const phase = useGame((s) => s.phase);

  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => {
      const state = useGame.getState();
      const deltaInGame = (TICK_MS / 1000) / REAL_SECONDS_PER_GAME_SECOND;
      state.advanceTime(deltaInGame);
      state.pruneToasts(Date.now());

      const next = useGame.getState();
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
