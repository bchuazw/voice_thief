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
      {/* Body coat */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <capsuleGeometry args={[0.34, 1.1, 6, 12]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.85} emissive="#0a0a18" emissiveIntensity={0.4} />
      </mesh>
      {/* Head silhouette */}
      <mesh position={[0, 2.45, 0]} castShadow>
        <sphereGeometry args={[0.24, 12, 12]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.9} emissive="#0a0a18" emissiveIntensity={0.4} />
      </mesh>
      {/* Fedora brim — lifted to a soft highlight so the hat reads */}
      <mesh position={[0, 2.78, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 0.06, 24]} />
        <meshStandardMaterial color="#3a3548" roughness={0.7} emissive="#2a263a" emissiveIntensity={0.5} />
      </mesh>
      {/* Crown */}
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.18, 24]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.9} />
      </mesh>
      {/* Crown band */}
      <mesh position={[0, 2.55, 0]}>
        <cylinderGeometry args={[0.285, 0.285, 0.04, 24]} />
        <meshStandardMaterial color="#0a0a14" roughness={1} />
      </mesh>
      {/* Rim-light pickup from behind/above */}
      <pointLight position={[0, 3.2, -1.2]} intensity={1.6} color="#7c8fc2" distance={4} decay={2} />
      {/* Subtle warm fill from in front */}
      <pointLight position={[0, 1.6, 1.5]} intensity={0.55} color="#c8a070" distance={3} decay={2} />
    </group>
  );
}
