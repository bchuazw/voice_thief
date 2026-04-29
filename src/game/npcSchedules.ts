"use client";

import { useGame } from "./store";
import { inGameTimeFromClock } from "./timeFormat";
import type { Emotion, LocationId, NpcId, ScheduleBranch, Vec3 } from "./types";

export interface ScheduleMoment {
  id: string;
  startSeconds: number;
  endSeconds: number;
  branch: ScheduleBranch;
  location: LocationId;
  position: Vec3;
  emotion: Emotion;
  scriptId: string;
  vaultClueLeak?: boolean;
  recordable: boolean;
}

const T = inGameTimeFromClock;

export const NPC_SCHEDULES: Record<NpcId, ScheduleMoment[]> = {
  bankManager: [
    {
      id: "manager-cigarette-6_15",
      startSeconds: T(18, 15),
      endSeconds: T(18, 25),
      branch: "default",
      location: "street",
      position: { x: -10, y: 0, z: 6 },
      emotion: "calm",
      scriptId: "manager-cigarette-6_15",
      vaultClueLeak: true,
      recordable: true,
    },
    {
      id: "manager-office-6_30",
      startSeconds: T(18, 30),
      endSeconds: T(18, 44),
      branch: "default",
      location: "bankLobby",
      position: { x: -6, y: 0, z: -2 },
      emotion: "calm",
      scriptId: "manager-office-mutter",
      recordable: false,
    },
    {
      id: "manager-phone-fight-6_45",
      startSeconds: T(18, 45),
      endSeconds: T(18, 59),
      branch: "default",
      location: "bankLobby",
      position: { x: -6, y: 0, z: -2 },
      emotion: "stressed",
      scriptId: "manager-phone-fight-6_45",
      recordable: true,
    },
    {
      id: "manager-late-7_00",
      startSeconds: T(19, 0),
      endSeconds: T(20, 59),
      branch: "default",
      location: "bankLobby",
      position: { x: -6, y: 0, z: -2 },
      emotion: "calm",
      scriptId: "manager-office-late",
      recordable: false,
    },
    {
      id: "manager-rushing-home",
      startSeconds: T(18, 36),
      endSeconds: T(18, 50),
      branch: "rushedHome",
      location: "street",
      position: { x: 4, y: 0, z: 6 },
      emotion: "panicked",
      scriptId: "manager-rushing-home",
      recordable: true,
    },
    {
      id: "manager-at-cafe",
      startSeconds: T(18, 30),
      endSeconds: T(18, 50),
      branch: "atCafe",
      location: "cafe",
      position: { x: 8, y: 0, z: 4 },
      emotion: "calm",
      scriptId: "manager-at-cafe",
      recordable: true,
    },
  ],

  secretary: [
    {
      id: "secretary-cafe-6_00",
      startSeconds: T(18, 0),
      endSeconds: T(18, 18),
      branch: "default",
      location: "cafe",
      position: { x: 8, y: 0, z: 4 },
      emotion: "calm",
      scriptId: "secretary-cafe-6_00",
      recordable: true,
    },
    {
      id: "secretary-bank-6_15",
      startSeconds: T(18, 15),
      endSeconds: T(19, 29),
      branch: "default",
      location: "bankLobby",
      position: { x: -3, y: 0, z: 0 },
      emotion: "calm",
      scriptId: "secretary-counter",
      recordable: false,
    },
    {
      id: "secretary-tired-7_30",
      startSeconds: T(19, 30),
      endSeconds: T(20, 30),
      branch: "default",
      location: "bankLobby",
      position: { x: -3, y: 0, z: 0 },
      emotion: "stressed",
      scriptId: "secretary-tired",
      recordable: true,
    },
    {
      id: "secretary-running-errand",
      startSeconds: T(18, 15),
      endSeconds: T(19, 30),
      branch: "runningErrand",
      location: "street",
      position: { x: 6, y: 0, z: 6 },
      emotion: "calm",
      scriptId: "secretary-running-errand",
      recordable: true,
    },
  ],

  bankGuard: [
    {
      id: "guard-patrol-6_30",
      startSeconds: T(18, 30),
      endSeconds: T(18, 50),
      branch: "default",
      location: "street",
      position: { x: -2, y: 0, z: 1 },
      emotion: "calm",
      scriptId: "guard-humming",
      recordable: true,
    },
    {
      id: "guard-bank-7_00",
      startSeconds: T(19, 0),
      endSeconds: T(20, 59),
      branch: "default",
      location: "bankLobby",
      position: { x: 0, y: 0, z: 0 },
      emotion: "calm",
      scriptId: "guard-lobby",
      recordable: false,
    },
  ],

  wife: [
    {
      id: "wife-gossip-6_30",
      startSeconds: T(18, 30),
      endSeconds: T(18, 44),
      branch: "default",
      location: "apartment",
      position: { x: 0, y: 0, z: 0 },
      emotion: "calm",
      scriptId: "wife-gossip-6_30",
      recordable: true,
    },
    {
      id: "wife-quiet-7_15",
      startSeconds: T(19, 15),
      endSeconds: T(20, 0),
      branch: "default",
      location: "apartment",
      position: { x: 0, y: 0, z: 0 },
      emotion: "stressed",
      scriptId: "wife-quiet-7_15",
      recordable: true,
    },
  ],
};

/** Stable string-hash → 0..1, deterministic per (seed, momentId).
 *  Used to jitter schedule windows so memorized routes don't dominate. */
function jitterFor(seed: number, momentId: string): number {
  let h = seed >>> 0;
  for (let i = 0; i < momentId.length; i++) {
    h = ((h ^ momentId.charCodeAt(i)) * 16777619) >>> 0;
  }
  // Map to [-1, 1]
  return ((h & 0xffff) / 0xffff) * 2 - 1;
}

/** ±90 in-game seconds of jitter per moment (1.5 game-min). Keeps moments
 *  roughly where the leads describe, but no two runs are identical. */
const JITTER_RANGE_SECONDS = 90;

/** Apply per-run jitter to a moment's start/end. Read seed from store. */
function jitter(m: ScheduleMoment): ScheduleMoment {
  // Don't jitter "branch" overrides — they should fire deterministically when
  // the player flips them via the phone. Only jitter the default schedule.
  if (m.branch !== "default") return m;
  const seed = useGame.getState().runSeed;
  const offset = jitterFor(seed, m.id) * JITTER_RANGE_SECONDS;
  return {
    ...m,
    startSeconds: m.startSeconds + offset,
    endSeconds: m.endSeconds + offset,
  };
}

export function findActiveMoment(
  npcId: NpcId,
  inGameTime: number,
  branch: ScheduleBranch,
): ScheduleMoment | null {
  const moments = NPC_SCHEDULES[npcId];
  for (const m of moments) {
    if (m.branch !== branch) continue;
    const jm = jitter(m);
    if (inGameTime >= jm.startSeconds && inGameTime < jm.endSeconds) return jm;
  }
  if (branch !== "default") {
    for (const m of moments) {
      if (m.branch !== "default") continue;
      const jm = jitter(m);
      if (inGameTime >= jm.startSeconds && inGameTime < jm.endSeconds) return jm;
    }
  }
  return null;
}

export function stepNpcSchedules(inGameTime: number): void {
  const state = useGame.getState();
  for (const id of Object.keys(state.npcs) as NpcId[]) {
    const npc = state.npcs[id];
    const moment = findActiveMoment(id, inGameTime, npc.branch);
    const newMomentId = moment?.id ?? null;
    const newSpeaking = newMomentId !== null;
    const newEmotion: Emotion = moment?.emotion ?? "calm";
    const newLocation: LocationId = moment?.location ?? npc.currentLocation;
    const newPos: Vec3 = moment?.position ?? npc.location;

    if (
      npc.currentMomentId === newMomentId &&
      npc.isSpeaking === newSpeaking &&
      npc.currentEmotion === newEmotion &&
      npc.currentLocation === newLocation &&
      npc.location.x === newPos.x &&
      npc.location.z === newPos.z
    ) {
      continue;
    }

    state.updateNpc(id, {
      currentMomentId: newMomentId,
      isSpeaking: newSpeaking,
      currentEmotion: newEmotion,
      currentLocation: newLocation,
      location: newPos,
    });
  }
}

export function setBranch(npcId: NpcId, branch: ScheduleBranch): void {
  useGame.getState().updateNpc(npcId, { branch });
}
