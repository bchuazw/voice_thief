import type { ConversationTurnRequest, ConversationTurnResult } from "@/elevenlabs/conversation";
import { resolvePhoneRule } from "@/game/phoneRules";

export function mockNpcReply(req: ConversationTurnRequest): ConversationTurnResult {
  const result = resolvePhoneRule({
    targetNpc: req.npcId,
    callerNpc: req.callerVoiceNpcId ?? req.npcId,
    text: req.callerText,
  });

  return {
    npcText: result.npcText,
    raisedSuspicion: result.raisedSuspicion,
    hangUp: result.hangUp,
    mock: true,
  };
}
