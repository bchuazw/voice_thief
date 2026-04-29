"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useGame } from "@/game/store";
import { moveToward } from "@/game/pathfinding";
import PlayerCharacter from "@/components/characters/PlayerCharacter";
import NpcActor from "@/components/characters/NpcActor";
import VolumetricLamp from "@/components/shaders/VolumetricLamp";
import VaultDoor from "@/components/shaders/VaultDoor";
import TargetPing from "@/components/world/TargetPing";
import MarbleFloor from "@/components/props/MarbleFloor";
import TellerCounter from "@/components/props/TellerCounter";
import Chandelier from "@/components/props/Chandelier";
import type { NpcId } from "@/game/types";

const NPC_LIST: NpcId[] = ["bankManager", "secretary", "bankGuard"];

export default function BankInteriorScene() {
  const player = useGame((s) => s.player);
  const setPlayerPosition = useGame((s) => s.setPlayerPosition);
  const setPlayerTarget = useGame((s) => s.setPlayerTarget);
  const viewMode = useGame((s) => s.viewMode);
  const vaultOpen = useGame((s) => s.vaultOpen);
  const lastPos = useRef(player.position);
  const { camera } = useThree();

  useEffect(() => {
    if (viewMode !== "diorama") return;
    camera.position.set(0, 11, 12);
    camera.lookAt(0, 1, -3);
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
      {/* Warm interior lighting */}
      <ambientLight intensity={0.42} color="#f8e8c8" />
      <pointLight position={[-3, 4, 2]} intensity={1.4} color="#ffd9a0" distance={10} />
      <pointLight position={[3, 4, 2]} intensity={1.4} color="#ffd9a0" distance={10} />
      <pointLight position={[0, 3.5, -8]} intensity={1.0} color="#ffb060" distance={6} />
      <VolumetricLamp position={[-6, 4, -6]} color="#f0c878" />

      {/* Marble floor with checker pattern */}
      <MarbleFloor
        position={[0, 0, 0]}
        size={[24, 18]}
        onClick={(e) => {
          if (viewMode !== "diorama") return;
          setPlayerTarget({ x: e.point.x, y: 0, z: e.point.z });
        }}
      />

      {/* Wood-paneled side walls */}
      <mesh position={[-12, 2.5, -2]} receiveShadow>
        <boxGeometry args={[0.4, 5, 16]} />
        <meshStandardMaterial color="#3a2418" roughness={0.55} />
      </mesh>
      <mesh position={[12, 2.5, -2]} receiveShadow>
        <boxGeometry args={[0.4, 5, 16]} />
        <meshStandardMaterial color="#3a2418" roughness={0.55} />
      </mesh>
      {/* Wainscoting */}
      <mesh position={[-11.78, 1, -2]} receiveShadow>
        <boxGeometry args={[0.05, 2, 16]} />
        <meshStandardMaterial color="#2a1810" />
      </mesh>
      <mesh position={[11.78, 1, -2]} receiveShadow>
        <boxGeometry args={[0.05, 2, 16]} />
        <meshStandardMaterial color="#2a1810" />
      </mesh>

      {/* Front wall + entrance back to street */}
      <mesh position={[0, 2.5, 6]} receiveShadow>
        <boxGeometry args={[24, 5, 0.4]} />
        <meshStandardMaterial color="#3a2418" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.4, 5.85]}>
        <boxGeometry args={[2.0, 2.4, 0.04]} />
        <meshStandardMaterial color="#28181c" />
      </mesh>
      {/* Top lit transom */}
      <mesh position={[0, 3.3, 5.85]}>
        <boxGeometry args={[2.4, 0.4, 0.04]} />
        <meshStandardMaterial color="#0a0a10" emissive="#f5a623" emissiveIntensity={0.6} />
      </mesh>

      {/* Teller counter with brass detailing */}
      <TellerCounter position={[0, 0, -5]} />

      {/* Hallway opening at back wall */}
      <mesh position={[-4.5, 2.5, -8]}>
        <boxGeometry args={[7, 5, 0.4]} />
        <meshStandardMaterial color="#3a2418" roughness={0.6} />
      </mesh>
      <mesh position={[4.5, 2.5, -8]}>
        <boxGeometry args={[7, 5, 0.4]} />
        <meshStandardMaterial color="#3a2418" roughness={0.6} />
      </mesh>
      <mesh position={[0, 4.4, -8]}>
        <boxGeometry args={[2, 1.2, 0.4]} />
        <meshStandardMaterial color="#3a2418" roughness={0.6} />
      </mesh>

      {/* Chandelier */}
      <Chandelier position={[0, 4.6, -2]} />

      {/* Vault chamber further back */}
      <mesh position={[0, 2.5, -12]}>
        <boxGeometry args={[8, 5, 0.4]} />
        <meshStandardMaterial color="#222024" roughness={0.6} />
      </mesh>
      <VaultDoor open={vaultOpen} position={[0, 2, -11.6]} />

      {/* Briefcase pedestal inside vault, visible after open */}
      {vaultOpen && (
        <group position={[0, 0, -13]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[0.7, 0.9, 0.6]} />
            <meshStandardMaterial color="#2a1810" />
          </mesh>
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[0.6, 0.18, 0.4]} />
            <meshStandardMaterial color="#5a3a22" roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.05, 0.21]}>
            <boxGeometry args={[0.18, 0.06, 0.02]} />
            <meshStandardMaterial color="#a07020" metalness={1} roughness={0.3} />
          </mesh>
          <pointLight position={[0, 1.5, 0]} intensity={1.4} color="#ffd9a0" distance={3} />
        </group>
      )}

      {viewMode === "diorama" && <PlayerCharacter />}
      {viewMode === "diorama" && <TargetPing />}
      {NPC_LIST.map((id) => (
        <NpcActor key={id} npcId={id} sceneLocation="bankLobby" />
      ))}
    </group>
  );
}
