#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs", "trailer", "voiceover-submission");

async function loadEnvKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  try {
    const env = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    const line = env
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith("ELEVENLABS_API_KEY="));
    return line?.split("=").slice(1).join("=").trim() || "";
  } catch {
    return "";
  }
}

const KEY = await loadEnvKey();
if (!KEY) {
  console.error("ELEVENLABS_API_KEY missing");
  process.exit(1);
}

const NARRATOR_VOICE = "pNInz6obpgDQGcFmaJgB";
const MANAGER_VOICE = "pqHfZKP75CvOlQylNhV4";

const LINES = [
  {
    id: "01-hook",
    voice: NARRATOR_VOICE,
    text: "You are a thief in a city where locks don't matter. Voices do.",
    style: 0.58,
    stability: 0.38,
  },
  {
    id: "02-title",
    voice: NARRATOR_VOICE,
    text: "Voice Thief.",
    style: 0.72,
    stability: 0.32,
  },
  {
    id: "03-shadow",
    voice: NARRATOR_VOICE,
    text: "Shadow the manager. Catch his voice when no one's watching.",
    style: 0.5,
    stability: 0.42,
  },
  {
    id: "04-clone",
    voice: NARRATOR_VOICE,
    text: "Clone it. Place the call. Change the night.",
    style: 0.55,
    stability: 0.38,
  },
  {
    id: "05-manager",
    voice: MANAGER_VOICE,
    text: "Margaret. Head home. There's been a break-in. I'll meet you there.",
    style: 0.6,
    stability: 0.44,
  },
  {
    id: "06-heat",
    voice: NARRATOR_VOICE,
    text: "Every lie raises heat. Every voiceprint can betray you.",
    style: 0.54,
    stability: 0.4,
  },
  {
    id: "07-plan",
    voice: NARRATOR_VOICE,
    text: "Study the schedule. Pick the right voice. Keep your nerve.",
    style: 0.52,
    stability: 0.4,
  },
  {
    id: "08-outro",
    voice: NARRATOR_VOICE,
    text: "One night. Four voices. One clean exit.",
    style: 0.68,
    stability: 0.35,
  },
];

async function tts(line) {
  const body = {
    text: line.text,
    model_id: process.env.ELEVENLABS_TTS_MODEL || "eleven_multilingual_v2",
    voice_settings: {
      stability: line.stability,
      similarity_boost: 0.86,
      style: line.style,
      use_speaker_boost: true,
    },
  };

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${line.voice}`, {
    method: "POST",
    headers: {
      "xi-api-key": KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`TTS ${line.id} failed: ${response.status} ${await response.text()}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

await fs.mkdir(OUT_DIR, { recursive: true });
console.log(`Rendering submission trailer VO -> ${OUT_DIR}`);

for (const line of LINES) {
  process.stdout.write(`  ${line.id}... `);
  const audio = await tts(line);
  await fs.writeFile(path.join(OUT_DIR, `${line.id}.mp3`), audio);
  console.log(`${(audio.length / 1024).toFixed(1)} kB`);
}

console.log("Done.");
