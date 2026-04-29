"use client";

interface Props {
  position: [number, number, number];
}

/**
 * Tenement-style apartment block with grid of windows (some lit, some
 * dark) and an iron fire escape zigzagging down the front.
 */
export default function ApartmentBlock({ position }: Props) {
  return (
    <group position={position}>
      {/* Body — taller than the others; front face at local z=0.
          Warm self-emit so the silhouette has presence at every angle, not just
          when a point-light catches it. */}
      <mesh position={[0, 4.0, -3]} castShadow receiveShadow>
        <boxGeometry args={[6.0, 8.0, 6]} />
        <meshStandardMaterial
          color="#2a2230"
          roughness={0.9}
          emissive="#1a1428"
          emissiveIntensity={0.45}
        />
      </mesh>

      {/* Brick stripe at base — warmer + slight emit for definition */}
      <mesh position={[0, 0.6, 0.06]} receiveShadow>
        <boxGeometry args={[6.2, 1.2, 0.4]} />
        <meshStandardMaterial
          color="#4a2218"
          roughness={0.95}
          emissive="#2a0e08"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Cornice rim light — wider band on the front face, lower on the building so
          the camera at street level catches it */}
      <mesh position={[0, 7.7, 0.06]}>
        <boxGeometry args={[6.1, 0.18, 0.08]} />
        <meshStandardMaterial color="#0a0a10" emissive="#f5a623" emissiveIntensity={0.85} />
      </mesh>
      {/* Vertical edge accents — warm column on each corner so the building outline
          reads against the dusk sky */}
      <mesh position={[-3.0, 4, 0.06]}>
        <boxGeometry args={[0.08, 7.4, 0.06]} />
        <meshStandardMaterial color="#0a0a10" emissive="#5a3a18" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[3.0, 4, 0.06]}>
        <boxGeometry args={[0.08, 7.4, 0.06]} />
        <meshStandardMaterial color="#0a0a10" emissive="#5a3a18" emissiveIntensity={0.6} />
      </mesh>
      {/* Sodium-lamp point light on the building face for environmental fill */}
      <pointLight position={[0, 5, 1.5]} intensity={0.6} color="#7aa6cc" distance={6} />

      {/* Lit window grid: 3 cols × 4 rows */}
      {[0, 1, 2].map((cx) =>
        [0, 1, 2, 3].map((cy) => {
          const lit = (cx * 7 + cy * 13 + 1) % 5 < 3;
          return (
            <group key={`${cx}-${cy}`} position={[(cx - 1) * 1.6, 2.2 + cy * 1.5, 0.04]}>
              {/* Sash */}
              <mesh>
                <boxGeometry args={[0.95, 1.05, 0.02]} />
                <meshStandardMaterial
                  color="#0d0d12"
                  emissive={lit ? "#f5a623" : "#0a0a10"}
                  emissiveIntensity={lit ? 1.2 : 0}
                />
              </mesh>
              {/* Cross mullion */}
              <mesh position={[0, 0, 0.02]}>
                <boxGeometry args={[0.95, 0.04, 0.04]} />
                <meshStandardMaterial color="#0a0a10" />
              </mesh>
              <mesh position={[0, 0, 0.02]}>
                <boxGeometry args={[0.04, 1.05, 0.04]} />
                <meshStandardMaterial color="#0a0a10" />
              </mesh>
              {/* Sill */}
              <mesh position={[0, -0.55, 0.06]}>
                <boxGeometry args={[1.05, 0.06, 0.18]} />
                <meshStandardMaterial color="#28181c" />
              </mesh>
            </group>
          );
        }),
      )}

      {/* Fire escape — three platforms with zigzag stairs */}
      {[2.0, 3.6, 5.2, 6.8].map((y, i) => (
        <group key={`fe-${i}`}>
          {/* Platform */}
          <mesh position={[0, y, 0.5]}>
            <boxGeometry args={[3.6, 0.06, 0.6]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.7} />
          </mesh>
          {/* Railing — front */}
          <mesh position={[0, y + 0.45, 0.78]}>
            <boxGeometry args={[3.6, 0.04, 0.04]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.7} />
          </mesh>
          {/* Railing posts */}
          {[-1.6, 0, 1.6].map((px, j) => (
            <mesh key={`p${j}`} position={[px, y + 0.22, 0.78]}>
              <boxGeometry args={[0.04, 0.46, 0.04]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.7} />
            </mesh>
          ))}
          {/* Stair to next platform */}
          {i < 3 && (
            <mesh position={[i % 2 === 0 ? 1.2 : -1.2, y + 0.8, 0.5]} rotation={[0, 0, i % 2 === 0 ? 0.4 : -0.4]}>
              <boxGeometry args={[1.4, 0.04, 0.5]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.7} />
            </mesh>
          )}
        </group>
      ))}

      {/* Door at street level */}
      <mesh position={[0, 1.2, 0.04]}>
        <boxGeometry args={[1.2, 2.4, 0.04]} />
        <meshStandardMaterial color="#28181c" roughness={0.6} />
      </mesh>
      {/* Door window */}
      <mesh position={[0, 1.6, 0.07]}>
        <boxGeometry args={[0.7, 0.9, 0.02]} />
        <meshStandardMaterial color="#0a0a10" emissive="#aac6ff" emissiveIntensity={0.4} />
      </mesh>
      {/* Doorknob */}
      <mesh position={[0.3, 1.2, 0.08]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.3} />
      </mesh>

      {/* Sconce above door */}
      <mesh position={[0, 2.6, 0.18]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#f5a623" emissive="#f5a623" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[0, 2.6, 0.3]} intensity={0.4} color="#ffb060" distance={3} />
    </group>
  );
}
