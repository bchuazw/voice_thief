"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useGame } from "@/game/store";
import { moveToward } from "@/game/pathfinding";
import PlayerCharacter from "@/components/characters/PlayerCharacter";
import NpcActor from "@/components/characters/NpcActor";
import LocationGate from "@/components/world/LocationGate";
import type { NpcId } from "@/game/types";

const NPC_LIST: NpcId[] = ["secretary", "bankManager"];

export default function CafeScene() {
  const player = useGame((s) => s.player);
  const setPlayerPosition = useGame((s) => s.setPlayerPosition);
  const setPlayerTarget = useGame((s) => s.setPlayerTarget);
  const setPlayerLocation = useGame((s) => s.setPlayerLocation);
  const lastPos = useRef(player.position);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 9, 10);
    camera.lookAt(0, 1, -1);
  }, [camera]);

  useFrame((_, dt) => {
    const t = useGame.getState().player.target;
    if (!t) return;
    const next = moveToward(lastPos.current, t, dt * 4);
    lastPos.current = next;
    setPlayerPosition(next);
    if (Math.hypot(next.x - t.x, next.z - t.z) < 0.05) setPlayerTarget(null);
  });

  return (
    <group>
      <ambientLight intensity={0.35} color="#f5d6a0" />
      <pointLight position={[0, 4, 0]} intensity={1.3} color="#ffb968" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={(e) => setPlayerTarget({ x: e.point.x, y: 0, z: e.point.z })}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#3a2818" roughness={0.5} />
      </mesh>

      <mesh position={[-4, 0.5, -1]}>
        <cylinderGeometry args={[0.6, 0.6, 1, 8]} />
        <meshStandardMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[4, 0.5, -1]}>
        <cylinderGeometry args={[0.6, 0.6, 1, 8]} />
        <meshStandardMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[0, 1.2, -4]}>
        <boxGeometry args={[8, 2.4, 0.4]} />
        <meshStandardMaterial color="#3a2418" />
      </mesh>

      <PlayerCharacter />
      {NPC_LIST.map((id) => (
        <NpcActor key={id} npcId={id} sceneLocation="cafe" />
      ))}

      <LocationGate
        position={[0, 1.2, 5]}
        label="← Street"
        color="#aac6ff"
        onClick={() => setPlayerLocation("street")}
      />
    </group>
  );
}
