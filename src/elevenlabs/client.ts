import "server-only";

export const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io";

export function isMockMode(): boolean {
  if (process.env.VT_MOCK_AI === "1") return true;
  if (!process.env.ELEVENLABS_API_KEY) return true;
  return false;
}

function apiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY missing — cannot make real API calls. Set VT_MOCK_AI=1 to use mocks.");
  return key;
}

export async function elevenFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (isMockMode()) {
    throw new Error(`elevenFetch called in mock mode for ${path} — caller should branch on isMockMode()`);
  }
  const headers = new Headers(init.headers);
  headers.set("xi-api-key", apiKey());
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const res = await fetch(`${ELEVENLABS_BASE_URL}${path}`, { ...init, headers });
  return res;
}

export async function elevenJSON<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await elevenFetch(path, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${path} ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export function makeSilentMp3(durationMs: number): Buffer {
  const seconds = Math.max(0.05, Math.min(60, durationMs / 1000));
  const frames = Math.ceil(seconds * 38);
  const frame = Buffer.from([
    0xff, 0xfb, 0x10, 0xc4,
    ...new Array(28).fill(0x00),
  ]);
  const out = Buffer.alloc(frame.length * frames);
  for (let i = 0; i < frames; i++) frame.copy(out, i * frame.length);
  return out;
}
