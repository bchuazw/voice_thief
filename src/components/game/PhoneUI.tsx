"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { NPC_PROFILES } from "@/config/voices";
import { setBranch } from "@/game/npcSchedules";
import type { NpcId } from "@/game/types";

const TARGETS: NpcId[] = ["bankManager", "secretary", "bankGuard", "wife"];

export default function PhoneUI() {
  const inventory = useGame((s) => s.voiceInventory);
  const togglePhone = useGame((s) => s.togglePhone);
  const setActiveCall = useGame((s) => s.setActiveCall);
  const activeCall = useGame((s) => s.activeCall);
  const pushCallTurn = useGame((s) => s.pushCallTurn);
  const raiseSuspicion = useGame((s) => s.raiseSuspicion);
  const inGameTime = useGame((s) => s.inGameTime);

  const [target, setTarget] = useState<NpcId>("bankManager");
  const [voiceCardId, setVoiceCardId] = useState<string>(inventory[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!voiceCardId && inventory[0]) setVoiceCardId(inventory[0].id);
  }, [inventory, voiceCardId]);

  async function placeCall() {
    const card = inventory.find((v) => v.id === voiceCardId);
    if (!card) {
      useGame.getState().pushToast("Pick a voice card first.");
      return;
    }
    if (!message.trim()) return;
    setPending(true);

    const newCall = activeCall ?? {
      targetNpc: target,
      voiceCardId: card.id,
      transcript: [],
      pending: true,
    };
    if (!activeCall) setActiveCall(newCall);

    pushCallTurn({ role: "caller", text: message });

    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcId: target,
          callerVoiceId: card.elevenLabsVoiceId,
          callerVoiceNpcId: card.npcId,
          callerText: message,
          history: newCall.transcript,
          inGameTime,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        npcText: string;
        raisedSuspicion: number;
        hangUp: boolean;
        callerAudio: string | null;
        npcAudio: string | null;
      };

      if (data.callerAudio) playDataUrl(data.callerAudio);
      pushCallTurn({ role: "npc", text: data.npcText });
      if (data.npcAudio) setTimeout(() => playDataUrl(data.npcAudio!), 600);

      if (data.raisedSuspicion > 0) {
        raiseSuspicion(data.raisedSuspicion, `${target} grew suspicious`);
      }

      applyCallEffects(target, card.npcId, message);

      if (data.hangUp) {
        setTimeout(() => {
          useGame.getState().pushToast(`${NPC_PROFILES[target].displayName} hung up.`);
          setActiveCall(null);
          togglePhone(false);
        }, 1800);
      }
    } catch (err) {
      useGame.getState().pushToast(`Call failed: ${(err as Error).message}`);
    } finally {
      setMessage("");
      setPending(false);
    }
  }

  function applyCallEffects(targetNpc: NpcId, callerNpc: NpcId, text: string) {
    const lower = text.toLowerCase();
    if (
      targetNpc === "bankManager" &&
      callerNpc === "wife" &&
      /(break.?in|burgl|stranger|home now|come home|emergency)/.test(lower) &&
      !/harold/.test(lower)
    ) {
      setBranch("bankManager", "rushedHome");
      useGame.getState().openHallway(true);
      useGame.getState().pushToast("The manager rushes for the door.");
    }
    if (
      targetNpc === "bankManager" &&
      callerNpc === "secretary" &&
      /(ledger|cafe|coffee|left it)/.test(lower)
    ) {
      setBranch("bankManager", "atCafe");
      useGame.getState().pushToast("The manager grumbles, heads to the cafe.");
    }
    if (
      targetNpc === "secretary" &&
      callerNpc === "bankManager" &&
      /(ledger|upstairs|check|lock up|errand)/.test(lower)
    ) {
      setBranch("secretary", "runningErrand");
      useGame.getState().openHallway(true);
      useGame.getState().pushToast("Lillian leaves to run the errand.");
    }
  }

  function endCall() {
    setActiveCall(null);
    setMessage("");
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 px-4 pointer-events-auto">
      <div className="w-[min(720px,92vw)] rounded border border-noir-paper/30 bg-noir-smoke p-6 text-noir-paper shadow-2xl">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl italic">The Phone</h2>
          <button
            onClick={() => {
              endCall();
              togglePhone(false);
            }}
            className="text-xs uppercase tracking-[0.3em] text-noir-fog hover:text-noir-paper"
          >
            Hang up · P
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-[11px] uppercase tracking-[0.3em] text-noir-fog">
            Call
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as NpcId)}
              className="mt-1 w-full rounded bg-noir-ash px-3 py-2 text-sm text-noir-paper"
            >
              {TARGETS.map((t) => (
                <option key={t} value={t}>
                  {NPC_PROFILES[t].displayName}
                </option>
              ))}
            </select>
          </label>

          <label className="text-[11px] uppercase tracking-[0.3em] text-noir-fog">
            Speak as
            <select
              value={voiceCardId}
              onChange={(e) => setVoiceCardId(e.target.value)}
              className="mt-1 w-full rounded bg-noir-ash px-3 py-2 text-sm text-noir-paper"
            >
              {inventory.length === 0 && <option value="">— no voices yet —</option>}
              {inventory.map((card) => (
                <option key={card.id} value={card.id}>
                  {NPC_PROFILES[card.npcId].displayName} ({card.emotionalState})
                </option>
              ))}
            </select>
          </label>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What do you want to say…"
          rows={3}
          className="mt-3 w-full resize-none rounded bg-noir-ash px-3 py-2 text-sm text-noir-paper placeholder:text-noir-fog focus:outline-none"
        />

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.3em] text-noir-fog">
            {message.length}/280
          </span>
          <button
            disabled={pending || !message.trim() || !voiceCardId}
            onClick={placeCall}
            className="rounded border border-noir-neon bg-noir-neon/10 px-5 py-2 text-[11px] uppercase tracking-[0.3em] text-noir-neon hover:bg-noir-neon hover:text-black disabled:opacity-40"
          >
            {pending ? "Dialing…" : "Place call"}
          </button>
        </div>

        <div className="mt-4 max-h-56 overflow-y-auto scrollbar-thin rounded bg-black/40 p-3 text-sm">
          {(activeCall?.transcript ?? []).length === 0 && (
            <p className="italic text-noir-fog">No call active.</p>
          )}
          {(activeCall?.transcript ?? []).map((t, i) => (
            <p
              key={i}
              className={`mb-1 ${
                t.role === "caller" ? "text-noir-paper" : "text-noir-amber"
              }`}
            >
              <span className="mr-2 text-[10px] uppercase tracking-[0.3em] text-noir-fog">
                {t.role === "caller" ? "you" : NPC_PROFILES[target].displayName}
              </span>
              {t.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function playDataUrl(url: string) {
  try {
    const audio = new Audio(url);
    audio.volume = 0.85;
    audio.play().catch(() => {});
  } catch {}
}
