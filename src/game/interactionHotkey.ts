"use client";

import { useEffect, useRef } from "react";
import { useGame } from "./store";
import { useInteraction } from "./interactionState";
import { beginRecording, endRecording } from "./recordingManager";

export function useInteractionHotkey(): void {
  const heldRef = useRef(false);

  useEffect(() => {
    function handleAction() {
      const { current } = useInteraction.getState();
      if (!current) return;
      const s = useGame.getState();
      switch (current.kind) {
        case "phone":
          s.togglePhone(true);
          return;
        case "enterLocation":
          if (current.locked) {
            s.pushToast("Locked. Try authenticating.");
            return;
          }
          s.setPlayerLocation(current.target as never);
          return;
        case "auth":
          s.setActiveAuth({
            device: current.device,
            voiceCardId: "",
            result: "pending",
          });
          return;
        case "briefcase":
          s.takeBriefcase();
          s.pushToast("Briefcase secured. Get to the train station.");
          return;
        case "trainStation":
          s.setPlayerPosition({ x: 12, y: 0, z: 8 });
          s.setPlayerTarget(null);
          s.pushToast("Boarding the train…");
          return;
        case "record":
          // Recording is press-and-hold, handled in down/up below
          return;
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      // Ignore if user is typing in a text input (e.g. phone message)
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
      ) {
        return;
      }

      if (e.key !== "e" && e.key !== "E") return;
      const focus = useInteraction.getState().current;
      if (!focus) return;

      if (focus.kind === "record") {
        if (heldRef.current) return;
        heldRef.current = true;
        beginRecording().catch(() => {});
        return;
      }

      // One-shot actions
      handleAction();
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key !== "e" && e.key !== "E") return;
      if (!heldRef.current) return;
      heldRef.current = false;
      endRecording().catch(() => {});
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}
