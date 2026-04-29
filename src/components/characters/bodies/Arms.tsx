"use client";

interface Props {
  sleeveColor: string;
  cuffColor?: string;
  skinColor: string;
}

/**
 * Generic two-piece arms (upper + lower + cuff + hand) hung at sides.
 * Used by all four NPC bodies for consistent silhouette presence in FP.
 */
export default function Arms({ sleeveColor, cuffColor, skinColor }: Props) {
  return (
    <group>
      {/* Upper arms */}
      <mesh position={[-0.36, 1.35, 0.02]} rotation={[0, 0, 0.16]} castShadow>
        <cylinderGeometry args={[0.10, 0.09, 0.6, 10]} />
        <meshStandardMaterial color={sleeveColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.36, 1.35, 0.02]} rotation={[0, 0, -0.16]} castShadow>
        <cylinderGeometry args={[0.10, 0.09, 0.6, 10]} />
        <meshStandardMaterial color={sleeveColor} roughness={0.7} />
      </mesh>
      {/* Forearms */}
      <mesh position={[-0.42, 0.95, 0.04]} castShadow>
        <cylinderGeometry args={[0.085, 0.085, 0.45, 10]} />
        <meshStandardMaterial color={sleeveColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.42, 0.95, 0.04]} castShadow>
        <cylinderGeometry args={[0.085, 0.085, 0.45, 10]} />
        <meshStandardMaterial color={sleeveColor} roughness={0.7} />
      </mesh>
      {/* Cuffs (optional accent ring) */}
      {cuffColor && (
        <>
          <mesh position={[-0.42, 0.72, 0.04]} castShadow>
            <cylinderGeometry args={[0.087, 0.087, 0.06, 10]} />
            <meshStandardMaterial color={cuffColor} />
          </mesh>
          <mesh position={[0.42, 0.72, 0.04]} castShadow>
            <cylinderGeometry args={[0.087, 0.087, 0.06, 10]} />
            <meshStandardMaterial color={cuffColor} />
          </mesh>
        </>
      )}
      {/* Hands */}
      <mesh position={[-0.42, 0.62, 0.04]} castShadow>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color={skinColor} roughness={0.85} />
      </mesh>
      <mesh position={[0.42, 0.62, 0.04]} castShadow>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color={skinColor} roughness={0.85} />
      </mesh>
    </group>
  );
}
