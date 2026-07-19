# Data Model

## Core Entities

- `JobSpec`: normalized request being quoted.
- `Vendor`: company or counterparty being evaluated.
- `QuoteAssertion`: one claim about price, fee, term, exclusion, or concession.
- `TranscriptEvidence`: source span that supports a quote assertion.
- `NegotiationAttempt`: follow-up interaction that uses verified leverage.
- `Recommendation`: ranked final offer with rationale and risks.

## Quote Assertion Rules

Each quote assertion must include:

- stable ID
- vendor ID
- field or category
- amount or term value when applicable
- status
- confidence
- transcript evidence reference

## Status Values

- `confirmed`: directly supported by transcript evidence.
- `vague`: mentioned without enough specificity.
- `hidden`: discovered later or not disclosed clearly.
- `contradicted`: conflicts with another source.
- `waived`: vendor removed the fee or restriction.
- `declined`: vendor refused a concession.

## Validation Outcome

The data model should prevent unsupported claims from being used as negotiation leverage.
