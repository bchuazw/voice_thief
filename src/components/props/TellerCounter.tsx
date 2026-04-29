"use client";

interface Props {
  position: [number, number, number];
}

/**
 * Long mahogany teller counter with brass-trimmed top, 3 teller windows
 * with iron bars, secretary's desk lamp on the end.
 */
export default function TellerCounter({ position }: Props) {
  return (
    <group position={position}>
      {/* Counter base */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 1.1, 0.9]} />
        <meshStandardMaterial color="#3a1f12" roughness={0.55} />
      </mesh>
      {/* Brass-trimmed top */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[10.2, 0.08, 1.0]} />
        <meshStandardMaterial color="#5a3820" roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.18, 0.51]}>
        <boxGeometry args={[10.2, 0.04, 0.04]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
      </mesh>

      {/* Three teller windows divided by partitions */}
      {[-3, 0, 3].map((x, i) => (
        <group key={i} position={[x, 1.6, 0]}>
          {/* Frame */}
          <mesh>
            <boxGeometry args={[2.4, 1.0, 0.08]} />
            <meshStandardMaterial color="#3a1f12" roughness={0.5} />
          </mesh>
          {/* Glass */}
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[2.0, 0.7, 0.02]} />
            <meshStandardMaterial color="#0a0a14" emissive="#f5d28a" emissiveIntensity={0.25} />
          </mesh>
          {/* Iron bars */}
          {[-0.7, -0.35, 0, 0.35, 0.7].map((bx, j) => (
            <mesh key={j} position={[bx, 0, 0.08]}>
              <cylinderGeometry args={[0.025, 0.025, 0.7, 6]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.45} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Partitions between windows */}
      {[-1.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 1.6, 0]}>
          <boxGeometry args={[0.18, 1.1, 0.5]} />
          <meshStandardMaterial color="#3a1f12" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[-4.7, 1.6, 0]}>
        <boxGeometry args={[0.18, 1.1, 0.5]} />
        <meshStandardMaterial color="#3a1f12" roughness={0.5} />
      </mesh>
      <mesh position={[4.7, 1.6, 0]}>
        <boxGeometry args={[0.18, 1.1, 0.5]} />
        <meshStandardMaterial color="#3a1f12" roughness={0.5} />
      </mesh>

      {/* Secretary's desk lamp on the right end */}
      <group position={[4.4, 1.18, 0.2]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.13, 0.05, 12]} />
          <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.32, 6]} />
          <meshStandardMaterial color="#3a2418" />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <coneGeometry args={[0.16, 0.14, 12, 1, true]} />
          <meshStandardMaterial color="#2a1810" emissive="#f5a623" emissiveIntensity={0.7} />
        </mesh>
        <pointLight position={[0, 0.35, 0]} intensity={0.45} color="#ffb060" distance={2.5} />
      </group>

      {/* Stack of papers */}
      <mesh position={[3.2, 1.22, 0.3]}>
        <boxGeometry args={[0.4, 0.04, 0.3]} />
        <meshStandardMaterial color="#f4eccd" roughness={0.9} />
      </mesh>
      {/* Inkwell */}
      <mesh position={[2.7, 1.22, 0.3]}>
        <cylinderGeometry args={[0.05, 0.05, 0.06, 8]} />
        <meshStandardMaterial color="#1a1a26" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Telephone (visual) */}
      <group position={[-3.6, 1.22, 0.3]}>
        <mesh>
          <boxGeometry args={[0.3, 0.12, 0.22]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.22, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
    </group>
  );
}
