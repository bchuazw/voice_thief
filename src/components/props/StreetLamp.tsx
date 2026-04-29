"use client";

interface Props {
  position: [number, number, number];
}

/**
 * Cast-iron streetlamp post — straight pole, bracket arm, frosted globe.
 * The volumetric halo is rendered separately by VolumetricLamp.
 */
export default function StreetLamp({ position }: Props) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.22, 0.32, 0.4, 8]} />
        <meshStandardMaterial color="#1a1a20" metalness={0.4} roughness={0.7} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 2.3, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 4.0, 8]} />
        <meshStandardMaterial color="#1a1a20" metalness={0.4} roughness={0.7} />
      </mesh>
      {/* Decorative ring near top */}
      <mesh position={[0, 4.1, 0]}>
        <torusGeometry args={[0.12, 0.025, 6, 12]} />
        <meshStandardMaterial color="#1a1a20" metalness={0.5} roughness={0.6} />
      </mesh>
      {/* Bracket arm */}
      <mesh position={[0, 4.3, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.06, 0.4]} />
        <meshStandardMaterial color="#1a1a20" metalness={0.4} roughness={0.7} />
      </mesh>
      {/* Globe */}
      <mesh position={[0, 4.0, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#fff5d8" emissive="#f5a623" emissiveIntensity={2.5} />
      </mesh>
      {/* Crown finial */}
      <mesh position={[0, 4.32, 0]}>
        <coneGeometry args={[0.06, 0.18, 6]} />
        <meshStandardMaterial color="#1a1a20" metalness={0.5} roughness={0.6} />
      </mesh>
    </group>
  );
}
