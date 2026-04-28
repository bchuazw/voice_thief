#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";

import bankManager from "../src/config/scripts/bankManager.json" with { type: "json" };
import secretary from "../src/config/scripts/secretary.json" with { type: "json" };
import bankGuard from "../src/config/scripts/bankGuard.json" with { type: "json" };
import wife from "../src/config/scripts/wife.json" with { type: "json" };

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

function silentMp3(durationMs: number): Buffer {
  const seconds = Math.max(0.05, Math.min(60, durationMs / 1000));
  const frames = Math.ceil(seconds * 38);
  const frame = Buffer.from([0xff, 0xfb, 0x10, 0xc4, ...new Array(28).fill(0x00)]);
  const out = Buffer.alloc(frame.length * frames);
  for (let i = 0; i < frames; i++) frame.copy(out, i * frame.length);
  return out;
}

async function renderMoment(npc: string, moment: ScriptMoment): Promise<Buffer> {
  const voiceId = process.env[VOICE_ENV[npc]];
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
        model_id: "eleven_flash_v2_5",
        voice_settings: {
          stability: moment.emotion === "panicked" ? 0.3 : 0.7,
          similarity_boost: 0.75,
          style: moment.emotion === "panicked" ? 0.8 : 0.3,
          use_speaker_boost: true,
        },
      }),
    },
  );
  if (!res.ok) {
    console.warn(`render fallback (${moment.id}):`, res.status, await res.text());
    return silentMp3(ms);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main(): Promise<void> {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`Rendering NPC scripts to ${OUT_DIR} (mock=${MOCK})`);
  for (const file of SCRIPTS) {
    for (const moment of file.moments) {
      const out = path.join(OUT_DIR, `${moment.id}.mp3`);
      const buf = await renderMoment(file.npc, moment);
      await fs.writeFile(out, buf);
      console.log(`  ✓ ${moment.id}  (${(buf.length / 1024).toFixed(1)} kB)`);
    }
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
