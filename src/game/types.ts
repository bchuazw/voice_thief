export type NpcId = "bankManager" | "secretary" | "bankGuard" | "wife";

export type LocationId =
  | "street"
  | "bankLobby"
  | "bankHallway"
  | "vault"
  | "apartment"
  | "cafe"
  | "trainStation";

export type Emotion = "calm" | "stressed" | "panicked";

export type Phase = "title" | "intro" | "playing" | "won" | "lost";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface VoiceCard {
  id: string;
  npcId: NpcId;
  elevenLabsVoiceId: string;
  capturedAtInGameTime: number;
  emotionalState: Emotion;
  durationSeconds: number;
  sourceMomentId: string;
  mock: boolean;
}

export type ScheduleBranch = "default" | "rushedHome" | "atCafe" | "runningErrand" | "atBank";

export interface NpcState {
  id: NpcId;
  location: Vec3;
  currentLocation: LocationId;
  scriptCursor: number;
  branch: ScheduleBranch;
  currentEmotion: Emotion;
  isSpeaking: boolean;
  currentMomentId: string | null;
  conversationHistory: { role: "caller" | "npc"; text: string }[];
  noticedRecording: boolean;
}

export interface PlayerState {
  position: Vec3;
  target: Vec3 | null;
  currentLocation: LocationId;
  isRecording: boolean;
  recordingTargetNpc: NpcId | null;
  recordingStartedAt: number | null;
  hasBriefcase: boolean;
}

export interface ActiveCall {
  targetNpc: NpcId;
  voiceCardId: string;
  transcript: { role: "caller" | "npc"; text: string }[];
  pending: boolean;
}

export interface AuthAttempt {
  device: "bankFront" | "bankHallway" | "vault";
  voiceCardId: string;
  result: "pending" | "pass" | "fail";
  reason?: string;
  stressScore?: number;
}

export interface GameState {
  phase: Phase;
  inGameTime: number;
  player: PlayerState;
  npcs: Record<NpcId, NpcState>;
  voiceInventory: VoiceCard[];
  suspicion: number;
  alarmTriggered: boolean;
  vaultOpen: boolean;
  briefcaseTaken: boolean;
  bankFrontUnlocked: boolean;
  bankHallwayUnlocked: boolean;
  activeCall: ActiveCall | null;
  activeAuth: AuthAttempt | null;
  notebookOpen: boolean;
  phoneOpen: boolean;
  menuOpen: boolean;
  toasts: { id: string; text: string; expiresAt: number }[];
  audioMuted: boolean;
  audioVolume: number;
  viewMode: "fp" | "diorama";
  pointerLocked: boolean;
}

export const GAME_START_SECONDS = 18 * 3600;
export const GAME_END_SECONDS = 21 * 3600;
export const GAME_DURATION_SECONDS = GAME_END_SECONDS - GAME_START_SECONDS;
// Real-time pace. 0.12 → ~22 real-min run (was 0.083 / ~15 min).
// Beta feedback: 15 min was too brutal vs. recordable windows.
export const REAL_SECONDS_PER_GAME_SECOND = 0.12;
