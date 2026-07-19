import type { IncomingMessage, ServerResponse } from "node:http";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }

  return JSON.parse(raw) as unknown;
}

export function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...corsHeaders,
  });
  res.end(JSON.stringify(payload));
}

export function sendNoContent(res: ServerResponse): void {
  res.writeHead(204, corsHeaders);
  res.end();
}

export function matchRoute(url: string | undefined, pattern: RegExp): RegExpMatchArray | null {
  if (!url) {
    return null;
  }

  const path = url.split("?")[0] ?? url;
  return path.match(pattern);
}
