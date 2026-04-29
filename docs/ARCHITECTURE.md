# Voice Thief — Architecture

```
                        Browser (R3F + Zustand)
                                │
         click-to-move ▲        │        ▼ TTS / IVC
                       │        │
                       │   Next.js App Router
                       │        │
                       │   /api/tts ──▶ ElevenLabs TTS
                       │   /api/clone ──▶ ElevenLabs IVC
                       │   /api/conversation ──▶ deterministic phone rules
                       │   /api/auth-voice ──▶ TTS + stress score
                       │   /api/bootstrap ──▶ health + optional agent provisioning
                       │   /api/cleanup ──▶ deletes cloned voices
                       │
                       ▼
                Zustand store (single source of truth)
                       │
                       ▼
                NPC schedule tick (every 200 ms)
```

## Game state

A single Zustand store (`src/game/store.ts`) keeps phase, in-game time, NPC
state, voice inventory, suspicion, vault state, and active UI dialogs.

`src/game/tick.ts` runs a 200ms loop while `phase === "playing"`. Each tick:
- advances `inGameTime` by ~2.4 game-seconds (15 game-min ≈ 75 real-sec)
- steps every NPC's schedule via `npcSchedules.ts`
- prunes expired toasts
- evaluates loss conditions

`useWinWatch` subscribes to state changes and flips to `won` when the player
reaches the train station with the briefcase and no alarm.

## NPC schedules and overrides

Each NPC has a list of `ScheduleMoment`s grouped by `branch`:
- `default` — the planned evening
- `rushedHome`, `atCafe`, `runningErrand`, `atBank` — branches triggered by
  player actions (mostly via the Phone)

`findActiveMoment(npcId, time, branch)` returns the moment in effect.
`stepNpcSchedules` writes that moment's emotion, location, position, and
speech state into the NPC.

The Phone's call handler (`PhoneUI.tsx`) inspects the call (target +
caller voice + text) and may flip a branch — e.g. wife → manager → "break-in"
flips manager to `rushedHome`.

## ElevenLabs integration

All ElevenLabs calls live in `src/elevenlabs/*` and are server-only
(`import "server-only"`). The `client.ts` wrapper short-circuits to mock
mode when `VT_MOCK_AI=1` or no API key is present:

| Call | Mock behavior |
| --- | --- |
| TTS | Synthesized silent MP3 of approximate duration |
| IVC | Returns a fake voice id `mock_voice_<npcId>_<ts>` |
| Phone conversation | Static rule-based replies in `config/mockResponses.ts` |
| Voice delete | No-op |

`/api/bootstrap` calls `ensureAgents()`. By default it returns mock agent IDs
so warmup checks do not create unused remote agents. Set
`ELEVENLABS_ENABLE_CONVAI_AGENTS=1` only if you want to provision the optional
ConvAI scaffolding and cache IDs in `.vt-agents.json` (gitignored).

## Voice authentication

Each voice card carries a server-tagged `emotionalState`. The vault accepts
only `calm`-tagged manager voices (the spec defers acoustic stress scoring
to a follow-up; see `audioFeatures.ts`).

`/api/auth-voice` synthesizes the required phrase using the cloned voice and
returns the verdict + stressScore + base64 audio. The browser plays the
audio so the player hears their stolen voice "speak" the phrase.

## File map

- `src/app/` — Next.js routes
- `src/components/game/` — HUD and modal UIs
- `src/components/scenes/` — R3F scenes
- `src/components/characters/` — player + NPC actors
- `src/components/shaders/` — GLSL materials
- `src/components/world/` — interactive props + location gates
- `src/game/` — store, tick, schedules, validators
- `src/elevenlabs/` — server-only API clients
- `src/audio/` — howler-backed playback + mock recorder
- `src/config/` — voice IDs, agent prompts, NPC scripts, mock responses
- `scripts/render-npc-scripts.ts` — build-time TTS prerender
- `hyperframes/` — trailer composition
