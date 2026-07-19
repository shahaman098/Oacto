# Local Development

## Setup

```bash
pnpm install
```

## Run Web App

```bash
pnpm dev
```

The web app runs from `apps/web`.

## Verify

```bash
./scripts/check.sh
```

This runs lint, typecheck, unit tests, build, and the Playwright smoke test.

## Environment

Create a repo-root `.env` from `.env.example`. `ELEVENLABS_API_KEY` is required for the live voice
call. `ELEVENLABS_AGENT_ID` is optional because the API can find or create the named demo agent.
Do not commit secrets.

## Live Voice Smoke Test

1. Open the Vite URL in Chrome or the Codex in-app browser.
2. Click **Open Live Negotiation** and **Start live voice call**.
3. Allow microphone access and wait for `live voice connected` plus a conversation ID.
4. Confirm the AI disclosure is spoken aloud, then role-play the vendor.
5. End the call and wait for `Provider proof attached` in the event log.

Any failure must remain visible in the provider event log; do not present fixture lines as a live call.
