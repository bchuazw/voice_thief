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

export default function LocationGate({ position, label, color, onClick }: Props) {
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
        <boxGeometry args={[1.6, 1.6, 0.2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.7 : 0.25}
          transparent
          opacity={0.55}
        />
      </mesh>
      <Html center position={[0, 1.2, 0]} distanceFactor={10} zIndexRange={[12, 0]}>
        <div className="pointer-events-none rounded bg-black/80 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-noir-paper">
          {label}
        </div>
      </Html>
    </group>
  );
}
