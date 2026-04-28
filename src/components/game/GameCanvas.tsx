"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { useGame } from "@/game/store";
import StreetScene from "@/components/scenes/StreetScene";
import BankInteriorScene from "@/components/scenes/BankInteriorScene";
import ApartmentScene from "@/components/scenes/ApartmentScene";
import CafeScene from "@/components/scenes/CafeScene";

export default function GameCanvas() {
  const loc = useGame((s) => s.player.currentLocation);

  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      camera={{ position: [0, 8, 12], fov: 45 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="absolute inset-0"
    >
      <fog attach="fog" args={["#05060a", 14, 38]} />
      <color attach="background" args={["#05060a"]} />
      <Suspense fallback={null}>
        {(loc === "street" || loc === "trainStation") && <StreetScene />}
        {(loc === "bankLobby" || loc === "bankHallway" || loc === "vault") && (
          <BankInteriorScene />
        )}
        {loc === "apartment" && <ApartmentScene />}
        {loc === "cafe" && <CafeScene />}
      </Suspense>
    </Canvas>
  );
}
