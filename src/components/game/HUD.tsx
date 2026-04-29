"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { clockLabel } from "@/game/timeFormat";
import { GAME_END_SECONDS } from "@/game/types";
import { beginRecording, endRecording } from "@/game/recordingManager";
import { useInteractionHotkey } from "@/game/interactionHotkey";
import { useInteraction, describeAction } from "@/game/interactionState";
import { suspicionTier } from "@/game/emotionDisplay";

const RECORD_GOOD_MS = 5000;
const RECORD_MAX_MS = 30000;

export default function HUD() {
  const time = useGame((s) => s.inGameTime);
  const suspicion = useGame((s) => s.suspicion);
  const inventory = useGame((s) => s.voiceInventory);
  const toggleNotebook = useGame((s) => s.toggleNotebook);
  const togglePhone = useGame((s) => s.togglePhone);
  const isRecording = useGame((s) => s.player.isRecording);
  const recordingStartedAt = useGame((s) => s.player.recordingStartedAt);
  const notebookOpen = useGame((s) => s.notebookOpen);
  const phoneOpen = useGame((s) => s.phoneOpen);
  const activeAuth = useGame((s) => s.activeAuth);
  const audioMuted = useGame((s) => s.audioMuted);
  const toggleMute = useGame((s) => s.toggleMute);
  const viewMode = useGame((s) => s.viewMode);
  const toggleViewMode = useGame((s) => s.toggleViewMode);
  const pointerLocked = useGame((s) => s.pointerLocked);
  const focus = useInteraction((s) => s.current);
  const isPaused = notebookOpen || phoneOpen || activeAuth !== null;

  useInteractionHotkey();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "m" || e.key === "M") toggleMute();
      if (e.key === "n" || e.key === "N") toggleNotebook();
      if (e.key === "p" || e.key === "P") togglePhone();
      if (e.key === "c" || e.key === "C") toggleViewMode();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleMute, toggleNotebook, togglePhone, toggleViewMode]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [isRecording]);

  const minutesLeft = Math.max(0, (GAME_END_SECONDS - time) / 60);
  const timeUrgent = minutesLeft < 30;

  const recordedMs = isRecording && recordingStartedAt ? now - recordingStartedAt : 0;
  const recordPct = Math.min(1, recordedMs / RECORD_MAX_MS);
  const recordGood = recordedMs >= RECORD_GOOD_MS;

  const tier = suspicionTier(suspicion);
  const suspColor = tier.color;

  const [hintDismissed, setHintDismissed] = useState(false);
  useEffect(() => {
    if (viewMode !== "fp") return;
    if (pointerLocked) return;
    const t = setTimeout(() => setHintDismissed(true), 4500);
    return () => clearTimeout(t);
  }, [viewMode, pointerLocked]);
  // Reset dismissal state when leaving FP mode
  useEffect(() => {
    if (viewMode !== "fp" || pointerLocked) setHintDismissed(false);
  }, [viewMode, pointerLocked]);

  const fpHintVisible =
    viewMode === "fp" && !pointerLocked && !isPaused && !isRecording && !hintDismissed;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      {/* FP crosshair */}
      {viewMode === "fp" && !isPaused && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            aria-hidden
            className="h-1.5 w-1.5 rounded-full border border-noir-paper/70 bg-noir-paper/15 mix-blend-difference"
          />
        </div>
      )}

      {/* Pointer-lock prompt */}
      {fpHintVisible && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded border border-noir-paper/30 bg-black/80 px-6 py-4 text-center text-noir-paper">
            <p className="font-serif text-lg italic">Click to look around</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-noir-fog">
              WASD walk · Shift run · E interact · C diorama view
            </p>
          </div>
        </div>
      )}

      {/* Clock */}
      <div className="absolute left-4 top-4 flex items-baseline gap-3 rounded bg-black/60 px-3 py-2 text-noir-paper backdrop-blur">
        <span className="text-[11px] uppercase tracking-[0.4em] text-noir-fog">Now</span>
        <span
          className={`font-mono text-2xl ${timeUrgent ? "animate-neon-flicker text-noir-neon" : ""}`}
        >
          {clockLabel(time)}
        </span>
        {isPaused && (
          <span
            className="ml-1 rounded border border-noir-amber/60 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em] text-noir-amber"
            role="status"
            aria-live="polite"
          >
            paused
          </span>
        )}
      </div>

      {/* Suspicion */}
      <div className="absolute right-4 top-4 flex flex-col items-end gap-1 rounded bg-black/60 px-3 py-2 backdrop-blur">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] uppercase tracking-[0.4em] text-noir-fog">Suspicion</span>
          <span
            className="font-mono text-xs"
            style={{ color: suspColor }}
            title="At 100, the alarm goes off."
          >
            {Math.round(suspicion)} / 100 · {tier.label}
          </span>
        </div>
        <div
          className="h-2.5 w-44 overflow-hidden rounded bg-noir-ash"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(suspicion)}
          aria-label={`Suspicion ${Math.round(suspicion)} of 100`}
        >
          <div
            className="h-full transition-all"
            style={{ width: `${suspicion}%`, background: suspColor }}
          />
        </div>
      </div>

      {/* Bottom-left button rail */}
      <div className="pointer-events-auto absolute bottom-4 left-4 flex flex-col gap-2">
        <button
          onClick={() => toggleNotebook()}
          aria-label="Open notebook"
          className="rounded border border-noir-paper/30 bg-black/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-noir-paper hover:bg-noir-paper hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-noir-amber"
        >
          Notebook ({inventory.length}) · N
        </button>
        <button
          onClick={() => togglePhone()}
          aria-label="Open phone"
          className="rounded border border-noir-paper/30 bg-black/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-noir-paper hover:bg-noir-paper hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-noir-amber"
        >
          Phone · P
        </button>
        <button
          onClick={() => toggleMute()}
          aria-label={audioMuted ? "Unmute audio" : "Mute audio"}
          aria-pressed={audioMuted}
          className={`rounded border bg-black/60 px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-noir-paper hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-noir-amber ${
            audioMuted
              ? "border-noir-amber text-noir-amber"
              : "border-noir-paper/30 text-noir-paper"
          }`}
        >
          {audioMuted ? "Muted · M" : "Sound · M"}
        </button>
        <button
          onClick={() => toggleViewMode()}
          aria-label={viewMode === "fp" ? "Switch to diorama view" : "Switch to first-person view"}
          aria-pressed={viewMode === "diorama"}
          className="rounded border border-noir-paper/30 bg-black/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-noir-paper hover:bg-noir-paper hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-noir-amber"
        >
          {viewMode === "fp" ? "Diorama · C" : "First-person · C"}
        </button>
      </div>

      {/* Persistent control strip */}
      <div className="pointer-events-none absolute bottom-2 right-4 text-right">
        <p className="text-[11px] uppercase tracking-[0.3em] text-noir-fog">
          {viewMode === "fp" ? (
            <>
              <kbd className="text-noir-amber">WASD</kbd> walk · Hold <kbd className="text-noir-amber">E</kbd> record · <kbd className="text-noir-amber">N</kbd> notebook · <kbd className="text-noir-amber">P</kbd> phone · <kbd className="text-noir-amber">C</kbd> view · <kbd className="text-noir-amber">Esc</kbd> close
            </>
          ) : (
            <>
              Click to walk · Hold <kbd className="text-noir-amber">E</kbd> record · <kbd className="text-noir-amber">N</kbd> notebook · <kbd className="text-noir-amber">P</kbd> phone · <kbd className="text-noir-amber">C</kbd> view · <kbd className="text-noir-amber">Esc</kbd> close
            </>
          )}
        </p>
      </div>

      {/* Centered interaction prompt (FP) / Record indicator */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 transform">
        {focus && (
          <div className="flex flex-col items-center gap-2">
            {focus.kind === "record" ? (
              <button
                type="button"
                onPointerDown={() => beginRecording()}
                onPointerUp={() => endRecording()}
                onPointerLeave={() => isRecording && endRecording()}
                onKeyDown={(e) => {
                  if ((e.key === "e" || e.key === "E" || e.key === " " || e.key === "Enter") && !e.repeat) {
                    e.preventDefault();
                    beginRecording();
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === "e" || e.key === "E" || e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    endRecording();
                  }
                }}
                aria-label={`Record ${focus.npcName}, hold to capture`}
                className={`pointer-events-auto flex flex-col items-center gap-1 rounded border bg-black/75 px-4 py-2 text-xs uppercase tracking-[0.3em] backdrop-blur transition focus:outline-none focus-visible:ring-2 focus-visible:ring-noir-amber ${
                  isRecording
                    ? "border-noir-neon text-noir-neon animate-pulse"
                    : "border-noir-amber/60 text-noir-paper hover:bg-noir-paper hover:text-black"
                }`}
                aria-live="polite"
              >
                <span>
                  {isRecording
                    ? `● Recording ${(recordedMs / 1000).toFixed(1)}s`
                    : `Hold E to record ${focus.npcName}`}
                </span>
                {isRecording && (
                  <div
                    className="h-1.5 w-44 overflow-hidden rounded bg-noir-ash"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={30}
                    aria-valuenow={recordedMs / 1000}
                    aria-label="Recording progress"
                  >
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${recordPct * 100}%`,
                        background: recordGood ? "#3affa6" : "#f5a623",
                      }}
                    />
                  </div>
                )}
              </button>
            ) : (
              <div className="rounded border border-noir-amber/60 bg-black/75 px-4 py-2 text-xs uppercase tracking-[0.3em] text-noir-paper backdrop-blur">
                <kbd className="mr-2 text-noir-amber">E</kbd>
                {describeAction(focus)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
