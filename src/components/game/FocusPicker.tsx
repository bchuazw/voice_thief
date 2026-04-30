"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useGame } from "@/game/store";
import { distance } from "@/game/pathfinding";
import { findActiveMoment } from "@/game/npcSchedules";
import { NPC_PROFILES } from "@/config/voices";
import { useInteraction, type InteractionAction } from "@/game/interactionState";
import type { LocationId, NpcId } from "@/game/types";

interface InteractableTarget {
  pos: THREE.Vector3;
  radius: number;
  build(): InteractionAction | null;
  priority: number;
}

interface Props {
  scene: LocationId;
}

const MAX_REACH = 4.5;

function listTargets(scene: LocationId): InteractableTarget[] {
  const s = useGame.getState();
  const targets: InteractableTarget[] = [];

  // NPCs in the same scene that are speaking + recordable
  for (const id of Object.keys(s.npcs) as NpcId[]) {
    const npc = s.npcs[id];
    if (npc.currentLocation !== scene) continue;
    const moment = findActiveMoment(id, s.inGameTime, npc.branch);
    if (!moment?.recordable) continue;
    if (!npc.isSpeaking) continue;
    targets.push({
      pos: new THREE.Vector3(npc.location.x, 1.2, npc.location.z),
      radius: 0.8,
      priority: 5,
      build: () => ({
        kind: "record",
        npcId: id,
        npcName: NPC_PROFILES[id].displayName,
        momentId: moment.id,
      }),
    });
  }

  // Scene-specific props
  if (scene === "street") {
    // Payphone at (2, *, 4)
    targets.push({
      pos: new THREE.Vector3(2, 1.2, 4),
      radius: 1.0,
      priority: 4,
      build: () => ({ kind: "phone" }),
    });
    // Bank door
    targets.push({
      pos: new THREE.Vector3(-10, 1.4, 0.6),
      radius: 1.2,
      priority: 3,
      build: () => {
        if (s.bankFrontUnlocked)
          return {
            kind: "enterLocation",
            target: "bankLobby",
            label: "Enter the bank",
            entryPosition: { x: 0, y: 0, z: 3.8 },
          };
        return {
          kind: "auth",
          device: "bankFront",
        };
      },
    });
    // Cafe door
    targets.push({
      pos: new THREE.Vector3(10, 1.4, -0.4),
      radius: 1.2,
      priority: 3,
      build: () => ({
        kind: "enterLocation",
        target: "cafe",
        label: "Enter the cafe",
        entryPosition: { x: 0, y: 0, z: 3.8 },
      }),
    });
    // Apartment door
    targets.push({
      pos: new THREE.Vector3(18, 1.4, 1.6),
      radius: 1.2,
      priority: 3,
      build: () => ({
        kind: "enterLocation",
        target: "apartment",
        label: "Enter the apartments",
        entryPosition: { x: 0, y: 0, z: 3.8 },
      }),
    });
    // Train station
    targets.push({
      pos: new THREE.Vector3(12, 1.0, 8),
      radius: 1.5,
      priority: 6,
      build: () => {
        if (s.briefcaseTaken) return { kind: "trainStation" };
        return {
          kind: "inspect",
          label: "Read train board",
          toast: "Last eastbound leaves at 9:00. No conductor waits for sirens.",
        };
      },
    });
  }

  if (scene === "bankLobby") {
    // Back to street
    targets.push({
      pos: new THREE.Vector3(0, 1.2, 5),
      radius: 1.2,
      priority: 3,
      build: () => ({
        kind: "enterLocation",
        target: "street",
        label: "Back to the street",
        entryPosition: { x: -10, y: 0, z: 2.8 },
      }),
    });
    // Hallway gate
    targets.push({
      pos: new THREE.Vector3(0, 1.2, -7.7),
      radius: 1.2,
      priority: 3,
      build: () => {
        if (s.bankHallwayUnlocked)
          return {
            kind: "enterLocation",
            target: "vault",
            label: "Enter the hallway",
            entryPosition: { x: 0, y: 0, z: -12.8 },
          };
        return { kind: "auth", device: "bankHallway" };
      },
    });
    targets.push({
      pos: new THREE.Vector3(-1.38, 1.8, -7.74),
      radius: 0.85,
      priority: 2,
      build: () => ({
        kind: "inspect",
        label: "Inspect records plaque",
        toast: "L. Park, Records. Every inner-door card is stamped with her initials.",
      }),
    });
    targets.push({
      pos: new THREE.Vector3(-9.2, 1.1, -3.15),
      radius: 1.1,
      priority: 4,
      build: () => ({ kind: "patrolLog" }),
    });
    // Back-alley exit (right side of lobby) — only appears if Eddie's beat-call
    // unlocked it. Skips the front door entirely and dumps you near the train.
    if (s.bankBackExitUnlocked) {
      targets.push({
        pos: new THREE.Vector3(10.5, 1.4, -3),
        radius: 1.2,
        priority: 5,
        build: () => ({
          kind: "enterLocation",
          target: "street",
          label: "Back alley exit → station",
          entryPosition: { x: 11, y: 0, z: 7 },
        }),
      });
    }
  }

  if (scene === "vault") {
    if (!s.vaultOpen) {
      targets.push({
        pos: new THREE.Vector3(0, 2, -9.7),
        radius: 1.4,
        priority: 4,
        build: () => ({ kind: "auth", device: "vault" }),
      });
      targets.push({
        pos: new THREE.Vector3(3.15, 1.3, -11.34),
        radius: 0.9,
        priority: 3,
        build: () => ({
          kind: "inspect",
          label: "Inspect audit panel",
          toast: "The audit glass holds on one line: L. Park - closing ledger - clear before vault cycle.",
        }),
      });
      targets.push({
        pos: new THREE.Vector3(-2.65, 1.15, -9.35),
        radius: 1.1,
        priority: 5,
        build: () => ({ kind: "auditLedger" }),
      });
    } else if (!s.briefcaseTaken) {
      targets.push({
        pos: new THREE.Vector3(0, 1.4, -11),
        radius: 1.5,
        priority: 6,
        build: () => ({ kind: "briefcase" }),
      });
    }
    targets.push({
      pos: new THREE.Vector3(0, 1.2, 5),
      radius: 1.2,
      priority: 3,
      build: () => ({
        kind: "enterLocation",
        target: "bankLobby",
        label: "Back to the lobby",
        entryPosition: { x: 0, y: 0, z: -7.2 },
      }),
    });
  }

  if (scene === "cafe" || scene === "apartment") {
    targets.push({
      pos: new THREE.Vector3(0, 1.2, 5),
      radius: 1.2,
      priority: 3,
      build: () => ({
        kind: "enterLocation",
        target: "street",
        label: "Back to the street",
        entryPosition:
          scene === "cafe" ? { x: 10, y: 0, z: 2.8 } : { x: 18, y: 0, z: 3.2 },
      }),
    });
  }

  return targets;
}

export default function FocusPicker({ scene }: Props) {
  const { camera } = useThree();
  const setFocus = useInteraction((s) => s.set);
  const lastSig = useRef<string>("");

  useFrame(() => {
    const viewMode = useGame.getState().viewMode;
    const player = useGame.getState().player;
    const playerPos = new THREE.Vector3(player.position.x, 1.6, player.position.z);

    const targets = listTargets(scene);
    let best: { dist: number; t: InteractableTarget } | null = null;

    if (viewMode === "fp") {
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      for (const t of targets) {
        const toTarget = new THREE.Vector3().subVectors(t.pos, playerPos);
        const dist = toTarget.length();
        if (dist > MAX_REACH + t.radius) continue;
        const dirToTarget = toTarget.clone().normalize();
        const dot = camDir.dot(dirToTarget);
        if (dot < 0.5) continue;
        const score = dist - t.priority * 0.1;
        if (!best || score < best.dist) best = { dist: score, t };
      }
    } else {
      // Diorama: proximity only
      const flat = { x: player.position.x, y: 0, z: player.position.z };
      for (const t of targets) {
        const d = distance(flat, { x: t.pos.x, y: 0, z: t.pos.z });
        if (d > MAX_REACH + t.radius) continue;
        const score = d - t.priority * 0.1;
        if (!best || score < best.dist) best = { dist: score, t };
      }
    }

    const action = best ? best.t.build() : null;
    const sig = action ? JSON.stringify(action) : "";
    if (sig !== lastSig.current) {
      lastSig.current = sig;
      setFocus(action);
    }
  });

  return null;
}
