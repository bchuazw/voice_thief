"use client";

interface Props {
  position: [number, number, number];
}

/**
 * Overhead neon sign for the bank facade. Two stacked words ("FIRST CITY"
 * in amber, "BANK" in red) on a dark backplate with mounting brackets.
 * Self-emit so it reads against the night sky without needing a stage light.
 */
export default function NeonBankSign({ position }: Props) {
  return (
    <group position={position}>
      {/* Brass frame */}
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[3.7, 0.96, 0.2]} />
        <meshStandardMaterial color="#a87828" metalness={0.85} roughness={0.32} />
      </mesh>
      {/* Black backplate */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.6, 0.9, 0.18]} />
        <meshStandardMaterial color="#07070b" roughness={0.7} />
      </mesh>
      {/* "FIRST CITY" amber bar (acts as the lit area for the top word) */}
      <mesh position={[0, 0.2, 0.105]}>
        <boxGeometry args={[3.2, 0.36, 0.04]} />
        <meshStandardMaterial
          color="#160a04"
          emissive="#f5a623"
          emissiveIntensity={2.2}
          roughness={0.38}
        />
      </mesh>
      {/* "BANK" red bar (lower word) */}
      <mesh position={[0, -0.24, 0.105]}>
        <boxGeometry args={[1.8, 0.32, 0.04]} />
        <meshStandardMaterial
          color="#1a0506"
          emissive="#ff3030"
          emissiveIntensity={2.4}
          roughness={0.35}
        />
      </mesh>
      {/* Tube bracket left */}
      <mesh position={[-1.74, 0, 0.105]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.84, 14]} />
        <meshStandardMaterial
          color="#160a04"
          emissive="#f5a623"
          emissiveIntensity={1.8}
        />
      </mesh>
      {/* Tube bracket right */}
      <mesh position={[1.74, 0, 0.105]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.84, 14]} />
        <meshStandardMaterial
          color="#160a04"
          emissive="#f5a623"
          emissiveIntensity={1.8}
        />
      </mesh>
      {/* Mounting brackets to the wall */}
      <mesh position={[-1.8, 0, -0.18]}>
        <boxGeometry args={[0.12, 0.18, 0.32]} />
        <meshStandardMaterial color="#12141a" metalness={0.7} roughness={0.42} />
      </mesh>
      <mesh position={[1.8, 0, -0.18]}>
        <boxGeometry args={[0.12, 0.18, 0.32]} />
        <meshStandardMaterial color="#12141a" metalness={0.7} roughness={0.42} />
      </mesh>
      {/* Faint amber wash spilling onto the wall behind. */}
      <pointLight
        position={[0, -0.1, 0.5]}
        intensity={0.6}
        color="#f5a623"
        distance={5}
      />
    </group>
  );
}
