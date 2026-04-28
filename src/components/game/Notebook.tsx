"use client";

import { useState } from "react";
import { useGame } from "@/game/store";
import { NPC_PROFILES } from "@/config/voices";
import { clockLabel } from "@/game/timeFormat";
import { NPC_SCHEDULES } from "@/game/npcSchedules";
import type { NpcId } from "@/game/types";

const TABS = ["voices", "suspects", "schedule"] as const;
type Tab = (typeof TABS)[number];

export default function Notebook() {
  const inventory = useGame((s) => s.voiceInventory);
  const npcs = useGame((s) => s.npcs);
  const toggleNotebook = useGame((s) => s.toggleNotebook);
  const [tab, setTab] = useState<Tab>("voices");

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 px-4 pointer-events-auto">
      <div className="relative h-[80%] w-[min(900px,90vw)] overflow-hidden rounded border border-noir-paper/30 bg-noir-smoke text-noir-paper shadow-2xl">
        <div className="flex items-center justify-between border-b border-noir-paper/15 px-6 py-3">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl italic">Notebook</span>
            <span className="text-[10px] uppercase tracking-[0.4em] text-noir-fog">
              First City — Thursday
            </span>
          </div>
          <button
            onClick={() => toggleNotebook(false)}
            className="text-xs uppercase tracking-[0.3em] text-noir-fog hover:text-noir-paper"
          >
            Close · N
          </button>
        </div>

        <div className="flex border-b border-noir-paper/10">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-[11px] uppercase tracking-[0.4em] ${
                tab === t ? "bg-noir-ash text-noir-paper" : "text-noir-fog hover:text-noir-paper"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="h-[calc(100%-100px)] overflow-y-auto scrollbar-thin px-6 py-4">
          {tab === "voices" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {inventory.length === 0 && (
                <p className="col-span-full italic text-noir-fog">
                  No voices yet. Get close to someone speaking and hold E.
                </p>
              )}
              {inventory.map((card) => (
                <div
                  key={card.id}
                  className="rounded border border-noir-paper/15 bg-black/40 p-3"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-serif text-lg">
                      {NPC_PROFILES[card.npcId].displayName}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-noir-fog">
                      {clockLabel(card.capturedAtInGameTime)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-noir-fog">
                    Emotion:{" "}
                    <span
                      className={
                        card.emotionalState === "calm"
                          ? "text-[#3affa6]"
                          : card.emotionalState === "stressed"
                            ? "text-noir-amber"
                            : "text-noir-neon"
                      }
                    >
                      {card.emotionalState}
                    </span>{" "}
                    · {card.durationSeconds.toFixed(1)}s ·{" "}
                    {card.mock ? "mock clone" : "live clone"}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-noir-fog/60">
                    {card.elevenLabsVoiceId}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === "suspects" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(Object.keys(NPC_PROFILES) as NpcId[]).map((id) => {
                const profile = NPC_PROFILES[id];
                const npc = npcs[id];
                return (
                  <div
                    key={id}
                    className="rounded border border-noir-paper/15 bg-black/40 p-3"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-serif text-lg">{profile.displayName}</span>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-noir-fog">
                        {npc.currentLocation}
                      </span>
                    </div>
                    <p className="mt-1 text-xs italic text-noir-fog">
                      {profile.description}
                    </p>
                    <p className="mt-2 text-[11px] text-noir-fog">
                      Branch: {npc.branch} · {npc.isSpeaking ? "speaking" : "quiet"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "schedule" && (
            <div className="space-y-3">
              {(Object.keys(NPC_SCHEDULES) as NpcId[]).map((id) => (
                <div key={id}>
                  <h3 className="font-serif text-lg">{NPC_PROFILES[id].displayName}</h3>
                  <ul className="mt-1 space-y-1 text-xs text-noir-fog">
                    {NPC_SCHEDULES[id]
                      .filter((m) => m.branch === "default")
                      .map((m) => (
                        <li key={m.id} className="flex justify-between">
                          <span>{clockLabel(m.startSeconds)}</span>
                          <span>
                            {m.location} ·{" "}
                            <span
                              className={
                                m.emotion === "calm"
                                  ? "text-[#3affa6]"
                                  : m.emotion === "stressed"
                                    ? "text-noir-amber"
                                    : "text-noir-neon"
                              }
                            >
                              {m.emotion}
                            </span>
                            {m.recordable ? " · recordable" : ""}
                            {m.vaultClueLeak ? " · clue" : ""}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
