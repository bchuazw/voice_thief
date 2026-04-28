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

npm run render-scripts
```

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
