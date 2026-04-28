import { NextRequest } from "next/server";
import { synthesizeTts } from "@/elevenlabs/tts";
import { scoreStressFromSourceTag } from "@/elevenlabs/audioFeatures";
import { AUTH_REQUIREMENTS } from "@/game/solutionValidator";
import type { AuthAttempt, Emotion, NpcId } from "@/game/types";

export const runtime = "nodejs";

interface Body {
  device?: AuthAttempt["device"];
  voiceCard?: {
    elevenLabsVoiceId: string;
    npcId: NpcId;
    emotionalState: Emotion;
  };
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const { device, voiceCard } = body;
  if (!device || !voiceCard) {
    return new Response("device and voiceCard required", { status: 400 });
  }
  const requirement = AUTH_REQUIREMENTS[device];
  if (!requirement) return new Response("Unknown device", { status: 400 });

  const stress = scoreStressFromSourceTag(voiceCard.emotionalState);
  const npcMatches = voiceCard.npcId === requirement.expectedNpc;
  const passes = npcMatches && stress.passes;

  let audio: string | null = null;
  try {
    const buf = await synthesizeTts({
      text: requirement.phrase,
      voiceId: voiceCard.elevenLabsVoiceId,
      emotion: voiceCard.emotionalState,
      highQuality: device === "vault",
    });
    audio = `data:audio/mpeg;base64,${Buffer.from(buf).toString("base64")}`;
  } catch {}

  let reason: string;
  if (!npcMatches) reason = `Voice mismatch — expected ${requirement.expectedNpc}.`;
  else if (!stress.passes) reason = `Voice too ${voiceCard.emotionalState} — try a calmer recording.`;
  else reason = "Voiceprint accepted.";

  return Response.json({
    passes,
    reason,
    stressScore: stress.score,
    phrase: requirement.phrase,
    audio,
  });
}
