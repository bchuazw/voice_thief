import { convaiAgentsEnabled, ensureAgents } from "@/elevenlabs/agents";
import { isMockMode } from "@/elevenlabs/client";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const agents = await ensureAgents();
    return Response.json({
      ok: true,
      mock: isMockMode() || !convaiAgentsEnabled(),
      agents,
      gameVersion: process.env.NEXT_PUBLIC_GAME_VERSION ?? "0.0.0",
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: (err as Error).message, mock: isMockMode() },
      { status: 500 },
    );
  }
}
