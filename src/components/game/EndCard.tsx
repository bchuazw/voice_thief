"use client";

import { useGame } from "@/game/store";
import { clockLabel } from "@/game/timeFormat";
import { evaluateLossConditions } from "@/game/winLose";

function pathLabel(): string {
  const s = useGame.getState();
  if (s.npcs.secretary.branch === "runningErrand") return "Insider con";
  if (s.npcs.bankManager.branch === "atCafe") return "Ledger diversion";
  if (s.npcs.bankManager.branch === "rushedHome") return "Family emergency";
  return "Direct lift";
}

export default function EndCard() {
  const phase = useGame((s) => s.phase);
  const reset = useGame((s) => s.reset);
  const restartRun = useGame((s) => s.restartRun);
  const inGameTime = useGame((s) => s.inGameTime);
  const voiceCount = useGame((s) => s.voiceInventory.length);
  const suspicion = useGame((s) => s.suspicion);
  const won = phase === "won";
  const lossReason = won ? "" : evaluateLossConditions(useGame.getState()) ?? "Time ran out";
  const outcome = won ? pathLabel() : "Job failed";

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/95 px-4">
      <div className="w-[min(720px,92vw)] text-center">
        <p className="mb-2 text-xs uppercase tracking-[0.4em] text-noir-fog">
          {won ? "Last train, 9:00 PM" : "First City - closed"}
        </p>
        <h1 className="font-serif text-6xl italic sm:text-7xl">
          {won ? "A clean con." : "Caught."}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-noir-fog">
          {won
            ? "The train groans out of First City with the briefcase under your coat. Nobody remembers your voice, because you never used it."
            : `${lossReason}. The city kept its voices, this time.`}
        </p>
        <div className="mx-auto mt-6 grid max-w-xl grid-cols-3 gap-2 text-center">
          <div className="rounded border border-noir-paper/10 bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-noir-fog">Method</p>
            <p className="mt-1 text-sm text-noir-paper">{outcome}</p>
          </div>
          <div className="rounded border border-noir-paper/10 bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-noir-fog">Voices</p>
            <p className="mt-1 font-mono text-sm text-noir-paper">{voiceCount}</p>
          </div>
          <div className="rounded border border-noir-paper/10 bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-noir-fog">Heat</p>
            <p className="mt-1 font-mono text-sm text-noir-paper">
              {Math.round(suspicion)} / 100
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-noir-fog">
          Final mark: {clockLabel(inGameTime)}
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={restartRun}
            className="border border-noir-paper/30 px-8 py-3 text-sm uppercase tracking-[0.4em] hover:bg-noir-paper hover:text-black"
          >
            Run it again
          </button>
          <button
            onClick={reset}
            className="border border-noir-paper/15 px-8 py-3 text-sm uppercase tracking-[0.4em] text-noir-fog hover:text-noir-paper"
          >
            Title
          </button>
        </div>
      </div>
    </div>
  );
}
