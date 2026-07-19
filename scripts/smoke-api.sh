#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${API_PORT:-8791}"
HOST="${API_HOST:-127.0.0.1}"
BASE="http://${HOST}:${PORT}"

pnpm --filter @quote-delta/api exec tsx src/server.ts >/tmp/quote-delta-api-smoke.log 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" >/dev/null 2>&1 || true
  wait "$SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

ready=0
for _ in $(seq 1 40); do
  if HEALTH_PROBE="$(curl -fsS "$BASE/health" 2>/dev/null)" && echo "$HEALTH_PROBE" | grep -q 'quote-delta-api'; then
    ready=1
    break
  fi
  sleep 0.25
done

if [[ "$ready" -ne 1 ]]; then
  echo "API failed to become ready on ${BASE}" >&2
  cat /tmp/quote-delta-api-smoke.log >&2 || true
  exit 1
fi

HEALTH="$(curl -fsS "$BASE/health")"
echo "$HEALTH" | grep -q '"ok":true'
echo "$HEALTH" | grep -q 'quote-delta-api'
echo "$HEALTH" | grep -q 'extract-and-verify'

EXTRACT="$(curl -fsS -X POST "$BASE/extract-and-verify" \
  -H 'Content-Type: application/json' \
  -d '{
    "transcript": {
      "transcriptId": "smoke-1",
      "vendorName": "Piedmont Haulers",
      "text": "For a two bedroom, base is nineteen hundred.\nStairs can be extra depending on the crew.",
      "jobSpec": {
        "origin": "Rock Hill, SC",
        "destination": "Charlotte, NC",
        "homeSize": "2-bedroom apartment",
        "distanceMiles": 45
      }
    }
  }')"

echo "$EXTRACT" | grep -q '"mode":'
echo "$EXTRACT" | grep -q 'mergeableAssertions'
echo "$EXTRACT" | grep -q 'verification'

STATUS="$(curl -fsS "$BASE/elevenlabs/status")"
echo "$STATUS" | grep -q '"configured":'

echo "API smoke checks passed on ${BASE}"
