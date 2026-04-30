# Handover — Voice Thief

This document is a runway for the next agent picking up Voice Thief. It covers
what landed, what's left, and — for each remaining gap — what's actually
needed to apply it (preconditions, file seams, scope, risks).

If you're inheriting this, read **CLAUDE.md** first (hard rules for the
project, especially mock-mode and key handling), then this file.

## Where things stand

- **Branch:** `claude/voice-thief-game-hhUcJ`
- **Latest gameplay pass:** production polish added save/continue, pause
  settings, pointer-lock-safe modals, bank collision gates, less hand-holding
  in auth, phone UI hardening, slow-time phone/auth pressure, inspectable
  world clues, and Node 20 release pinning.
- **E2E:** `node vt-e2e.cjs` → 79/79 passing in mock mode
  (`VT_MOCK_AI=1 npm run start`)
- **Tooling clean:** `npm run typecheck`, `npm run lint`, `npm run build`
  all pass

The vertical slice plays end-to-end in mock mode: title → intro → 15-min
heist loop → win or lose → restart. Four NPCs, four solution paths
(Two-Voice Lift / Lost Ledger / Family Emergency / Beat-Cop Bluff /
Counter Clearance — these can stack), achievement chips, schedule jitter
per run, recording awareness, phone-overhear penalty, escalating auth
heat, multi-turn doubt accumulator with in-character vocabulary checks.

## What two rounds of playtests said

Round 1 (cold-read):
- Narrative critic: $10. "Seed of something real, not a tech demo."
- Immersive-sim purist: torch on r/imsims. Phone bluff is regex bingo.
- Hackathon judge: top-5 IF the bluff feels alive, top-20 if keyword-gated.
- Twitch streamer: replay twice; mic is decorative.

Round 2 (after the doubt accumulator + narrative trims landed):
- Narrative critic: **$10 → $15, wishlisting**. "It leaves the way trains
  leave when nobody is watching" earned the upgrade.
- Imsim purist: torch → **r/imsims with-caveats**. "The phone seam is no
  longer a lie." Replay 2 → 3-5 runs.

Convergent unsolved gaps after round 2:

1. **Content variety** — one job, one bank, one night. Replay caps at
   3-5 runs because the player has seen every branch enum.
2. **Real audio** — game runs in `VT_MOCK_AI=1` with silent placeholder
   MP3s and scripted reply text. The ElevenLabs hook is the whole pitch
   to the hackathon judges; without keys it's a deterministic dialogue
   tree wearing a TTS sticker.
3. **Mic-driven bluff** — the streamer's 10× change. The player still
   types into a textarea instead of speaking into a mic and hearing
   their own words come out in a stolen voice.
4. ~~**bankGuardReply** has no character-coherence layer.~~ Fixed in the
   caller-aware guard-desk pass: Harold can check the lobby, Margaret gets a
   wrong-line response, and casual off-post orders now raise heat.

## Recommendations, sequenced

I'd ship in this order. Each phase is independently shippable; you don't
have to commit to all of it.

### Phase A — Real audio (highest leverage, lowest design risk)

This is the gap most worth closing first. The architecture already
supports it; it just needs keys + a few TODOs cleared.

**What you need:**

- An ElevenLabs paid plan (Creator $22/mo or Starter $5/mo for testing).
  Free tier won't survive: IVC clones expire at 24h, and the per-month
  character cap is too small for prerendered NPC scripts + live
  conversation TTS.
- API key in `.env.local`:
  ```
  VT_MOCK_AI=0
  ELEVENLABS_API_KEY=sk_...
  ELEVENLABS_TTS_MODEL=eleven_multilingual_v2
  ```
- Optional pinned voice IDs for the four NPCs (otherwise the premade cast
  in `src/config/voices.ts` is used). Pinning is recommended for
  consistency between runs.

**Where it slots in:**

- `src/elevenlabs/client.ts` — the `isMockMode()` short-circuit. Already
  handles the toggle; nothing to change here.
- `src/elevenlabs/tts.ts` — verify the live path works end-to-end with a
  real key. The `eleven_v3` branch is currently used only for vault-auth
  playback; everything else uses `eleven_flash_v2_5` for live dialogue
  per **CLAUDE.md** hard rules.
- `scripts/render-npc-scripts.ts` — pre-renders all NPC dialogue into
  `public/audio/npc-scripts/*.mp3` at build time. Run with real keys and
  commit the resulting MP3s (or generate at deploy). This is the path
  that makes the world feel populated; mock mode currently emits silent
  stubs of the right durations.
- `src/elevenlabs/conversation.ts` — currently always falls through to
  `mockNpcReply` (line 29). With keys, gate this on `isMockMode()` and
  add the actual ConvAI agent call. **CLAUDE.md** notes that ConvAI
  agents are intentionally optional and the deterministic phone rules
  are the puzzle layer — keep them as a fallback if ConvAI returns junk.
- `/api/bootstrap` — programmatically creates the four ConvAI agents.
  Already idempotent (keyed on stable names). Verify on first boot with
  real keys.

**Scope:** ~1 day with keys in hand. Most of the work is verification —
the scaffolding is already there.

**Risks:**
- ElevenLabs IVC clone quality varies. The hackathon spec calls this out
  in §15. Test the cigarette-break recording (manager calm at 6:15) →
  vault auth path first, since it's the canonical solution.
- ConvAI latency. Live calls might take 1-3s. The phone UI shows a
  "Dialing..." state but you may want to add a typing-indicator while
  waiting, otherwise it feels frozen.
- Cost. Live phone calls + per-replay NPC ambient voice can chew through
  the character budget faster than you'd expect. The pre-rendered
  scripts are a one-time cost; live calls scale with playtime.

### Phase B — Mic-driven push-to-talk (the streamer's 10× change)

This is the change that takes the game from "novel mechanic" to
"watchable on stream." Player whispers "Maggie, lock the door" → the
target hears Margaret's voice say it. The cloning loop becomes
performative.

**What you need:**

- Same ElevenLabs key as Phase A.
- ElevenLabs Voice Conversion API (the speech-to-speech endpoint, not
  TTS). Available on the same paid plans.
- A push-to-talk capture in the phone UI. The recording infrastructure
  already exists (`src/game/recordingManager.ts` does NPC-voice capture
  with hold-E); the new path is structurally similar but writes to a
  different endpoint.

**Where it slots in:**

- New endpoint `src/app/api/voice-convert/route.ts`. Mirror
  `/api/clone`'s shape: accept multipart form data (audio blob + target
  voice ID), POST to ElevenLabs voice-conversion, return base64 MP3.
- New module `src/elevenlabs/voiceConvert.ts` (mock-mode aware).
- `src/components/game/PhoneUI.tsx` — replace the textarea with a
  push-to-talk button (or keep both, with a toggle). On release, send
  the captured blob to `/api/voice-convert` with the selected voice
  card's ID. Play back the converted audio AND run the same
  `analyzeTurnDoubt` + `resolvePhoneRule` pipeline on a transcript
  (you'll need ASR — see below).
- ASR: ElevenLabs has a Speech-to-Text endpoint, or you can use the Web
  Speech API (browser-side, free, but uneven). The transcript drives
  the puzzle; the voice-converted audio drives the streaming moment.

**Scope:** ~2-3 days. The architectural pieces are clean; the
integration friction is real (mic permissions, ASR latency, fallback
when conversion fails).

**Risks:**
- Mic permission UX. Players will deny the mic on first prompt. Need a
  graceful fallback to the textarea.
- The existing intro literally says "you don't speak, since the war."
  Reframe: the player whispers into the receiver, the device synthesizes
  the voice. Update one beat in `src/components/game/IntroCinematic.tsx`
  and one notebook lead in `src/game/leads.ts`.
- Latency. STT + voice conversion + TTS roundtrip can hit 4-6s. Pre-warm
  with a "...hello?" stub or design the UX to live with the wait.

### Phase C — Second job (the content tail)

The single biggest replay-extension lever. Both round-1 and round-2
playtesters capped replay value at 2-5 runs because they'd seen every
branch enum on the bank job. A second job — same systems, different
target — proves the formula generalises.

**What you need:**

- Game design first, code later. Pick a target whose voice-locked thing
  is meaningfully different from a bank vault. Candidates:
  - **A smuggling boat** at the harbor. Captain's voice unlocks the
    manifest. Different schedule (boat leaves on a tide, not a clock).
    NPCs: harbormaster, dock foreman, captain, customs officer.
  - **A radio station** broadcasting a coded number. Producer's voice
    unlocks the mic, which broadcasts the code to a confederate. Time
    pressure is the live broadcast slot.
  - **A judge's house safe**. Wife schedules her bridge club; judge
    works late; bailiff has a key but is bribable. Court records as the
    target.
- A second `runMode` enum on the store (`"bankHeist"` vs `"newJobName"`)
  to gate scene loading and schedule selection.
- Reuse:
  - The doubt accumulator (`src/game/phoneRules.ts`).
  - The recording awareness loop (`src/game/tick.ts`).
  - The auth-dialog escalation system (`src/components/game/VoiceAuthDialog.tsx`).
  - The Blender asset pipeline (`scripts/blender/noir_kit.py`) — extend
    with the new prop kit for the new scene.
- Net new:
  - One new scene (or 1-2 scenes if your target has both an exterior
    and interior).
  - A new `NPC_SCHEDULES` block.
  - A new `AUTH_REQUIREMENTS` for the new voice-locked thing.
  - A new dialogue script JSON per NPC.
  - Updated `winLose.ts` for the new escape condition.

**Where it slots in:**

- `src/game/types.ts` — add `runMode: "bankHeist" | "newJob"` to GameState
  and a per-job state slice.
- `src/game/npcSchedules.ts` — split into `bankHeistSchedule.ts` and
  `newJobSchedule.ts`, gated on `runMode`.
- `src/components/scenes/` — new scene file(s). The Blender kit gives
  you a head start on prop authoring.
- `src/components/game/TitleScreen.tsx` — job-selection UI (start with
  the bank job, unlock the second after a first win).
- `src/game/solutionValidator.ts` — extend `AUTH_REQUIREMENTS` to be
  a record keyed on `runMode`.

**Scope:** ~5-7 days for one new job done well. The systems carry over;
the content (writing, schedule design, scene authoring) is what eats
the time. **Do not start coding until the job is designed on paper** —
specifically, until you've written the four solution paths and the
plant-the-clue moment that teaches the puzzle.

**Risks:**
- The bank job is tightly designed because the team iterated on it; the
  second job will feel thin unless it gets the same attention. Better
  to ship one excellent second job than three mediocre ones.
- Don't break the bank job. Add a regression e2e covering the existing
  win path before refactoring `npcSchedules.ts`.

### Phase D — Tighten bankGuardReply (done)

Smallest of the four. This has landed: `bankGuardReply` is now
caller-aware, with Harold/Margaret/Lillian branches and API regression
coverage. Keep expanding this only if you add new Cole-facing routes.

**Changed files:** `src/game/phoneRules.ts`, `vt-e2e.cjs`,
`docs/E2E_REPORT.md`, `README.md`.

### Phase E — Save/load + settings menu (done)

This has landed as a lightweight local autosave/continue path plus pause
volume/view settings. The save format starts at version 1 and deliberately
does not persist live modal/call/auth/recording state.

**What landed:**

- `src/game/saveGame.ts` handles versioned local storage.
- `src/components/game/TitleScreen.tsx` exposes Continue / New Run.
- `src/components/game/PauseMenu.tsx` exposes volume, mute, view mode, and
  Save + Title.

**Remaining small follow-ups:**

- Add multiple manual save slots only if play sessions become longer.
- Add reduced-motion and mouse-sensitivity settings when controller/Steam Deck
  work begins.

## What I would NOT do

In rough order of "tempting but wrong":

- **Add procedural NPCs / a sandbox mode.** Voice Thief works because
  every NPC is hand-authored. A procedural cast would dilute the writing.
- **Replace the doubt accumulator with a full LLM bluff layer.** The
  determinism is what makes the game testable and consistent. The LLM
  layer should be additive (richer NPC small-talk between turns) not a
  replacement for the doubt + vocab system.
- **Add combat / chase sequences / an actual fail-state mini-game.** The
  threat in this game is social, not physical. Adding a "guard chase"
  cheapens the bluff.
- **Move to Unity / Unreal.** The R3F + Next.js stack is fine. The art
  pipeline (Blender → GLB → R3F) already exists. A migration would burn
  a month.

## Quick reference

**Dev loop:**
```bash
VT_MOCK_AI=1 npm run dev          # mock mode, no keys needed
VT_MOCK_AI=0 npm run dev          # real APIs, requires .env.local
npm run typecheck && npm run lint
npm run build && VT_MOCK_AI=1 npm run start
node vt-e2e.cjs                   # 79 assertions, full gameplay loop
```

**Asset bake (if you have Blender 4.5 LTS locally):**
```bash
npm run verify-blender
npm run generate-assets           # writes to public/models/noir-kit/
```

**Pre-render NPC dialogue (real keys, once):**
```bash
npm run render-scripts            # writes public/audio/npc-scripts/*.mp3
```

**Critical files to know:**

- `src/game/store.ts` — Zustand single source of truth.
- `src/game/phoneRules.ts` — doubt accumulator + per-caller vocabulary
  + reply branches. The system the testers cared about most.
- `src/game/npcSchedules.ts` — NPC moments + jitter. Adding a second
  job means splitting this.
- `src/game/solutionValidator.ts` — vault auth requirements. Extends
  for new voice-locked devices.
- `src/components/game/PhoneUI.tsx` — call placement, doubt UI, overhear
  warning. Where mic push-to-talk lands in Phase B.
- `vt-e2e.cjs` — 11 phases, 69 assertions. Add a phase per major change.

## One last note

This game's strength is its specificity — the 6:15 cigarette break, the
"Harold/twenty years" pet-name trap, the Lillian records desk, "I just
keep the porch light on." Whatever you add, add it with that
specificity. Generic noir is everywhere; this kind of noir is rare.
