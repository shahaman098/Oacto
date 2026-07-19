# Review Change

Use this skill when reviewing a proposed or completed change.

## Review Priorities

1. Product correctness against `PRODUCT.md`.
2. Evidence integrity for quote and leverage claims.
3. Security of secrets, transcripts, and provider outputs.
4. Type safety and validation.
5. Test coverage for changed behavior.
6. Demo reliability.

## Required Checks

- Run or inspect `./scripts/check.sh`.
- Confirm no secrets or private recordings are committed.
- Confirm user-visible changes match acceptance criteria.

## Output

Lead with bugs, risks, or missing tests. Keep summaries secondary.
