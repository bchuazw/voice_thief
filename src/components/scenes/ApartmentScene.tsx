"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useGame } from "@/game/store";
import { moveToward } from "@/game/pathfinding";
import PlayerCharacter from "@/components/characters/PlayerCharacter";
import NpcActor from "@/components/characters/NpcActor";
import TargetPing from "@/components/world/TargetPing";
import HardwoodFloor from "@/components/props/HardwoodFloor";
import LivingRoom from "@/components/props/LivingRoom";

export default function ApartmentScene() {
  const player = useGame((s) => s.player);
  const setPlayerPosition = useGame((s) => s.setPlayerPosition);
  const setPlayerTarget = useGame((s) => s.setPlayerTarget);
  const viewMode = useGame((s) => s.viewMode);
  const lastPos = useRef(player.position);
  const { camera } = useThree();

  useEffect(() => {
    if (viewMode !== "diorama") return;
    camera.position.set(0, 9, 10);
    camera.lookAt(0, 1, -1);
  }, [camera, viewMode]);

  useFrame((_, dt) => {
    if (viewMode !== "diorama") return;
    const t = useGame.getState().player.target;
    if (!t) return;
    const next = moveToward(lastPos.current, t, dt * 4);
    lastPos.current = next;
    setPlayerPosition(next);
    if (Math.hypot(next.x - t.x, next.z - t.z) < 0.05) setPlayerTarget(null);
  });

  return (
    <group>
      <ambientLight intensity={0.32} color="#f8d8a8" />
      <pointLight position={[2, 3.4, 2]} intensity={1.6} color="#ffb060" distance={9} />
      <pointLight position={[-3, 3, -2]} intensity={0.65} color="#aac6ff" distance={5} />

      {/* Hardwood floor */}
      <HardwoodFloor
        size={[14, 12]}
        onClick={(e) => {
          if (viewMode !== "diorama") return;
          setPlayerTarget({ x: e.point.x, y: 0, z: e.point.z });
        }}
      />

      {/* Wallpapered back wall */}
      <mesh position={[0, 2, -5]} receiveShadow>
        <boxGeometry args={[14, 4, 0.2]} />
        <meshStandardMaterial color="#3a2018" roughness={0.85} />
      </mesh>
      {/* Crown molding */}
      <mesh position={[0, 3.95, -4.95]}>
        <boxGeometry args={[14, 0.15, 0.15]} />
        <meshStandardMaterial color="#f4eccd" roughness={0.7} />
      </mesh>
      {/* Baseboard */}
      <mesh position={[0, 0.16, -4.85]}>
        <boxGeometry args={[14, 0.18, 0.1]} />
        <meshStandardMaterial color="#f4eccd" roughness={0.85} />
      </mesh>

      {/* Side walls */}
      <mesh position={[-7, 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, 4, 12]} />
        <meshStandardMaterial color="#3a2018" roughness={0.85} />
      </mesh>
      <mesh position={[7, 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, 4, 12]} />
        <meshStandardMaterial color="#3a2018" roughness={0.85} />
      </mesh>

      {/* Front wall with door back to street */}
      <mesh position={[0, 2, 5.9]}>
        <boxGeometry args={[14, 4, 0.2]} />
        <meshStandardMaterial color="#3a2018" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.4, 5.78]}>
        <boxGeometry args={[1.4, 2.4, 0.04]} />
        <meshStandardMaterial color="#28181c" />
      </mesh>

      {/* Window with curtains on left wall */}
      <mesh position={[-6.85, 2.4, -2]}>
        <boxGeometry args={[0.04, 1.5, 1.6]} />
        <meshStandardMaterial color="#0a0a10" emissive="#aac6ff" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[-6.7, 2.4, -1.0]}>
        <boxGeometry args={[0.04, 1.6, 0.5]} />
        <meshStandardMaterial color="#7a1818" roughness={0.85} />
      </mesh>
      <mesh position={[-6.7, 2.4, -3.0]}>
        <boxGeometry args={[0.04, 1.6, 0.5]} />
        <meshStandardMaterial color="#7a1818" roughness={0.85} />
      </mesh>

      {/* Living room: sofa, side table, lamp, photo wall */}
      <LivingRoom />

      {viewMode === "diorama" && <PlayerCharacter />}
      {viewMode === "diorama" && <TargetPing />}
      <NpcActor npcId="wife" sceneLocation="apartment" />
    </group>
  );
}
