#!/usr/bin/env tsx
/**
 * Standalone live-API smoke test. Run with:
 *   npx tsx scripts/verify-eleven.ts
 *
 * Reads ELEVENLABS_API_KEY and optional ELEVENLABS_VOICE_ID_* values from
 * .env.local. Confirms:
 *  1. Key is valid (200 from /v1/user)
 *  2. Each configured/default cast voice exists (200 from /v1/voices/{id})
 *  3. TTS works for the bank manager voice (writes /tmp/vt-live-smoke.mp3)
 *
 * Does NOT touch IVC or ConvAI. Cheap to run.
 */
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_NPC_VOICE_IDS } from "../src/config/voices";

function loadEnvLocal(): void {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

loadEnvLocal();

const KEY = process.env.ELEVENLABS_API_KEY ?? "";
if (!KEY) {
  console.error("✗ ELEVENLABS_API_KEY not set");
  process.exit(1);
}

const VOICES: Record<string, string | undefined> = {
  bankManager: process.env.ELEVENLABS_VOICE_ID_BANK_MANAGER || DEFAULT_NPC_VOICE_IDS.bankManager,
  secretary: process.env.ELEVENLABS_VOICE_ID_SECRETARY || DEFAULT_NPC_VOICE_IDS.secretary,
  bankGuard: process.env.ELEVENLABS_VOICE_ID_BANK_GUARD || DEFAULT_NPC_VOICE_IDS.bankGuard,
  wife: process.env.ELEVENLABS_VOICE_ID_WIFE || DEFAULT_NPC_VOICE_IDS.wife,
};

async function get(url: string): Promise<Response> {
  return fetch(url, { headers: { "xi-api-key": KEY, Accept: "application/json" } });
}

async function main(): Promise<void> {
  console.log("→ /v1/user");
  const u = await get("https://api.elevenlabs.io/v1/user");
  if (!u.ok) {
    console.error(`✗ key rejected: ${u.status} ${await u.text()}`);
    process.exit(1);
  }
  const subs = (await u.json()) as { subscription?: { tier?: string; character_count?: number; character_limit?: number } };
  console.log(`✓ key OK · tier=${subs.subscription?.tier} · used=${subs.subscription?.character_count}/${subs.subscription?.character_limit}`);

  for (const [npc, id] of Object.entries(VOICES)) {
    const v = await get(`https://api.elevenlabs.io/v1/voices/${id}`);
    if (!v.ok) {
      console.error(`✗ ${npc} (${id}): ${v.status} ${await v.text()}`);
      continue;
    }
    const j = (await v.json()) as { name: string };
    console.log(`✓ ${npc} → ${j.name} (${id})`);
  }

  console.log("→ TTS smoke test (bank manager)");
  const mgrId = VOICES.bankManager;
  if (!mgrId) {
    console.warn("! skipping TTS — no bank manager voice");
    return;
  }
  const t = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${mgrId}`, {
    method: "POST",
    headers: {
      "xi-api-key": KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: "Authorize vault, code 7-7-1.",
      model_id: "eleven_flash_v2_5",
      voice_settings: {
        stability: 0.7,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });
  if (!t.ok) {
    console.error(`✗ TTS failed: ${t.status} ${await t.text()}`);
    return;
  }
  const buf = Buffer.from(await t.arrayBuffer());
  const out = "/tmp/vt-live-smoke.mp3";
  fs.writeFileSync(out, buf);
  console.log(`✓ TTS OK · wrote ${out} (${(buf.length / 1024).toFixed(1)} kB)`);
  console.log("\nAll good. Run `npm run dev` to play live.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
