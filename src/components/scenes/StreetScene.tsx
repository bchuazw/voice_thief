"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useGame } from "@/game/store";
import { clampToWalkable, moveToward } from "@/game/pathfinding";
import PlayerCharacter from "@/components/characters/PlayerCharacter";
import NpcActor from "@/components/characters/NpcActor";
import RainShader from "@/components/shaders/RainShader";
import VolumetricLamp from "@/components/shaders/VolumetricLamp";
import WetAsphalt from "@/components/shaders/WetAsphalt";
import InteractiveProp from "@/components/world/InteractiveProp";
import LocationGate from "@/components/world/LocationGate";
import TargetPing from "@/components/world/TargetPing";
import type { NpcId } from "@/game/types";

const NPC_LIST: NpcId[] = ["bankManager", "secretary", "bankGuard", "wife"];

export default function StreetScene() {
  const player = useGame((s) => s.player);
  const setPlayerPosition = useGame((s) => s.setPlayerPosition);
  const setPlayerTarget = useGame((s) => s.setPlayerTarget);
  const setPlayerLocation = useGame((s) => s.setPlayerLocation);
  const setActiveAuth = useGame((s) => s.setActiveAuth);
  const togglePhone = useGame((s) => s.togglePhone);
  const bankFrontUnlocked = useGame((s) => s.bankFrontUnlocked);
  const briefcaseTaken = useGame((s) => s.briefcaseTaken);

  const lastPos = useRef(player.position);
  const groundRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(2, 14, 18);
    camera.lookAt(0, 1, -1);
  }, [camera]);

  useFrame((_, dt) => {
    const target = useGame.getState().player.target;
    if (!target) return;
    const next = moveToward(lastPos.current, target, dt * 4);
    const safe = clampToWalkable(next, "street");
    lastPos.current = safe;
    setPlayerPosition(safe);
    if (Math.hypot(safe.x - target.x, safe.z - target.z) < 0.05) {
      setPlayerTarget(null);
    }
  });

  function handleGroundClick(e: React.MouseEvent | { point: THREE.Vector3 }) {
    const point = "point" in e ? e.point : (e as unknown as { point: THREE.Vector3 }).point;
    setPlayerTarget(clampToWalkable({ x: point.x, y: 0, z: point.z }, "street"));
  }

  return (
    <group>
      <ambientLight intensity={0.32} color="#1a2030" />
      <directionalLight
        position={[6, 14, 6]}
        intensity={0.35}
        color="#aac6ff"
        castShadow
      />
      <hemisphereLight args={["#3a4a6a", "#0a0a14", 0.25]} />

      <VolumetricLamp position={[-12, 4, 4]} color="#f5a623" />
      <VolumetricLamp position={[12, 4, 4]} color="#ffe9b0" />
      <VolumetricLamp position={[0, 4, -8]} color="#ff8a42" />

      <mesh
        ref={groundRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={(e) => handleGroundClick(e)}
      >
        <planeGeometry args={[60, 40]} />
        <WetAsphalt />
      </mesh>

      <mesh position={[-10, 3, -4]} castShadow>
        <boxGeometry args={[8, 6, 8]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.85} />
      </mesh>
      <mesh position={[-10, 1.4, 0.05]}>
        <boxGeometry args={[2.2, 2.8, 0.1]} />
        <meshStandardMaterial color="#3a2a18" emissive="#22150a" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[-10, 6.2, -4]}>
        <boxGeometry args={[5, 0.6, 0.1]} />
        <meshStandardMaterial color="#0a0a10" emissive="#ff3c3c" emissiveIntensity={1.2} />
      </mesh>

      <mesh position={[10, 2.5, -4]} castShadow>
        <boxGeometry args={[6, 5, 6]} />
        <meshStandardMaterial color="#22191a" roughness={0.9} />
      </mesh>
      <mesh position={[10, 1.5, -1.05]}>
        <boxGeometry args={[3, 2.2, 0.1]} />
        <meshStandardMaterial color="#2a1a10" emissive="#f5a623" emissiveIntensity={0.65} />
      </mesh>

      <mesh position={[18, 2.5, -2]} castShadow>
        <boxGeometry args={[6, 5, 6]} />
        <meshStandardMaterial color="#161620" roughness={0.85} />
      </mesh>
      <mesh position={[18, 1.4, 1.05]}>
        <boxGeometry args={[1.8, 2, 0.1]} />
        <meshStandardMaterial color="#0a0a10" emissive="#aac6ff" emissiveIntensity={0.3} />
      </mesh>

      <RainShader />

      <PlayerCharacter />
      <TargetPing />

      {NPC_LIST.map((id) => (
        <NpcActor key={id} npcId={id} sceneLocation="street" />
      ))}

      <InteractiveProp
        position={[2, 1.2, 4]}
        label="Payphone"
        color="#ff3c3c"
        onClick={() => togglePhone(true)}
      />

      <LocationGate
        position={[-10, 1.4, 0.6]}
        label={bankFrontUnlocked ? "Bank — enter" : "Bank — locked"}
        color={bankFrontUnlocked ? "#f5a623" : "#444"}
        onClick={() => {
          if (bankFrontUnlocked) setPlayerLocation("bankLobby");
          else setActiveAuth({ device: "bankFront", voiceCardId: "", result: "pending" });
        }}
      />

      <LocationGate
        position={[10, 1.4, -0.4]}
        label="Cafe"
        color="#f5d6a0"
        onClick={() => setPlayerLocation("cafe")}
      />

      <LocationGate
        position={[18, 1.4, 1.6]}
        label="Apartments"
        color="#aac6ff"
        onClick={() => setPlayerLocation("apartment")}
      />

      <LocationGate
        position={[12, 1.4, 8]}
        label={briefcaseTaken ? "Train station — ESCAPE" : "Train station"}
        color={briefcaseTaken ? "#3affa6" : "#666"}
        onClick={() => {
          if (briefcaseTaken) {
            setPlayerPosition({ x: 12, y: 0, z: 8 });
            setPlayerTarget(null);
          } else {
            useGame
              .getState()
              .pushToast("Nothing to flee with yet. Get the briefcase first.");
          }
        }}
      />
    </group>
  );
}
