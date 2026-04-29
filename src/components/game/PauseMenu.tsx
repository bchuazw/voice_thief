"use client";

import { useEffect } from "react";
import { useGame } from "@/game/store";
import { clockLabel } from "@/game/timeFormat";

export default function PauseMenu() {
  const inGameTime = useGame((s) => s.inGameTime);
  const voiceCount = useGame((s) => s.voiceInventory.length);
  const suspicion = useGame((s) => s.suspicion);
  const hasBriefcase = useGame((s) => s.briefcaseTaken);
  const toggleMenu = useGame((s) => s.toggleMenu);
  const restartRun = useGame((s) => s.restartRun);
  const reset = useGame((s) => s.reset);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") toggleMenu(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleMenu]);

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 px-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div className="w-[min(520px,92vw)] rounded border border-noir-paper/25 bg-noir-smoke p-5 text-noir-paper shadow-2xl sm:p-6">
        <p className="text-[10px] uppercase tracking-[0.4em] text-noir-fog">Paused</p>
        <h2 id="pause-title" className="mt-1 font-serif text-4xl italic">
          The job waits.
        </h2>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded border border-noir-paper/10 bg-black/35 px-2 py-2 sm:px-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-noir-fog">Time</p>
            <p className="mt-1 whitespace-nowrap font-mono text-base sm:text-lg">{clockLabel(inGameTime)}</p>
          </div>
          <div className="rounded border border-noir-paper/10 bg-black/35 px-2 py-2 sm:px-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-noir-fog">Voices</p>
            <p className="mt-1 font-mono text-base sm:text-lg">{voiceCount}</p>
          </div>
          <div className="rounded border border-noir-paper/10 bg-black/35 px-2 py-2 sm:px-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-noir-fog">Heat</p>
            <p className="mt-1 font-mono text-base sm:text-lg">{Math.round(suspicion)}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-noir-fog">
          {hasBriefcase
            ? "Briefcase in hand. Main Street, then the train."
            : "Open the notebook for leads, use the phone to move people, and keep one calm Harold voice for the vault."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => toggleMenu(false)}
            className="flex-1 rounded border border-noir-paper/35 px-4 py-3 text-xs uppercase tracking-[0.3em] hover:bg-noir-paper hover:text-black"
          >
            Resume
          </button>
          <button
            onClick={restartRun}
            className="flex-1 rounded border border-noir-amber/55 px-4 py-3 text-xs uppercase tracking-[0.3em] text-noir-amber hover:bg-noir-amber hover:text-black"
          >
            Restart Heist
          </button>
          <button
            onClick={reset}
            className="flex-1 rounded border border-noir-paper/20 px-4 py-3 text-xs uppercase tracking-[0.3em] text-noir-fog hover:text-noir-paper"
          >
            Title
          </button>
        </div>
      </div>
    </div>
  );
}
