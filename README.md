# Voice Thief

A noir heist puzzle where the player has no voice — but everyone else does.

> **Submission for the Zed × ElevenLabs Hackathon — Hack #6.**
> Built in Zed. Powered by ElevenLabs (TTS + Instant Voice Cloning + Conversational AI).

## How to play

It is 6 PM. The First City Bank vault closes at 7. You have until 9 PM to walk
out with the briefcase. The vault opens only to the manager's voice. So does
the office. So does the front door after closing.

You cannot speak. But you have a tape recorder. And there are people in this
city who do.

- **Click** to walk.
- **Hold E** near a speaking NPC to record their voice.
- **N** opens your notebook (voices, suspects, schedule).
- **P** opens the phone — call anyone in any voice you've stolen.
- Reach the train station with the briefcase before 9:00 PM.

## Local development

```bash
git clone https://github.com/bchuazw/voice_thief.git
cd voice_thief
cp .env.local.example .env.local
# Default mock mode lets you play without API keys.
npm install
npm run dev
# Open http://localhost:3000
```

To run with real ElevenLabs:

```bash
# .env.local
VT_MOCK_AI=0
ELEVENLABS_API_KEY=eleven_xxx
ELEVENLABS_VOICE_ID_BANK_MANAGER=...
ELEVENLABS_VOICE_ID_SECRETARY=...
ELEVENLABS_VOICE_ID_BANK_GUARD=...
ELEVENLABS_VOICE_ID_WIFE=...
```

Optionally pre-render NPC scripts (silent MP3s in mock mode):

```bash
npm run render-scripts
```

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md), [docs/ELEVENLABS_INTEGRATION.md](./docs/ELEVENLABS_INTEGRATION.md), and [docs/DEPLOY.md](./docs/DEPLOY.md).

## Credits

- **Built in:** [Zed](https://zed.dev)
- **Voice AI:** [ElevenLabs](https://elevenlabs.io)
- **3D:** [Three.js](https://threejs.org) + [React Three Fiber](https://r3f.docs.pmnd.rs)
- **Trailer:** Hyperframes
