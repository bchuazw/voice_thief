"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { NPC_PROFILES } from "@/config/voices";
import { setBranch } from "@/game/npcSchedules";
import { emotionGlyph } from "@/game/emotionDisplay";
import { playAudio } from "@/audio/play";
import { speakStolenText } from "@/audio/npcSpeech";
import type { NpcId } from "@/game/types";

const TARGETS: NpcId[] = ["bankManager", "secretary", "bankGuard", "wife"];

function phonePlaceholder(caller: NpcId | null, target: NpcId): string {
  if (!caller) return "Pick a stolen voice, then dial.";
  if (caller === "wife" && target === "bankManager")
    return "What does Margaret only say when she's actually scared?";
  if (caller === "secretary" && target === "bankManager")
    return "Lillian sighs that Harold always loses things.";
  if (caller === "bankManager" && target === "secretary")
    return "Lillian only obeys ordinary requests in his voice.";
  if (caller === "bankManager" && target === "wife")
    return "Margaret notices when he sounds rehearsed.";
  if (caller === "bankGuard" && target === "bankManager")
    return "Cole calls Mr. Vance about the beat. Keep it routine.";
  if (target === "bankGuard")
    return "Eddie won't leave his post. He'd hang up on himself.";
  return "Speak in their voice. The world will believe what it expects to hear.";
}

export default function PhoneUI() {
  const inventory = useGame((s) => s.voiceInventory);
  const togglePhone = useGame((s) => s.togglePhone);
  const setActiveCall = useGame((s) => s.setActiveCall);
  const activeCall = useGame((s) => s.activeCall);
  const pushCallTurn = useGame((s) => s.pushCallTurn);
  const raiseSuspicion = useGame((s) => s.raiseSuspicion);
  const inGameTime = useGame((s) => s.inGameTime);

  const [target, setTarget] = useState<NpcId>("bankManager");
  const [voiceCardId, setVoiceCardId] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const storedVoiceCard = inventory.find((card) => card.id === voiceCardId);
  const selectedVoiceCard =
    storedVoiceCard ?? inventory.find((card) => card.npcId !== target) ?? inventory[0] ?? null;
  const selectedVoiceCardId = selectedVoiceCard?.id ?? "";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveCall(null);
        togglePhone(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setActiveCall, togglePhone]);

  async function placeCall() {
    const card = inventory.find((v) => v.id === selectedVoiceCardId);
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
        mock: boolean;
        callerAudio: string | null;
        npcAudio: string | null;
      };

      const callerIsMock = card.mock || card.elevenLabsVoiceId.startsWith("mock_voice_");
      if (callerIsMock || !data.callerAudio) {
        speakStolenText(card.npcId, message, card.emotionalState);
      } else {
        playAudio(data.callerAudio);
      }
      pushCallTurn({ role: "npc", text: data.npcText });
      setTimeout(() => {
        if (data.mock || !data.npcAudio) {
          speakStolenText(target, data.npcText, "calm");
        } else {
          playAudio(data.npcAudio);
        }
      }, 600);

      if (data.raisedSuspicion > 0) {
        raiseSuspicion(data.raisedSuspicion, `${target} grew suspicious`);
      }

      const branchFired = applyCallEffects(target, card.npcId, message);
      // A call that doesn't move anything still costs heat — the line was tied up
      // for nothing and the receiving NPC remembers a strange voice asking for something
      // odd.
      if (!branchFired && data.raisedSuspicion === 0 && card.npcId !== target) {
        raiseSuspicion(4, `awkward call to ${NPC_PROFILES[target].displayName}`);
      }

      if (data.hangUp) {
        setTimeout(() => {
          useGame.getState().pushToast(`${NPC_PROFILES[target].displayName} hung up.`);
          setActiveCall(null);
          togglePhone(false);
        }, 4200);
      }
    } catch (err) {
      useGame.getState().pushToast(`Call failed: ${(err as Error).message}`);
    } finally {
      setMessage("");
      setPending(false);
    }
  }

  // Each branch flip now requires at least 2 of 3 keyword classes (e.g. urgency +
  // domesticity + verb). One word alone is not enough — Harold needs to be sold
  // on the *story* before he abandons his post.
  function applyCallEffects(
    targetNpc: NpcId,
    callerNpc: NpcId,
    text: string,
  ): boolean {
    const lower = text.toLowerCase();
    const pushDelayedToast = (toast: string) => {
      setTimeout(() => useGame.getState().pushToast(toast), 1800);
    };
    const matches = (regexes: RegExp[]): number =>
      regexes.reduce((n, r) => (r.test(lower) ? n + 1 : n), 0);

    // Wife → Manager: break-in / domestic emergency.
    // Needs (urgency word) + (home/break-in word) AND must NOT use "Harold" (Maggie says Harry).
    if (
      targetNpc === "bankManager" &&
      callerNpc === "wife" &&
      !/harold/.test(lower)
    ) {
      const urgency = matches([/break.?in/, /burgl/, /stranger/, /scared/, /please/, /now/, /hurry/]);
      const domestic = matches([/home/, /house/, /door/, /window/, /bedroom/, /maggie|margaret/]);
      if (urgency >= 1 && domestic >= 1 && (urgency + domestic) >= 3) {
        setBranch("bankManager", "rushedHome");
        useGame.getState().openHallway(true);
        pushDelayedToast("The manager rushes for the door.");
        return true;
      }
    }

    // Secretary → Manager: lure to cafe via lost ledger
    if (
      targetNpc === "bankManager" &&
      callerNpc === "secretary"
    ) {
      const item = matches([/ledger/, /papers/, /folder/, /file/]);
      const place = matches([/cafe/, /coffee/, /booth/, /counter/]);
      const verb = matches([/left/, /forgot/, /grab/, /pick.?up/, /bring/]);
      if (item >= 1 && place >= 1 && verb >= 1) {
        setBranch("bankManager", "atCafe");
        pushDelayedToast("The manager grumbles, heads to the cafe.");
        return true;
      }
    }

    // Manager → Secretary: send her on an errand
    if (
      targetNpc === "secretary" &&
      callerNpc === "bankManager"
    ) {
      const verb = matches([/check/, /go/, /look/, /lock/, /grab/, /fetch/]);
      const place = matches([/upstairs/, /attic/, /storage/, /vault/, /office/, /supply/]);
      const polite = matches([/lillian/, /please/, /ledger/, /errand/, /key/]);
      if (verb >= 1 && place >= 1 && polite >= 1) {
        setBranch("secretary", "runningErrand");
        useGame.getState().openHallway(true);
        pushDelayedToast("Lillian leaves to run the errand.");
        return true;
      }
    }

    // Guard → Manager: routine beat-check that confirms Eddie is on patrol.
    // Flag this for the back-exit unlock (handled in store/back-exit logic).
    if (
      targetNpc === "bankManager" &&
      callerNpc === "bankGuard"
    ) {
      const beat = matches([/beat/, /patrol/, /quiet/, /clear/, /check.?in/, /round/]);
      if (beat >= 1) {
        useGame.getState().openBackExit?.(true);
        pushDelayedToast("Eddie's all-clear logs in. The alley gate clicks.");
        return true;
      }
    }
    return false;
  }

  function endCall() {
    setActiveCall(null);
    setMessage("");
  }

  // Pick a placeholder hint based on (caller voice → target) combo.
  const callerVoiceNpcId = selectedVoiceCard?.npcId ?? null;
  const placeholder = phonePlaceholder(callerVoiceNpcId, target);
  const hasVoices = inventory.length > 0;

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 px-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-title"
    >
      <div className="w-[min(720px,94vw)] rounded border border-noir-amber/40 bg-noir-smoke p-4 text-noir-paper shadow-2xl ring-1 ring-noir-amber/10 sm:p-6">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span aria-hidden className="text-noir-amber text-xl">☎</span>
            <h2 id="phone-title" className="font-serif text-2xl italic">The Phone</h2>
          </div>
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-[11px] uppercase tracking-[0.3em] text-noir-fog">
            Call
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as NpcId)}
              className="mt-1 w-full rounded bg-noir-ash px-3 py-2 text-xs text-noir-paper sm:text-sm"
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
              value={selectedVoiceCardId}
              onChange={(e) => setVoiceCardId(e.target.value)}
              className="mt-1 w-full rounded bg-noir-ash px-3 py-2 text-xs text-noir-paper sm:text-sm"
            >
              {!hasVoices && <option value="">-- no voices yet --</option>}
              {inventory.map((card) => (
                <option key={card.id} value={card.id}>
                  {NPC_PROFILES[card.npcId].displayName} ({emotionGlyph(card.emotionalState)} {card.emotionalState})
                </option>
              ))}
            </select>
          </label>
        </div>

        {!hasVoices && (
          <div className="mt-4 rounded border border-noir-amber/30 bg-black/35 px-3 py-3 text-sm text-noir-fog">
            Record someone first. The best leads are in the notebook schedule.
          </div>
        )}

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={hasVoices ? placeholder : "No stolen voices yet."}
          rows={3}
          disabled={!hasVoices}
          className="mt-3 w-full resize-none rounded bg-noir-ash px-3 py-2 text-sm text-noir-paper placeholder:text-noir-fog/70 placeholder:italic focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.3em] text-noir-fog">
            {message.length}/280
          </span>
          <button
            disabled={pending || !message.trim() || !selectedVoiceCardId || !hasVoices}
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

