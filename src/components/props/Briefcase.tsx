"use client";

interface Props {
  position: [number, number, number];
}

/**
 * The briefcase on its pedestal inside the vault. Brass corners, clasp,
 * leather-wrapped handle. Replaces an earlier 3-box stub and reads as
 * "object you're stealing" rather than "block".
 */
export default function Briefcase({ position }: Props) {
  return (
    <group position={position}>
      {/* Wood pedestal */}
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[0.74, 0.92, 0.6]} />
        <meshStandardMaterial color="#3a2114" roughness={0.5} />
      </mesh>
      {/* Brass cap */}
      <mesh position={[0, 0.94, 0]}>
        <boxGeometry args={[0.78, 0.04, 0.64]} />
        <meshStandardMaterial color="#a87828" metalness={0.9} roughness={0.32} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.62, 0.18, 0.44]} />
        <meshStandardMaterial color="#3a2114" roughness={0.45} />
      </mesh>
      {/* Brass corners — front */}
      {[
        [-0.28, 0.97, -0.19],
        [0.28, 0.97, -0.19],
        [-0.28, 1.13, -0.19],
        [0.28, 1.13, -0.19],
        [-0.28, 0.97, 0.19],
        [0.28, 0.97, 0.19],
        [-0.28, 1.13, 0.19],
        [0.28, 1.13, 0.19],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
          <meshStandardMaterial color="#a87828" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      {/* Clasp */}
      <mesh position={[0, 1.06, 0.225]}>
        <boxGeometry args={[0.18, 0.05, 0.025]} />
        <meshStandardMaterial color="#a87828" metalness={0.9} roughness={0.28} />
      </mesh>
      {/* Handle brackets */}
      <mesh position={[-0.12, 1.18, 0]}>
        <boxGeometry args={[0.04, 0.05, 0.05]} />
        <meshStandardMaterial color="#a87828" metalness={0.9} roughness={0.32} />
      </mesh>
      <mesh position={[0.12, 1.18, 0]}>
        <boxGeometry args={[0.04, 0.05, 0.05]} />
        <meshStandardMaterial color="#a87828" metalness={0.9} roughness={0.32} />
      </mesh>
      {/* Wrapped leather handle */}
      <mesh position={[0, 1.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, 0.27, 18]} />
        <meshStandardMaterial color="#1a1410" roughness={0.7} />
      </mesh>
      {/* Top edge brass trim — adds the brass-piping look */}
      <mesh position={[0, 1.146, 0]}>
        <boxGeometry args={[0.6, 0.012, 0.42]} />
        <meshStandardMaterial color="#a87828" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Warm rim light */}
      <pointLight position={[0, 1.5, 0]} intensity={1.4} color="#ffd9a0" distance={3} />
    </group>
  );
}
