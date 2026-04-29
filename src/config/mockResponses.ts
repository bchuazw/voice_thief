import type { ConversationTurnRequest, ConversationTurnResult } from "@/elevenlabs/conversation";
import type { NpcId } from "@/game/types";

interface ResponseRule {
  match: (req: ConversationTurnRequest) => boolean;
  reply: string;
  effect?: { raisedSuspicion?: number; hangUp?: boolean };
}

function callerIsClonedOf(req: ConversationTurnRequest, expected: NpcId): boolean {
  return req.callerVoiceNpcId === expected;
}

function txt(req: ConversationTurnRequest): string {
  return req.callerText.toLowerCase();
}

const RULES: Record<NpcId, ResponseRule[]> = {
  bankManager: [
    {
      match: (r) => callerIsClonedOf(r, "wife") && /break.?in|burgl|stranger|home now/.test(txt(r)),
      reply: "Maggie, slow down — I'm leaving now. Lock the bedroom door. I'm coming.",
      effect: { raisedSuspicion: 0, hangUp: true },
    },
    {
      match: (r) => callerIsClonedOf(r, "wife") && /harold/.test(txt(r)),
      reply: "...Harold? You haven't called me Harold in twenty years. Who is this?",
      effect: { raisedSuspicion: 25, hangUp: true },
    },
    {
      match: (r) => callerIsClonedOf(r, "secretary") && /(ledger|cafe|coffee|left)/.test(txt(r)),
      reply: "The ledger? Damn it, Lillian. Fine, I'll grab it on the way back.",
      effect: { hangUp: true },
    },
    {
      match: (r) => /(vault code|the code|7-7-1|combination)/.test(txt(r)),
      reply: "I don't discuss the vault on the phone. Don't ever ask me that again.",
      effect: { raisedSuspicion: 30, hangUp: true },
    },
    {
      match: () => true,
      reply: "Vance speaking. Who is this?",
      effect: { raisedSuspicion: 5 },
    },
  ],

  secretary: [
    {
      match: (r) => callerIsClonedOf(r, "bankManager") && /(ledger|upstairs|check|errand)/.test(txt(r)),
      reply: "Of course, Mr. Vance. I'll go check now.",
      effect: { hangUp: true },
    },
    {
      match: (r) => callerIsClonedOf(r, "bankManager") && /(lock up|leave|go home)/.test(txt(r)),
      reply: "All right — but you sound off. You sure everything's fine? ... Okay, locking up.",
      effect: { hangUp: true },
    },
    {
      match: (r) => callerIsClonedOf(r, "wife") && /harry/.test(txt(r)),
      reply: "Mrs. Vance? He's in his office. I'll put you through... oh, the line's busy.",
    },
    {
      match: (r) => /(vault|combination|code)/.test(txt(r)),
      reply: "I don't have access to that. And I wouldn't tell you if I did.",
      effect: { raisedSuspicion: 20, hangUp: true },
    },
    {
      match: () => true,
      reply: "First City Bank, this is Lillian. How can I help?",
    },
  ],

  bankGuard: [
    {
      match: (r) => /(leave|abandon|post|go home)/.test(txt(r)),
      reply: "Not gonna happen, friend. I'll call this in. Have a good one.",
      effect: { raisedSuspicion: 10, hangUp: true },
    },
    {
      match: () => true,
      reply: "Cole, security. ... Yeah? Mhm. Right. Anything else?",
    },
  ],

  wife: [
    {
      match: (r) => callerIsClonedOf(r, "bankManager") && /(harold)/.test(txt(r)),
      reply: "Harold? You haven't called me from work like this in years. Are you all right?",
      effect: { raisedSuspicion: 15 },
    },
    {
      match: (r) => callerIsClonedOf(r, "bankManager"),
      reply: "Harry, you sound off. Working late again? Don't forget to eat.",
    },
    {
      match: () => true,
      reply: "Hello? ... Who is this? Margaret Vance. Hello?",
    },
  ],
};

export function mockNpcReply(req: ConversationTurnRequest): ConversationTurnResult {
  const rules = RULES[req.npcId];
  for (const rule of rules) {
    if (rule.match(req)) {
      return {
        npcText: rule.reply,
        raisedSuspicion: rule.effect?.raisedSuspicion ?? 0,
        hangUp: rule.effect?.hangUp ?? false,
        mock: true,
      };
    }
  }
  return { npcText: "...hello?", raisedSuspicion: 0, hangUp: false, mock: true };
}
