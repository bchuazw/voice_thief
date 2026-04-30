"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";

// The cinematic earns its mood. Tutorial text used to live in beat 6 — it
// undercut the silence. The notebook teaches itself; trust the silence.
const BEATS = [
  { t: 0, line: "A hotel room. Rain on the window." },
  { t: 4500, line: "The radio whispers: First City Bank, the vault that listens." },
  { t: 9500, line: "A folded note on the bed. One word. ONE JOB." },
  { t: 14500, line: "You don't speak. You haven't, since the war." },
  { t: 19500, line: "But the city is full of voices." },
  { t: 24500, line: "Last train at nine." },
];

export default function IntroCinematic() {
  const setPhase = useGame((s) => s.setPhase);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setNow(Date.now() - start), 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (now >= 29000) setPhase("playing");
  }, [now, setPhase]);

  const visible = BEATS.filter((b) => now >= b.t).slice(-1)[0];

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black px-6 text-center">
      <div className="absolute inset-0 crt opacity-40 pointer-events-none" />
      <p className="font-serif text-3xl italic text-noir-paper md:text-5xl">
        {visible?.line ?? ""}
      </p>
      <button
        onClick={() => setPhase("playing")}
        className="absolute bottom-8 right-8 border border-noir-paper/30 px-5 py-2 text-[11px] uppercase tracking-[0.3em] text-noir-fog hover:text-noir-paper"
      >
        Skip
      </button>
    </div>
  );
}
