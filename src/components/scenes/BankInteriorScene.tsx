"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useGame } from "@/game/store";
import { moveToward } from "@/game/pathfinding";
import PlayerCharacter from "@/components/characters/PlayerCharacter";
import NpcActor from "@/components/characters/NpcActor";
import VolumetricLamp from "@/components/shaders/VolumetricLamp";
import VaultDoor from "@/components/shaders/VaultDoor";
import LocationGate from "@/components/world/LocationGate";
import InteractiveProp from "@/components/world/InteractiveProp";
import type { NpcId } from "@/game/types";

const NPC_LIST: NpcId[] = ["bankManager", "secretary", "bankGuard"];

export default function BankInteriorScene() {
  const player = useGame((s) => s.player);
  const setPlayerPosition = useGame((s) => s.setPlayerPosition);
  const setPlayerTarget = useGame((s) => s.setPlayerTarget);
  const setPlayerLocation = useGame((s) => s.setPlayerLocation);
  const setActiveAuth = useGame((s) => s.setActiveAuth);
  const hallwayUnlocked = useGame((s) => s.bankHallwayUnlocked);
  const vaultOpen = useGame((s) => s.vaultOpen);
  const briefcaseTaken = useGame((s) => s.briefcaseTaken);
  const takeBriefcase = useGame((s) => s.takeBriefcase);

  const lastPos = useRef(player.position);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 11, 12);
    camera.lookAt(0, 1, -3);
  }, [camera]);

  useFrame((_, dt) => {
    const t = useGame.getState().player.target;
    if (!t) return;
    const next = moveToward(lastPos.current, t, dt * 4);
    lastPos.current = next;
    setPlayerPosition(next);
    if (Math.hypot(next.x - t.x, next.z - t.z) < 0.05) setPlayerTarget(null);
  });

  return (
    <group>
      <ambientLight intensity={0.4} color="#f8e8c8" />
      <pointLight position={[0, 5, 2]} intensity={1.2} color="#ffd9a0" />
      <VolumetricLamp position={[-6, 5, -6]} color="#f0c878" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow
        onClick={(e) => setPlayerTarget({ x: e.point.x, y: 0, z: e.point.z })}>
        <planeGeometry args={[24, 18]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.4} metalness={0.2} />
      </mesh>

      <mesh position={[0, 1.2, -8]} castShadow>
        <boxGeometry args={[18, 2.4, 0.4]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.55} />
      </mesh>

      <mesh position={[-9, 2.5, -4]} castShadow>
        <boxGeometry args={[0.4, 5, 8]} />
        <meshStandardMaterial color="#1a1a22" />
      </mesh>
      <mesh position={[9, 2.5, -4]} castShadow>
        <boxGeometry args={[0.4, 5, 8]} />
        <meshStandardMaterial color="#1a1a22" />
      </mesh>

      <PlayerCharacter />
      {NPC_LIST.map((id) => (
        <NpcActor key={id} npcId={id} sceneLocation="bankLobby" />
      ))}

      <LocationGate
        position={[0, 1.2, 5]}
        label="← Street"
        color="#aac6ff"
        onClick={() => setPlayerLocation("street")}
      />

      <LocationGate
        position={[0, 1.2, -7.7]}
        label={hallwayUnlocked ? "Hallway →" : "Hallway — locked"}
        color={hallwayUnlocked ? "#f5a623" : "#444"}
        onClick={() => {
          if (hallwayUnlocked) setPlayerLocation("vault");
          else setActiveAuth({ device: "bankHallway", voiceCardId: "", result: "pending" });
        }}
      />

      <VaultDoor open={vaultOpen} position={[0, 2, -10]} />

      {!vaultOpen && (
        <InteractiveProp
          position={[0, 2, -9.7]}
          label="Vault intercom"
          color="#ff3c3c"
          onClick={() => setActiveAuth({ device: "vault", voiceCardId: "", result: "pending" })}
        />
      )}

      {vaultOpen && !briefcaseTaken && (
        <InteractiveProp
          position={[0, 1.4, -11]}
          label="Briefcase"
          color="#f5d6a0"
          onClick={() => {
            takeBriefcase();
            useGame.getState().pushToast("Briefcase secured. Get to the train station.");
          }}
        />
      )}
    </group>
  );
}
