"use client";

interface Props {
  position: [number, number, number];
}

/**
 * The all-night cafe — large mullion window casting warm light, striped
 * awning, glowing transom, hanging light visible in window.
 */
export default function CafeFacade({ position }: Props) {
  return (
    <group position={position}>
      {/* Building mass — front face at local z=0 */}
      <mesh position={[0, 2.6, -3]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 5.2, 6]} />
        <meshStandardMaterial color="#231a1c" roughness={0.85} />
      </mesh>

      {/* Stone base */}
      <mesh position={[0, 0.4, 0.08]} receiveShadow>
        <boxGeometry args={[6.6, 0.8, 0.6]} />
        <meshStandardMaterial color="#3a2218" roughness={0.95} />
      </mesh>

      {/* Big mullion window — 5 wide x 3 tall grid */}
      <group position={[-1.2, 2.3, 0.04]}>
        {[0, 1, 2, 3, 4].map((cx) =>
          [0, 1, 2].map((cy) => {
            // Random-ish unlit cells via deterministic hash
            const lit = (cx * 31 + cy * 17) % 5 !== 0;
            return (
              <mesh key={`${cx}-${cy}`} position={[cx * 0.66 - 0.06, cy * 0.7 - 0.7, 0]}>
                <boxGeometry args={[0.6, 0.64, 0.02]} />
                <meshStandardMaterial
                  color="#1a0e08"
                  emissive="#f5a623"
                  emissiveIntensity={lit ? 1.5 : 0.25}
                />
              </mesh>
            );
          }),
        )}
        {/* Vertical mullions (5 columns → 6 lines) */}
        {[-0.06, 0.6, 1.26, 1.92, 2.58, 3.24].map((mx, i) => (
          <mesh key={`vm${i}`} position={[mx - 0.06, 0, 0.03]}>
            <boxGeometry args={[0.04, 2.2, 0.04]} />
            <meshStandardMaterial color="#1a1418" />
          </mesh>
        ))}
        {/* Horizontal mullions */}
        {[-1.04, -0.34, 0.36, 1.06].map((my, i) => (
          <mesh key={`hm${i}`} position={[1.6, my, 0.03]}>
            <boxGeometry args={[3.4, 0.04, 0.04]} />
            <meshStandardMaterial color="#1a1418" />
          </mesh>
        ))}
      </group>

      {/* Striped awning above the window */}
      {[-1.6, -1.0, -0.4, 0.2, 0.8, 1.4].map((sx, i) => (
        <mesh key={i} position={[sx + 0.4, 4.2, 0.4]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.5, 0.05, 1.0]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#7a2018" : "#f4eccd"}
            roughness={0.7}
          />
        </mesh>
      ))}

      {/* Door with glass + chevron pattern */}
      <mesh position={[2.0, 1.4, 0.05]}>
        <boxGeometry args={[1.0, 2.2, 0.04]} />
        <meshStandardMaterial color="#3a2418" roughness={0.5} />
      </mesh>
      {/* Door window pane */}
      <mesh position={[2.0, 1.7, 0.08]}>
        <boxGeometry args={[0.6, 1.0, 0.02]} />
        <meshStandardMaterial color="#0a0a10" emissive="#f5a623" emissiveIntensity={0.7} />
      </mesh>
      {/* Brass kickplate */}
      <mesh position={[2.0, 0.45, 0.08]}>
        <boxGeometry args={[0.9, 0.18, 0.02]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
      </mesh>
      {/* Doorknob */}
      <mesh position={[2.35, 1.4, 0.1]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.3} />
      </mesh>

      {/* Hanging Edison bulb visible in upper-right of window */}
      <mesh position={[1.6, 3.4, 0.2]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#f5a623" emissive="#f5a623" emissiveIntensity={2.5} />
      </mesh>
      <pointLight position={[1.6, 3.2, 0.4]} intensity={0.5} color="#ffb060" distance={3} />
    </group>
  );
}
