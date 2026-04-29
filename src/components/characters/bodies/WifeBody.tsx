"use client";

/**
 * Margaret Vance — 50s. Tea-length dress with belted waist, pearl
 * necklace, pinned hair.
 */
export default function WifeBody() {
  return (
    <group>
      {/* Skirt — flares slightly */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.34, 1.0, 14]} />
        <meshStandardMaterial color="#5a2828" roughness={0.85} />
      </mesh>
      {/* Pattern accent: lighter belt */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.08, 14]} />
        <meshStandardMaterial color="#3a1818" roughness={0.7} />
      </mesh>
      {/* Bodice */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.7, 6, 12]} />
        <meshStandardMaterial color="#5a2828" roughness={0.85} />
      </mesh>
      {/* Pearl necklace */}
      <mesh position={[0, 1.74, 0.24]}>
        <torusGeometry args={[0.10, 0.012, 6, 24]} />
        <meshStandardMaterial color="#f4eccd" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.30, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#e6c4a0" roughness={0.85} />
      </mesh>
      <mesh position={[0.30, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#e6c4a0" roughness={0.85} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.92, 0]} castShadow>
        <sphereGeometry args={[0.20, 14, 14]} />
        <meshStandardMaterial color="#e6c4a0" roughness={0.85} />
      </mesh>
      {/* Lipstick */}
      <mesh position={[0, 1.84, 0.19]}>
        <boxGeometry args={[0.06, 0.014, 0.01]} />
        <meshStandardMaterial color="#a01818" />
      </mesh>
      {/* Hair: rolled-up volume, blonde-ish */}
      <mesh position={[0, 2.1, -0.02]} castShadow>
        <sphereGeometry args={[0.22, 14, 14]} />
        <meshStandardMaterial color="#a07a3a" roughness={0.95} />
      </mesh>
      <mesh position={[-0.18, 1.92, -0.04]} castShadow>
        <sphereGeometry args={[0.10, 12, 12]} />
        <meshStandardMaterial color="#a07a3a" roughness={0.95} />
      </mesh>
      <mesh position={[0.18, 1.92, -0.04]} castShadow>
        <sphereGeometry args={[0.10, 12, 12]} />
        <meshStandardMaterial color="#a07a3a" roughness={0.95} />
      </mesh>
      {/* Earring */}
      <mesh position={[-0.19, 1.88, 0.05]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[0.19, 1.88, 0.05]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
}
