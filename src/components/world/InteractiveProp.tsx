"use client";

import { Html } from "@react-three/drei";
import { useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";

interface Props {
  position: [number, number, number];
  label: string;
  color: string;
  onClick: () => void;
}

export default function InteractiveProp({ position, label, color, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  function stop(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
  }
  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          stop(e);
          onClick();
        }}
        onPointerOver={(e) => {
          stop(e);
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[0.6, 0.9, 0.4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.9 : 0.4}
        />
      </mesh>
      <Html center position={[0, 0.9, 0]} distanceFactor={9}>
        <div className="pointer-events-none rounded bg-black/70 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-noir-paper">
          {label}
        </div>
      </Html>
    </group>
  );
}
