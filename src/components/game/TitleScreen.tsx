"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { clearSavedRun, loadSavedRun, type SavedRun } from "@/game/saveGame";
import { clockLabel } from "@/game/timeFormat";

export default function TitleScreen() {
  const setPhase = useGame((s) => s.setPhase);
  const [savedRun, setSavedRun] = useState<SavedRun | null>(null);

  useEffect(() => {
    setSavedRun(loadSavedRun());
  }, []);

  function startNewRun() {
    clearSavedRun();
    setSavedRun(null);
    setPhase("intro");
  }

  function continueRun() {
    const run = loadSavedRun();
    if (!run) {
      setSavedRun(null);
      return;
    }
    const now = Date.now();
    useGame.setState({
      ...run.state,
      activeCall: null,
      activeAuth: null,
      notebookOpen: false,
      phoneOpen: false,
      menuOpen: false,
      pointerLocked: false,
      runStartedAt: now,
      toasts: [
        {
          id: `${now}_continue`,
          text: `Back on the job. ${clockLabel(run.state.inGameTime)}.`,
          expiresAt: now + 4500,
        },
      ],
    });
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black px-4 text-noir-paper">
      <p className="mb-2 text-xs uppercase tracking-[0.5em] text-noir-fog">
        First City - Thursday
      </p>
      <h1 className="text-center text-5xl font-extrabold leading-tight tracking-[0.08em] sm:text-6xl sm:tracking-[0.12em] md:text-7xl md:tracking-[0.18em]">
        VOICE THIEF
      </h1>
      <p className="mt-6 max-w-xl text-center italic text-noir-fog">
        It is 6 PM. You have until 9 to walk out with the briefcase.
      </p>
      <p className="mt-2 max-w-xl text-center text-sm text-noir-fog">
        You can&apos;t speak. Steal a voice. Open the vault.
      </p>
      <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
        {savedRun && (
          <button
            onClick={continueRun}
            className="flex-1 border border-noir-paper/35 px-6 py-3 text-sm uppercase tracking-[0.28em] hover:bg-noir-paper hover:text-black"
          >
            Continue {clockLabel(savedRun.state.inGameTime)}
          </button>
        )}
        <button
          onClick={startNewRun}
          className="flex-1 border border-noir-amber/50 px-6 py-3 text-sm uppercase tracking-[0.28em] text-noir-amber hover:bg-noir-amber hover:text-black"
        >
          {savedRun ? "New Run" : "Start"}
        </button>
      </div>
      <p className="mt-6 max-w-3xl text-center text-[10px] uppercase tracking-[0.3em] text-noir-fog/70">
        First-person: WASD move | Diorama: C then click to walk | Hold E record | N notebook | P phone
      </p>
    </div>
  );
}
