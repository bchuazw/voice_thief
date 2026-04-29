"use client";

/**
 * Harold Vance — late 50s. Three-piece pinstripe with a bowler hat.
 */
export default function BankManagerBody() {
  return (
    <group>
      {/* Trousers */}
      <mesh position={[-0.12, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.10, 0.12, 0.9, 8]} />
        <meshStandardMaterial color="#1a1a26" roughness={0.7} />
      </mesh>
      <mesh position={[0.12, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.10, 0.12, 0.9, 8]} />
        <meshStandardMaterial color="#1a1a26" roughness={0.7} />
      </mesh>
      {/* Suit jacket */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <capsuleGeometry args={[0.34, 0.8, 6, 12]} />
        <meshStandardMaterial color="#22222e" roughness={0.7} />
      </mesh>
      {/* Waistcoat / shirt accent */}
      <mesh position={[0, 1.3, 0.28]}>
        <boxGeometry args={[0.32, 0.7, 0.06]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.65} />
      </mesh>
      {/* White shirt collar */}
      <mesh position={[0, 1.78, 0.26]}>
        <boxGeometry args={[0.18, 0.12, 0.04]} />
        <meshStandardMaterial color="#f4eccd" />
      </mesh>
      {/* Tie */}
      <mesh position={[0, 1.55, 0.32]}>
        <boxGeometry args={[0.06, 0.4, 0.02]} />
        <meshStandardMaterial color="#7a1818" />
      </mesh>
      {/* Pocket watch chain */}
      <mesh position={[0.15, 1.4, 0.32]}>
        <boxGeometry args={[0.13, 0.02, 0.02]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
      </mesh>
      {/* Hands at sides */}
      <mesh position={[-0.34, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color="#e0b48a" roughness={0.85} />
      </mesh>
      <mesh position={[0.34, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color="#e0b48a" roughness={0.85} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.96, 0]} castShadow>
        <sphereGeometry args={[0.21, 14, 14]} />
        <meshStandardMaterial color="#e0b48a" roughness={0.85} />
      </mesh>
      {/* Mustache */}
      <mesh position={[0, 1.93, 0.2]}>
        <boxGeometry args={[0.14, 0.03, 0.02]} />
        <meshStandardMaterial color="#3a2a1a" roughness={1} />
      </mesh>
      {/* Bowler hat brim */}
      <mesh position={[0, 2.18, 0]}>
        <cylinderGeometry args={[0.30, 0.30, 0.04, 24]} />
        <meshStandardMaterial color="#0e0e14" roughness={0.7} />
      </mesh>
      {/* Bowler hat dome */}
      <mesh position={[0, 2.28, 0]}>
        <sphereGeometry args={[0.21, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0e0e14" roughness={0.65} />
      </mesh>
      <mesh position={[0, 2.20, 0]}>
        <torusGeometry args={[0.21, 0.018, 6, 16]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
    </group>
  );
}
