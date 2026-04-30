# Voice Thief Trailer

Hyperframes composition for the vertical gameplay submission trailer.

## Current Pipeline

- `index.html` is the active Hyperframes composition.
- `styles.css` contains the trailer overlays, caption styling, and motion polish.
- `assets/gameplay/gameplay-trailer-base.mp4` is the trimmed gameplay base used by the composition.
- `assets/voiceover-submission/*.mp3` are ElevenLabs-generated narration clips copied from `docs/trailer/voiceover-submission/`.
- `assets/audio/noir-pulse.wav` is a procedural, royalty-free music/tension bed mixed under the narration.
- `output/voice-thief-submission-trailer.mp4` is the raw Hyperframes render and is ignored by git.

The canonical upload file is written to:

```bash
docs/trailer/voice-thief-submission-trailer.mp4
```

## Render

FFmpeg must be available on `PATH`. On this machine the Winget install is:

```powershell
$env:PATH = "C:\Users\bchua\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin;$env:PATH"
npm run render
```

The render script targets:

- MP4 container
- H.264 High Profile
- 1080x1920 vertical
- 60 fps
- BT.709 SDR
- 12 Mbps video target

## Voiceover

Narration is generated through `scripts/render-submission-trailer-vo.mjs`, which reads `ELEVENLABS_API_KEY` from the environment or `.env.local`.

After regenerating VO, copy the files into this Hyperframes project:

```powershell
Copy-Item ..\docs\trailer\voiceover-submission\*.mp3 .\assets\voiceover-submission -Force
```

## Upload Master

After Hyperframes render, the canonical upload master is produced with a final audio/loudness pass:

```powershell
ffmpeg -y -i .\output\voice-thief-submission-trailer.mp4 `
  -c:v copy `
  -filter:a "loudnorm=I=-14:LRA=9:TP=-1.5" `
  -c:a aac -b:a 384k -ar 48000 -ac 2 `
  -movflags +faststart `
  ..\docs\trailer\voice-thief-submission-trailer.mp4
```
