"use client";

import Arms from "./Arms";

/**
 * Eddie Cole — 40s. Uniform jacket with brass buttons, peaked cap, baton.
 */
export default function BankGuardBody() {
  return (
    <group>
      <Arms sleeveColor="#2a3450" skinColor="#cc9870" />
      {/* Trousers */}
      <mesh position={[-0.13, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.13, 0.9, 8]} />
        <meshStandardMaterial color="#1a1f2a" roughness={0.7} />
      </mesh>
      <mesh position={[0.13, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.13, 0.9, 8]} />
        <meshStandardMaterial color="#1a1f2a" roughness={0.7} />
      </mesh>
      {/* Uniform jacket — broader shoulders */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <capsuleGeometry args={[0.36, 0.85, 6, 12]} />
        <meshStandardMaterial color="#2a3450" roughness={0.7} />
      </mesh>
      {/* Brass buttons (3) */}
      {[1.5, 1.3, 1.1].map((y, i) => (
        <mesh key={i} position={[0, y, 0.32]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#a07020" metalness={1} roughness={0.3} />
        </mesh>
      ))}
      {/* Belt + buckle */}
      <mesh position={[0, 0.96, 0.3]}>
        <boxGeometry args={[0.5, 0.08, 0.06]} />
        <meshStandardMaterial color="#3a1818" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.96, 0.34]}>
        <boxGeometry args={[0.12, 0.08, 0.04]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
      </mesh>
      {/* (arms now rendered by shared Arms component above) */}
      {/* Baton on belt */}
      <mesh position={[0.4, 0.7, 0.18]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
        <meshStandardMaterial color="#3a1f12" roughness={0.55} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.96, 0]} castShadow>
        <sphereGeometry args={[0.22, 14, 14]} />
        <meshStandardMaterial color="#cc9870" roughness={0.85} />
      </mesh>
      {/* Mustache */}
      <mesh position={[0, 1.92, 0.21]}>
        <boxGeometry args={[0.16, 0.025, 0.02]} />
        <meshStandardMaterial color="#3a1f12" />
      </mesh>
      {/* Peaked cap — brim */}
      <mesh position={[0, 2.18, 0.08]}>
        <boxGeometry args={[0.42, 0.04, 0.16]} />
        <meshStandardMaterial color="#0a0e1a" />
      </mesh>
      {/* Cap dome */}
      <mesh position={[0, 2.27, 0]}>
        <cylinderGeometry args={[0.20, 0.22, 0.2, 18]} />
        <meshStandardMaterial color="#2a3450" roughness={0.65} />
      </mesh>
      {/* Cap badge */}
      <mesh position={[0, 2.27, 0.22]}>
        <boxGeometry args={[0.08, 0.06, 0.02]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
      </mesh>
    </group>
  );
}
