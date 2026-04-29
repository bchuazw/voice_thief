"use client";

/**
 * Cafe counter, espresso machine, stools, hanging Edison bulbs, jukebox.
 */
export default function CafeInterior() {
  return (
    <group>
      {/* Long counter along back */}
      <mesh position={[0, 0.55, -3.5]} castShadow receiveShadow>
        <boxGeometry args={[10, 1.1, 1.0]} />
        <meshStandardMaterial color="#3a1f12" roughness={0.55} />
      </mesh>
      {/* Brass kickplate */}
      <mesh position={[0, 0.12, -3.05]}>
        <boxGeometry args={[10, 0.18, 0.04]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
      </mesh>
      {/* Top */}
      <mesh position={[0, 1.13, -3.5]}>
        <boxGeometry args={[10.2, 0.06, 1.05]} />
        <meshStandardMaterial color="#28181c" roughness={0.4} />
      </mesh>
      {/* Brass nosing */}
      <mesh position={[0, 1.16, -3.0]}>
        <boxGeometry args={[10.2, 0.04, 0.04]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
      </mesh>

      {/* Espresso machine */}
      <group position={[-3, 1.16, -3.5]}>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[1.4, 0.8, 0.7]} />
          <meshStandardMaterial color="#a07020" metalness={0.9} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.16, 0.18, 0.2, 16]} />
          <meshStandardMaterial color="#a07020" metalness={1} roughness={0.3} />
        </mesh>
        {/* Steam wand */}
        <mesh position={[-0.7, 0.6, 0.36]} rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
          <meshStandardMaterial color="#1a1a1a" metalness={1} roughness={0.4} />
        </mesh>
        {/* Cups stacked on top */}
        {[-0.4, -0.2, 0, 0.2, 0.4].map((x, i) => (
          <mesh key={i} position={[x, 1.15, 0.2]}>
            <cylinderGeometry args={[0.06, 0.05, 0.1, 12]} />
            <meshStandardMaterial color="#f4eccd" />
          </mesh>
        ))}
      </group>

      {/* Cash register */}
      <group position={[3.5, 1.16, -3.5]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.8, 0.6, 0.5]} />
          <meshStandardMaterial color="#3a2418" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.7, 0.04, 0.45]} />
          <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
        </mesh>
      </group>

      {/* Stools facing the counter */}
      {[-3, -1.5, 0, 1.5, 3].map((x, i) => (
        <group key={i} position={[x, 0, -2.0]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.18, 0.16, 0.08, 16]} />
            <meshStandardMaterial color="#7a1818" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.7, 8]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.04, 12]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      ))}

      {/* Three hanging Edison bulbs */}
      {[-3, 0, 3].map((x, i) => (
        <group key={i} position={[x, 3.4, -1.8]}>
          {/* Cord */}
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.8, 4]} />
            <meshStandardMaterial color="#0a0a0a" />
          </mesh>
          {/* Bulb */}
          <mesh>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color="#fff5d8" emissive="#f5a623" emissiveIntensity={2.5} />
          </mesh>
          <pointLight intensity={0.4} color="#ffb060" distance={3} />
        </group>
      ))}

      {/* Jukebox in corner */}
      <group position={[5.5, 0, -2.5]}>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[1.1, 1.4, 0.6]} />
          <meshStandardMaterial color="#a02418" roughness={0.55} />
        </mesh>
        {/* Dome */}
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.55, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#a02418" roughness={0.55} />
        </mesh>
        {/* Window */}
        <mesh position={[0, 1.0, 0.31]}>
          <boxGeometry args={[0.7, 0.5, 0.02]} />
          <meshStandardMaterial color="#1a1a1a" emissive="#f5a623" emissiveIntensity={0.6} />
        </mesh>
        {/* Coin slot */}
        <mesh position={[0, 0.4, 0.31]}>
          <boxGeometry args={[0.1, 0.04, 0.02]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        <pointLight position={[0, 1.0, 0.5]} intensity={0.4} color="#ffb060" distance={2} />
      </group>

      {/* Two cafe tables in front of counter */}
      {[
        [-3, 0, 1.5],
        [3, 0, 1.5],
      ].map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.04, 24]} />
            <meshStandardMaterial color="#3a2418" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.7, 8]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          {/* Coffee cup */}
          <mesh position={[0, 0.78, 0]}>
            <cylinderGeometry args={[0.07, 0.05, 0.1, 12]} />
            <meshStandardMaterial color="#f4eccd" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
