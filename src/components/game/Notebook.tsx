"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { NPC_PROFILES } from "@/config/voices";
import { clockLabel } from "@/game/timeFormat";
import { NPC_SCHEDULES } from "@/game/npcSchedules";
import { buildLeads } from "@/game/leads";
import { emotionColorClass, emotionGlyph } from "@/game/emotionDisplay";
import { startNpcAudio } from "@/audio/npcSpeech";
import type { NpcId } from "@/game/types";

const TABS = ["leads", "voices", "suspects", "schedule"] as const;
type Tab = (typeof TABS)[number];

export default function Notebook() {
  const inventory = useGame((s) => s.voiceInventory);
  const npcs = useGame((s) => s.npcs);
  const toggleNotebook = useGame((s) => s.toggleNotebook);
  const state = useGame();
  const leads = buildLeads(state);
  const hasActiveLockout = Object.values(state.authLockouts).some(
    (unlockAt) => unlockAt > state.inGameTime,
  );
  // First-time players get Leads. Once they've recorded anything, default
  // back to Voices unless a hot relay has created a time-sensitive lead.
  const [tab, setTab] = useState<Tab>(
    hasActiveLockout ? "leads" : inventory.length > 0 ? "voices" : "leads",
  );

  useEffect(() => {
    if (hasActiveLockout) setTab("leads");
  }, [hasActiveLockout]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") toggleNotebook(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleNotebook]);

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 px-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notebook-title"
    >
      <div
        className="relative flex h-[88dvh] w-[min(900px,94vw)] flex-col overflow-hidden rounded border border-noir-paper/25 text-noir-paper shadow-2xl sm:h-[80%] sm:w-[min(900px,90vw)]"
        style={{
          backgroundColor: "#221d18",
          backgroundImage:
            "radial-gradient(1200px 600px at 30% 20%, rgba(244,241,234,0.04), transparent 60%)," +
            "repeating-linear-gradient(0deg, transparent 0, transparent 28px, rgba(244,241,234,0.025) 28px, rgba(244,241,234,0.025) 29px)",
        }}
      >
        <div className="flex flex-col gap-2 border-b border-noir-paper/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-baseline gap-3">
            <h2 id="notebook-title" className="font-serif text-2xl italic">Notebook</h2>
            <span className="truncate text-[10px] uppercase tracking-[0.25em] text-noir-fog sm:tracking-[0.4em]">
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

        <div className="grid grid-cols-2 border-b border-noir-paper/10 sm:flex">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 text-[10px] uppercase tracking-[0.25em] sm:flex-1 sm:text-[11px] sm:tracking-[0.4em] ${
                tab === t ? "bg-noir-ash text-noir-paper" : "text-noir-fog hover:text-noir-paper"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-4 py-4 sm:px-6">
          {tab === "leads" && (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className={`rounded border bg-black/40 p-3 ${
                    lead.urgency === "active"
                      ? "border-noir-amber/45"
                      : lead.urgency === "solved"
                        ? "border-[#3affa6]/35"
                        : "border-noir-paper/15"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-serif text-lg">{lead.title}</h3>
                    <span
                      className={`text-[10px] uppercase tracking-[0.3em] ${
                        lead.urgency === "active"
                          ? "text-noir-amber"
                          : lead.urgency === "solved"
                            ? "text-[#3affa6]"
                            : "text-noir-fog"
                      }`}
                    >
                      {lead.urgency}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-noir-fog">{lead.body}</p>
                </div>
              ))}
            </div>
          )}

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
                    <span className={emotionColorClass(card.emotionalState)}>
                      <span aria-hidden className="mr-1">{emotionGlyph(card.emotionalState)}</span>
                      {card.emotionalState}
                    </span>{" "}
                    · {card.durationSeconds.toFixed(1)}s
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      startNpcAudio(card.npcId, card.sourceMomentId, { spatial: false })
                    }
                    className="pointer-events-auto relative z-10 mt-3 block w-full rounded border border-noir-paper/20 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-noir-paper hover:bg-noir-paper hover:text-black"
                  >
                    Replay sample
                  </button>
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
              <p className="text-[11px] italic text-noir-fog">
                Times are approximate — your informants are guessing within a
                couple of minutes.
              </p>
              {(Object.keys(NPC_SCHEDULES) as NpcId[]).map((id) => (
                <div key={id}>
                  <h3 className="font-serif text-lg">{NPC_PROFILES[id].displayName}</h3>
                  <ul className="mt-1 space-y-1 text-xs text-noir-fog">
                    {NPC_SCHEDULES[id]
                      .filter((m) => m.branch === "default")
                      .map((m) => (
                        <li key={m.id} className="flex justify-between">
                          <span>≈ {clockLabel(m.startSeconds)}</span>
                          <span>
                            {m.location} ·{" "}
                            <span className={emotionColorClass(m.emotion)}>
                              <span aria-hidden className="mr-1">{emotionGlyph(m.emotion)}</span>
                              {m.emotion}
                            </span>
                            {m.recordable ? " · voice window" : ""}
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
