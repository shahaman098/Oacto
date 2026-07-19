#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APPLY=false

if [[ "${1:-}" == "--apply" ]]; then
  APPLY=true
fi

if ! command -v doctl >/dev/null 2>&1; then
  echo "doctl is required for DigitalOcean deployment." >&2
  exit 1
fi

cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

required_secrets=(ELEVENLABS_API_KEY)
for secret_name in "${required_secrets[@]}"; do
  if [[ -z "${!secret_name:-}" ]]; then
    echo "$secret_name is required in .env or the shell environment for a live deploy." >&2
    exit 1
  fi
done

tmp_spec="$(mktemp)"
trap 'rm -f "$tmp_spec"' EXIT

node scripts/render-do-spec.mjs .do/app.yaml "$tmp_spec"

pnpm build
doctl apps spec validate .do/app.yaml --schema-only >/dev/null
doctl apps propose --spec .do/app.yaml

if [[ "$APPLY" != "true" ]]; then
  echo "Dry run complete. Re-run scripts/deploy.sh --apply to create or update the DigitalOcean app."
  exit 0
fi

doctl apps create \
  --spec "$tmp_spec" \
  --upsert \
  --update-sources \
  --wait \
  --format ID,DefaultIngress,ActiveDeployment.ID,InProgressDeployment.ID,Created
