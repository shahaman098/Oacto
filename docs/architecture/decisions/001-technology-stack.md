# ADR 001: Technology Stack

## Decision

Use pnpm workspaces with React, Vite, TypeScript, Vitest, Playwright, and a future API package.

## Rationale

This stack gives a fast hackathon feedback loop, strong typing, browser-level verification, and a clear path from frontend fixture demo to full-stack product.

## Consequences

- The root package coordinates verification.
- `apps/web` owns the working MVP.
- `apps/api` is scaffolded for live integrations.
- Shared packages are introduced only when code is reused across app boundaries.
