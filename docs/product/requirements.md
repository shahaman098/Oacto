# Product Requirements

## Product

Quote Delta Ledger turns phone-based vendor negotiations into an auditable quote comparison system.

## Mission

Help buyers get better outcomes in opaque service markets by proving what vendors said, identifying real quote differences, and recommending only honest leverage.

## Expected Outcomes

- User outcome: the buyer knows which offer is actually best after fees, exclusions, and concessions.
- Product outcome: transcripts become structured quote records with evidence references.
- Demo outcome: judges see one before/after negotiation delta and can inspect why it is legitimate.
- Business outcome: the product creates trust in AI-assisted negotiation by making claims auditable.
- Technical outcome: the MVP has deterministic quote logic, typed contracts, tested guardrails, and a single verification command.

## MVP Requirements

- Capture or simulate one confirmed service request.
- Represent at least three vendor quote conversations.
- Extract itemized quote assertions into a normalized ledger.
- Link each assertion to transcript evidence.
- Classify quote items as confirmed, vague, hidden, contradicted, waived, or declined.
- Calculate comparable all-in totals.
- Block unsupported leverage claims.
- Show one negotiated price or term delta.
- Rank final offers with evidence-backed reasoning.
- Run one real browser voice negotiation through ElevenLabs and attach the conversation ID and post-call proof.
- Keep the live voice path strict: report failures and never relabel fixtures as a connected call.

## Target User

The primary user is a consumer or small business owner buying a phone-priced service under time pressure. The hackathon demo user is planning a local move and needs three comparable quotes.

## Constraints

- One vertical is enough for the MVP.
- Demo data may be fixture-backed if it preserves real integration contracts.
- Secrets stay in `.env` and are never committed.
- Raw real customer recordings should not be committed.
