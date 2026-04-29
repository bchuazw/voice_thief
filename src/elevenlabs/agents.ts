import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { elevenFetch, isMockMode } from "./client";
import { bankManagerAgent } from "@/config/agents/bankManager";
import { secretaryAgent } from "@/config/agents/secretary";
import { bankGuardAgent } from "@/config/agents/bankGuard";
import { wifeAgent } from "@/config/agents/wife";
import type { NpcId } from "@/game/types";

export interface AgentDefinition {
  npcId: NpcId;
  stableName: string;
  systemPrompt: string;
  firstMessage: string;
  voiceIdEnv: string;
}

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  bankManagerAgent,
  secretaryAgent,
  bankGuardAgent,
  wifeAgent,
];

const AGENT_CACHE_FILE = path.join(process.cwd(), ".vt-agents.json");

interface AgentCache {
  [stableName: string]: { agentId: string; createdAt: number };
}

async function readCache(): Promise<AgentCache> {
  try {
    const raw = await fs.readFile(AGENT_CACHE_FILE, "utf8");
    return JSON.parse(raw) as AgentCache;
  } catch {
    return {};
  }
}

async function writeCache(cache: AgentCache): Promise<void> {
  await fs.writeFile(AGENT_CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
}

function envAgentId(def: AgentDefinition): string | undefined {
  const key = `ELEVENLABS_AGENT_ID_${def.npcId.replace(/([A-Z])/g, "_$1").toUpperCase()}`;
  return process.env[key];
}

export function convaiAgentsEnabled(): boolean {
  return process.env.ELEVENLABS_ENABLE_CONVAI_AGENTS === "1";
}

export async function ensureAgents(): Promise<Record<NpcId, string>> {
  const result: Partial<Record<NpcId, string>> = {};

  if (isMockMode() || !convaiAgentsEnabled()) {
    for (const def of AGENT_DEFINITIONS) {
      result[def.npcId] = `mock_agent_${def.npcId}`;
    }
    return result as Record<NpcId, string>;
  }

  const cache = await readCache();
  let cacheDirty = false;

  for (const def of AGENT_DEFINITIONS) {
    const fromEnv = envAgentId(def);
    if (fromEnv) {
      result[def.npcId] = fromEnv;
      continue;
    }

    const cached = cache[def.stableName];
    if (cached?.agentId) {
      result[def.npcId] = cached.agentId;
      continue;
    }

    const agentId = await createAgent(def);
    cache[def.stableName] = { agentId, createdAt: Date.now() };
    cacheDirty = true;
    result[def.npcId] = agentId;
  }

  if (cacheDirty) await writeCache(cache);
  return result as Record<NpcId, string>;
}

async function createAgent(def: AgentDefinition): Promise<string> {
  const voiceId = process.env[def.voiceIdEnv];
  const body = {
    name: def.stableName,
    conversation_config: {
      agent: {
        prompt: { prompt: def.systemPrompt },
        first_message: def.firstMessage,
        language: "en",
      },
      tts: voiceId ? { voice_id: voiceId, model_id: "eleven_flash_v2_5" } : undefined,
    },
  };

  const res = await elevenFetch("/v1/convai/agents/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Agent create failed for ${def.stableName}: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { agent_id: string };
  return json.agent_id;
}
