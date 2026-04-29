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
  const [shown, setShown] = useState<{ id: LocationId; elapsed: number } | null>(null);
  const lastShownLocation = useRef<LocationId | null>(null);

  useEffect(() => {
    if (phase !== "playing") return;
    // Only retrigger when the location actually changes
    if (lastShownLocation.current === location) return;
    lastShownLocation.current = location;
    const startedAt = Date.now();
    const show = setTimeout(() => {
      setShown({ id: location, elapsed: 0 });
    }, 0);
    const interval = setInterval(() => {
      setShown((current) =>
        current?.id === location
          ? { id: location, elapsed: Date.now() - startedAt }
          : current,
      );
    }, 80);
    const stopAt = setTimeout(() => {
      clearInterval(interval);
      setShown(null);
    }, TOTAL_MS);
    return () => {
      clearTimeout(show);
      clearInterval(interval);
      clearTimeout(stopAt);
    };
  }, [location, phase]);

  if (!shown) return null;
  const fadeIn = Math.min(1, shown.elapsed / 200);
  const fadeOut = Math.max(0, Math.min(1, (TOTAL_MS - shown.elapsed) / 600));
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
