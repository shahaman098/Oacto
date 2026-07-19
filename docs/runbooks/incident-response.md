# Incident Response

## Scope

This runbook covers demo and early-product issues.

## Common Incidents

- Demo app fails to load.
- API key is exposed.
- Transcript or private customer data is accidentally committed.
- Live provider API is unavailable.

## Response

1. Stop using the affected demo path.
2. Rotate any exposed credential immediately.
3. Remove private data from the working tree and repository history before sharing.
4. Switch to fixture-backed fallback data for the demo.
5. Record the issue in `docs/plans/technical-debt.md` if follow-up work remains.
