# Deploying Voice Thief on Render

This project ships with `render.yaml` for one-click deploy as a Render Web
Service.

## First-time deploy

1. Create a new Web Service on Render and connect it to the GitHub repo.
2. Render auto-detects `render.yaml` — accept the proposed settings.
3. In **Environment**, fill in any of the keys in `render.yaml` that you want
   to use real APIs for. To run the demo without keys, set:

   ```
   VT_MOCK_AI=1
   ```

   Anything else can stay blank in mock mode.

4. Click **Create Web Service**. The first build takes ~3–4 minutes.
5. The health check probes `/api/bootstrap`, which warms the app without
   creating ConvAI agents unless `ELEVENLABS_ENABLE_CONVAI_AGENTS=1`.

## With real keys

To switch from mock to live ElevenLabs:

| Key | Where to find |
| --- | --- |
| `ELEVENLABS_API_KEY` | <https://elevenlabs.io/app/settings/api-keys> |
| `ELEVENLABS_VOICE_ID_*` | Voice Library — pin one voice per NPC |
| `ELEVENLABS_ENABLE_CONVAI_AGENTS` | Optional experimental agent provisioning; leave `0` for normal play |
| `ELEVENLABS_AGENT_ID_*` | Optional. Used only when ConvAI agent provisioning is enabled |
| `ANTHROPIC_API_KEY` | Reserved; not required for the shipped puzzle path |

Set `VT_MOCK_AI=0` (or remove it) to make the server use real APIs.

## Cold starts

Render's starter tier sleeps after inactivity. Either:
- Upgrade to a paid plan, or
- Hit `/api/bootstrap` from a cron or uptime pinger (e.g. UptimeRobot every
  10 minutes) to keep it warm during the demo period.

## Voice cleanup

Cloned voices accumulate quickly. The browser triggers `DELETE` for each
session voice on tab close (best-effort), and `/api/cleanup` accepts a
`POST { voiceIds: [...] }` for bulk cleanup. For real-key deploys, schedule
a Render cron job that lists older voices and deletes them.

## Updating after the hackathon

`autoDeploy: true` in `render.yaml` means every push to `main` triggers a
deploy. To freeze the submitted build, set `autoDeploy: false` after the
demo URL is live.
