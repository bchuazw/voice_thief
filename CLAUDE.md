# Voice Thief — Agent Operating Notes

You are working on a hackathon game (Zed × ElevenLabs, Hack #6). The full
build spec is the message in `git log` for the initial commit; the
day-by-day plan is captured in `docs/ARCHITECTURE.md` and the deploy notes
in `docs/DEPLOY.md`.

## Hard rules

- **No API keys in client components.** All ElevenLabs calls go through
  `app/api/*` route handlers and `src/elevenlabs/*` modules tagged with
  `import "server-only"`. Never reference `process.env.ELEVENLABS_API_KEY`
  outside of `src/elevenlabs/`.
- **Mock mode is the default.** Every external call must respect
  `isMockMode()` from `src/elevenlabs/client.ts` and short-circuit before
  any network fetch. Tested by running `VT_MOCK_AI=1 npm run dev` — the
  game must be fully playable without keys.
- **Use `eleven_flash_v2_5` for live dialogue** and `eleven_v3` only for
  the vault-auth playback in `/api/auth-voice` (when `device === "vault"`).
- **Pre-render NPC scripts at build time.** Do not call TTS at runtime for
  scheduled NPC dialogue — use `scripts/render-npc-scripts.ts`.
- **Always clean up cloned voices.** The browser POSTs to `/api/cleanup`
  on tab close (best-effort), and a future cron job should delete clones
  older than 24 hours.

## Where things live

- `src/game/store.ts` — Zustand single source of truth.
- `src/game/npcSchedules.ts` — schedule + branch overrides.
- `src/game/solutionValidator.ts` — vault auth requirements.
- `src/components/scenes/*` — three R3F scenes (Street, Bank, Apartment, Cafe).
- `src/components/game/PhoneUI.tsx` — branch-flipping call effects.
- `src/elevenlabs/agents.ts` — programmatic ConvAI agent creation.
- `src/config/scripts/*.json` — scripted NPC dialogue (note the planted
  vault-code clue at 6:15 PM).

## Decision log

When you hit a fork, write your reasoning in `docs/DECISION_LOG.md` with
the date, the alternatives, and the pick. Useful for the writeup later.

## Test as you build

After each phase, the game must still boot. No multi-day in-progress
states. `npm run dev` is your smoke test; `npm run build` before committing.
