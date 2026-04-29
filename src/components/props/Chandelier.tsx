"use client";

interface Props {
  position: [number, number, number];
}

/**
 * Brass chandelier with six warm bulbs.
 */
export default function Chandelier({ position }: Props) {
  return (
    <group position={position}>
      {/* Hanging chain */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.4, 6]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
      {/* Brass ring */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.6, 0.04, 8, 24]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
      </mesh>
      {/* Six bulbs around the ring */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * 0.6;
        const z = Math.sin(a) * 0.6;
        return (
          <group key={i} position={[x, -0.05, z]}>
            <mesh>
              <coneGeometry args={[0.06, 0.18, 8]} />
              <meshStandardMaterial color="#a07020" metalness={0.6} roughness={0.45} />
            </mesh>
            <mesh position={[0, -0.14, 0]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshStandardMaterial color="#fff5d8" emissive="#f5a623" emissiveIntensity={2.4} />
            </mesh>
          </group>
        );
      })}
      <pointLight position={[0, -0.1, 0]} intensity={1.4} color="#ffd9a0" distance={8} />
    </group>
  );
}
