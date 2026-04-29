# ElevenLabs Integration

Voice Thief uses three ElevenLabs APIs as load-bearing gameplay primitives:
**TTS**, **Instant Voice Cloning (IVC)**, and **Conversational AI**. Each is
wrapped in a server-only module under `src/elevenlabs/`, and routed through
`app/api/*` so the API key never reaches the browser.

## Mock mode (default)

If `VT_MOCK_AI=1` or `ELEVENLABS_API_KEY` is unset:
- TTS returns a silent MP3 of approximate duration.
- IVC returns a synthetic voice id `mock_voice_<npcId>_<timestamp>`.
- ConvAI replies are scripted by keyword in `config/mockResponses.ts`.
- Voice delete is a no-op.

The game still ships real ElevenLabs-rendered ambient NPC clips in
`public/audio/npc-scripts/`, so mock mode is playable without robotic browser
speech. Browser speech synthesis is only the client fallback if an MP3 fails
to load or `NEXT_PUBLIC_VT_NPC_AUDIO=speech` is set.

## TTS — `/api/tts`

POST `{ text, voiceId, emotion?, highQuality? }` → `audio/mpeg`.

Models:
- `eleven_multilingual_v2` by default for more natural phone/auth playback.
- Override with `ELEVENLABS_TTS_MODEL` when testing a different ElevenLabs
  model.

Voice settings vary by emotion: `panicked` lowers stability, raises style.

If `ELEVENLABS_VOICE_ID_*` is unset, the game uses the premade cast in
`src/config/voices.ts`. `npm run render-scripts` uses the same cast to render
the 14 shipped NPC clips.

## IVC — `/api/clone`

POST `multipart/form-data { audio, npcId, sourceMomentId, emotion }` →
`{ voiceId, mock, npcId, sourceMomentId, emotion }`.

Limits:
- Max payload: 10 MB.
- Per-IP rate limit: 12 clones / minute.
- The recorder caps recording duration at 30 s before auto-stop.

Server uploads to `POST /v1/voices/add` with `remove_background_noise=true`.
The returned `voice_id` is stored client-side as a `VoiceCard`.

## Conversational AI — `/api/conversation`

POST `{ npcId, callerVoiceId, callerVoiceNpcId, callerText, history,
inGameTime }` → `{ npcText, raisedSuspicion, hangUp, callerAudio,
npcAudio, mock }`.

Agents are created at boot via `ensureAgents()` (`/api/bootstrap`) using the
system prompts in `src/config/agents/*`. Their IDs are cached in
`.vt-agents.json` so subsequent boots don't re-create them. The agents are
stable-named (`vt_bank_manager_v1`, etc.) so they're easy to find in the
dashboard.

In mock mode (and currently with real keys until ConvAI WebSocket streaming
is wired), turn responses are produced by `mockResponses.ts` rules, then
TTS'd with the caller voice and the target NPC voice for playback.

## Voice authentication — `/api/auth-voice`

POST `{ device, voiceCard }` →
`{ passes, reason, stressScore, phrase, audio }`.

The vault and other voice-locked devices route through here. The server
computes a deterministic source-tagged stress score (per spec §5.4 — the
recommended hackathon path) and returns the verdict plus a base64 audio
sample of the cloned voice "speaking" the required phrase.

## Cleanup — `/api/cleanup`

POST `{ voiceIds: [...] }` deletes the listed clones. The browser fires this
on `beforeunload` (best-effort). For real-key deploys, schedule a daily
cron to delete clones older than 24 hours.
