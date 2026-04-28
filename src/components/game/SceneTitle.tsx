"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import type { LocationId } from "@/game/types";

const LABELS: Record<LocationId, string> = {
  street: "First City — Main Street",
  bankLobby: "First City Bank — Lobby",
  bankHallway: "Bank — Inner Hallway",
  vault: "Bank — Vault",
  apartment: "Vance Residence",
  cafe: "All-Night Cafe",
  trainStation: "Union Station",
};

export default function SceneTitle() {
  const phase = useGame((s) => s.phase);
  const location = useGame((s) => s.player.currentLocation);
  const [shown, setShown] = useState<{ id: LocationId; at: number } | null>(null);

  useEffect(() => {
    if (phase !== "playing") return;
    setShown({ id: location, at: Date.now() });
    const t = setTimeout(() => setShown(null), 2600);
    return () => clearTimeout(t);
  }, [location, phase]);

  if (!shown) return null;
  const fade = Math.min(1, (Date.now() - shown.at) / 200);
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[35%] z-20 flex flex-col items-center text-center"
      style={{ opacity: fade }}
    >
      <p className="text-[10px] uppercase tracking-[0.5em] text-noir-fog">Voice Thief</p>
      <p className="mt-1 font-serif text-3xl italic text-noir-paper drop-shadow-[0_4px_18px_rgba(0,0,0,0.9)]">
        {LABELS[shown.id]}
      </p>
    </div>
  );
}
