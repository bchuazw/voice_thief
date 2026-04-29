#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";

import bankManager from "../src/config/scripts/bankManager.json" with { type: "json" };
import secretary from "../src/config/scripts/secretary.json" with { type: "json" };
import bankGuard from "../src/config/scripts/bankGuard.json" with { type: "json" };
import wife from "../src/config/scripts/wife.json" with { type: "json" };
import { DEFAULT_NPC_VOICE_IDS } from "../src/config/voices";
import type { NpcId } from "../src/game/types";

interface ScriptLine {
  text: string;
  pause: number;
}
interface ScriptMoment {
  id: string;
  emotion: "calm" | "stressed" | "panicked";
  lines: ScriptLine[];
}
interface ScriptFile {
  npc: string;
  moments: ScriptMoment[];
}

const SCRIPTS: ScriptFile[] = [
  bankManager as ScriptFile,
  secretary as ScriptFile,
  bankGuard as ScriptFile,
  wife as ScriptFile,
];

const VOICE_ENV: Record<string, string> = {
  bankManager: "ELEVENLABS_VOICE_ID_BANK_MANAGER",
  secretary: "ELEVENLABS_VOICE_ID_SECRETARY",
  bankGuard: "ELEVENLABS_VOICE_ID_BANK_GUARD",
  wife: "ELEVENLABS_VOICE_ID_WIFE",
};

const OUT_DIR = path.join(process.cwd(), "public", "audio", "npc-scripts");
const MOCK = process.env.VT_MOCK_AI === "1" || !process.env.ELEVENLABS_API_KEY;
const MODEL_ID = process.env.ELEVENLABS_TTS_MODEL || "eleven_multilingual_v2";

function silentMp3(durationMs: number): Buffer {
  const seconds = Math.max(0.05, Math.min(60, durationMs / 1000));
  const frames = Math.ceil(seconds * 38);
  const frame = Buffer.from([0xff, 0xfb, 0x10, 0xc4, ...new Array(28).fill(0x00)]);
  const out = Buffer.alloc(frame.length * frames);
  for (let i = 0; i < frames; i++) frame.copy(out, i * frame.length);
  return out;
}

async function renderMoment(npc: string, moment: ScriptMoment): Promise<Buffer> {
  const npcId = npc as NpcId;
  const voiceId = process.env[VOICE_ENV[npc]] || DEFAULT_NPC_VOICE_IDS[npcId];
  const text = moment.lines.map((l) => l.text).join(" ... ");
  const totalPause = moment.lines.reduce((acc, l) => acc + l.pause, 0);
  const ms = Math.max(2000, text.length * 70 + totalPause * 1000);

  if (MOCK || !voiceId) return silentMp3(ms);

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability:
            moment.emotion === "panicked" ? 0.32 : moment.emotion === "stressed" ? 0.45 : 0.58,
          similarity_boost: 0.82,
          style:
            moment.emotion === "panicked" ? 0.82 : moment.emotion === "stressed" ? 0.58 : 0.38,
          use_speaker_boost: true,
        },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`render failed (${moment.id}): ${res.status} ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main(): Promise<void> {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`Rendering NPC scripts to ${OUT_DIR} (mock=${MOCK}, model=${MODEL_ID})`);
  for (const file of SCRIPTS) {
    for (const moment of file.moments) {
      const out = path.join(OUT_DIR, `${moment.id}.mp3`);
      const buf = await renderMoment(file.npc, moment);
      await fs.writeFile(out, buf);
      console.log(`  ok ${moment.id}  (${(buf.length / 1024).toFixed(1)} kB)`);
    }
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
