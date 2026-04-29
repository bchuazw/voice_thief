"use client";

interface Props {
  position: [number, number, number];
  active: boolean;
}

/**
 * Subway / train station entrance arch at end of block — visible target
 * for the win condition. Glows green when the briefcase is taken.
 */
export default function TrainStation({ position, active }: Props) {
  const glow = active ? "#3affa6" : "#5a5a72";
  const intensity = active ? 1.6 : 0.5;
  return (
    <group position={position}>
      {/* Arched entrance frame */}
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[2.4, 0.2, 0.4]} />
        <meshStandardMaterial color="#1a1a26" />
      </mesh>
      <mesh position={[-1.1, 0.7, 0]}>
        <boxGeometry args={[0.2, 1.4, 0.4]} />
        <meshStandardMaterial color="#1a1a26" />
      </mesh>
      <mesh position={[1.1, 0.7, 0]}>
        <boxGeometry args={[0.2, 1.4, 0.4]} />
        <meshStandardMaterial color="#1a1a26" />
      </mesh>
      {/* Steps going down (subway) */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, -0.1 - i * 0.15, 0.4 + i * 0.18]} receiveShadow>
          <boxGeometry args={[1.8, 0.16, 0.18]} />
          <meshStandardMaterial color="#1a1a22" />
        </mesh>
      ))}
      {/* SUBWAY sign */}
      <mesh position={[0, 1.85, 0.05]}>
        <boxGeometry args={[1.6, 0.4, 0.04]} />
        <meshStandardMaterial color="#0a0a10" emissive={glow} emissiveIntensity={intensity} />
      </mesh>
      {/* Globe finials on either side */}
      <mesh position={[-1.4, 1.6, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#fff5d8" emissive="#f5a623" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[1.4, 1.6, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#fff5d8" emissive="#f5a623" emissiveIntensity={1.4} />
      </mesh>
      <pointLight position={[0, 1.6, 0.5]} intensity={0.6} color={glow} distance={4} />
    </group>
  );
}
