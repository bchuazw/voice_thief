"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useGame } from "@/game/store";
import { moveToward } from "@/game/pathfinding";
import PlayerCharacter from "@/components/characters/PlayerCharacter";
import NpcActor from "@/components/characters/NpcActor";
import LocationGate from "@/components/world/LocationGate";

export default function ApartmentScene() {
  const player = useGame((s) => s.player);
  const setPlayerPosition = useGame((s) => s.setPlayerPosition);
  const setPlayerTarget = useGame((s) => s.setPlayerTarget);
  const setPlayerLocation = useGame((s) => s.setPlayerLocation);
  const lastPos = useRef(player.position);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(player.position.x, 5, player.position.z + 7);
    camera.lookAt(player.position.x, 1, player.position.z);
  }, [camera, player.position.x, player.position.z]);

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
      <ambientLight intensity={0.3} color="#f8d8a8" />
      <pointLight position={[2, 4, 2]} intensity={1.6} color="#ffb060" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={(e) => setPlayerTarget({ x: e.point.x, y: 0, z: e.point.z })}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#3a2218" roughness={0.6} />
      </mesh>

      <mesh position={[0, 1, -5]}>
        <boxGeometry args={[14, 4, 0.2]} />
        <meshStandardMaterial color="#28181a" />
      </mesh>

      <mesh position={[-3, 0.8, -3]}>
        <boxGeometry args={[3, 1.2, 1.5]} />
        <meshStandardMaterial color="#5a2828" roughness={0.7} />
      </mesh>
      <mesh position={[3, 0.5, -3]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#3a2418" />
      </mesh>
      <mesh position={[3, 1.2, -3]}>
        <cylinderGeometry args={[0.25, 0.4, 0.4]} />
        <meshStandardMaterial color="#000" emissive="#ffb060" emissiveIntensity={0.8} />
      </mesh>

      <PlayerCharacter />
      <NpcActor npcId="wife" sceneLocation="apartment" />

      <LocationGate
        position={[0, 1.2, 5]}
        label="← Street"
        color="#aac6ff"
        onClick={() => setPlayerLocation("street")}
      />
    </group>
  );
}
