"use client";

import { create } from "zustand";
import type { NpcId, Vec3 } from "./types";

export type InteractionAction =
  | { kind: "record"; npcId: NpcId; npcName: string; momentId: string }
  | { kind: "phone" }
  | { kind: "inspect"; label: string; toast: string }
  | { kind: "enterLocation"; target: string; label: string; locked?: boolean; entryPosition?: Vec3 }
  | { kind: "auth"; device: "bankFront" | "bankHallway" | "vault" }
  | { kind: "auditLedger" }
  | { kind: "briefcase" }
  | { kind: "trainStation" };

interface InteractionState {
  current: InteractionAction | null;
  set(action: InteractionAction | null): void;
}

/**
 * Lightweight focused-interaction store, written every frame from the FP
 * raycast. Separated from the main game store so the high-frequency writes
 * don't churn unrelated subscribers.
 */
export const useInteraction = create<InteractionState>((set) => ({
  current: null,
  set: (current) => set({ current }),
}));

export function describeAction(a: InteractionAction | null): string {
  if (!a) return "";
  switch (a.kind) {
    case "record":
      return `Record ${a.npcName}`;
    case "phone":
      return "Use payphone";
    case "inspect":
      return a.label;
    case "enterLocation":
      return a.locked ? `${a.label} (locked)` : a.label;
    case "auth":
      return a.device === "vault"
        ? "Authenticate vault"
        : a.device === "bankHallway"
          ? "Open hallway"
          : "Open bank door";
    case "auditLedger":
      return "File audit clearance";
    case "briefcase":
      return "Take the briefcase";
    case "trainStation":
      return "Board the train";
  }
}
