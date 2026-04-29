"use client";

import { useEffect, useRef, useState } from "react";
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

const TOTAL_MS = 1800;

export default function SceneTitle() {
  const phase = useGame((s) => s.phase);
  const location = useGame((s) => s.player.currentLocation);
  const [tick, setTick] = useState(0);
  const shownRef = useRef<{ id: LocationId; at: number } | null>(null);
  const lastShownLocation = useRef<LocationId | null>(null);

  useEffect(() => {
    if (phase !== "playing") return;
    // Only retrigger when the location actually changes
    if (lastShownLocation.current === location) return;
    lastShownLocation.current = location;
    shownRef.current = { id: location, at: Date.now() };
    setTick((t) => t + 1);
    const interval = setInterval(() => setTick((t) => t + 1), 80);
    const stopAt = setTimeout(() => {
      shownRef.current = null;
      clearInterval(interval);
      setTick((t) => t + 1);
    }, TOTAL_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(stopAt);
    };
  }, [location, phase]);

  // Read from ref so re-renders triggered by tick recompute opacity
  void tick;
  const shown = shownRef.current;
  if (!shown) return null;
  const elapsed = Date.now() - shown.at;
  const fadeIn = Math.min(1, elapsed / 200);
  const fadeOut = Math.max(0, Math.min(1, (TOTAL_MS - elapsed) / 600));
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[14%] z-20 flex flex-col items-center text-center"
      style={{ opacity }}
    >
      <p className="text-[10px] uppercase tracking-[0.5em] text-noir-fog">Voice Thief</p>
      <p className="mt-1 font-serif text-2xl italic text-noir-paper drop-shadow-[0_4px_18px_rgba(0,0,0,0.9)]">
        {LABELS[shown.id]}
      </p>
    </div>
  );
}
