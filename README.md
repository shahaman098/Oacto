# Quote Delta Ledger

Hackathon product prototype for the ElevenLabs "The Negotiator" challenge.

Quote Delta Ledger turns vendor calls into an auditable negotiation record: structured job spec, itemized quote assertions, transcript evidence, honesty constraints, and a before/after price or term delta.

## Quick Start

```bash
pnpm install
# add ELEVENLABS_API_KEY to the repo-root .env
pnpm dev
```

The live voice demo is served through the Vite app. The first call finds or creates the dedicated
`Quote Delta Live Negotiator` agent, requests microphone access, and opens a signed ElevenLabs
session. The voice call has no fixture fallback: startup and provider failures appear in the
on-screen event log.

Backend API (optional standalone server):

```bash
pnpm dev:api
# health: http://127.0.0.1:8791/health
```

The web app can also serve `/api/extract-and-verify` through Vite middleware. Use `pnpm dev:api` when you want the dedicated backend process.

Run verification:

```bash
./scripts/check.sh
pnpm smoke:api
```

## Repository Structure

- `apps/web`: React/Vite MVP demo.
- `apps/api`: extraction, verification, and provider adapters (OpenAI, Tavily, ElevenLabs).
- `packages`: shared types and validation schemas.
- `docs/product`: requirements, flows, acceptance criteria, and non-goals.
- `docs/architecture`: system design, data model, security, integrations, and ADRs.
- `docs/plans`: active plan, completed plans, and technical debt.
- `.agents/skills`: local workflow skills for feature work, review, and release.
- `.codex/config.toml`: Codex project context and verification command.

## Product Thesis

The hard part of phone negotiation is not only making calls. It is proving what each vendor said and using only honest leverage to improve the result.

## MVP Demo

1. Confirm one moving-job spec.
2. Review three vendor call outcomes.
3. Inspect transcript-backed quote fields.
4. See hidden/vague fees flagged.
5. Click **Open Live Negotiation**, then **Start live voice call** and allow microphone access.
6. Role-play the vendor while the real ElevenLabs agent discloses itself and cites only the verified
   $1,850 all-in competitor quote.
7. Offer $1,800 all-in with stairs included, end the call, and wait for provider proof to attach.
8. Apply the verified outcome and show the negotiated delta and final ranked recommendation.
9. Optionally paste a transcript and run AI extraction + web verification.

## Expected Outcome

The MVP should let a judge understand the product quickly: one buyer, one service request, three vendor calls, one verified negotiation improvement, and a final recommendation backed by transcript evidence.
