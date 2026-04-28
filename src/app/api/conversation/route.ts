import { NextRequest } from "next/server";
import { runConversationTurn } from "@/elevenlabs/conversation";
import { ensureAgents } from "@/elevenlabs/agents";
import { synthesizeTts } from "@/elevenlabs/tts";
import { isMockMode } from "@/elevenlabs/client";
import { npcVoiceId } from "@/config/voices";
import type { NpcId } from "@/game/types";

export const runtime = "nodejs";

interface Body {
  npcId?: NpcId;
  callerVoiceId?: string;
  callerVoiceNpcId?: NpcId | null;
  callerText?: string;
  history?: { role: "caller" | "npc"; text: string }[];
  inGameTime?: number;
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { npcId, callerVoiceId, callerText } = body;
  if (!npcId || !callerVoiceId || !callerText) {
    return new Response("npcId, callerVoiceId, callerText required", { status: 400 });
  }

  const agents = await ensureAgents();
  const agentId = agents[npcId];
  if (!agentId) return new Response(`No agent for ${npcId}`, { status: 500 });

  const turn = await runConversationTurn({
    npcId,
    agentId,
    callerVoiceId,
    callerVoiceNpcId: body.callerVoiceNpcId ?? null,
    callerText,
    history: body.history ?? [],
    inGameTime: body.inGameTime ?? 0,
  });

  let callerAudio: string | null = null;
  let npcAudio: string | null = null;

  try {
    const callerBuf = await synthesizeTts({
      text: callerText,
      voiceId: callerVoiceId,
      emotion: "calm",
    });
    callerAudio = `data:audio/mpeg;base64,${Buffer.from(callerBuf).toString("base64")}`;
  } catch {}

  const npcVoice = npcVoiceId(npcId);
  if (!isMockMode() && npcVoice) {
    try {
      const buf = await synthesizeTts({
        text: turn.npcText,
        voiceId: npcVoice,
        emotion: "calm",
      });
      npcAudio = `data:audio/mpeg;base64,${Buffer.from(buf).toString("base64")}`;
    } catch {}
  } else {
    try {
      const buf = await synthesizeTts({
        text: turn.npcText,
        voiceId: `mock_${npcId}`,
        emotion: "calm",
      });
      npcAudio = `data:audio/mpeg;base64,${Buffer.from(buf).toString("base64")}`;
    } catch {}
  }

  return Response.json({
    npcText: turn.npcText,
    raisedSuspicion: turn.raisedSuspicion,
    hangUp: turn.hangUp,
    mock: turn.mock,
    callerAudio,
    npcAudio,
  });
}
