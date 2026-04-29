import "server-only";
import { elevenFetch, isMockMode, makeSilentMp3 } from "./client";

export type Emotion = "calm" | "stressed" | "panicked";

export interface TtsRequest {
  text: string;
  voiceId: string;
  emotion?: Emotion;
  highQuality?: boolean;
}

function voiceSettings(emotion: Emotion = "calm") {
  return {
    stability: emotion === "panicked" ? 0.32 : emotion === "stressed" ? 0.45 : 0.58,
    similarity_boost: 0.82,
    style: emotion === "panicked" ? 0.82 : emotion === "stressed" ? 0.58 : 0.38,
    use_speaker_boost: true,
  };
}

export async function synthesizeTts(req: TtsRequest): Promise<Buffer> {
  if (isMockMode()) {
    return makeSilentMp3(Math.max(800, req.text.length * 60));
  }

  const modelId = process.env.ELEVENLABS_TTS_MODEL || "eleven_multilingual_v2";

  const res = await elevenFetch(`/v1/text-to-speech/${req.voiceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text: req.text,
      model_id: modelId,
      voice_settings: voiceSettings(req.emotion),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TTS failed ${res.status}: ${text}`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
