"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { useGame } from "@/game/store";
import StreetScene from "@/components/scenes/StreetScene";
import BankInteriorScene from "@/components/scenes/BankInteriorScene";
import ApartmentScene from "@/components/scenes/ApartmentScene";
import CafeScene from "@/components/scenes/CafeScene";
import FirstPersonController from "./FirstPersonController";
import FocusPicker from "./FocusPicker";
import CameraDebugHandle from "./CameraDebugHandle";
import type { LocationId } from "@/game/types";

export default function GameCanvas() {
  const loc = useGame((s) => s.player.currentLocation);
  const viewMode = useGame((s) => s.viewMode);

  // First-person camera defaults (used as initial; PointerLockControls drives rotation)
  const fpCamera = { position: [0, 1.62, 6] as [number, number, number], fov: 70 };
  const dioramaCamera = { position: [2, 14, 18] as [number, number, number], fov: 38 };
  const camera = viewMode === "fp" ? fpCamera : dioramaCamera;

  // Stable scene key — recreate camera default when view-mode changes
  const sceneKey: LocationId =
    loc === "bankHallway" || loc === "vault" ? "bankLobby" : loc;

  return (
    <Canvas
      key={`vt-${viewMode}`}
      shadows
      dpr={[1, 1.6]}
      camera={camera}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="absolute inset-0"
    >
      <fog attach="fog" args={["#05060a", 22, 55]} />
      <color attach="background" args={["#05060a"]} />
      <Suspense fallback={null}>
        {(loc === "street" || loc === "trainStation") && <StreetScene />}
        {(loc === "bankLobby" || loc === "bankHallway" || loc === "vault") && (
          <BankInteriorScene />
        )}
        {loc === "apartment" && <ApartmentScene />}
        {loc === "cafe" && <CafeScene />}
        {viewMode === "fp" && <FirstPersonController scene={sceneKey} />}
        <FocusPicker scene={loc} />
        <CameraDebugHandle />
      </Suspense>
    </Canvas>
  );
}
