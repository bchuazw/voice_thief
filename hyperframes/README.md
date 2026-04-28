# Voice Thief — Trailer

Hyperframes composition for the 60-second hackathon trailer.

## What's here

- `compositions/trailer.html` — full timeline composition (per Voice Thief spec §12.3)
- `compositions/styles.css` — typography + caption animations
- `assets/gameplay-clips/` — drop OBS captures here (1920×1080, 60 fps, H.264 MP4)
- `assets/music/` — drop a royalty-free noir track here as `noir-pulse.wav`
- `output/` — render destination

## Required clips

Capture each at 1920×1080 / 60 fps / MP4-H.264 with OBS:

| Clip | Duration | Filename |
| --- | --- | --- |
| Establishing rain | 4 s | `01-rain-establishing.mp4` |
| Following the manager | 5 s | `02-following-manager.mp4` |
| Cigarette break record | 6 s | `03-cigarette-record.mp4` |
| Payphone pickup | 3 s | `04-payphone-pickup.mp4` |
| Typing the message | 4 s | `05-typing-message.mp4` |
| Wife's cloned voice | 5 s | `06-managers-wife-voice.mp4` |
| Manager rushes out | 4 s | `07-manager-rushes-out.mp4` |
| Bank empty | 3 s | `08-bank-empty.mp4` |
| Vault auth | 6 s | `09-vault-auth.mp4` |
| Briefcase pickup | 3 s | `10-briefcase-pickup.mp4` |
| Walk into rain | 4 s | `11-walk-into-rain.mp4` |
| Title card | 4 s | `12-title-card.mp4` |

Also render or compose `assets/gameplay-clips/full-diegetic-track.wav` (~51 s) per spec §12.5.

## Rendering

```bash
cd hyperframes
npx hyperframes init voice-thief-trailer   # one time
npx hyperframes preview                     # live preview in browser
npx hyperframes lint                        # validate composition
npx hyperframes render --output ./output/voice-thief-trailer.mp4
```

Output target: 1920×1080, 60 fps, ~51 s, ~30–40 MB MP4.
