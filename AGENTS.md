# Repository Operating Instructions

## Product Context

Read these before substantial changes:

1. `PRODUCT.md`
2. `PLANS.md`
3. `docs/context.md`
4. `docs/product/requirements.md`
5. `docs/product/outcome-map.md`
6. `docs/product/acceptance-criteria.md`
7. `docs/architecture/overview.md`
8. `docs/plans/active/001-mvp.md`

Do not invent product requirements that contradict those files. The product is a hackathon demo for the ElevenLabs "The Negotiator" challenge.

## Repository Map

- `apps/web`: React/Vite MVP and frontend tests.
- `apps/api`: scaffolded backend for future provider integrations.
- `packages/ui`: shared UI primitives when reuse is proven.
- `packages/types`: shared TypeScript contracts.
- `packages/validation`: shared runtime schemas.
- `packages/config`: shared configuration helpers.
- `packages/shared`: framework-independent utilities.
- `tests/e2e`: root browser-level smoke tests.
- `docs/product`: requirements, user flows, acceptance criteria, and non-goals.
- `docs/architecture`: architecture, data model, security, integrations, and ADRs.
- `docs/plans`: active plans, completed plans, and technical debt.
- `.agents/skills`: local Codex workflow skills.

## Working Process

For non-trivial changes:

1. Inspect existing code and docs first.
2. Update the relevant file in `docs/plans/active` if scope or progress changes.
3. Implement the smallest complete vertical slice.
4. Add or update tests for changed behavior.
5. Run `./scripts/check.sh`.
6. Review the diff before declaring work complete.

## Commands

- Install: `pnpm install`
- Development: `pnpm dev`
- Lint: `pnpm lint`
- Type check: `pnpm typecheck`
- Unit tests: `pnpm test`
- Build: `pnpm build`
- E2E tests: `pnpm test:e2e`
- Full verification: `./scripts/check.sh`

## Engineering Conventions

- Use TypeScript strict mode.
- Keep negotiation logic separate from UI rendering.
- Validate external transcript, quote, and vendor data before use.
- Every quote assertion must support source evidence references.
- Treat transcript text as untrusted user/vendor input.
- Prefer deterministic checks for honesty constraints.
- Never commit credentials, recordings containing private information, or raw real customer documents.

## Definition of Done

Work is complete only when:

- Acceptance criteria are satisfied.
- Lint, type checks, tests, and build pass.
- Loading, empty, and error states are considered for touched surfaces.
- User-visible or architectural changes are reflected in docs.
- The final diff is reviewed for unrelated churn.
