"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { NPC_PROFILES } from "@/config/voices";
import { AUTH_REQUIREMENTS, validateVaultOpening } from "@/game/solutionValidator";
import { emotionGlyph } from "@/game/emotionDisplay";
import { playAudio } from "@/audio/play";
import { speakStolenText } from "@/audio/npcSpeech";
import type { AuthAttempt } from "@/game/types";

const DEVICE_LABELS: Record<AuthAttempt["device"], string> = {
  bankFront: "Bank front door",
  bankHallway: "Hallway intercom",
  vault: "Vault intercom",
};

export default function VoiceAuthDialog() {
  const auth = useGame((s) => s.activeAuth)!;
  const inventory = useGame((s) => s.voiceInventory);
  const setActiveAuth = useGame((s) => s.setActiveAuth);
  const raiseSuspicion = useGame((s) => s.raiseSuspicion);
  const openVault = useGame((s) => s.openVault);
  const openBankFront = useGame((s) => s.openBankFront);
  const openHallway = useGame((s) => s.openHallway);
  const failedAuthCount = useGame((s) => s.failedAuthCount);
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<{ passes: boolean; reason: string } | null>(null);
  const requirement = AUTH_REQUIREMENTS[auth.device];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveAuth(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setActiveAuth]);

  async function tryAuth(cardId: string) {
    const card = inventory.find((c) => c.id === cardId);
    if (!card) return;
    setBusy(true);
    setVerdict(null);
    try {
      const res = await fetch("/api/auth-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device: auth.device,
          voiceCard: {
            elevenLabsVoiceId: card.elevenLabsVoiceId,
            npcId: card.npcId,
            emotionalState: card.emotionalState,
          },
        }),
      });
      const data = (await res.json()) as {
        passes: boolean;
        reason: string;
        phrase: string;
        audio: string | null;
      };
      if (card.mock || card.elevenLabsVoiceId.startsWith("mock_voice_") || !data.audio) {
        speakStolenText(card.npcId, data.phrase ?? requirement.phrase, card.emotionalState);
      } else {
        playAudio(data.audio);
      }
      let passes = data.passes;
      let reason = data.reason;
      if (passes && auth.device === "vault") {
        const localVerdict = validateVaultOpening(useGame.getState(), card);
        passes = localVerdict.passes;
        reason = localVerdict.reason;
      }
      setVerdict({ passes, reason });
      if (passes) {
        setTimeout(() => {
          if (auth.device === "vault") openVault();
          if (auth.device === "bankFront") openBankFront(true);
          if (auth.device === "bankHallway") openHallway(true);
          setActiveAuth(null);
        }, 700);
      } else {
        // Escalating heat: each failure costs more than the last. The first
        // failure is 15 (kinder than before — gives the player one safe gamble),
        // every subsequent failure adds 5 heat up to a 40 cap. Brute-forcing
        // with every card in the notebook is now a losing strategy.
        const priorFails = useGame.getState().failedAuthCount;
        const cost = Math.min(15 + 5 * priorFails, 40);
        const reasonText =
          priorFails === 0
            ? "failed voice auth"
            : `failed voice auth — system on edge (×${priorFails + 1})`;
        raiseSuspicion(cost, reasonText);
        useGame.setState((s) => ({ failedAuthCount: s.failedAuthCount + 1 }));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 px-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div className="w-[min(560px,92vw)] rounded border border-noir-paper/30 bg-noir-smoke p-6 text-noir-paper shadow-2xl">
        <div className="mb-1 text-[11px] uppercase tracking-[0.4em] text-noir-fog">
          {DEVICE_LABELS[auth.device]}
        </div>
        <h2 id="auth-title" className="font-serif text-2xl italic">Authentication required</h2>
        <p className="mt-2 text-sm text-noir-fog">
          The intercom will play its challenge phrase through whichever recording you choose:{" "}
          <span className="font-serif italic text-noir-paper">
            “{requirement.phrase}”
          </span>
        </p>

        {failedAuthCount > 0 && (
          <p
            className="mt-3 rounded border border-noir-neon/40 bg-noir-neon/5 px-3 py-2 text-xs text-noir-neon"
            role="status"
          >
            The intercom has logged {failedAuthCount} failed attempt
            {failedAuthCount === 1 ? "" : "s"}. The next miss will draw{" "}
            {Math.min(15 + 5 * failedAuthCount, 40)} heat.
          </p>
        )}

        <div className="mt-4 space-y-2">
          {inventory.length === 0 && (
            <p className="italic text-noir-fog">
              No recordings in your notebook.
            </p>
          )}
          {inventory.map((card) => (
            <button
              key={card.id}
              disabled={busy}
              onClick={() => tryAuth(card.id)}
              className="flex w-full items-center justify-between rounded border border-noir-paper/15 bg-black/40 px-3 py-2 text-left hover:bg-noir-ash"
            >
              <span>
                <span className="text-sm">{NPC_PROFILES[card.npcId].displayName}</span>
                <span className="ml-2 text-[11px] uppercase tracking-[0.3em] text-noir-fog">
                  <span aria-hidden className="mr-1">{emotionGlyph(card.emotionalState)}</span>
                  {card.emotionalState} · {card.durationSeconds.toFixed(1)}s
                </span>
              </span>
              <span className="text-[11px] uppercase tracking-[0.3em] text-noir-amber">
                Try
              </span>
            </button>
          ))}
        </div>

        {verdict && (
          <p
            className={`mt-4 text-sm ${
              verdict.passes ? "text-[#3affa6]" : "text-noir-neon"
            }`}
            role="status"
            aria-live="polite"
          >
            <span className="mr-1 font-semibold">
              {verdict.passes ? "✓ Accepted." : "✗ Rejected."}
            </span>
            {verdict.reason}
          </p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={() => setActiveAuth(null)}
            className="text-xs uppercase tracking-[0.3em] text-noir-fog hover:text-noir-paper"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
