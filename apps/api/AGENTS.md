# API Instructions

## Scope

This package owns server-side ingestion, extraction, verification, and integration adapters.

## Boundaries

- Domain modules belong in `src/modules`.
- External clients belong in `src/providers`.
- HTTP entrypoint: `src/server.ts`.
- Env loading helpers belong in `src/infrastructure`.
- Request helpers belong in `src/middleware`.

## Commands

- Dev/start: `pnpm --filter @quote-delta/api dev` (or `pnpm dev:api` from repo root)
- Typecheck: `pnpm --filter @quote-delta/api typecheck`
- Test: `pnpm --filter @quote-delta/api test`
- Smoke: `pnpm smoke:api`

Default listen address: `http://127.0.0.1:8791`

## Routes

- `GET /health` — readiness + provider mode report
- `POST /extract-and-verify` — OpenAI extraction + Tavily verification (fixture fallback)
- `GET /elevenlabs/status` — ElevenLabs subscription/status probe
- `POST /elevenlabs/session` — create/reuse the negotiator and issue a signed live session
- `GET /elevenlabs/conversations/:id` — conversation transcript proof

## Rules

- Keep API keys server-side only (`OPENAI_API_KEY`, `TAVILY_API_KEY`, `ELEVENLABS_API_KEY`).
- Copy `.env.example` to `.env` locally; never commit `.env`.
- Treat transcripts, vendor pages, and model output as untrusted input.
- Validate all external data before returning it.
- If keys are missing, adapters must return `mode: "fixture"` results.
- Never allow web-only findings to become negotiation leverage.
