# Build Feature

Use this skill when adding a new product feature to Quote Delta Ledger.

## Required Context

Read:

- `PRODUCT.md`
- `PLANS.md`
- `docs/product/requirements.md`
- `docs/product/acceptance-criteria.md`
- `docs/architecture/overview.md`
- the active plan in `docs/plans/active`

## Process

1. Identify the user outcome and demo outcome.
2. Keep the implementation to one vertical slice.
3. Update shared types or validation before UI wiring when contracts change.
4. Add or update unit tests for domain logic.
5. Add or update e2e coverage when the user workflow changes.
6. Run `./scripts/check.sh`.

## Definition of Done

The feature is done when it satisfies acceptance criteria, is tested, and updates the relevant plan or docs.
