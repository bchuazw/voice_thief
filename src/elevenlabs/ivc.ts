import "server-only";
import { elevenFetch, isMockMode } from "./client";

export interface IvcCloneResult {
  voiceId: string;
  mock: boolean;
}

export async function cloneVoiceFromBlob(
  npcId: string,
  audio: File | Blob,
  filename = "sample.webm",
): Promise<IvcCloneResult> {
  if (isMockMode()) {
    return {
      voiceId: `mock_voice_${npcId}_${Date.now().toString(36)}`,
      mock: true,
    };
  }

  const form = new FormData();
  form.append("name", `vt_clone_${npcId}_${Date.now()}`);
  form.append(
    "files",
    audio instanceof File ? audio : new File([audio], filename, { type: "audio/webm" }),
  );
  form.append("remove_background_noise", "true");
  form.append(
    "description",
    `Voice Thief in-session clone of ${npcId}. Auto-deleted within 24h.`,
  );

  const res = await elevenFetch("/v1/voices/add", { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`IVC failed ${res.status}: ${text}`);
  }
  const json = (await res.json()) as { voice_id: string };
  return { voiceId: json.voice_id, mock: false };
}

export async function deleteClonedVoice(voiceId: string): Promise<void> {
  if (isMockMode() || voiceId.startsWith("mock_voice_")) return;
  const res = await elevenFetch(`/v1/voices/${voiceId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new Error(`Voice delete failed ${res.status}: ${text}`);
  }
}
