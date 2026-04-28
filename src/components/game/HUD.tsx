"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { clockLabel } from "@/game/timeFormat";
import { GAME_END_SECONDS } from "@/game/types";
import { distance } from "@/game/pathfinding";
import { findActiveMoment } from "@/game/npcSchedules";
import { useRecordingHotkey } from "@/game/recordingManager";
import type { NpcId } from "@/game/types";

const RECORD_GOOD_MS = 5000;
const RECORD_MAX_MS = 30000;

export default function HUD() {
  const time = useGame((s) => s.inGameTime);
  const suspicion = useGame((s) => s.suspicion);
  const playerPos = useGame((s) => s.player.position);
  const npcs = useGame((s) => s.npcs);
  const inventory = useGame((s) => s.voiceInventory);
  const toggleNotebook = useGame((s) => s.toggleNotebook);
  const togglePhone = useGame((s) => s.togglePhone);
  const isRecording = useGame((s) => s.player.isRecording);
  const recordingStartedAt = useGame((s) => s.player.recordingStartedAt);

  useRecordingHotkey();

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [isRecording]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "n" || e.key === "N") toggleNotebook();
      if (e.key === "p" || e.key === "P") togglePhone();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleNotebook, togglePhone]);

  let recordableNpc: NpcId | null = null;
  for (const id of Object.keys(npcs) as NpcId[]) {
    const npc = npcs[id];
    if (!npc.isSpeaking) continue;
    const moment = findActiveMoment(id, time, npc.branch);
    if (!moment?.recordable) continue;
    if (distance(npc.location, playerPos) < 4.5) {
      recordableNpc = id;
      break;
    }
  }

  const minutesLeft = Math.max(0, (GAME_END_SECONDS - time) / 60);
  const timeUrgent = minutesLeft < 30;

  const recordedMs = isRecording && recordingStartedAt ? now - recordingStartedAt : 0;
  const recordPct = Math.min(1, recordedMs / RECORD_MAX_MS);
  const recordGood = recordedMs >= RECORD_GOOD_MS;

  const suspColor =
    suspicion > 70 ? "#ff3c3c" : suspicion > 40 ? "#f5a623" : "#3affa6";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      <div className="absolute left-4 top-4 flex items-baseline gap-3 rounded bg-black/60 px-3 py-2 text-noir-paper backdrop-blur">
        <span className="text-[10px] uppercase tracking-[0.4em] text-noir-fog">Now</span>
        <span
          className={`font-mono text-2xl ${timeUrgent ? "animate-neon-flicker text-noir-neon" : ""}`}
        >
          {clockLabel(time)}
        </span>
      </div>

      <div className="absolute right-4 top-4 flex flex-col items-end gap-1 rounded bg-black/60 px-3 py-2 backdrop-blur">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] uppercase tracking-[0.4em] text-noir-fog">Suspicion</span>
          <span
            className="font-mono text-[11px]"
            style={{ color: suspColor }}
            title="At 100, the alarm goes off."
          >
            {Math.round(suspicion)} / 100
          </span>
        </div>
        <div className="h-2 w-44 overflow-hidden rounded bg-noir-ash">
          <div
            className="h-full transition-all"
            style={{ width: `${suspicion}%`, background: suspColor }}
          />
        </div>
      </div>

      <div className="pointer-events-auto absolute bottom-4 left-4 flex flex-col gap-2">
        <button
          onClick={() => toggleNotebook()}
          className="rounded border border-noir-paper/30 bg-black/60 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-noir-paper hover:bg-noir-paper hover:text-black"
        >
          Notebook ({inventory.length})  · N
        </button>
        <button
          onClick={() => togglePhone()}
          className="rounded border border-noir-paper/30 bg-black/60 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-noir-paper hover:bg-noir-paper hover:text-black"
        >
          Phone · P
        </button>
      </div>

      {/* Persistent control strip — first-time players never miss this */}
      <div className="pointer-events-none absolute bottom-2 right-4 text-right">
        <p className="text-[9px] uppercase tracking-[0.3em] text-noir-fog/70">
          Click to walk · Hold <span className="text-noir-amber">E</span> to record · <span className="text-noir-amber">N</span> notebook · <span className="text-noir-amber">P</span> phone
        </p>
      </div>

      {/* Recording indicator with progress */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 transform">
        {recordableNpc && (
          <div
            className={`flex flex-col items-center gap-1 rounded bg-black/70 px-4 py-2 text-[12px] uppercase tracking-[0.3em] backdrop-blur ${
              isRecording ? "text-noir-neon" : "text-noir-paper"
            }`}
          >
            <span>
              {isRecording
                ? `● Recording… ${(recordedMs / 1000).toFixed(1)}s`
                : "Hold E to record"}
            </span>
            {isRecording && (
              <div className="h-1 w-44 overflow-hidden rounded bg-noir-ash">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${recordPct * 100}%`,
                    background: recordGood ? "#3affa6" : "#f5a623",
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
