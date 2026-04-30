"use client";

import type { GameState, NpcState, PlayerState, VoiceCard } from "./types";

const SAVE_VERSION = 1;
const SAVE_KEY = "voice-thief-save-v1";

export interface SavedRunState {
  phase: "playing";
  inGameTime: number;
  player: PlayerState;
  npcs: GameState["npcs"];
  voiceInventory: VoiceCard[];
  suspicion: number;
  alarmTriggered: boolean;
  vaultOpen: boolean;
  briefcaseTaken: boolean;
  bankFrontUnlocked: boolean;
  bankHallwayUnlocked: boolean;
  bankBackExitUnlocked: boolean;
  lastPressureCheck: number;
  audioMuted: boolean;
  audioVolume: number;
  viewMode: GameState["viewMode"];
  runSeed: number;
  runStartedAt: number;
  failedAuthCount: number;
  recordingsBust: number;
}

export interface SavedRun {
  version: typeof SAVE_VERSION;
  savedAt: number;
  state: SavedRunState;
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function sanitizePlayer(player: PlayerState): PlayerState {
  return {
    ...player,
    target: null,
    isRecording: false,
    recordingTargetNpc: null,
    recordingStartedAt: null,
    recordingAwareness: 0,
  };
}

function sanitizeNpc(npc: NpcState): NpcState {
  return {
    ...npc,
    isSpeaking: false,
    currentMomentId: null,
  };
}

function serializeRun(state: GameState): SavedRun | null {
  if (state.phase !== "playing") return null;
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    state: {
      phase: "playing",
      inGameTime: state.inGameTime,
      player: sanitizePlayer(state.player),
      npcs: {
        bankManager: sanitizeNpc(state.npcs.bankManager),
        secretary: sanitizeNpc(state.npcs.secretary),
        bankGuard: sanitizeNpc(state.npcs.bankGuard),
        wife: sanitizeNpc(state.npcs.wife),
      },
      voiceInventory: state.voiceInventory,
      suspicion: state.suspicion,
      alarmTriggered: state.alarmTriggered,
      vaultOpen: state.vaultOpen,
      briefcaseTaken: state.briefcaseTaken,
      bankFrontUnlocked: state.bankFrontUnlocked,
      bankHallwayUnlocked: state.bankHallwayUnlocked,
      bankBackExitUnlocked: state.bankBackExitUnlocked,
      lastPressureCheck: state.lastPressureCheck,
      audioMuted: state.audioMuted,
      audioVolume: state.audioVolume,
      viewMode: state.viewMode,
      runSeed: state.runSeed,
      runStartedAt: state.runStartedAt,
      failedAuthCount: state.failedAuthCount,
      recordingsBust: state.recordingsBust,
    },
  };
}

export function saveCurrentRun(state: GameState): boolean {
  const store = storage();
  const payload = serializeRun(state);
  if (!store || !payload) return false;
  try {
    store.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadSavedRun(): SavedRun | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedRun>;
    if (parsed.version !== SAVE_VERSION || !parsed.state || parsed.state.phase !== "playing") {
      store.removeItem(SAVE_KEY);
      return null;
    }
    return parsed as SavedRun;
  } catch {
    store.removeItem(SAVE_KEY);
    return null;
  }
}

export function clearSavedRun(): void {
  storage()?.removeItem(SAVE_KEY);
}
