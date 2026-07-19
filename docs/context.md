# Project Context

## Hackathon Context

Quote Delta Ledger is being built for HackNation July 2026 as a high-upside entry around AI-assisted negotiation. The selected challenge direction is voice negotiation, with the product focused on proof, evidence, and measurable deal improvement rather than generic call automation.

## Product Context

The buyer is trying to purchase a phone-priced service. The MVP uses a local moving scenario because moving quotes are often opaque, fee-heavy, and hard to compare. The product converts vendor conversations into structured quote evidence and then shows which negotiation claims are honest to use.

## Build Context

The current repository is a pnpm workspace:

- `apps/web` contains the working React/Vite MVP.
- `apps/api` is scaffolded for live integrations.
- `packages` is reserved for shared code once reuse is real.
- `docs` contains the product constitution, architecture, plans, and runbooks.

## Decision Context

Default to the highest-upside demo path:

- Show a measurable before/after negotiation result.
- Make every claim inspectable.
- Favor one strong vertical over many shallow verticals.
- Keep live API integrations behind deterministic fallback data.

## Verification Context

Before calling work complete, run:

```bash
./scripts/check.sh
```
