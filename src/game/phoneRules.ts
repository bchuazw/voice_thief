import type { NpcId, ScheduleBranch } from "./types";

export interface PhoneRuleEffect {
  branch?: {
    npcId: NpcId;
    branch: ScheduleBranch;
  };
  unlockHallway?: boolean;
  unlockBackExit?: boolean;
  toast?: string;
}

export interface PhoneRuleResult {
  npcText: string;
  raisedSuspicion: number;
  hangUp: boolean;
  effect?: PhoneRuleEffect;
}

export interface PhoneRuleInput {
  targetNpc: NpcId;
  callerNpc: NpcId;
  text: string;
}

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => (pattern.test(text) ? count + 1 : count), 0);
}

function selfCallReply(targetNpc: NpcId): PhoneRuleResult {
  const name =
    targetNpc === "bankManager"
      ? "Vance"
      : targetNpc === "secretary"
        ? "Lillian"
        : targetNpc === "bankGuard"
          ? "Cole"
          : "Margaret";

  return {
    npcText: `${name} speaking. That is my voice. Who is this?`,
    raisedSuspicion: 6,
    hangUp: false,
  };
}

function bankManagerReply(callerNpc: NpcId, text: string): PhoneRuleResult {
  if (/(vault code|the code|7-7-1|combination)/.test(text)) {
    return {
      npcText: "I don't discuss the vault on the phone. Don't ever ask me that again.",
      raisedSuspicion: 30,
      hangUp: true,
    };
  }

  if (callerNpc === "wife") {
    if (/harold/.test(text)) {
      return {
        npcText: "...Harold? You haven't called me Harold in twenty years. Who is this?",
        raisedSuspicion: 25,
        hangUp: true,
      };
    }

    const urgency = countMatches(text, [
      /break.?in/,
      /burgl/,
      /stranger/,
      /scared/,
      /please/,
      /now/,
      /hurry/,
    ]);
    const domestic = countMatches(text, [
      /home/,
      /house/,
      /door/,
      /window/,
      /bedroom/,
      /maggie|margaret/,
    ]);

    if (urgency >= 1 && domestic >= 1 && urgency + domestic >= 3) {
      return {
        npcText: "Maggie, lock the bedroom door. I'm leaving now. Stay on the line.",
        raisedSuspicion: 0,
        hangUp: true,
        effect: {
          branch: { npcId: "bankManager", branch: "rushedHome" },
          toast: "The manager rushes for the door.",
        },
      };
    }

    return {
      npcText: "Maggie? Slow down. Tell me clearly what's happening.",
      raisedSuspicion: 4,
      hangUp: false,
    };
  }

  if (callerNpc === "secretary") {
    const item = countMatches(text, [/ledger/, /papers/, /folder/, /file/]);
    const place = countMatches(text, [/cafe/, /coffee/, /booth/, /counter/]);
    const verb = countMatches(text, [/left/, /forgot/, /grab/, /pick.?up/, /bring/]);

    if (item >= 1 && place >= 1 && verb >= 1) {
      return {
        npcText: "The ledger? Damn it, Lillian. Fine, I'll grab it on the way back.",
        raisedSuspicion: 0,
        hangUp: true,
        effect: {
          branch: { npcId: "bankManager", branch: "atCafe" },
          toast: "The manager grumbles, heads to the cafe.",
        },
      };
    }

    return {
      npcText: "Lillian, be specific. Which file, and where did you leave it?",
      raisedSuspicion: 4,
      hangUp: false,
    };
  }

  if (callerNpc === "bankGuard") {
    const beat = countMatches(text, [/beat/, /patrol/, /quiet/, /clear/, /check.?in/, /round/]);
    if (beat >= 1) {
      return {
        npcText: "Good. Log the alley gate and keep moving, Cole.",
        raisedSuspicion: 0,
        hangUp: true,
        effect: {
          unlockBackExit: true,
          toast: "Eddie's all-clear logs in. The alley gate clicks.",
        },
      };
    }

    return {
      npcText: "Cole? If this is about your round, make it official.",
      raisedSuspicion: 4,
      hangUp: false,
    };
  }

  return {
    npcText: "Vance speaking. Who is this?",
    raisedSuspicion: 5,
    hangUp: false,
  };
}

function secretaryReply(callerNpc: NpcId, text: string): PhoneRuleResult {
  if (/(vault|combination|code)/.test(text)) {
    return {
      npcText: "I don't have access to that. And I wouldn't tell you if I did.",
      raisedSuspicion: 20,
      hangUp: true,
    };
  }

  if (callerNpc === "bankManager") {
    const verb = countMatches(text, [/check/, /go/, /look/, /lock/, /grab/, /fetch/]);
    const place = countMatches(text, [/upstairs/, /attic/, /storage/, /vault/, /office/, /supply/]);
    const polite = countMatches(text, [/lillian/, /please/, /ledger/, /errand/, /key/]);

    if (verb >= 1 && place >= 1 && polite >= 1) {
      return {
        npcText: "Of course, Mr. Vance. I'll go check now.",
        raisedSuspicion: 0,
        hangUp: true,
        effect: {
          branch: { npcId: "secretary", branch: "runningErrand" },
          toast: "Lillian leaves to run the errand. Her records desk is unattended.",
        },
      };
    }

    if (/(lock up|leave|go home)/.test(text)) {
      return {
        npcText: "All right, but you sound off. You sure everything's fine? Okay, locking up.",
        raisedSuspicion: 0,
        hangUp: true,
      };
    }

    return {
      npcText: "Mr. Vance? You'll have to tell me exactly what needs checking.",
      raisedSuspicion: 4,
      hangUp: false,
    };
  }

  if (callerNpc === "wife" && /harry/.test(text)) {
    return {
      npcText: "Mrs. Vance? He's in his office. I'll put you through... oh, the line's busy.",
      raisedSuspicion: 0,
      hangUp: false,
    };
  }

  return {
    npcText: "First City Bank, this is Lillian. How can I help?",
    raisedSuspicion: 0,
    hangUp: false,
  };
}

function bankGuardReply(text: string): PhoneRuleResult {
  if (/(leave|abandon|post|go home)/.test(text)) {
    return {
      npcText: "Not gonna happen, friend. I'll call this in. Have a good one.",
      raisedSuspicion: 10,
      hangUp: true,
    };
  }

  return {
    npcText: "Cole, security. ... Yeah? Mhm. Right. Anything else?",
    raisedSuspicion: 0,
    hangUp: false,
  };
}

function wifeReply(callerNpc: NpcId, text: string): PhoneRuleResult {
  if (callerNpc === "bankManager" && /harold/.test(text)) {
    return {
      npcText: "Harold? You haven't called me from work like this in years. Are you all right?",
      raisedSuspicion: 15,
      hangUp: false,
    };
  }

  if (callerNpc === "bankManager") {
    return {
      npcText: "Harry, you sound off. Working late again? Don't forget to eat.",
      raisedSuspicion: 0,
      hangUp: false,
    };
  }

  return {
    npcText: "Hello? ... Who is this? Margaret Vance. Hello?",
    raisedSuspicion: 0,
    hangUp: false,
  };
}

export function resolvePhoneRule(input: PhoneRuleInput): PhoneRuleResult {
  const text = input.text.toLowerCase();

  if (input.targetNpc === input.callerNpc) {
    return selfCallReply(input.targetNpc);
  }

  if (input.targetNpc === "bankManager") {
    return bankManagerReply(input.callerNpc, text);
  }
  if (input.targetNpc === "secretary") {
    return secretaryReply(input.callerNpc, text);
  }
  if (input.targetNpc === "bankGuard") {
    return bankGuardReply(text);
  }
  return wifeReply(input.callerNpc, text);
}
