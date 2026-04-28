"use client";

import dynamic from "next/dynamic";

const GameRoot = dynamic(() => import("@/components/game/GameRoot"), { ssr: false });

export default function PlayPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <GameRoot />
    </main>
  );
}
