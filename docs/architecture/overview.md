# Architecture Overview

## System Shape

Quote Delta Ledger is structured as a pnpm workspace. The current MVP is a frontend-first demo in `apps/web`; the `apps/api` package is scaffolded for server-side integrations once live transcript, model, and search flows are added.

## Components

- `apps/web`: React/Vite app for the judge-facing product experience.
- `apps/api`: future server boundary for ingestion, extraction, verification, and provider adapters.
- `packages/ui`: future shared UI primitives.
- `packages/types`: future shared TypeScript contracts.
- `packages/validation`: future schemas for transcript, quote, and vendor inputs.
- `packages/config`: future shared config loading.
- `packages/shared`: future framework-independent utilities.

## Data Flow

1. User confirms a structured job spec.
2. Calls or fixtures produce transcripts.
3. Extraction creates quote assertions with evidence references.
4. Ledger logic classifies assertion status and calculates totals.
5. Honesty checks decide which leverage can be used.
6. Follow-up negotiation creates a before/after delta.
7. Recommendation view ranks offers and exposes evidence.

## Dependency Direction

Frontend components can depend on feature selectors and shared types. Domain logic must not depend on React. Provider clients must sit behind API adapters before production use.

## Expected Technical Outcome

The codebase should make it easy for Codex or a human developer to add one complete vertical slice at a time: data contract, implementation, tests, docs, and verification.
