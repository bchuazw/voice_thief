"use client";

import { useEffect, useState } from "react";
import { NPC_PROFILES } from "@/config/voices";
import { playAudio } from "@/audio/play";
import { speakStolenText } from "@/audio/npcSpeech";
import { emotionGlyph } from "@/game/emotionDisplay";
import { setBranch } from "@/game/npcSchedules";
import { distance } from "@/game/pathfinding";
import {
  analyzeTurnDoubt,
  resolvePhoneRule,
  type PhoneRuleEffect,
} from "@/game/phoneRules";
import { useGame } from "@/game/store";
import type { NpcId } from "@/game/types";

const HANGUP_DOUBT = 60;
const BRANCH_BLOCK_DOUBT = 30;

const TARGETS: NpcId[] = ["bankManager", "secretary", "bankGuard", "wife"];
const OVERHEAR_RADIUS = 5;

function findOverhearer(targetNpc: NpcId): NpcId | null {
  const s = useGame.getState();
  const playerLoc = s.player.currentLocation;
  const playerPos = s.player.position;
  for (const id of Object.keys(s.npcs) as NpcId[]) {
    if (id === targetNpc) continue;
    const npc = s.npcs[id];
    if (npc.currentLocation !== playerLoc) continue;
    if (distance(npc.location, playerPos) < OVERHEAR_RADIUS) return id;
  }
  return null;
}

function phonePlaceholder(caller: NpcId | null, target: NpcId): string {
  if (!caller) return "Pick a stolen voice, then dial.";
  if (caller === "wife" && target === "bankManager") {
    return "What does Margaret only say when she's actually scared?";
  }
  if (caller === "secretary" && target === "bankManager") {
    return "Lillian sighs that Harold always loses things.";
  }
  if (caller === "bankManager" && target === "secretary") {
    return "Give Lillian a boring records errand. She questions anything dramatic.";
  }
  if (caller === "bankManager" && target === "wife") {
    return "Margaret notices when he sounds rehearsed.";
  }
  if (caller === "bankGuard" && target === "bankManager") {
    return "Cole calls Mr. Vance about the beat. Keep it routine.";
  }
  if (target === "bankGuard") {
    return "Eddie won't leave his post. He'd hang up on himself.";
  }
  return "Speak in their voice. The world will believe what it expects to hear.";
}

export default function PhoneUI() {
  const inventory = useGame((s) => s.voiceInventory);
  const togglePhone = useGame((s) => s.togglePhone);
  const setActiveCall = useGame((s) => s.setActiveCall);
  const activeCall = useGame((s) => s.activeCall);
  const pushCallTurn = useGame((s) => s.pushCallTurn);
  const raiseCallDoubt = useGame((s) => s.raiseCallDoubt);
  const raiseSuspicion = useGame((s) => s.raiseSuspicion);
  const inGameTime = useGame((s) => s.inGameTime);
  // Subscribing to npcs makes the overhear warning live-update if a patrolling
  // NPC walks into earshot while the phone is open.
  const npcs = useGame((s) => s.npcs);
  const playerLoc = useGame((s) => s.player.currentLocation);
  const playerPos = useGame((s) => s.player.position);

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
      doubt: 0,
    };
    if (!activeCall) setActiveCall(newCall);

    // Compute turn doubt against the prior caller turns *before* we push
    // the new turn. priorDoubt is the entry state — branch flips with
    // priorDoubt ≥ 30 are blocked because the NPC was already suspicious
    // when this turn started.
    const priorCallerTurns = newCall.transcript
      .filter((t) => t.role === "caller")
      .map((t) => t.text);
    const turnAnalysis = analyzeTurnDoubt(message, priorCallerTurns, card.npcId);
    const priorDoubt = newCall.doubt;

    pushCallTurn({ role: "caller", text: message });
    raiseCallDoubt(turnAnalysis.doubt);

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

      const rule = resolvePhoneRule({
        targetNpc: target,
        callerNpc: card.npcId,
        text: message,
      });

      // Branch flips ARE blocked when prior doubt was already too high. The
      // NPC text is rewritten to a "you sound off" pushback so the player
      // hears the consequence of fumbling the opener.
      const branchBlocked = priorDoubt >= BRANCH_BLOCK_DOUBT && rule.effect?.branch;
      const newDoubt = useGame.getState().activeCall?.doubt ?? 0;
      const forceHangup = newDoubt >= HANGUP_DOUBT;

      let displayedNpcText = data.npcText;
      let effectiveHangup = data.hangUp;

      if (branchBlocked) {
        displayedNpcText = `Wait — slow down. You sound off. Who exactly is this?`;
        effectiveHangup = false;
      }
      if (forceHangup) {
        displayedNpcText = `That's it. I'm hanging up.`;
        effectiveHangup = true;
      }

      pushCallTurn({ role: "npc", text: displayedNpcText });
      setTimeout(() => {
        if (data.mock || !data.npcAudio) {
          speakStolenText(target, displayedNpcText, "calm");
        } else {
          playAudio(data.npcAudio);
        }
      }, 600);

      if (data.raisedSuspicion > 0 && !branchBlocked) {
        raiseSuspicion(data.raisedSuspicion, `${target} grew suspicious`);
      }

      // High-doubt hangup is a serious heat event — scaled with how badly the
      // bluff was botched. 60-doubt = 12 heat; 100-doubt = 24 heat.
      if (forceHangup) {
        raiseSuspicion(Math.round(newDoubt * 0.2), `${target} smelled the bluff`);
      }

      const overhearer = findOverhearer(target);
      if (overhearer) {
        raiseSuspicion(6, `${NPC_PROFILES[overhearer].displayName} overheard the call`);
      }

      if (!branchBlocked && !forceHangup) {
        applyPhoneEffect(rule.effect);
      }

      if (effectiveHangup) {
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

  function applyPhoneEffect(effect?: PhoneRuleEffect): void {
    if (!effect) return;

    if (effect.branch) {
      setBranch(effect.branch.npcId, effect.branch.branch);
    }
    if (effect.unlockHallway) {
      useGame.getState().openHallway(true);
    }
    if (effect.unlockBackExit) {
      useGame.getState().openBackExit(true);
    }
    const toast = effect.toast;
    if (toast) {
      setTimeout(() => useGame.getState().pushToast(toast), 1800);
    }
  }

  function endCall() {
    setActiveCall(null);
    setMessage("");
  }

  const callerVoiceNpcId = selectedVoiceCard?.npcId ?? null;
  const placeholder = phonePlaceholder(callerVoiceNpcId, target);
  const hasVoices = inventory.length > 0;
  const callDoubt = activeCall?.doubt ?? 0;
  const doubtTone = callDoubt < 30 ? "calm" : callDoubt < 60 ? "wary" : "exposed";
  // Live overhear check — recomputes whenever npcs / player position change.
  const nearbyOverhearer = (() => {
    for (const id of Object.keys(npcs) as NpcId[]) {
      if (id === target) continue;
      const npc = npcs[id];
      if (npc.currentLocation !== playerLoc) continue;
      if (distance(npc.location, playerPos) < OVERHEAR_RADIUS) return id;
    }
    return null;
  })();

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
            <h2 id="phone-title" className="font-serif text-2xl italic">
              The Phone
            </h2>
          </div>
          <button
            onClick={() => {
              endCall();
              togglePhone(false);
            }}
            className="text-xs uppercase tracking-[0.3em] text-noir-fog hover:text-noir-paper"
          >
            Hang up / P
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
                  {NPC_PROFILES[card.npcId].displayName} ({emotionGlyph(card.emotionalState)}{" "}
                  {card.emotionalState})
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

        {/* Tension meter: how doubtful the target sounds. Branch flips fail
            once it crosses 30; the call ends entirely at 60. */}
        {hasVoices && activeCall && (
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.3em] text-noir-fog">
              <span>Tension</span>
              <span
                className={
                  doubtTone === "calm"
                    ? "text-[#3affa6]"
                    : doubtTone === "wary"
                      ? "text-noir-amber"
                      : "text-noir-neon"
                }
              >
                {doubtTone}
              </span>
            </div>
            <div
              className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/50"
              role="progressbar"
              aria-valuenow={Math.round(callDoubt)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Call tension"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  doubtTone === "calm"
                    ? "bg-[#3affa6]"
                    : doubtTone === "wary"
                      ? "bg-noir-amber"
                      : "bg-noir-neon"
                }`}
                style={{ width: `${Math.min(100, callDoubt)}%` }}
              />
            </div>
          </div>
        )}

        {hasVoices && nearbyOverhearer && (
          <div
            className="mt-4 rounded border border-noir-neon/45 bg-noir-neon/5 px-3 py-2 text-xs text-noir-neon"
            role="status"
            aria-live="polite"
          >
            {NPC_PROFILES[nearbyOverhearer].displayName} is within earshot. Placing the call now will draw eyes.
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
            {pending ? "Dialing..." : "Place call"}
          </button>
        </div>

        <div className="mt-4 max-h-56 overflow-y-auto scrollbar-thin rounded bg-black/40 p-3 text-sm">
          {(activeCall?.transcript ?? []).length === 0 && (
            <p className="italic text-noir-fog">No call active.</p>
          )}
          {(activeCall?.transcript ?? []).map((t, i) => (
            <p
              key={i}
              className={`mb-1 ${t.role === "caller" ? "text-noir-paper" : "text-noir-amber"}`}
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
