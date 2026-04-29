"use client";

/**
 * Misc props that flesh out the street: fire hydrant, trash can, mailbox,
 * manhole cover, drain grates, newspaper box.
 */
export default function StreetFurniture() {
  return (
    <group>
      {/* Fire hydrant */}
      <group position={[-5, 0, 3]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.18, 0.2, 0.6, 8]} />
          <meshStandardMaterial color="#a01818" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <sphereGeometry args={[0.22, 12, 8]} />
          <meshStandardMaterial color="#a01818" roughness={0.6} />
        </mesh>
        <mesh position={[0.22, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.18, 8]} />
          <meshStandardMaterial color="#a01818" roughness={0.6} />
        </mesh>
        <mesh position={[-0.22, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.18, 8]} />
          <meshStandardMaterial color="#a01818" roughness={0.6} />
        </mesh>
      </group>

      {/* Trash can */}
      <group position={[-2, 0, 4.4]}>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.32, 0.28, 1.1, 12]} />
          <meshStandardMaterial color="#1f2028" metalness={0.5} roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.04, 12]} />
          <meshStandardMaterial color="#0a0a10" metalness={0.6} roughness={0.5} />
        </mesh>
      </group>

      {/* Mailbox — blue */}
      <group position={[6, 0, 4.2]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.56, 0.7, 0.4]} />
          <meshStandardMaterial color="#1a3866" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 0.56, 12]} />
          <meshStandardMaterial color="#1a3866" roughness={0.6} />
        </mesh>
        {/* Slot */}
        <mesh position={[0, 0.95, 0.21]}>
          <boxGeometry args={[0.4, 0.06, 0.02]} />
          <meshStandardMaterial color="#0a0a10" />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.22, 0.18, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.36, 6]} />
          <meshStandardMaterial color="#0a0a10" />
        </mesh>
        <mesh position={[0.22, 0.18, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.36, 6]} />
          <meshStandardMaterial color="#0a0a10" />
        </mesh>
      </group>

      {/* Manhole cover (faint warmth — steam vent below) */}
      <mesh position={[-3, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.6, 24]} />
        <meshStandardMaterial color="#16161a" metalness={0.7} roughness={0.5} />
      </mesh>

      {/* Newspaper box */}
      <group position={[3, 0, 4.4]}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.5, 1.1, 0.4]} />
          <meshStandardMaterial color="#7a1e18" roughness={0.6} />
        </mesh>
        {/* Window pane */}
        <mesh position={[0, 0.7, 0.21]}>
          <boxGeometry args={[0.36, 0.34, 0.02]} />
          <meshStandardMaterial color="#1a1a1a" emissive="#aac6ff" emissiveIntensity={0.2} />
        </mesh>
        {/* Coin slot */}
        <mesh position={[0, 0.95, 0.21]}>
          <boxGeometry args={[0.14, 0.04, 0.02]} />
          <meshStandardMaterial color="#0a0a10" />
        </mesh>
      </group>
    </group>
  );
}
