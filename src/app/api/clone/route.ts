import { NextRequest } from "next/server";
import { cloneVoiceFromBlob } from "@/elevenlabs/ivc";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

const cloneCounters = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_PER_MIN = 12;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = cloneCounters.get(ip);
  if (!entry || entry.resetAt < now) {
    cloneCounters.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_PER_MIN) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest): Promise<Response> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!rateLimit(ip)) {
    return new Response("Slow down — rate limit exceeded.", { status: 429 });
  }

  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("multipart/form-data")) {
    return new Response("multipart/form-data required", { status: 415 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("Bad multipart payload", { status: 400 });
  }

  const audio = form.get("audio");
  const npcId = form.get("npcId");
  const sourceMomentId = form.get("sourceMomentId");
  const emotion = form.get("emotion");

  if (!(audio instanceof File) || typeof npcId !== "string") {
    return new Response("audio (File) and npcId (string) required", { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return new Response("audio too large", { status: 413 });
  }

  try {
    const result = await cloneVoiceFromBlob(npcId, audio, audio.name || "sample.webm");
    return Response.json({
      voiceId: result.voiceId,
      mock: result.mock,
      npcId,
      sourceMomentId: typeof sourceMomentId === "string" ? sourceMomentId : null,
      emotion: typeof emotion === "string" ? emotion : "calm",
    });
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }
}
