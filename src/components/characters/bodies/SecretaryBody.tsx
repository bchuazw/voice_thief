"use client";

import Arms from "./Arms";

/**
 * Lillian Park — late 30s. Pencil skirt + crisp blouse + low bun.
 */
export default function SecretaryBody() {
  return (
    <group>
      <Arms sleeveColor="#5a2828" skinColor="#e6c4a0" />
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
      {/* (arms now rendered by shared Arms component above) */}
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
      {/* Hair: swept-back cap on the head + small bun at the nape */}
      <mesh position={[0, 1.99, -0.04]} castShadow>
        <sphereGeometry args={[0.22, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color="#3a1f12" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.78, -0.22]} castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
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
