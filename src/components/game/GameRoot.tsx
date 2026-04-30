"use client";

import { useEffect } from "react";
import { useGame } from "@/game/store";
import { clearSavedRun, saveCurrentRun } from "@/game/saveGame";
import { useGameTick } from "@/game/tick";
import { useWinWatch } from "@/game/useWinWatch";
import GameCanvas from "./GameCanvas";
import HUD from "./HUD";
import IntroCinematic from "./IntroCinematic";
import Notebook from "./Notebook";
import PhoneUI from "./PhoneUI";
import VoiceAuthDialog from "./VoiceAuthDialog";
import EndCard from "./EndCard";
import ToastStack from "./ToastStack";
import TitleScreen from "./TitleScreen";
import SceneTitle from "./SceneTitle";
import PauseMenu from "./PauseMenu";
import DialogueCaptions from "./DialogueCaptions";

export default function GameRoot() {
  const phase = useGame((s) => s.phase);
  const notebookOpen = useGame((s) => s.notebookOpen);
  const phoneOpen = useGame((s) => s.phoneOpen);
  const menuOpen = useGame((s) => s.menuOpen);
  const activeAuth = useGame((s) => s.activeAuth);

  useGameTick();
  useWinWatch();

  useEffect(() => {
    fetch("/api/bootstrap").catch(() => {});
    if (typeof window !== "undefined") {
      (window as unknown as { __vt?: unknown }).__vt = {
        store: useGame,
        getState: useGame.getState,
        setState: useGame.setState,
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const save = () => saveCurrentRun(useGame.getState());
    const interval = window.setInterval(save, 2500);
    window.addEventListener("beforeunload", save);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("beforeunload", save);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (notebookOpen || phoneOpen || menuOpen || activeAuth || phase === "won" || phase === "lost") {
      document.exitPointerLock?.();
    }
  }, [activeAuth, menuOpen, notebookOpen, phase, phoneOpen]);

  useEffect(() => {
    if (phase === "won" || phase === "lost") clearSavedRun();
  }, [phase]);

  return (
    <div className="relative h-full w-full">
      {phase === "title" && <TitleScreen />}
      {phase === "intro" && <IntroCinematic />}
      {(phase === "playing" || phase === "won" || phase === "lost") && (
        <>
          <GameCanvas />
          <SceneTitle />
          <DialogueCaptions />
          <HUD />
          <ToastStack />
          {notebookOpen && <Notebook />}
          {phoneOpen && <PhoneUI />}
          {menuOpen && <PauseMenu />}
          {activeAuth && <VoiceAuthDialog />}
        </>
      )}
      {(phase === "won" || phase === "lost") && <EndCard />}
    </div>
  );
}
