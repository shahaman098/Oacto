# Release Product

Use this skill before sharing the demo publicly or submitting to the hackathon.

## Required Context

Read:

- `docs/product/acceptance-criteria.md`
- `docs/runbooks/deployment.md`
- `docs/runbooks/incident-response.md`
- `docs/plans/active/001-mvp.md`

## Release Steps

1. Run `./scripts/check.sh`.
2. Confirm demo data is safe to share.
3. Confirm `.env` files and secrets are not tracked.
4. Build the web app.
5. Open the deployed or preview URL and run the judging demo path.
6. Prepare fallback screenshots or fixture data if live APIs fail.

## Release Outcome

The product is ready when a judge can open the demo, understand the core value quickly, and see a verified before/after negotiation result.
