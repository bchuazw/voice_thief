"use client";

interface Props {
  position: [number, number, number];
}

/**
 * Mid-century red booth-style payphone.
 */
export default function Payphone({ position }: Props) {
  return (
    <group position={position}>
      {/* Booth back & sides */}
      <mesh position={[0, 1.4, -0.18]}>
        <boxGeometry args={[1.0, 2.4, 0.08]} />
        <meshStandardMaterial color="#7a1e18" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Cabinet box */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.7, 0.85, 0.34]} />
        <meshStandardMaterial color="#a0241e" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Front face — darker red */}
      <mesh position={[0, 1.3, 0.18]}>
        <boxGeometry args={[0.66, 0.81, 0.02]} />
        <meshStandardMaterial color="#7a1818" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Coin slot */}
      <mesh position={[0, 1.55, 0.2]}>
        <boxGeometry args={[0.18, 0.04, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" metalness={1} roughness={0.4} />
      </mesh>
      {/* Rotary dial */}
      <mesh position={[0, 1.3, 0.2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[0, 1.3, 0.21]}>
        <torusGeometry args={[0.1, 0.015, 6, 16]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
      </mesh>
      {/* Coin return */}
      <mesh position={[0, 1.05, 0.2]}>
        <boxGeometry args={[0.14, 0.06, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.5} />
      </mesh>
      {/* Handset on hook */}
      <mesh position={[0.42, 1.3, 0.05]} rotation={[0, 0, 1.5]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0.42, 1.5, 0.05]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0.42, 1.1, 0.05]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Coiled cord — abstracted */}
      <mesh position={[0.35, 1.3, 0.08]}>
        <torusGeometry args={[0.06, 0.012, 6, 18]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Glowing TELEPHONE sign on top */}
      <mesh position={[0, 2.45, 0.08]}>
        <boxGeometry args={[0.7, 0.22, 0.04]} />
        <meshStandardMaterial color="#0a0a10" emissive="#ff3c3c" emissiveIntensity={1.6} />
      </mesh>
      <pointLight position={[0, 2.0, 0.3]} intensity={0.45} color="#ff5050" distance={2.5} />
    </group>
  );
}
