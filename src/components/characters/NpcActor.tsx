"use client";

import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useGame } from "@/game/store";
import { distance } from "@/game/pathfinding";
import { findActiveMoment } from "@/game/npcSchedules";
import { NPC_PROFILES } from "@/config/voices";
import { startNpcAudio, stopNpcAudio } from "@/audio/npcSpeech";
import BankManagerBody from "./bodies/BankManagerBody";
import SecretaryBody from "./bodies/SecretaryBody";
import BankGuardBody from "./bodies/BankGuardBody";
import WifeBody from "./bodies/WifeBody";
import type { LocationId, NpcId } from "@/game/types";

interface Props {
  npcId: NpcId;
  sceneLocation: LocationId;
}

export default function NpcActor({ npcId, sceneLocation }: Props) {
  const npc = useGame((s) => s.npcs[npcId]);
  const playerPos = useGame((s) => s.player.position);
  const inGameTime = useGame((s) => s.inGameTime);
  const isRecording = useGame((s) => s.player.isRecording);
  const recordingTarget = useGame((s) => s.player.recordingTargetNpc);

  const ref = useRef<THREE.Group>(null);
  const bobT = useRef(0);
  const lastSpeakingMoment = useRef<string | null>(null);

  const isInScene = npc.currentLocation === sceneLocation;
  const isSpeaking = npc.isSpeaking && isInScene;
  const closeEnough = distance(npc.location, playerPos) < 4.5;

  useFrame((_, dt) => {
    bobT.current += dt;
    if (!ref.current) return;
    const yBob = isSpeaking ? Math.sin(bobT.current * 8) * 0.04 : Math.sin(bobT.current * 2) * 0.015;
    ref.current.position.set(npc.location.x, yBob, npc.location.z);
  });

  useEffect(() => {
    if (!isInScene) {
      stopNpcAudio(npcId);
      return;
    }
    if (npc.currentMomentId && npc.currentMomentId !== lastSpeakingMoment.current) {
      lastSpeakingMoment.current = npc.currentMomentId;
      startNpcAudio(npcId, npc.currentMomentId);
    } else if (!npc.currentMomentId) {
      lastSpeakingMoment.current = null;
      stopNpcAudio(npcId);
    }
  }, [npcId, npc.currentMomentId, isInScene]);

  if (!isInScene) return null;

  const profile = NPC_PROFILES[npcId];
  const moment = findActiveMoment(npcId, inGameTime, npc.branch);
  const recordable = !!moment?.recordable;
  const showRecordHint = closeEnough && isSpeaking && recordable;
  const recordingMe = isRecording && recordingTarget === npcId;

  return (
    <group ref={ref}>
      {npcId === "bankManager" && <BankManagerBody />}
      {npcId === "secretary" && <SecretaryBody />}
      {npcId === "bankGuard" && <BankGuardBody />}
      {npcId === "wife" && <WifeBody />}

      {isSpeaking && (
        <mesh position={[0, 3.0, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#ff3c3c" emissive="#ff3c3c" emissiveIntensity={2} />
        </mesh>
      )}

      <Html center distanceFactor={8} position={[0, 3.2, 0]} occlude zIndexRange={[12, 0]}>
        <div className="pointer-events-none flex flex-col items-center gap-1 text-center text-[10px] uppercase tracking-[0.25em] text-noir-paper">
          <span>{profile.displayName}</span>
          {showRecordHint && (
            <span className={recordingMe ? "text-noir-neon animate-pulse" : "text-noir-amber"}>
              {recordingMe ? "● REC" : "[E] Record"}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}
