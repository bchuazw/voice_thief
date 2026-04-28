"use client";

import { useEffect } from "react";
import { useGame } from "@/game/store";
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

export default function GameRoot() {
  const phase = useGame((s) => s.phase);
  const notebookOpen = useGame((s) => s.notebookOpen);
  const phoneOpen = useGame((s) => s.phoneOpen);
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

  return (
    <div className="relative h-full w-full">
      {phase === "title" && <TitleScreen />}
      {phase === "intro" && <IntroCinematic />}
      {(phase === "playing" || phase === "won" || phase === "lost") && (
        <>
          <GameCanvas />
          <SceneTitle />
          <HUD />
          <ToastStack />
          {notebookOpen && <Notebook />}
          {phoneOpen && <PhoneUI />}
          {activeAuth && <VoiceAuthDialog />}
        </>
      )}
      {(phase === "won" || phase === "lost") && <EndCard />}
    </div>
  );
}
