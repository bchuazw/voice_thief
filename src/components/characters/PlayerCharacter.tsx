"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useGame } from "@/game/store";

export default function PlayerCharacter() {
  const ref = useRef<THREE.Group>(null);
  const player = useGame((s) => s.player);

  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.set(player.position.x, 0, player.position.z);
    if (player.target) {
      const dx = player.target.x - player.position.x;
      const dz = player.target.z - player.position.z;
      const angle = Math.atan2(dx, dz);
      ref.current.rotation.y = THREE.MathUtils.damp(
        ref.current.rotation.y,
        angle,
        6,
        dt,
      );
    }
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <capsuleGeometry args={[0.32, 1, 6, 12]} />
        <meshStandardMaterial color="#0a0a10" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.4, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#0a0a10" roughness={1} />
      </mesh>
      <mesh position={[0, 2.7, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.05, 24]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.18, 24]} />
        <meshStandardMaterial color="#000" />
      </mesh>
    </group>
  );
}
