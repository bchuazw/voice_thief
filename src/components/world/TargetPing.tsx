"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { useGame } from "@/game/store";
import type { Vec3 } from "@/game/types";

export default function TargetPing() {
  const target = useGame((s) => s.player.target);
  if (!target) return null;
  return <TargetPingRing key={`${target.x}:${target.z}`} target={target} />;
}

function TargetPingRing({ target }: { target: Vec3 }) {
  const [active, setActive] = useState<{ pos: THREE.Vector3; t: number } | null>(
    () => ({
      pos: new THREE.Vector3(target.x, 0.05, target.z),
      t: 0,
    }),
  );
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (!active || !ringRef.current) return;
    const elapsed = active.t + dt;
    if (elapsed > 0.85) {
      setActive(null);
      return;
    }
    setActive({ ...active, t: elapsed });
    const k = elapsed / 0.85;
    ringRef.current.scale.setScalar(0.4 + k * 1.6);
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = (1 - k) * 0.7;
  });

  if (!active) return null;
  return (
    <mesh ref={ringRef} position={active.pos} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.6, 0.78, 32]} />
      <meshBasicMaterial color="#f5a623" transparent opacity={0.7} />
    </mesh>
  );
}
