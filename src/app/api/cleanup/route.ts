import { NextRequest } from "next/server";
import { deleteClonedVoice } from "@/elevenlabs/ivc";

export const runtime = "nodejs";

interface Body {
  voiceIds?: string[];
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const ids = body.voiceIds ?? [];
  const results: { voiceId: string; ok: boolean; error?: string }[] = [];
  for (const id of ids) {
    try {
      await deleteClonedVoice(id);
      results.push({ voiceId: id, ok: true });
    } catch (err) {
      results.push({ voiceId: id, ok: false, error: (err as Error).message });
    }
  }
  return Response.json({ deleted: results.filter((r) => r.ok).length, results });
}

export async function GET(): Promise<Response> {
  return Response.json({ ok: true, hint: "POST { voiceIds: [...] } to delete." });
}
