import { GAME_END_SECONDS, GAME_START_SECONDS } from "./types";

export function clockLabel(inGameTime: number): string {
  const clamped = Math.max(GAME_START_SECONDS, Math.min(GAME_END_SECONDS, inGameTime));
  const totalMin = Math.floor(clamped / 60);
  const hours24 = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = ((hours24 + 11) % 12) + 1;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${meridiem}`;
}

export function inGameTimeFromClock(hours24: number, minutes: number): number {
  return hours24 * 3600 + minutes * 60;
}
