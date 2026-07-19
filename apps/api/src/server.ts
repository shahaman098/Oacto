import { createServer } from "node:http";
import { loadApiEnv, providerStatus } from "./infrastructure/env";
import { matchRoute, readJsonBody, sendJson, sendNoContent } from "./middleware/http";
import { extractAndVerify } from "./modules/extract-and-verify";
import { createElevenLabsAdapter } from "./providers/elevenlabs";

loadApiEnv();

const port = Number(process.env.API_PORT || 8791);
const host = process.env.API_HOST || "127.0.0.1";
const elevenLabs = createElevenLabsAdapter();

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      sendNoContent(res);
      return;
    }

    if (req.method === "GET" && req.url?.startsWith("/health")) {
      const providers = providerStatus();
      sendJson(res, 200, {
        ok: true,
        service: "quote-delta-api",
        host,
        port,
        envFile: process.env.QUOTE_DELTA_ENV_FILE ?? null,
        providers,
        routes: [
          "GET /health",
          "GET /elevenlabs/status",
          "POST /elevenlabs/session",
          "GET /elevenlabs/conversations/:id",
          "POST /extract-and-verify",
        ],
      });
      return;
    }

    if (req.method === "GET" && req.url === "/elevenlabs/status") {
      const result = await elevenLabs.getSubscriptionStatus();
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && req.url === "/elevenlabs/session") {
      const result = await elevenLabs.createLiveSession();
      sendJson(res, 200, result);
      return;
    }

    const conversationMatch = matchRoute(req.url, /^\/elevenlabs\/conversations\/([^/]+)$/);
    if (req.method === "GET" && conversationMatch) {
      const conversationId = decodeURIComponent(conversationMatch[1] ?? "");
      const result = await elevenLabs.getConversationProof(conversationId);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && req.url?.startsWith("/extract-and-verify")) {
      const body = await readJsonBody(req);
      const result = await extractAndVerify(body as never);
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    const statusCode = /required|invalid|parse|validation/i.test(message) ? 400 : 502;
    sendJson(res, statusCode, { error: message });
  }
});

server.listen(port, host, () => {
  const providers = providerStatus();
  console.log(`Quote Delta API listening on http://${host}:${port}`);
  console.log(
    `Providers → openai:${providers.openai.activeMode} tavily:${providers.tavily.activeMode} elevenlabs:${providers.elevenlabs.activeMode}`,
  );
});

function shutdown(signal: string) {
  console.log(`Received ${signal}; shutting down API`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
