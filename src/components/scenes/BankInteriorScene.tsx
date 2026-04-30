"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useGame } from "@/game/store";
import { moveToward } from "@/game/pathfinding";
import PlayerCharacter from "@/components/characters/PlayerCharacter";
import NpcActor from "@/components/characters/NpcActor";
import VolumetricLamp from "@/components/shaders/VolumetricLamp";
import VaultDoor from "@/components/shaders/VaultDoor";
import TargetPing from "@/components/world/TargetPing";
import MarbleFloor from "@/components/props/MarbleFloor";
import TellerCounter from "@/components/props/TellerCounter";
import Chandelier from "@/components/props/Chandelier";
import Briefcase from "@/components/props/Briefcase";
import NoirAsset from "@/components/assets/NoirAsset";
import type { NpcId } from "@/game/types";

const NPC_LIST: NpcId[] = ["bankManager", "secretary", "bankGuard"];

export default function BankInteriorScene() {
  const player = useGame((s) => s.player);
  const setPlayerPosition = useGame((s) => s.setPlayerPosition);
  const setPlayerTarget = useGame((s) => s.setPlayerTarget);
  const viewMode = useGame((s) => s.viewMode);
  const vaultOpen = useGame((s) => s.vaultOpen);
  const bankBackExitUnlocked = useGame((s) => s.bankBackExitUnlocked);
  const lastPos = useRef(player.position);
  const { camera } = useThree();

  useEffect(() => {
    if (viewMode !== "diorama") return;
    camera.position.set(0, 11, 12);
    camera.lookAt(0, 1, -3);
  }, [camera, viewMode]);

  useFrame((_, dt) => {
    if (viewMode !== "diorama") return;
    const t = useGame.getState().player.target;
    if (!t) return;
    const next = moveToward(lastPos.current, t, dt * 4);
    lastPos.current = next;
    setPlayerPosition(next);
    if (Math.hypot(next.x - t.x, next.z - t.z) < 0.05) setPlayerTarget(null);
  });

  return (
    <group>
      {/* Warm interior lighting + cool counter-bounce */}
      <ambientLight intensity={0.8} color="#f5e0bc" />
      <hemisphereLight args={["#7083aa", "#2a211c", 0.68]} />
      <pointLight position={[-3, 4, 2]} intensity={1.85} color="#ffd9a0" distance={11} />
      <pointLight position={[3, 4, 2]} intensity={1.85} color="#ffd9a0" distance={11} />
      <pointLight position={[0, 3.5, -8]} intensity={1.55} color="#ffb060" distance={7} />
      <pointLight position={[2.7, 2.0, -10.4]} intensity={0.85} color="#ffd9a0" distance={4.5} />
      {/* Cool teal bounce from the marble floor — counter-tone for the warm chandeliers */}
      <pointLight position={[0, 0.9, 2]} intensity={0.76} color="#7aa6cc" distance={10} />
      <VolumetricLamp position={[-6, 4, -6]} color="#f0c878" />

      {/* Marble floor with checker pattern */}
      <MarbleFloor
        position={[0, 0, 0]}
        size={[24, 18]}
        onClick={(e) => {
          if (viewMode !== "diorama") return;
          setPlayerTarget({ x: e.point.x, y: 0, z: e.point.z });
        }}
      />

      {/* Wood-paneled side walls */}
      <mesh position={[-12, 2.5, -2]} receiveShadow>
        <boxGeometry args={[0.4, 5, 16]} />
        <meshStandardMaterial color="#4a2e1a" roughness={0.55} />
      </mesh>
      <mesh position={[12, 2.5, -2]} receiveShadow>
        <boxGeometry args={[0.4, 5, 16]} />
        <meshStandardMaterial color="#4a2e1a" roughness={0.55} />
      </mesh>
      {/* Wainscoting */}
      <mesh position={[-11.78, 1, -2]} receiveShadow>
        <boxGeometry args={[0.05, 2, 16]} />
        <meshStandardMaterial color="#2a1810" />
      </mesh>
      <mesh position={[11.78, 1, -2]} receiveShadow>
        <boxGeometry args={[0.05, 2, 16]} />
        <meshStandardMaterial color="#2a1810" />
      </mesh>

      {/* Back-alley exit door (right side wall) */}
      <mesh position={[11.78, 1.4, -3]}>
        <boxGeometry args={[0.05, 2.4, 1.2]} />
        <meshStandardMaterial color="#28181c" />
      </mesh>
      {/* EXIT sign — green when unlocked, dim when not */}
      <mesh position={[11.74, 2.85, -3]}>
        <boxGeometry args={[0.04, 0.22, 0.5]} />
        <meshStandardMaterial
          color="#0a0a10"
          emissive={bankBackExitUnlocked ? "#3affa6" : "#222018"}
          emissiveIntensity={bankBackExitUnlocked ? 1.6 : 0.18}
        />
      </mesh>
      {bankBackExitUnlocked && (
        <pointLight position={[11.4, 2.6, -3]} intensity={0.45} color="#3affa6" distance={3} />
      )}

      {/* Front wall + entrance back to street */}
      <mesh position={[0, 2.5, 6]} receiveShadow>
        <boxGeometry args={[24, 5, 0.4]} />
        <meshStandardMaterial color="#3a2418" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.4, 5.85]}>
        <boxGeometry args={[2.0, 2.4, 0.04]} />
        <meshStandardMaterial color="#28181c" />
      </mesh>
      {/* Top lit transom */}
      <mesh position={[0, 3.3, 5.85]}>
        <boxGeometry args={[2.4, 0.4, 0.04]} />
        <meshStandardMaterial color="#0a0a10" emissive="#f5a623" emissiveIntensity={0.6} />
      </mesh>
      {/* Coffered ceiling — light wood with thin grid */}
      <mesh position={[0, 5, -2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 18]} />
        <meshStandardMaterial color="#3a2418" roughness={0.85} />
      </mesh>

      {/* Teller counter with brass detailing */}
      <TellerCounter position={[0, 0, -5]} />

      {/* Hallway opening at back wall */}
      <mesh position={[-4.5, 2.5, -8]}>
        <boxGeometry args={[7, 5, 0.4]} />
        <meshStandardMaterial color="#3a2418" roughness={0.6} />
      </mesh>
      <mesh position={[4.5, 2.5, -8]}>
        <boxGeometry args={[7, 5, 0.4]} />
        <meshStandardMaterial color="#3a2418" roughness={0.6} />
      </mesh>
      <mesh position={[0, 4.4, -8]}>
        <boxGeometry args={[2, 1.2, 0.4]} />
        <meshStandardMaterial color="#3a2418" roughness={0.6} />
      </mesh>
      <NoirAsset name="recordsPlaque" position={[-1.38, 2.05, -7.74]} />

      {/* Chandelier */}
      <Chandelier position={[0, 4.6, -2]} />

      {/* Vault chamber further back — concrete walls */}
      <mesh position={[0, 2.5, -16]}>
        <boxGeometry args={[8, 5, 0.4]} />
        <meshStandardMaterial color="#34323a" roughness={0.85} />
      </mesh>
      {/* Vault side walls */}
      <mesh position={[-4, 2.5, -14]}>
        <boxGeometry args={[0.4, 5, 4]} />
        <meshStandardMaterial color="#34323a" roughness={0.85} />
      </mesh>
      <mesh position={[4, 2.5, -14]}>
        <boxGeometry args={[0.4, 5, 4]} />
        <meshStandardMaterial color="#34323a" roughness={0.85} />
      </mesh>
      {/* Vault ceiling */}
      <mesh position={[0, 5, -14]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#1a1a20" roughness={0.95} />
      </mesh>
      {/* Vault floor — same marble pattern */}
      <mesh position={[0, 0.01, -14]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#3a2818" roughness={0.45} metalness={0.2} />
      </mesh>
      {/* Deposit boxes on the back wall — 4×3 brass-faced grid */}
      {Array.from({ length: 4 }).map((_, ix) =>
        Array.from({ length: 3 }).map((_, iy) => {
          const x = -2.4 + ix * 1.6;
          const y = 1.2 + iy * 1.0;
          return (
            <group key={`db-${ix}-${iy}`} position={[x, y, -15.78]}>
              <mesh>
                <boxGeometry args={[1.4, 0.85, 0.06]} />
                <meshStandardMaterial color="#a07020" metalness={1} roughness={0.45} />
              </mesh>
              <mesh position={[0, 0, 0.04]}>
                <boxGeometry args={[1.3, 0.75, 0.02]} />
                <meshStandardMaterial color="#7a5028" metalness={0.65} roughness={0.55} />
              </mesh>
              {/* Keyhole */}
              <mesh position={[0, 0, 0.06]}>
                <cylinderGeometry args={[0.04, 0.04, 0.02, 12]} />
                <meshStandardMaterial color="#1a1a1a" />
              </mesh>
              {/* Number plate */}
              <mesh position={[0.45, 0.2, 0.06]}>
                <boxGeometry args={[0.16, 0.1, 0.02]} />
                <meshStandardMaterial color="#0a0a10" emissive="#f5a623" emissiveIntensity={0.5} />
              </mesh>
            </group>
          );
        }),
      )}
      {/* Vault door at the entrance to the chamber */}
      <VaultDoor open={vaultOpen} position={[0, 2, -11.6]} />
      <NoirAsset name="vaultAuditPanel" position={[3.15, 1.28, -11.34]} scale={0.86} />
      {/* Vault door frame ring */}
      <mesh position={[0, 2, -11.4]}>
        <torusGeometry args={[2.6, 0.15, 16, 32]} />
        <meshStandardMaterial color="#3a2418" metalness={0.7} roughness={0.45} />
      </mesh>
      {/* Wheel handle */}
      {vaultOpen ? null : (
        <group position={[0, 2, -11.3]}>
          <mesh>
            <torusGeometry args={[0.5, 0.05, 8, 24]} />
            <meshStandardMaterial color="#a07020" metalness={1} roughness={0.35} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              rotation={[0, 0, (i / 4) * Math.PI * 2]}
            >
              <boxGeometry args={[0.04, 1.1, 0.04]} />
              <meshStandardMaterial color="#a07020" metalness={1} roughness={0.35} />
            </mesh>
          ))}
        </group>
      )}
      {/* Caged sconce inside the chamber */}
      <mesh position={[0, 4.3, -13]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#fff5d8" emissive="#f5a623" emissiveIntensity={2.4} />
      </mesh>
      <pointLight position={[0, 4.0, -13]} intensity={2.0} color="#ffd9a0" distance={8} />
      <pointLight position={[0, 2.4, -15.5]} intensity={1.4} color="#ffb060" distance={5} />
      {/* Cage bars over the sconce for noir flavor */}
      {[-Math.PI / 4, 0, Math.PI / 4].map((a, i) => (
        <mesh
          key={i}
          position={[Math.sin(a) * 0.22, 4.1, -13 + Math.cos(a) * 0.22]}
        >
          <cylinderGeometry args={[0.012, 0.012, 0.45, 6]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
      ))}

      {/* Briefcase pedestal inside vault, visible after open */}
      {vaultOpen && <Briefcase position={[0, 0, -13]} />}

      {viewMode === "diorama" && <PlayerCharacter />}
      {viewMode === "diorama" && <TargetPing />}
      {NPC_LIST.map((id) => (
        <NpcActor key={id} npcId={id} sceneLocation="bankLobby" />
      ))}
    </group>
  );
}
