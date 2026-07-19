# Deployment

## Target

Production runs as one DigitalOcean App Platform service:

- React/Vite build from `apps/web/dist`.
- Server-side `/api/*` routes from `apps/api/src/web-server.ts`.
- ElevenLabs, OpenAI, Tavily, and optional Twilio credentials are runtime secrets only.

## Local Build

```bash
pnpm build
```

The app build output is produced under `apps/web/dist`.

## DigitalOcean Deploy

1. Confirm `.env` contains at least `ELEVENLABS_API_KEY`.
2. Confirm `doctl` is authenticated.
3. Run:

```bash
./scripts/deploy.sh --apply
```

The script validates the DigitalOcean app spec, shows the proposed cost, injects local secrets into a temporary spec, then creates or updates the `quote-delta-ledger` app.

## Pre-Deploy Check

```bash
./scripts/check.sh
```

## Notes

- Do not commit `.env` or any rendered temporary app spec.
- The committed `.do/app.yaml` intentionally contains only non-secret runtime settings.
- The app uses `apps-s-1vcpu-1gb-fixed` for a stable demo service.
