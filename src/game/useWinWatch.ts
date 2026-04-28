"use client";

import { useEffect } from "react";
import { useGame } from "./store";
import { evaluateWinCondition } from "./winLose";

export function useWinWatch(): void {
  useEffect(() => {
    const unsub = useGame.subscribe((s) => {
      if (s.phase !== "playing") return;
      if (evaluateWinCondition(s)) {
        useGame.setState({ phase: "won" });
      }
    });
    return unsub;
  }, []);
}
