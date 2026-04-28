# Voice Thief

A noir heist puzzle where the player has no voice — but everyone else does.

> **Submission for the Zed × ElevenLabs Hackathon — Hack #6.**
> Built in Zed. Powered by ElevenLabs (TTS + Instant Voice Cloning + Conversational AI).

![Title screen](docs/screenshots/02-title.png)

## The pitch

It is 6 PM. The First City Bank vault closes at 7. You have until 9 PM to walk
out with the briefcase. The vault opens only to the manager's voice. So does
the office. So does the front door after closing.

You cannot speak. But you have a tape recorder. And there are people in this
city who do.

## Screens

### Landing

![Landing page](docs/screenshots/01-landing.png)

### Intro cinematic

A 33-second cold open. No tutorial popups; the world tells you what it is.

![Intro cinematic](docs/screenshots/03-intro.png)

### The street

The single block where most of the heist plays out. Bank entrance on the left,
payphone center, all-night cafe on the right, apartments at the end of the
block. NPCs move between scenes on a real schedule from 6 PM to 9 PM. A scene
title fades in on every location change.

![Street at 6 PM with scene title](docs/screenshots/04-scene-title.png)

Click anywhere on the ground to walk. A small golden ring marks the target.

![Click-to-move target ring](docs/screenshots/06-target-ping.png)

### Notebook — three tabs

Your inventory. Voices you've stolen, dossiers on every suspect, and the
schedule of recordable moments you've uncovered.

![Notebook — Schedule](docs/screenshots/08-notebook-schedule.png)

![Notebook — Suspects](docs/screenshots/09-notebook-suspects.png)

### The phone

The crime. Pick a target. Pick a stolen voice. Type what you want them to
hear. The receiving NPC reacts in character — and if your performance is
plausible, the world bends around it.

![Phone UI](docs/screenshots/10-phone.png)

## A complete heist, captured frame-by-frame

The screenshots below are pulled from the **end-to-end test** — Playwright
drives the running dev server in mock mode, so this is the actual game flow
the test verifies. **38 / 38 checks pass.**

### 1. Game start

Player on the rainy street at 6:00 PM. Bank front-left, cafe glowing yellow
right, payphone red center. Eddie Cole the guard begins his beat.

![Street at 6 PM](docs/test-shots/01-street-6pm.png)

### 2. Voice captured → Notebook

The player has just recorded the manager's calm 6:15 PM cigarette break.
Voice card appears in the Notebook with the calm tag and a recording duration.

![Notebook with first voice card](docs/test-shots/02-notebook-with-card.png)

### 3. The phone

Pick a target. Pick a voice. Type what you want them to hear.

![Phone — initial state](docs/test-shots/03-phone-open.png)

### 4. The diversion lands

Calling the manager from the payphone in his **wife's** voice — *"Honey,
there's been a break-in at the house. Come home now."* He believes it. The
toast in the corner confirms: *"The manager rushes for the door."*

![Phone call active — manager rushes home](docs/test-shots/04-phone-call-active.png)

### 5. Inside the bank

With the manager gone and the hallway unlocked, the player walks into the
empty lobby. The vault intercom is at the end of the hallway.

![Bank lobby](docs/test-shots/05-bank-lobby.png)

### 6. Vault authentication required

Click the intercom. The system asks for the phrase
*"Authorize vault, code 7-7-1"* in the manager's voice. The Notebook lists
every matching voice card.

![Vault auth dialog open](docs/test-shots/06-vault-auth-open.png)

### 7. Wrong recording — rejected

The player tries the **stressed** recording from the manager's 6:45 PM phone
fight. *"Voice too stressed — try a calmer recording."* +15 suspicion.

![Stressed voice rejected](docs/test-shots/07-vault-auth-stressed-fail.png)

### 8. Calm recording — accepted

The cigarette-break recording passes. *"Voiceprint accepted."*

![Calm voice accepted](docs/test-shots/08-vault-auth-calm-pass.png)

### 9. Vault open

Brass door swings. Briefcase sits inside under a single lamp.

![Vault open](docs/test-shots/09-vault-open.png)

### 10. WIN

Briefcase in hand, the player reaches the train station before 9:00 PM.

![Win screen — A clean con.](docs/test-shots/10-win.png)

### 11. Failure paths

Get caught — too many failed auths, too many bad calls, suspicion crosses 100
and the alarm goes. End of evening.

![Lost — alarm raised](docs/test-shots/11-lost.png)

…or just run out the clock past 9:00 PM.

![Lost — last train](docs/test-shots/12-lost-timeout.png)

### 12. Solution C kicks off

Calling the manager *as the secretary* — *"Sir, I left the safe-deposit ledger
at the cafe. Could you grab it on your way back?"* Manager pivots to the cafe;
the player can now record him there, calm, in person.

![Solution C — secretary call lures the manager to the cafe](docs/test-shots/13-solution-c-call.png)

## Controls

| Key / action | What it does |
| --- | --- |
| Click ground | Walk to that point |
| **Hold E** | Record a nearby NPC who is speaking |
| **N** | Toggle the Notebook |
| **P** | Toggle the Phone |
| Click a door / intercom | Voice authentication dialog |

## How a heist plays out

There are three valid solution paths to the vault. None of them require
combat or stealth in the traditional sense — only careful timing and good
casting.

1. **Direct:** record the manager during his calm 6:15 PM cigarette break,
   wait until the bank empties, walk in and play it at the vault.
2. **Diversion:** record the manager's wife gossiping at home. Call the
   manager from the payphone in her voice. Tell him there's a break-in.
   Watch him flee. Steal his panicked voice on the way out (useful for
   tricking the secretary, not the vault). You'll still need the calm
   cigarette recording for the vault itself.
3. **Insider:** record the secretary at the cafe at 6:00 PM. Use her voice to
   call the manager about a "lost ledger." He detours to the cafe. You
   record him, calm, in person at the cafe. Then call the secretary in his
   voice and send her on an errand. Bank is empty.

The vault accepts only **calm** voiceprints. A panicked or stressed
recording fails authentication and pings suspicion.

## Local development

```bash
git clone https://github.com/bchuazw/voice_thief.git
cd voice_thief
cp .env.local.example .env.local
# Default mock mode (VT_MOCK_AI=1) lets you play without any API keys.
npm install
npm run dev
# Open http://localhost:3000
```

The placeholder NPC dialogue MP3s ship in `public/audio/npc-scripts/` so the
mock-mode demo works out of the box. To regenerate them with real
ElevenLabs voices:

```bash
# .env.local
VT_MOCK_AI=0
ELEVENLABS_API_KEY=eleven_xxx
ELEVENLABS_VOICE_ID_BANK_MANAGER=...
ELEVENLABS_VOICE_ID_SECRETARY=...
ELEVENLABS_VOICE_ID_BANK_GUARD=...
ELEVENLABS_VOICE_ID_WIFE=...

npm run verify-eleven       # 30s smoke test against the live API
npm run render-scripts      # render all 14 NPC dialogue clips
npm run dev
```

## Tests

The end-to-end run that produced the screenshots above lives at
`vt-e2e.cjs`. With the dev server running in mock mode:

```bash
node vt-e2e.cjs
```

It exercises every gameplay primitive — phase transitions, recording,
notebook inventory, phone diversion (wife→manager break-in flips the manager
to `rushedHome` and unlocks the hallway), voice auth (stressed fails, calm
passes), briefcase, train-station win, suspicion-driven loss, time-out loss,
and the Solution C secretary→manager pivot — plus 9 direct API contract
checks. Full transcript is in [docs/E2E_REPORT.md](./docs/E2E_REPORT.md).

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md),
[docs/ELEVENLABS_INTEGRATION.md](./docs/ELEVENLABS_INTEGRATION.md), and
[docs/DEPLOY.md](./docs/DEPLOY.md).

The ElevenLabs API key never reaches the browser — every external call goes
through `app/api/*` route handlers backed by `src/elevenlabs/*` modules
tagged `import "server-only"`. A single `isMockMode()` check short-circuits
all four APIs so the game is fully playable without any keys.

## Credits

- **Built in:** [Zed](https://zed.dev)
- **Voice AI:** [ElevenLabs](https://elevenlabs.io)
- **3D:** [Three.js](https://threejs.org) + [React Three Fiber](https://r3f.docs.pmnd.rs)
- **Trailer:** [Hyperframes](https://hyperframes.dev)
