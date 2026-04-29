"use client";

interface Props {
  position: [number, number, number];
}

/**
 * First City Bank — late-deco facade. 8 wide × 6.5 tall × 7 deep.
 * Stone base, four flat columns, recessed door with brass fittings,
 * coin-detailed cornice, barred windows on either side.
 */
export default function BankFacade({ position }: Props) {
  return (
    <group position={position}>
      {/* Main mass behind the facade — front face at local z=0 */}
      <mesh position={[0, 3, -3]} castShadow receiveShadow>
        <boxGeometry args={[8.2, 6.6, 6]} />
        <meshStandardMaterial color="#262534" roughness={0.85} />
      </mesh>

      {/* Stone base plinth — slightly proud of the facade */}
      <mesh position={[0, 0.5, 0.1]} receiveShadow>
        <boxGeometry args={[8.4, 1.0, 0.6]} />
        <meshStandardMaterial color="#3a3848" roughness={0.95} />
      </mesh>

      {/* Step up to door */}
      <mesh position={[0, 0.18, 0.6]} receiveShadow>
        <boxGeometry args={[3.6, 0.34, 0.5]} />
        <meshStandardMaterial color="#2a2832" roughness={0.95} />
      </mesh>

      {/* Four flat columns */}
      {[-3.0, -1.0, 1.0, 3.0].map((x, i) => (
        <mesh key={i} position={[x, 3.4, 0.2]} castShadow>
          <boxGeometry args={[0.6, 5.0, 0.34]} />
          <meshStandardMaterial color="#403e4e" roughness={0.7} />
        </mesh>
      ))}

      {/* Cornice — top horizontal slab with a thin amber edge */}
      <mesh position={[0, 6.2, 0.18]} castShadow>
        <boxGeometry args={[8.4, 0.5, 0.5]} />
        <meshStandardMaterial color="#2a2832" roughness={0.7} />
      </mesh>
      <mesh position={[0, 6.45, 0.43]}>
        <boxGeometry args={[8.4, 0.06, 0.04]} />
        <meshStandardMaterial color="#0a0a10" emissive="#f5a623" emissiveIntensity={0.8} />
      </mesh>

      {/* Recessed entrance — dark inset, brass-trimmed double doors */}
      <mesh position={[0, 1.6, 0.05]}>
        <boxGeometry args={[2.4, 2.6, 0.05]} />
        <meshStandardMaterial color="#0a080c" emissive="#3a2818" emissiveIntensity={1.2} />
      </mesh>
      {/* Two sconce lights flanking the entrance */}
      <mesh position={[-1.4, 2.6, 0.18]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#fff5d8" emissive="#f5a623" emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[1.4, 2.6, 0.18]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#fff5d8" emissive="#f5a623" emissiveIntensity={2.5} />
      </mesh>
      <pointLight position={[-1.4, 2.6, 0.4]} intensity={0.55} color="#ffb060" distance={3} />
      <pointLight position={[1.4, 2.6, 0.4]} intensity={0.55} color="#ffb060" distance={3} />
      {/* Door panels */}
      <mesh position={[-0.5, 1.6, 0.08]}>
        <boxGeometry args={[1.0, 2.4, 0.04]} />
        <meshStandardMaterial color="#3a2418" roughness={0.5} />
      </mesh>
      <mesh position={[0.5, 1.6, 0.08]}>
        <boxGeometry args={[1.0, 2.4, 0.04]} />
        <meshStandardMaterial color="#3a2418" roughness={0.5} />
      </mesh>
      {/* Brass door handles */}
      <mesh position={[-0.15, 1.6, 0.12]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[0.15, 1.6, 0.12]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.3} />
      </mesh>
      {/* Transom window above door — warm light */}
      <mesh position={[0, 3.1, 0.08]}>
        <boxGeometry args={[2.4, 0.5, 0.04]} />
        <meshStandardMaterial color="#0a0a10" emissive="#f5a623" emissiveIntensity={0.85} />
      </mesh>

      {/* Two barred windows on either side of the columns */}
      {[-2.4, 2.4].map((x, i) => (
        <group key={i} position={[x, 2.8, 0.1]}>
          <mesh>
            <boxGeometry args={[1.4, 1.8, 0.04]} />
            <meshStandardMaterial color="#0a0a10" emissive="#f5a623" emissiveIntensity={1.1} />
          </mesh>
          {/* Brass mullions */}
          {[-0.45, 0, 0.45].map((mx, j) => (
            <mesh key={`v${j}`} position={[mx, 0, 0.04]}>
              <boxGeometry args={[0.05, 1.8, 0.05]} />
              <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[1.4, 0.05, 0.05]} />
            <meshStandardMaterial color="#a07020" metalness={1} roughness={0.4} />
          </mesh>
          {/* Bars */}
          {[-0.5, -0.16, 0.16, 0.5].map((bx, j) => (
            <mesh key={`b${j}`} position={[bx, 0, 0.08]}>
              <cylinderGeometry args={[0.02, 0.02, 1.7, 6]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Address numbers on plinth */}
      <mesh position={[3.4, 0.7, 0.42]}>
        <boxGeometry args={[0.7, 0.3, 0.02]} />
        <meshStandardMaterial color="#0a0a10" emissive="#f5a623" emissiveIntensity={0.7} />
      </mesh>

      {/* Stone steps */}
      <mesh position={[0, 0.06, 0.85]} receiveShadow>
        <boxGeometry args={[3.0, 0.12, 0.4]} />
        <meshStandardMaterial color="#3a3848" roughness={0.95} />
      </mesh>
    </group>
  );
}
