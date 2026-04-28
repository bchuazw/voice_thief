"use client";

import { useState } from "react";
import { useGame } from "@/game/store";
import { NPC_PROFILES } from "@/config/voices";
import { AUTH_REQUIREMENTS } from "@/game/solutionValidator";
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
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<{ passes: boolean; reason: string } | null>(null);
  const requirement = AUTH_REQUIREMENTS[auth.device];

  const candidates = inventory.filter((c) => c.npcId === requirement.expectedNpc);

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
        audio: string | null;
      };
      if (data.audio) {
        const a = new Audio(data.audio);
        a.volume = 0.9;
        a.play().catch(() => {});
      }
      setVerdict({ passes: data.passes, reason: data.reason });
      if (data.passes) {
        setTimeout(() => {
          if (auth.device === "vault") openVault();
          if (auth.device === "bankFront") openBankFront(true);
          if (auth.device === "bankHallway") openHallway(true);
          setActiveAuth(null);
        }, 1500);
      } else {
        raiseSuspicion(15, "failed voice auth");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 px-4 pointer-events-auto">
      <div className="w-[min(560px,92vw)] rounded border border-noir-paper/30 bg-noir-smoke p-6 text-noir-paper shadow-2xl">
        <div className="mb-1 text-[10px] uppercase tracking-[0.4em] text-noir-fog">
          {DEVICE_LABELS[auth.device]}
        </div>
        <h2 className="font-serif text-2xl italic">Authentication required</h2>
        <p className="mt-2 text-sm text-noir-fog">
          Speak the phrase{" "}
          <span className="font-serif italic text-noir-paper">
            “{requirement.phrase}”
          </span>{" "}
          in the voice of {NPC_PROFILES[requirement.expectedNpc].displayName}.
        </p>

        <div className="mt-4 space-y-2">
          {candidates.length === 0 && (
            <p className="italic text-noir-fog">
              No matching voices in your notebook.
            </p>
          )}
          {candidates.map((card) => (
            <button
              key={card.id}
              disabled={busy}
              onClick={() => tryAuth(card.id)}
              className="flex w-full items-center justify-between rounded border border-noir-paper/15 bg-black/40 px-3 py-2 text-left hover:bg-noir-ash"
            >
              <span>
                <span className="text-sm">{NPC_PROFILES[card.npcId].displayName}</span>
                <span className="ml-2 text-[10px] uppercase tracking-[0.3em] text-noir-fog">
                  {card.emotionalState} · {card.durationSeconds.toFixed(1)}s
                </span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-noir-amber">
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
          >
            {verdict.passes ? "✓ " : "✗ "}
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
