import { NextRequest } from "next/server";
import { synthesizeTts, type Emotion } from "@/elevenlabs/tts";

export const runtime = "nodejs";

interface Body {
  text?: string;
  voiceId?: string;
  emotion?: Emotion;
  highQuality?: boolean;
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (!body.text || !body.voiceId) {
    return new Response("text and voiceId required", { status: 400 });
  }
  if (body.text.length > 1500) {
    return new Response("text too long (max 1500 chars)", { status: 413 });
  }

  try {
    const buf = await synthesizeTts({
      text: body.text,
      voiceId: body.voiceId,
      emotion: body.emotion,
      highQuality: body.highQuality,
    });
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }
}
