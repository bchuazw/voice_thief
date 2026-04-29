"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { NPC_PROFILES } from "@/config/voices";
import bankManagerScripts from "@/config/scripts/bankManager.json";
import secretaryScripts from "@/config/scripts/secretary.json";
import bankGuardScripts from "@/config/scripts/bankGuard.json";
import wifeScripts from "@/config/scripts/wife.json";
import type { NpcId } from "@/game/types";

interface ScriptLine {
  text: string;
  pause: number;
}
interface ScriptMoment {
  id: string;
  emotion: string;
  lines: ScriptLine[];
}
interface ScriptFile {
  npc: NpcId;
  moments: ScriptMoment[];
}

const SCRIPT_BY_MOMENT = new Map<string, { npcId: NpcId; lines: ScriptLine[] }>();
for (const file of [bankManagerScripts, secretaryScripts, bankGuardScripts, wifeScripts] as ScriptFile[]) {
  for (const m of file.moments) {
    SCRIPT_BY_MOMENT.set(m.id, { npcId: file.npc, lines: m.lines });
  }
}

/** Caption track for currently-speaking NPC dialogue. Reads `npc.currentMomentId`,
 *  pages through the script lines respecting their `pause` rhythm, and renders
 *  the active line in an aria-live region near the bottom of the screen.
 *  Critical for hearing-impaired players — the manager's planted vault-code
 *  clue is otherwise audio-only. */
export default function DialogueCaptions() {
  const npcs = useGame((s) => s.npcs);
  const audioMuted = useGame((s) => s.audioMuted);
  const [active, setActive] = useState<{ npcId: NpcId; text: string } | null>(null);

  useEffect(() => {
    // Find the FIRST NPC speaking in the player's current scene.
    const player = useGame.getState().player;
    let speaker: { npcId: NpcId; momentId: string } | null = null;
    for (const id of Object.keys(npcs) as NpcId[]) {
      const npc = npcs[id];
      if (!npc.isSpeaking || !npc.currentMomentId) continue;
      if (npc.currentLocation !== player.currentLocation) continue;
      speaker = { npcId: id, momentId: npc.currentMomentId };
      break;
    }

    if (!speaker) {
      setActive(null);
      return;
    }
    const script = SCRIPT_BY_MOMENT.get(speaker.momentId);
    if (!script || script.lines.length === 0) {
      setActive(null);
      return;
    }

    // Walk through the lines, holding each visible for ~1.5s + pause + (line.length * 50ms)
    let idx = 0;
    let cancelled = false;
    const showLine = () => {
      if (cancelled) return;
      const line = script.lines[idx];
      if (!line) {
        setActive(null);
        return;
      }
      setActive({ npcId: script.npcId, text: line.text });
      const ms = Math.max(1500, line.text.length * 50) + Math.max(150, line.pause * 1000);
      const t = setTimeout(() => {
        idx += 1;
        showLine();
      }, ms);
      return () => clearTimeout(t);
    };
    showLine();
    return () => {
      cancelled = true;
      setActive(null);
    };
  }, [npcs]);

  if (!active) return null;
  const profile = NPC_PROFILES[active.npcId];

  return (
    <div
      className="pointer-events-none absolute bottom-[18%] left-1/2 z-15 max-w-[min(720px,90vw)] -translate-x-1/2 rounded bg-black/75 px-4 py-2 text-center backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <p className="text-[9px] uppercase tracking-[0.4em] text-noir-amber">
        {profile.displayName}
      </p>
      <p className="mt-0.5 font-serif text-base italic text-noir-paper">
        &ldquo;{active.text}&rdquo;
      </p>
      {audioMuted && (
        <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-noir-fog">
          (audio muted)
        </p>
      )}
    </div>
  );
}
