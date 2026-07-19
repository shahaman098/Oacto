import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Load repo-root `.env` if present. Never required for fixture mode. */
export function loadApiEnv(env: NodeJS.ProcessEnv = process.env): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(here, "../../../.env"),
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env"),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      loadEnv({ path, override: false });
      env.QUOTE_DELTA_ENV_FILE = path;
      return;
    }
  }
}

export function providerStatus(env: NodeJS.ProcessEnv = process.env) {
  const forceFixture = env.FORCE_FIXTURE_PROVIDERS === "true";
  const openai = Boolean(env.OPENAI_API_KEY?.trim()) && !forceFixture;
  const tavily = Boolean(env.TAVILY_API_KEY?.trim()) && !forceFixture;
  const elevenlabs = Boolean(env.ELEVENLABS_API_KEY?.trim()) && !forceFixture;

  return {
    forceFixture,
    openai: { configured: Boolean(env.OPENAI_API_KEY?.trim()), activeMode: openai ? "live" : "fixture" },
    tavily: { configured: Boolean(env.TAVILY_API_KEY?.trim()), activeMode: tavily ? "live" : "fixture" },
    elevenlabs: {
      configured: Boolean(env.ELEVENLABS_API_KEY?.trim()),
      activeMode: elevenlabs ? "live" : "fixture",
    },
  };
}
