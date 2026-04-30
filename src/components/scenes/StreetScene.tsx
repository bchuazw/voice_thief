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
import TargetPing from "@/components/world/TargetPing";
import BankFacade from "@/components/props/BankFacade";
import CafeFacade from "@/components/props/CafeFacade";
import ApartmentBlock from "@/components/props/ApartmentBlock";
import StreetLamp from "@/components/props/StreetLamp";
import Payphone from "@/components/props/Payphone";
import StreetFurniture from "@/components/props/StreetFurniture";
import NeonBankSign from "@/components/props/NeonBankSign";
import TrainStation from "@/components/props/TrainStation";
import type { NpcId } from "@/game/types";

const NPC_LIST: NpcId[] = ["bankManager", "secretary", "bankGuard", "wife"];

export default function StreetScene() {
  const player = useGame((s) => s.player);
  const setPlayerPosition = useGame((s) => s.setPlayerPosition);
  const setPlayerTarget = useGame((s) => s.setPlayerTarget);
  const viewMode = useGame((s) => s.viewMode);
  const briefcaseTaken = useGame((s) => s.briefcaseTaken);
  const lastPos = useRef(player.position);
  const { camera } = useThree();

  useEffect(() => {
    if (viewMode !== "diorama") return;
    camera.position.set(2, 14, 18);
    camera.lookAt(0, 1, -1);
  }, [camera, viewMode]);

  // Diorama mode keeps the click-to-walk system
  useFrame((_, dt) => {
    if (viewMode !== "diorama") return;
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

  function handleGroundClick(e: { point: THREE.Vector3 }) {
    if (viewMode !== "diorama") return;
    const point = e.point;
    setPlayerTarget(clampToWalkable({ x: point.x, y: 0, z: point.z }, "street"));
  }

  return (
    <group>
      {/* Dusk sky / blue moonlight */}
      <ambientLight intensity={0.74} color="#5f749a" />
      <directionalLight
        position={[6, 18, 6]}
        intensity={0.84}
        color="#bcd0ff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight args={["#879bc8", "#202434", 0.66]} />

      {/* Volumetric lamp halos — three on the block */}
      <VolumetricLamp position={[-12, 4, 4]} color="#f5a623" />
      <VolumetricLamp position={[12, 4, 4]} color="#ffe9b0" />
      <VolumetricLamp position={[0, 4, -8]} color="#f5a623" />

      {/* Road plane — wet asphalt shader */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={(e) => handleGroundClick(e)}
      >
        <planeGeometry args={[80, 30]} />
        <WetAsphalt />
      </mesh>

      {/* Sidewalks (slightly elevated, lighter color) */}
      <Sidewalk position={[-10, 0.05, 4]} size={[18, 0.1, 5]} />
      <Sidewalk position={[10, 0.05, 4]} size={[18, 0.1, 5]} />
      <Sidewalk position={[0, 0.05, -4.5]} size={[80, 0.1, 3]} />

      {/* Curbs */}
      <mesh position={[-10, 0.16, 1.5]}>
        <boxGeometry args={[18, 0.16, 0.18]} />
        <meshStandardMaterial color="#20212b" />
      </mesh>
      <mesh position={[10, 0.16, 1.5]}>
        <boxGeometry args={[18, 0.16, 0.18]} />
        <meshStandardMaterial color="#20212b" />
      </mesh>

      {/* Street furniture */}
      <StreetFurniture />

      {/* Three streetlamp posts (geometry; halos already above) */}
      <StreetLamp position={[-12, 0, 4]} />
      <StreetLamp position={[12, 0, 4]} />
      <StreetLamp position={[0, 0, -8]} />

      {/* The buildings */}
      <BankFacade position={[-10, 0, -4]} />
      {/* Overhead neon sign for the bank, mounted above the door */}
      <NeonBankSign position={[-10, 3.7, 0.6]} />
      <CafeFacade position={[10, 0, -4]} />
      <ApartmentBlock position={[18, 0, -2]} />

      {/* Payphone */}
      <Payphone position={[2, 0, 4]} />

      {/* Train station marker / archway at end of block */}
      <TrainStation position={[12, 0, 8]} active={briefcaseTaken} />

      <RainShader />

      {viewMode === "diorama" && <PlayerCharacter />}
      {viewMode === "diorama" && <TargetPing />}

      {NPC_LIST.map((id) => (
        <NpcActor key={id} npcId={id} sceneLocation="street" />
      ))}
    </group>
  );
}

function Sidewalk({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#30323d" roughness={0.85} />
    </mesh>
  );
}
