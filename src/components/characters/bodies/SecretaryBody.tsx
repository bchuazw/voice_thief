"use client";

/**
 * Lillian Park — late 30s. Pencil skirt + crisp blouse + low bun.
 */
export default function SecretaryBody() {
  return (
    <group>
      {/* Pencil skirt */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 1.0, 12]} />
        <meshStandardMaterial color="#3a2a3a" roughness={0.8} />
      </mesh>
      {/* Blouse (slimmer top) */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.7, 6, 12]} />
        <meshStandardMaterial color="#f4eccd" roughness={0.75} />
      </mesh>
      {/* Cardigan over shoulders (slight color difference) */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <capsuleGeometry args={[0.30, 0.4, 6, 12]} />
        <meshStandardMaterial color="#5a2828" roughness={0.85} />
      </mesh>
      {/* Brooch */}
      <mesh position={[0.1, 1.6, 0.27]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.3} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.28, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#e6c4a0" roughness={0.85} />
      </mesh>
      <mesh position={[0.28, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#e6c4a0" roughness={0.85} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.92, 0]} castShadow>
        <sphereGeometry args={[0.19, 14, 14]} />
        <meshStandardMaterial color="#e6c4a0" roughness={0.85} />
      </mesh>
      {/* Lipstick */}
      <mesh position={[0, 1.82, 0.18]}>
        <boxGeometry args={[0.05, 0.014, 0.01]} />
        <meshStandardMaterial color="#a01818" roughness={0.4} />
      </mesh>
      {/* Hair: low bun at back, swept-back top */}
      <mesh position={[0, 2.05, -0.05]} castShadow>
        <sphereGeometry args={[0.20, 14, 14]} />
        <meshStandardMaterial color="#3a1f12" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.88, -0.18]} castShadow>
        <sphereGeometry args={[0.10, 12, 12]} />
        <meshStandardMaterial color="#3a1f12" roughness={0.95} />
      </mesh>
      {/* Earring */}
      <mesh position={[-0.18, 1.88, 0.06]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
}
