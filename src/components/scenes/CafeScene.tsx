"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useGame } from "@/game/store";
import { moveToward } from "@/game/pathfinding";
import PlayerCharacter from "@/components/characters/PlayerCharacter";
import NpcActor from "@/components/characters/NpcActor";
import TargetPing from "@/components/world/TargetPing";
import CheckerFloor from "@/components/props/CheckerFloor";
import CafeInterior from "@/components/props/CafeInterior";
import type { NpcId } from "@/game/types";

const NPC_LIST: NpcId[] = ["secretary", "bankManager"];

export default function CafeScene() {
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
      <ambientLight intensity={0.95} color="#f5d6a0" />
      <hemisphereLight args={["#5a6b8c", "#3a2818", 0.45]} />
      <pointLight position={[-3, 3.4, -1]} intensity={2.1} color="#ffb968" distance={9} />
      <pointLight position={[3, 3.4, -1]} intensity={2.1} color="#ffb968" distance={9} />
      <pointLight position={[0, 3.0, 2]} intensity={1.25} color="#ffd9a0" distance={7} />
      {/* Back-bar wall wash — brightened so the espresso machine reads */}
      <pointLight position={[0, 2.0, -3.0]} intensity={2.6} color="#ffb060" distance={7} />
      {/* Cool window-side moonlight — strong counter-tone now (0.6 → 1.6) */}
      <pointLight position={[5, 2.8, 4]} intensity={1.6} color="#aac6ff" distance={7} />
      <pointLight position={[-5, 2.8, 4]} intensity={1.4} color="#aac6ff" distance={6} />
      {/* Right-side cold rim hitting the back wall to break up the warm wash */}
      <pointLight position={[6, 1.8, -3]} intensity={0.85} color="#7aa6cc" distance={5} />

      {/* Checker tile floor */}
      <CheckerFloor
        size={[14, 12]}
        onClick={(e) => {
          if (viewMode !== "diorama") return;
          setPlayerTarget({ x: e.point.x, y: 0, z: e.point.z });
        }}
      />

      {/* Back wall */}
      <mesh position={[0, 2, -5]} receiveShadow>
        <boxGeometry args={[14, 4, 0.2]} />
        <meshStandardMaterial color="#6a4d2c" roughness={0.85} />
      </mesh>
      {/* Side walls */}
      <mesh position={[-7, 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, 4, 12]} />
        <meshStandardMaterial color="#6a4d2c" roughness={0.85} />
      </mesh>
      <mesh position={[7, 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, 4, 12]} />
        <meshStandardMaterial color="#6a4d2c" roughness={0.85} />
      </mesh>
      {/* Front wall + door */}
      <mesh position={[0, 2, 5.9]}>
        <boxGeometry args={[14, 4, 0.2]} />
        <meshStandardMaterial color="#6a4d2c" roughness={0.85} />
      </mesh>
      {/* Ceiling — pressed-tin cream */}
      <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#675440" roughness={0.85} />
      </mesh>
      {/* Crown molding */}
      <mesh position={[0, 3.95, -4.95]}>
        <boxGeometry args={[14, 0.15, 0.15]} />
        <meshStandardMaterial color="#f4eccd" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.4, 5.78]}>
        <boxGeometry args={[1.2, 2.4, 0.04]} />
        <meshStandardMaterial color="#28181c" />
      </mesh>

      <CafeInterior />

      {viewMode === "diorama" && <PlayerCharacter />}
      {viewMode === "diorama" && <TargetPing />}
      {NPC_LIST.map((id) => (
        <NpcActor key={id} npcId={id} sceneLocation="cafe" />
      ))}
    </group>
  );
}
