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

/**
 * Score how plausible/coherent a single turn sounds. Returns a doubt delta
 * (0-30 typical) plus a tone tag the UI can display ("specific", "weak",
 * "generic", "neutral"). Calls accumulate doubt across turns; ≥60 ends the
 * call, ≥30 (going into a turn) blocks branch-flip side effects so a
 * fumbled opener can't be salvaged by spamming the right keywords later.
 *
 * The vocabulary axis is character-aware: each caller has a list of words
 * they would and wouldn't naturally know. Margaret saying "vault" or
 * "patrol" raises doubt; Cole saying "porch light" raises doubt; the
 * manager has the broadest natural vocabulary. This blocks the regression
 * where high noun-density alone (regardless of in-character coherence)
 * always lowered doubt.
 */
export interface TurnAnalysis {
  doubt: number;
  tone: "specific" | "weak" | "generic" | "neutral" | "out-of-character";
}

const GENERIC_NOUN_HINTS = [
  // pure names — fine for any caller to drop
  /maggie|margaret|harold|harry|lillian|cole|eddie|vance|park/i,
  // numbers / time — universal
  /\b(\d{1,2})(:\d\d)?\b|\b(seven|eight|nine|ten|eleven)\b/i,
];

interface CallerVocab {
  // Words that flow naturally from this caller's life.
  own: RegExp[];
  // Words that would raise an eyebrow on the other end of the line.
  foreign: RegExp[];
}

// Each entry is one *category* — countMatches returns the number of
// categories present in the text, so multiple OOC words from the same
// caller compound into more doubt.
const VOCAB_BY_CALLER: Record<NpcId, CallerVocab> = {
  wife: {
    own: [
      /\b(home|house|bedroom|window|kitchen|porch|dinner|door)\b/i, // domestic
      /\b(maggie|harry|margaret|hendersons|ruthie)\b/i, // family
      /\b(scared|frightened|hurry|please)\b/i, // domestic distress
    ],
    foreign: [
      /\bledger\b/i,
      /\bvault\b/i,
      /\bcombination\b|7-?7-?1/i,
      /\bpatrol\b/i,
      /\balley\b/i,
      /\brecords\b/i,
      /\bteller\b/i,
      /\bbeat\b/i,
    ],
  },
  bankManager: {
    own: [
      /\b(lillian|park|cole|maggie|margaret|harry)\b/i, // people
      /\b(ledger|vault|teller|deposit|records|safe|combination|first city|bank)\b/i, // bank vocab
      /\b(office|upstairs|attic|supply|storage)\b/i, // bank places
    ],
    // The manager is the worldly one — narrow foreign list (only beat-cop slang).
    foreign: [/\b(dock|beat-cop|nightstick)\b/i],
  },
  secretary: {
    own: [
      /\b(lillian|harold|vance|harry)\b/i, // people
      /\b(ledger|file|records|key)\b/i, // records-desk vocab
      /\b(attic|storage|supply|upstairs|cafe|coffee|booth|signing|firm)\b/i, // places + work
    ],
    foreign: [
      /\bpatrol\b/i,
      /\bbeat\b/i,
      /\balley\b/i,
      /\bporch\b/i,
      /\bbedroom\b/i,
      /\bdock\b/i,
      /\bcombination\b|7-?7-?1/i,
    ],
  },
  bankGuard: {
    own: [
      /\b(cole|eddie|vance|harold)\b/i, // people he calls by name
      /\b(patrol|beat|round|alley|gate|lobby|signing|night|dock|station)\b/i, // beat vocab
    ],
    foreign: [
      /\bledger\b/i,
      /\bfile\b/i,
      /\brecords\b/i,
      /\bbedroom\b/i,
      /\bporch\b/i,
      /\b(hendersons|ruthie)\b/i,
    ],
  },
};

const GENERIC_OPENERS = /^(hi|hey|hello|yo|yes|no|ok|okay|wait|um|uh)\b/i;

function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function analyzeTurnDoubt(
  text: string,
  priorTranscript: string[],
  callerNpc?: NpcId,
): TurnAnalysis {
  const words = wordCount(text);

  // Repetition is the single most damning signal — if you say the same line
  // twice, the NPC notices.
  const seenBefore = priorTranscript.some((t) => t.trim().toLowerCase() === text.trim().toLowerCase());
  if (seenBefore && text.trim().length > 0) {
    return { doubt: 25, tone: "weak" };
  }

  // Vocabulary check (character-aware). The foreign-vocabulary penalty
  // overrides keyword-density bonuses — using words your character wouldn't
  // know is the loudest tell of a bluff.
  const vocab = callerNpc ? VOCAB_BY_CALLER[callerNpc] : null;
  const foreignHits = vocab ? countMatches(text, vocab.foreign) : 0;
  if (foreignHits > 0) {
    // Each foreign word is worth +12 doubt. Two such words is enough to
    // push a fresh call past the branch-block threshold by itself.
    return { doubt: 12 * foreignHits, tone: "out-of-character" };
  }

  const ownHits = vocab ? countMatches(text, vocab.own) : 0;
  const genericNouns = countMatches(text, GENERIC_NOUN_HINTS);
  const totalNouns = ownHits + genericNouns;

  // Very short or no nouns → reads as fishing / panicked. 18 is calibrated so
  // a SECOND weak turn pushes cumulative doubt past the 30 branch-block
  // threshold (player can't recover by spamming keywords after a fumble).
  if (words < 4) return { doubt: 18, tone: "weak" };
  if (totalNouns === 0) return { doubt: 16, tone: "weak" };

  // Generic opener with little behind it.
  if (GENERIC_OPENERS.test(text) && totalNouns < 2) return { doubt: 10, tone: "generic" };

  // Specific multi-noun message with reasonable length and IN-CHARACTER
  // vocabulary: rapport-building.
  if (ownHits >= 2 && words >= 8) return { doubt: -3, tone: "specific" };

  // Solid, coherent, on-topic.
  if (totalNouns >= 2 && words >= 6) return { doubt: 2, tone: "neutral" };

  // Default: light doubt for anything else.
  return { doubt: 5, tone: "neutral" };
}
