import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadApiEnv, providerStatus } from "./infrastructure/env";
import { matchRoute, readJsonBody, sendJson, sendNoContent } from "./middleware/http";
import { extractAndVerify } from "./modules/extract-and-verify";
import { createElevenLabsAdapter } from "./providers/elevenlabs";

loadApiEnv();

const port = Number(process.env.PORT || process.env.API_PORT || 8080);
const host = process.env.HOST || "0.0.0.0";
const staticRoot = resolve(fileURLToPath(new URL("../../web/dist", import.meta.url)));
const indexFile = join(staticRoot, "index.html");
const elevenLabs = createElevenLabsAdapter();

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      sendNoContent(res);
      return;
    }

    if (req.url?.startsWith("/api/")) {
      await handleApiRequest(req, res);
      return;
    }

    await serveStaticAsset(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    const statusCode = /required|invalid|parse|validation/i.test(message) ? 400 : 502;
    sendJson(res, statusCode, { error: message });
  }
});

server.listen(port, host, () => {
  const providers = providerStatus();
  console.log(`Quote Delta web service listening on http://${host}:${port}`);
  console.log(
    `Providers -> openai:${providers.openai.activeMode} tavily:${providers.tavily.activeMode} elevenlabs:${providers.elevenlabs.activeMode}`,
  );
});

async function handleApiRequest(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "GET" && req.url?.startsWith("/api/health")) {
    sendJson(res, 200, {
      ok: true,
      service: "quote-delta-web",
      providers: providerStatus(),
      routes: [
        "GET /api/health",
        "GET /api/elevenlabs/status",
        "POST /api/elevenlabs/session",
        "GET /api/elevenlabs/conversations/:id",
        "POST /api/extract-and-verify",
      ],
    });
    return;
  }

  if (req.method === "GET" && req.url === "/api/elevenlabs/status") {
    const result = await elevenLabs.getSubscriptionStatus();
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && req.url === "/api/elevenlabs/session") {
    const result = await elevenLabs.createLiveSession();
    sendJson(res, 200, result);
    return;
  }

  const conversationMatch = matchRoute(req.url, /^\/api\/elevenlabs\/conversations\/([^/]+)$/);
  if (req.method === "GET" && conversationMatch) {
    const conversationId = decodeURIComponent(conversationMatch[1] ?? "");
    const result = await elevenLabs.getConversationProof(conversationId);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && req.url?.startsWith("/api/extract-and-verify")) {
    const body = await readJsonBody(req);
    const result = await extractAndVerify(body as never);
    sendJson(res, 200, result);
    return;
  }

  sendJson(res, 404, { error: "API route not found" });
}

async function serveStaticAsset(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, securityHeaders());
    res.end("Method not allowed");
    return;
  }

  const requestedPath = decodeURIComponent((req.url ?? "/").split("?")[0] ?? "/");
  const safePath = normalize(requestedPath)
    .replace(/^[/\\]+/, "")
    .replace(/^(\.\.[/\\])+/, "");
  const candidate = resolve(staticRoot, safePath);
  const filePath = candidate.startsWith(staticRoot) ? candidate : indexFile;
  const resolvedFile = await existingFile(filePath);
  const finalFile = resolvedFile ?? indexFile;

  res.writeHead(200, {
    ...securityHeaders(),
    "Content-Type": contentType(finalFile),
  });

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  createReadStream(finalFile).pipe(res);
}

async function existingFile(filePath: string): Promise<string | null> {
  try {
    const fileStat = await stat(filePath);
    return fileStat.isFile() ? filePath : null;
  } catch {
    return null;
  }
}

function contentType(filePath: string): string {
  const types: Record<string, string> = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  };

  return types[extname(filePath)] ?? "application/octet-stream";
}

function securityHeaders(): Record<string, string> {
  return {
    "Cache-Control": "no-store",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
}

function shutdown(signal: string) {
  console.log(`Received ${signal}; shutting down web service`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
