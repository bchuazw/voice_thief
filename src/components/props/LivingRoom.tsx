"use client";

/**
 * Tufted sofa, side table with rotary phone + lamp, framed photos on wall,
 * area rug, coffee table.
 */
export default function LivingRoom() {
  return (
    <group>
      {/* Area rug */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5.5, 4.5]} />
        <meshStandardMaterial color="#5a2828" roughness={0.95} />
      </mesh>
      {/* Rug pattern (lighter inset) */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.6, 3.6]} />
        <meshStandardMaterial color="#7a3a3a" roughness={0.95} />
      </mesh>

      {/* Sofa — three cushions */}
      <group position={[-3, 0, -3]}>
        {/* Base */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[3.5, 0.7, 1.2]} />
          <meshStandardMaterial color="#5a2820" roughness={0.85} />
        </mesh>
        {/* Back */}
        <mesh position={[0, 1.0, -0.5]} castShadow>
          <boxGeometry args={[3.5, 0.9, 0.3]} />
          <meshStandardMaterial color="#5a2820" roughness={0.85} />
        </mesh>
        {/* Arms */}
        <mesh position={[-1.7, 0.8, 0]} castShadow>
          <boxGeometry args={[0.25, 0.85, 1.3]} />
          <meshStandardMaterial color="#5a2820" roughness={0.85} />
        </mesh>
        <mesh position={[1.7, 0.8, 0]} castShadow>
          <boxGeometry args={[0.25, 0.85, 1.3]} />
          <meshStandardMaterial color="#5a2820" roughness={0.85} />
        </mesh>
        {/* Three cushions */}
        {[-1.05, 0, 1.05].map((x, i) => (
          <mesh key={i} position={[x, 0.85, 0.05]} castShadow>
            <boxGeometry args={[0.95, 0.25, 1.0]} />
            <meshStandardMaterial color="#7a3a30" roughness={0.85} />
          </mesh>
        ))}
      </group>

      {/* Coffee table — center */}
      <group position={[0, 0, -1]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.6, 0.08, 0.9]} />
          <meshStandardMaterial color="#3a2418" roughness={0.4} />
        </mesh>
        {/* Legs */}
        {[
          [-0.7, 0.22, -0.4],
          [0.7, 0.22, -0.4],
          [-0.7, 0.22, 0.4],
          [0.7, 0.22, 0.4],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]}>
            <cylinderGeometry args={[0.05, 0.05, 0.45, 6]} />
            <meshStandardMaterial color="#3a2418" />
          </mesh>
        ))}
        {/* Newspaper */}
        <mesh position={[0.2, 0.5, 0.05]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.6, 0.02, 0.4]} />
          <meshStandardMaterial color="#f4eccd" roughness={0.9} />
        </mesh>
        {/* Tea cup */}
        <mesh position={[-0.5, 0.55, 0]}>
          <cylinderGeometry args={[0.06, 0.04, 0.06, 12]} />
          <meshStandardMaterial color="#f4eccd" roughness={0.45} />
        </mesh>
      </group>

      {/* Side table with rotary phone + lamp */}
      <group position={[3, 0, -3]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[0.9, 0.06, 0.9]} />
          <meshStandardMaterial color="#3a2418" roughness={0.4} />
        </mesh>
        {/* Legs */}
        {[
          [-0.36, 0.22, -0.36],
          [0.36, 0.22, -0.36],
          [-0.36, 0.22, 0.36],
          [0.36, 0.22, 0.36],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]}>
            <cylinderGeometry args={[0.03, 0.03, 0.45, 6]} />
            <meshStandardMaterial color="#3a2418" />
          </mesh>
        ))}
        {/* Lamp */}
        <group position={[0.2, 0.48, 0.2]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.1, 0.04, 12]} />
            <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.55, 6]} />
            <meshStandardMaterial color="#3a2418" />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <coneGeometry args={[0.18, 0.22, 12, 1, true]} />
            <meshStandardMaterial color="#f4eccd" emissive="#f5a623" emissiveIntensity={0.6} />
          </mesh>
          <pointLight position={[0, 0.6, 0]} intensity={0.6} color="#ffb060" distance={2.5} />
        </group>
        {/* Rotary phone */}
        <group position={[-0.2, 0.5, 0.0]}>
          <mesh>
            <boxGeometry args={[0.34, 0.14, 0.24]} />
            <meshStandardMaterial color="#0e0e10" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.3, 8]} />
            <meshStandardMaterial color="#0e0e10" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.08, 0.06]}>
            <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />
            <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* Wall photos: three frames */}
      {[-2.0, 0, 2.0].map((x, i) => (
        <group key={i} position={[x, 2.5, -4.86]}>
          {/* Frame */}
          <mesh>
            <boxGeometry args={[0.7, 0.9, 0.04]} />
            <meshStandardMaterial color="#3a1f12" roughness={0.5} />
          </mesh>
          {/* Photo (warm sepia) */}
          <mesh position={[0, 0, 0.025]}>
            <boxGeometry args={[0.55, 0.75, 0.02]} />
            <meshStandardMaterial color={i === 1 ? "#e6c98a" : "#bba26a"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
