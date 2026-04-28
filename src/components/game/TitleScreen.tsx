"use client";

import { useGame } from "@/game/store";

export default function TitleScreen() {
  const setPhase = useGame((s) => s.setPhase);
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black text-noir-paper">
      <p className="mb-2 text-xs uppercase tracking-[0.5em] text-noir-fog">
        First City — Thursday
      </p>
      <h1 className="text-7xl font-extrabold tracking-[0.18em]">VOICE THIEF</h1>
      <p className="mt-6 max-w-xl text-center italic text-noir-fog">
        It is 6 PM. You have until 9 to walk out with the briefcase.
      </p>
      <p className="mt-2 max-w-xl text-center text-sm text-noir-fog">
        You can&apos;t speak. Steal a voice. Open the vault.
      </p>
      <button
        onClick={() => setPhase("intro")}
        className="mt-10 border border-noir-paper/30 px-8 py-3 text-sm uppercase tracking-[0.4em] hover:bg-noir-paper hover:text-black"
      >
        Start
      </button>
      <p className="mt-6 text-[10px] uppercase tracking-[0.35em] text-noir-fog/70">
        Click to walk · Hold E to record · N notebook · P phone
      </p>
    </div>
  );
}
