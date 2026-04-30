# Voice Thief

A noir heist puzzle where the player has no voice — but everyone else does.

> **Submission for the Zed × ElevenLabs Hackathon — Hack #6.**
> Built in Zed. Powered by ElevenLabs voice tech: human TTS, rendered NPC
> dialogue, and Instant Voice Cloning-ready phone/auth flows.

![Title screen](docs/screenshots/02-title.png)

## The pitch

It is 6 PM. The First City Bank locks down at 7:30. You have until 9 PM to walk
out with the briefcase. The vault opens only to the manager's voice. So does
the office. So does the front door after closing.

You cannot speak. But you have a tape recorder. And there are people in this
city who do.

## A first-person heist

The game plays in first-person — WASD walk, Shift run, mouse-look, **E** to
interact with whatever's centered in the crosshair. Press **C** to flip into
a top-down "diorama" view if you'd rather plan the heist like a chess board.

### Landing

![Landing](docs/screenshots/01-landing.png)

### Intro cinematic

A 33-second cold open. No tutorial popups; the world tells you what it is.

![Intro cinematic](docs/screenshots/03-intro.png)

### The street, in first-person

First City — Main Street at 6 PM. The streetlamps cast amber halos onto the
wet asphalt. The bank's red neon underline glows at the corner. Out on patrol,
the bank guard hums to himself.

![FP — Main Street](docs/screenshots/04-fp-street.png)

The payphone is the player's only outbound line. Pick it up to make a call
in any voice you've stolen.

![FP — Payphone in close-up](docs/screenshots/05-fp-payphone.png)

### The bank facade

First City Bank by night. Stone columns, brass door fittings, two amber
sconces, barred glowing windows, a transom over the door, a red neon strip
under the engraved sign.

![FP — Bank facade](docs/screenshots/06-fp-bank-facade.png)

### The apartment block

Tenements at the end of the block, fire escape running down the front, lit
windows scattered between dark ones. Margaret Vance's apartment is on the
ground floor.

![FP — Apartments + fire escape](docs/screenshots/06b-fp-apartments.png)

### Inside the bank

Marble checker floor, brass chandelier, three teller windows with iron bars
behind a long mahogany counter. The secretary's lamp glows on the counter
end. Harold Vance the manager is doing paperwork.

![FP — Bank lobby](docs/screenshots/07-fp-bank-lobby.png)

### The records cabinet

Past Lillian's hallway intercom, a records cabinet sits by the vault approach.
If you have Lillian's calm voice, you can file a false clearance here instead
of moving her off the counter by phone.

![FP — Records cabinet](docs/screenshots/07b-fp-records-cabinet.png)

### The vault

Past the manager's hallway, the brass torus frame rings the open vault door.
The deposit-box grid lines the back wall, each box with its keyhole and tiny
glowing number plate. The briefcase sits on its pedestal in the corner.

![FP — Vault chamber](docs/screenshots/08-fp-vault.png)

### Margaret Vance's living room

Maroon walls, picture frames, a sofa under a warm sconce, a window dressed
with curtains looking out at the moonlight. Margaret on the phone gossiping
with the neighbor.

![FP — Apartment living room](docs/screenshots/09-fp-apartment.png)

### The all-night cafe

Black-and-cream checker tile, hanging Edison bulbs, espresso machine on the
counter, red-topped stools. The secretary takes her coffee here at 6 PM
sharp.

![FP — Cafe interior](docs/screenshots/10-fp-cafe.png)

### Diorama mode (press C)

Same scenes, top-down. Useful for planning, for the demo trailer, and for
anyone who finds first-person uncomfortable.

![Diorama — Main Street](docs/screenshots/11-diorama-street.png)

### The notebook (press N)

The notebook now works like an in-game case board. **Leads** react to your
current run state, **Voices** stores stolen samples you can replay, **Suspects**
tracks who you know, and **Schedule** lists every recordable window. Emotion
tags stay readable without relying on color alone.

![Notebook - Leads](docs/screenshots/12-notebook-leads.png)

Voice cards keep their source moment, emotional state, and replay button so the
player can hear what they actually stole before trying an intercom or call.

![Notebook - Voice inventory](docs/screenshots/13-notebook-voices.png)

The schedule remains the planning layer for players who want to solve the route
instead of following only the live leads.

![Notebook - Schedule](docs/screenshots/14-notebook-schedule.png)

### The phone (press P)

The crime. Pick a target. Pick a stolen voice. Type what you want them to
hear. The receiving NPC reacts in character — and if your performance is
plausible, the world bends around it.

![Phone UI](docs/screenshots/15-phone.png)

### Pause and replay

Esc opens a pause menu when no modal is active. It freezes the clock, shows the
current heat/voice count, exposes volume and view settings, and lets the player
resume, restart, or save back to title. The title screen offers Continue when a
saved run exists.

![Pause menu](docs/screenshots/16-pause-menu.png)

### Ending

The ending now reports the route, number of stolen voices, final heat, and run
time, then offers an immediate replay.

![Win ending](docs/screenshots/17-ending-win.png)

## Controls

| Key | What it does |
| --- | --- |
| **WASD** / arrows | Walk |
| **Shift** | Run |
| Mouse | Look around (FP only — click the canvas to engage pointer-lock) |
| Click ground | Walk to that point (Diorama only) |
| **E** | Interact with what's centered in the crosshair: record an NPC, use the payphone, open a door, file a records clearance, authenticate at a voice-locked intercom, take the briefcase |
| **N** | Toggle the Notebook |
| **P** | Toggle the Phone |
| **M** | Mute / unmute audio |
| **C** | Toggle First-person ↔ Diorama view |
| **Esc** | Close any open modal; open the pause menu during play |

## How a heist plays out

The vault is now a layered voice puzzle, not a single-key door. None of the
solutions require combat or traditional stealth, but the clean route asks you
to learn the bank's chain of trust and keep two people from hearing the wrong
thing.

1. **Records key.** The inner hallway belongs to Lillian Park, not Harold.
   Capture a calm Lillian recording at the cafe, or send her outside on an
   errand and record her there. Her voice opens the hallway intercom.
2. **Vault key.** Harold Vance still owns the vault voiceprint. The best calm
   recording is his 6:15 PM cigarette break, though the ledger diversion can
   lure him to the cafe for another clean take.
3. **Clear the ledger.** The vault will reject even a perfect Harold sample
   while Lillian's closing ledger is active. Either use Harold's voice on the
   phone to give her a boring records errand, or get into the hallway with
   Lillian's calm voice and forge a records clearance at the cabinet.
4. **Optional exits and diversions.** Margaret's voice can pull Harold out of
   the bank. Eddie Cole's beat-call can open the alley gate for a faster
   escape. These help, but they do not replace the records/vault voice puzzle.

The important rule: intercoms accept only **calm** voiceprints. A panicked or
stressed recording fails authentication and pings suspicion.

## Local development

```bash
git clone https://github.com/bchuazw/voice_thief.git
cd voice_thief
cp .env.local.example .env.local
# Default mock mode (VT_MOCK_AI=1) lets you play without any API keys.
npm install
nvm use # optional, but Node 20 LTS is the pinned release runtime
npm run generate-assets
npm run dev
# Open http://localhost:3000
```

`npm run generate-assets` runs Blender 4.5 LTS in background mode and
rebuilds the semi-realistic GLB noir kit in `public/models/noir-kit/`. The
assets are deliberately modular so the game can keep simple, reliable
gameplay volumes while the visible set pieces improve through Blender.
Use `npm run verify-blender` to confirm the local Blender executable. If
Blender is installed outside the normal path, set `BLENDER_EXE` before
running the generator.

The repo ships with ElevenLabs-rendered NPC dialogue in
`public/audio/npc-scripts/`, so ambient voices and replayed samples sound
human even when gameplay AI is running in mock mode. Browser speech synthesis
is only a fallback if those MP3s fail to load or if you force
`NEXT_PUBLIC_VT_NPC_AUDIO=speech`.

To regenerate the clips with your own account or custom voice IDs:

```bash
# .env.local
VT_MOCK_AI=0
ELEVENLABS_API_KEY=eleven_xxx
ELEVENLABS_TTS_MODEL=eleven_multilingual_v2

# Optional; blank uses the premade cast in src/config/voices.ts.
ELEVENLABS_VOICE_ID_BANK_MANAGER=
ELEVENLABS_VOICE_ID_SECRETARY=
ELEVENLABS_VOICE_ID_BANK_GUARD=
ELEVENLABS_VOICE_ID_WIFE=

npm run verify-eleven       # 30s smoke test against the live API
npm run render-scripts      # render all 14 NPC dialogue clips
npm run dev
```

## Tests

The end-to-end suite lives at `vt-e2e.cjs`. Boot the dev or production server
in mock mode and run `node vt-e2e.cjs` in another terminal. **82 / 82 checks pass.**
Set `VT_BASE_URL=http://localhost:<port>` if your server is not on port 3000.
It exercises first-person startup and WASD movement, phase transitions,
save/continue, pause settings, recording, notebook inventory, phone diversion,
hallway voice gating, vault watcher rejection, forged records clearance,
voice auth, briefcase, train-station win,
suspicion-driven loss, time-out loss, Solution C, weak-call failure
regressions, guard back-exit diversion, caller-aware guard replies,
recording-awareness busts, the doubt accumulator, direct API contracts, and
browser runtime error health.
Full transcript:
[docs/E2E_REPORT.md](./docs/E2E_REPORT.md).

The screenshots above are captured by `vt-fp-shots.cjs` against the running
dev server in mock mode:

```bash
npm run dev
node vt-fp-shots.cjs
# Or, for a non-3000 server:
VT_BASE_URL=http://localhost:3001 node vt-fp-shots.cjs
```

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md),
[docs/ASSET_PIPELINE.md](./docs/ASSET_PIPELINE.md),
[docs/ELEVENLABS_INTEGRATION.md](./docs/ELEVENLABS_INTEGRATION.md), and
[docs/DEPLOY.md](./docs/DEPLOY.md).

The ElevenLabs API key never reaches the browser — every external call goes
through `app/api/*` route handlers backed by `src/elevenlabs/*` modules
tagged `import "server-only"`. A single `isMockMode()` check short-circuits
all four APIs so the game is fully playable without any keys.

## Accessibility

- Color is never the only channel. Emotion tags carry glyphs (○ ◐ ●).
  Suspicion shows numeric `XX / 100 · clean / noticed / hunted` alongside
  the color bar. Suspicion + recording bars expose proper `role="progressbar"`
  with aria values.
- Recording works via mouse, keyboard, switch, or screen reader: an on-screen
  Record button with `aria-label`, focus ring, and `aria-live` updates plus
  the Hold-E hotkey.
- Every modal is `role="dialog" aria-modal="true"` with an `aria-labelledby`
  heading; **Esc** closes everything.
- Game time pauses for the notebook and pause menu. Phone and auth surfaces run
  in slow time, preserving accessibility without fully removing heist pressure.
  A `paused` badge announces true pause state.
- **M** toggles a global mute that's respected by all synthesized speech
  playback (TTS calls, voice-auth playback, scripted NPC dialogue).
- HUD controls compress on mobile instead of overlapping. Phone calls render
  transcript text; ambient and replayed voice lines are represented in the
  notebook and schedule text.

## Credits

- **Built in:** [Zed](https://zed.dev)
- **Voice AI:** [ElevenLabs](https://elevenlabs.io)
- **3D:** [Three.js](https://threejs.org) + [React Three Fiber](https://r3f.docs.pmnd.rs)
- **Trailer:** [Hyperframes](https://hyperframes.dev)
