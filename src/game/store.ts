"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  GAME_START_SECONDS,
  type ActiveCall,
  type AuthAttempt,
  type Emotion,
  type GameState,
  type LocationId,
  type NpcId,
  type NpcState,
  type Vec3,
  type VoiceCard,
} from "./types";

const NPC_START_LOCATIONS: Record<NpcId, { pos: Vec3; loc: LocationId }> = {
  bankManager: { pos: { x: -6, y: 0, z: -2 }, loc: "bankLobby" },
  secretary: { pos: { x: 8, y: 0, z: 4 }, loc: "cafe" },
  bankGuard: { pos: { x: -2, y: 0, z: 0 }, loc: "street" },
  wife: { pos: { x: 0, y: 0, z: 0 }, loc: "apartment" },
};

const LOCATION_ENTRY_POSITIONS: Record<LocationId, Vec3> = {
  street: { x: 0, y: 0, z: 6 },
  bankLobby: { x: 0, y: 0, z: 3.8 },
  bankHallway: { x: 0, y: 0, z: -7.2 },
  vault: { x: 0, y: 0, z: -12.8 },
  apartment: { x: 0, y: 0, z: 3.8 },
  cafe: { x: 0, y: 0, z: 3.8 },
  trainStation: { x: 12, y: 0, z: 8 },
};

function makeInitialNpc(id: NpcId): NpcState {
  const start = NPC_START_LOCATIONS[id];
  return {
    id,
    location: start.pos,
    currentLocation: start.loc,
    scriptCursor: 0,
    branch: "default",
    currentEmotion: "calm",
    isSpeaking: false,
    currentMomentId: null,
    conversationHistory: [],
    noticedRecording: false,
  };
}

export const initialState: GameState = {
  phase: "title",
  inGameTime: GAME_START_SECONDS,
  player: {
    position: { x: 0, y: 0, z: 6 },
    target: null,
    currentLocation: "street",
    isRecording: false,
    recordingTargetNpc: null,
    recordingStartedAt: null,
    hasBriefcase: false,
  },
  npcs: {
    bankManager: makeInitialNpc("bankManager"),
    secretary: makeInitialNpc("secretary"),
    bankGuard: makeInitialNpc("bankGuard"),
    wife: makeInitialNpc("wife"),
  },
  voiceInventory: [],
  suspicion: 0,
  alarmTriggered: false,
  vaultOpen: false,
  briefcaseTaken: false,
  bankFrontUnlocked: true,
  bankHallwayUnlocked: false,
  activeCall: null,
  activeAuth: null,
  notebookOpen: false,
  phoneOpen: false,
  toasts: [],
  audioMuted: false,
  audioVolume: 0.85,
  viewMode: "fp",
  pointerLocked: false,
};

export interface GameActions {
  setPhase(phase: GameState["phase"]): void;
  advanceTime(deltaSeconds: number): void;
  setPlayerTarget(target: Vec3 | null): void;
  setPlayerPosition(pos: Vec3): void;
  setPlayerLocation(loc: LocationId, entryPosition?: Vec3): void;
  startRecording(npcId: NpcId): void;
  stopRecording(): void;
  addVoiceCard(card: VoiceCard): void;
  removeVoiceCard(id: string): void;
  updateNpc(id: NpcId, patch: Partial<NpcState>): void;
  setNpcSpeaking(id: NpcId, momentId: string | null, emotion: Emotion): void;
  raiseSuspicion(amount: number, reason: string): void;
  triggerAlarm(reason: string): void;
  openBankFront(open: boolean): void;
  openHallway(open: boolean): void;
  openVault(): void;
  takeBriefcase(): void;
  setActiveCall(call: ActiveCall | null): void;
  pushCallTurn(turn: { role: "caller" | "npc"; text: string }): void;
  setActiveAuth(auth: AuthAttempt | null): void;
  toggleNotebook(open?: boolean): void;
  togglePhone(open?: boolean): void;
  pushToast(text: string, ttlMs?: number): void;
  pruneToasts(now: number): void;
  toggleMute(value?: boolean): void;
  setVolume(value: number): void;
  toggleViewMode(): void;
  setPointerLocked(value: boolean): void;
  reset(): void;
}

export const useGame = create<GameState & GameActions>()(
  subscribeWithSelector((set, _get) => ({
    ...initialState,

    setPhase: (phase) =>
      set((s) => {
        if (phase !== "playing" || s.phase === "playing") return { phase };
        return {
          phase,
          toasts: [
            ...s.toasts,
            {
              id: `${Date.now()}_objective`,
              text: "Objective: check the notebook, steal a calm manager voice, open the vault.",
              expiresAt: Date.now() + 7000,
            },
          ],
        };
      }),

    advanceTime: (deltaSeconds) =>
      set((s) => ({ inGameTime: s.inGameTime + deltaSeconds })),

    setPlayerTarget: (target) =>
      set((s) => ({ player: { ...s.player, target } })),

    setPlayerPosition: (position) =>
      set((s) => ({ player: { ...s.player, position } })),

    setPlayerLocation: (loc, entryPosition) =>
      set((s) => ({
        player: {
          ...s.player,
          currentLocation: loc,
          position: entryPosition ?? LOCATION_ENTRY_POSITIONS[loc],
          target: null,
        },
      })),

    startRecording: (npcId) =>
      set((s) => ({
        player: {
          ...s.player,
          isRecording: true,
          recordingTargetNpc: npcId,
          recordingStartedAt: Date.now(),
        },
      })),

    stopRecording: () =>
      set((s) => ({
        player: {
          ...s.player,
          isRecording: false,
          recordingTargetNpc: null,
          recordingStartedAt: null,
        },
      })),

    addVoiceCard: (card) =>
      set((s) => ({ voiceInventory: [...s.voiceInventory, card] })),

    removeVoiceCard: (id) =>
      set((s) => ({ voiceInventory: s.voiceInventory.filter((v) => v.id !== id) })),

    updateNpc: (id, patch) =>
      set((s) => ({ npcs: { ...s.npcs, [id]: { ...s.npcs[id], ...patch } } })),

    setNpcSpeaking: (id, momentId, emotion) =>
      set((s) => ({
        npcs: {
          ...s.npcs,
          [id]: {
            ...s.npcs[id],
            isSpeaking: momentId !== null,
            currentMomentId: momentId,
            currentEmotion: emotion,
          },
        },
      })),

    raiseSuspicion: (amount, reason) =>
      set((s) => {
        const next = Math.min(100, s.suspicion + amount);
        const triggered = next >= 100 && !s.alarmTriggered;
        return {
          suspicion: next,
          alarmTriggered: triggered ? true : s.alarmTriggered,
          toasts: [
            ...s.toasts,
            {
              id: `${Date.now()}_susp`,
              text: triggered ? `ALARM: ${reason}` : `Suspicion +${amount}: ${reason}`,
              expiresAt: Date.now() + 4000,
            },
          ],
        };
      }),

    triggerAlarm: (reason) =>
      set((s) => ({
        alarmTriggered: true,
        suspicion: 100,
        toasts: [
          ...s.toasts,
          { id: `${Date.now()}_alarm`, text: `ALARM: ${reason}`, expiresAt: Date.now() + 6000 },
        ],
      })),

    openBankFront: (open) => set({ bankFrontUnlocked: open }),
    openHallway: (open) => set({ bankHallwayUnlocked: open }),

    openVault: () =>
      set({
        vaultOpen: true,
        toasts: [
          {
            id: `${Date.now()}_vault`,
            text: "Vault opens with a deep clunk.",
            expiresAt: Date.now() + 4000,
          },
        ],
      }),

    takeBriefcase: () =>
      set((s) => ({
        briefcaseTaken: true,
        player: { ...s.player, hasBriefcase: true },
      })),

    setActiveCall: (call) => set({ activeCall: call }),

    pushCallTurn: (turn) =>
      set((s) =>
        s.activeCall
          ? {
              activeCall: {
                ...s.activeCall,
                transcript: [...s.activeCall.transcript, turn],
              },
            }
          : s,
      ),

    setActiveAuth: (auth) => set({ activeAuth: auth }),

    toggleNotebook: (open) =>
      set((s) => ({ notebookOpen: open !== undefined ? open : !s.notebookOpen })),

    togglePhone: (open) =>
      set((s) => ({ phoneOpen: open !== undefined ? open : !s.phoneOpen })),

    pushToast: (text, ttlMs = 3500) =>
      set((s) => ({
        toasts: [
          ...s.toasts,
          { id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, text, expiresAt: Date.now() + ttlMs },
        ],
      })),

    pruneToasts: (now) =>
      set((s) => ({ toasts: s.toasts.filter((t) => t.expiresAt > now) })),

    toggleMute: (value) =>
      set((s) => ({ audioMuted: value !== undefined ? value : !s.audioMuted })),

    setVolume: (value) =>
      set({ audioVolume: Math.max(0, Math.min(1, value)) }),

    toggleViewMode: () =>
      set((s) => ({ viewMode: s.viewMode === "fp" ? "diorama" : "fp" })),

    setPointerLocked: (value) => set({ pointerLocked: value }),

    reset: () =>
      set((s) => ({
        ...initialState,
        phase: "title",
        // Preserve user audio + view prefs across resets
        audioMuted: s.audioMuted,
        audioVolume: s.audioVolume,
        viewMode: s.viewMode,
      })),
  })),
);
