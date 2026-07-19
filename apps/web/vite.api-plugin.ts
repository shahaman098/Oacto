import type { IncomingMessage, ServerResponse } from "node:http";
import { createJiti } from "jiti";
import type { Connect, Plugin } from "vite";

if (process.env.ALLOW_LIVE_PROVIDERS !== "true") {
  process.env.FORCE_FIXTURE_PROVIDERS = "true";
}

const jiti = createJiti(import.meta.url);

async function loadExtractAndVerify() {
  const api = (await jiti.import("@quote-delta/api")) as {
    extractAndVerify: (request: unknown) => Promise<unknown>;
  };
  return api.extractAndVerify;
}

async function loadElevenLabsAdapter() {
  const api = (await jiti.import("@quote-delta/api")) as {
    loadApiEnv: () => void;
    createElevenLabsAdapter: () => {
      createLiveSession: () => Promise<unknown>;
      getConversationProof: (conversationId: string) => Promise<unknown>;
    };
  };
  api.loadApiEnv();
  return api.createElevenLabsAdapter();
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function createExtractMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (!req.url?.startsWith("/api/extract-and-verify")) {
      next();
      return;
    }

    if (req.method === "OPTIONS") {
      writeCors(res, 204);
      res.end();
      return;
    }

    if (req.method !== "POST") {
      writeCors(res, 405);
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    try {
      const body = await readJsonBody(req);
      const extractAndVerify = await loadExtractAndVerify();
      const result = await extractAndVerify(body);
      writeCors(res, 200);
      res.end(JSON.stringify(result));
    } catch (error) {
      writeCors(res, 400);
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Extraction failed",
        }),
      );
    }
  };
}

function createElevenLabsMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (!req.url?.startsWith("/api/elevenlabs/")) {
      next();
      return;
    }

    if (req.method === "OPTIONS") {
      writeCors(res, 204);
      res.end();
      return;
    }

    try {
      const elevenLabs = await loadElevenLabsAdapter();

      if (req.method === "POST" && req.url === "/api/elevenlabs/session") {
        const result = await elevenLabs.createLiveSession();
        writeCors(res, 200);
        res.end(JSON.stringify(result));
        return;
      }

      const match = req.url.match(/^\/api\/elevenlabs\/conversations\/([^/?]+)/);
      if (req.method === "GET" && match?.[1]) {
        const result = await elevenLabs.getConversationProof(decodeURIComponent(match[1]));
        writeCors(res, 200);
        res.end(JSON.stringify(result));
        return;
      }

      writeCors(res, 404);
      res.end(JSON.stringify({ error: "ElevenLabs route not found" }));
    } catch (error) {
      writeCors(res, providerErrorStatus(error));
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : "ElevenLabs request failed",
          provider: "elevenlabs",
        }),
      );
    }
  };
}

function writeCors(res: ServerResponse, statusCode: number) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function providerErrorStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : "";
  if (/API_KEY is required/i.test(message)) {
    return 503;
  }
  if (/HTTP 401|HTTP 403/i.test(message)) {
    return 502;
  }
  return 502;
}

/** Serves extraction/verification through Vite so keys never reach the browser bundle. */
export function quoteDeltaApiPlugin(): Plugin {
  return {
    name: "quote-delta-api",
    configureServer(server) {
      server.middlewares.use(createElevenLabsMiddleware());
      server.middlewares.use(createExtractMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createElevenLabsMiddleware());
      server.middlewares.use(createExtractMiddleware());
    },
  };
}
