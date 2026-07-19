# Integrations

## Current State

The quote ledger remains fixture-backed for deterministic comparison. OpenAI structured extraction and Tavily vendor verification retain fixture modes. The judge-facing ElevenLabs call path is live-only: it reports provider failure and never substitutes a simulated voice conversation.

## Implemented Integrations

- OpenAI adapter (`apps/api/src/providers/openai.ts`): extracts quote assertions from transcript text. Parses live JSON when `OPENAI_API_KEY` is set; otherwise returns deterministic fixture extraction.
- Tavily adapter (`apps/api/src/providers/tavily.ts`): returns public-web confirmation/warning findings. Maps live search results when `TAVILY_API_KEY` is set; otherwise returns fixture verification.
- ElevenLabs adapter (`apps/api/src/providers/elevenlabs.ts`): finds or creates the dedicated negotiator agent, issues a short-lived signed WebSocket session, and retrieves post-call transcript/audio proof.
- Shared contracts: `packages/types`, runtime schemas: `packages/validation`.
- Dedicated API server: `pnpm dev:api` on `http://127.0.0.1:8791`.
- Web demo calls `/api/elevenlabs/session` and `/api/elevenlabs/conversations/:id` through Vite middleware so the ElevenLabs key never enters the browser bundle.
- The React app uses the official `@elevenlabs/react` SDK for microphone input, real-time voice output, connection lifecycle events, and transcript turns.

## Planned Integrations

- Twilio or SIP: optional outbound phone transport.
- Supabase: optional persistence for transcripts, quotes, vendors, and demo sessions.

## Integration Rules

- Provider clients belong in `apps/api/src/providers`.
- Shared contracts belong in `packages/types` and `packages/validation`.
- Frontend should call API routes or Vite middleware, never third-party APIs directly.
- OpenAI and Tavily may use fixture modes. The live ElevenLabs call must fail visibly rather than fall back.
- Web evidence can warn or confirm, but cannot create negotiation leverage by itself.

## Local Keys

Copy `.env.example` to a local `.env` (never commit it). Optional:

- `OPENAI_API_KEY`
- `TAVILY_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID` (optional; otherwise the app finds or creates its named demo agent)
- `ALLOW_LIVE_PROVIDERS=true` to allow live adapter attempts from the Vite middleware
- `API_PORT=8791` (default)

## Live Call Failure Contract

The call console logs microphone permission, agent/session provisioning, connection status,
conversation ID, disconnect reason, transcript processing, and proof retrieval. The outcome button
stays locked until a real transcript contains a $1,800 all-in offer with included terms.

## Tavily Outcome

Tavily should verify public vendor claims and pricing context, not act as a generic search feature.
