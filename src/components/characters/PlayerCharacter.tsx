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
        <capsuleGeometry args={[0.34, 1.1, 6, 12]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.85} emissive="#0a0a18" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 2.45, 0]} castShadow>
        <sphereGeometry args={[0.24, 12, 12]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.9} emissive="#0a0a18" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 2.78, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 0.06, 24]} />
        <meshStandardMaterial color="#101018" />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.18, 24]} />
        <meshStandardMaterial color="#101018" />
      </mesh>
      <pointLight position={[0, 2, 0]} intensity={0.35} color="#5a72a8" distance={3} />
    </group>
  );
}
