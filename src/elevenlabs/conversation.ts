import "server-only";
import { isMockMode } from "./client";
import { mockNpcReply } from "@/config/mockResponses";
import type { NpcId } from "@/game/types";

export interface ConversationTurnRequest {
  npcId: NpcId;
  agentId: string;
  callerVoiceId: string;
  callerVoiceNpcId: NpcId | null;
  callerText: string;
  history: { role: "caller" | "npc"; text: string }[];
  inGameTime: number;
}

export interface ConversationTurnResult {
  npcText: string;
  raisedSuspicion: number;
  hangUp: boolean;
  mock: boolean;
}

export async function runConversationTurn(
  req: ConversationTurnRequest,
): Promise<ConversationTurnResult> {
  if (isMockMode() || req.agentId.startsWith("mock_agent_")) {
    return mockNpcReply(req);
  }
  return mockNpcReply(req);
}
