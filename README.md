# Quote Delta Ledger

A simple way to turn messy vendor calls into a quote you can trust.

Quote Delta Ledger is a hackathon prototype for the ElevenLabs "The Negotiator" challenge. It focuses on one real problem: service quotes are full of hidden fees, vague promises, and details that are easy to forget once the call ends. The app pulls those details into a ledger, shows what is confirmed, and makes it clear which claims are safe to use in a follow-up negotiation.

## What it does

- extracts itemized quote claims from call transcripts
- links each claim back to transcript evidence
- labels items as confirmed, vague, hidden, contradicted, waived, or declined
- compares vendor offers using comparable all-in totals
- shows the before/after delta from a follow-up negotiation
- supports a live ElevenLabs voice call with post-call proof

## What the demo looks like

1. Confirm the moving job spec.
2. Review three vendor quotes.
3. Inspect the evidence behind each line item.
4. See which claims can be used honestly in negotiation.
5. Run the live voice call and wait for the post-call proof.
6. Review the final ranked recommendation and the negotiated delta.

## Quick start

```bash
pnpm install
# add ELEVENLABS_API_KEY to the repo-root .env
pnpm dev
```

Open the Vite app in your browser. The first live call finds or creates the `Quote Delta Live Negotiator` agent, requests microphone access, and opens a signed ElevenLabs session.

Run the API separately if you want the server process:

```bash
pnpm dev:api
# health: http://127.0.0.1:8791/health
```

Verify everything:

```bash
./scripts/check.sh
pnpm smoke:api
```

## Environment

Create a repo-root `.env` from `.env.example`. The live voice demo needs `ELEVENLABS_API_KEY`. `ELEVENLABS_AGENT_ID` is optional because the app can find or create the demo agent by name. `OPENAI_API_KEY` and `TAVILY_API_KEY` are only needed if you want the server-side extraction and verification path to call live providers.

## Project layout

- `apps/web`: React/Vite demo used for the judge-facing experience
- `apps/api`: server-side extraction, verification, and provider adapters
- `packages`: shared types, config, and validation schemas
- `docs`: product notes, architecture, and runbooks
- `scripts`: local setup, smoke tests, and verification helpers

## Current shape

The current MVP is frontend-first. Fixture data keeps the demo deterministic where needed, while the live voice path stays strict: if ElevenLabs setup fails, the app reports the failure instead of pretending a call happened.

## In One Sentence

Quote Delta Ledger helps someone compare vendor quotes, prove what was actually said, and negotiate with evidence instead of guesswork.
