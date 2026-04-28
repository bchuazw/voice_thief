import { distance } from "./pathfinding";
import type { GameState } from "./types";
import { GAME_END_SECONDS } from "./types";

const TRAIN_STATION_POS = { x: 12, y: 0, z: 8 };
const TRAIN_RADIUS = 2.5;

export function evaluateWinCondition(state: GameState): boolean {
  if (!state.briefcaseTaken) return false;
  if (state.alarmTriggered) return false;
  if (state.player.currentLocation !== "street") return false;
  return distance(state.player.position, TRAIN_STATION_POS) < TRAIN_RADIUS;
}

export function evaluateLossConditions(state: GameState): string | null {
  if (state.alarmTriggered) return "Alarm raised";
  if (state.inGameTime >= GAME_END_SECONDS) return "Last train left at 9:00 PM";
  if (state.suspicion >= 100) return "Too suspicious";
  return null;
}
