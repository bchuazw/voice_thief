"use client";

import { useGame } from "@/game/store";
import { evaluateLossConditions } from "@/game/winLose";

export default function EndCard() {
  const phase = useGame((s) => s.phase);
  const reset = useGame((s) => s.reset);
  const won = phase === "won";
  const lossReason = won ? "" : evaluateLossConditions(useGame.getState()) ?? "Time ran out";

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/95 px-4">
      <div className="text-center">
        <p className="mb-2 text-xs uppercase tracking-[0.4em] text-noir-fog">
          {won ? "Last train, 9:00 PM" : "First City — closed"}
        </p>
        <h1 className="font-serif text-7xl italic">
          {won ? "A clean con." : "Caught."}
        </h1>
        <p className="mt-3 max-w-md text-noir-fog">
          {won
            ? "You walked out like you were never there. Briefcase in hand. Rain on your collar."
            : `${lossReason}. The city kept its voices, this time.`}
        </p>
        <button
          onClick={reset}
          className="mt-10 border border-noir-paper/30 px-8 py-3 text-sm uppercase tracking-[0.4em] hover:bg-noir-paper hover:text-black"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
