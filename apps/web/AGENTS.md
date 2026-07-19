# Web App Instructions

## Scope

This package owns the React/Vite user experience for Quote Delta Ledger.

## Boundaries

- App composition belongs in `src/app`.
- Negotiation UI and feature state belong in `src/features`.
- Reusable presentational pieces belong in `src/components`.
- Shared frontend helpers belong in `src/lib`.
- Cross-package contracts should move to `packages/types` or `packages/validation` once reused by the API.

## Commands

- Development: `pnpm --filter @quote-delta/web dev`
- Lint: `pnpm --filter @quote-delta/web lint`
- Type check: `pnpm --filter @quote-delta/web typecheck`
- Unit tests: `pnpm --filter @quote-delta/web test`
- Build: `pnpm --filter @quote-delta/web build`

## UX Rules

- Keep the first screen as the product experience, not a marketing page.
- Every quote, fee, and leverage recommendation must expose supporting evidence.
- Do not show unverified AI claims as facts.
- Design for a judge to understand the demo in under 60 seconds.
