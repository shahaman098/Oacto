# Quote Delta Ledger

## Vision

Make opaque phone-priced services negotiable by proving what was said, what changed, and which leverage is honest to use.

## Problem

In moving, dental care, auto repair, contractors, and similar markets, the real price is often only available by phone. Buyers call several vendors, hear vague bundles and hidden fees, and then lose track of which terms are binding. A generic voice agent can place calls, but it does not by itself prove which fee changed or whether a competing-bid claim is honest.

## Target Users

- Primary: households buying phone-priced services under time pressure.
- Secondary: consumer advocates, family members helping compare quotes, and small businesses buying local services.
- Demo user: a person preparing a local move who needs three comparable quotes and one honest renegotiation.

## MVP

- Build one confirmed structured job specification.
- Simulate or run at least three voice-counterparty calls with distinct negotiation styles.
- Extract itemized quote assertions from transcripts.
- Link every quote field to transcript evidence.
- Mark each fee as confirmed, vague, hidden, contradicted, waived, or declined.
- Block fake competing bids and unsupported leverage.
- Show one price or term delta after a follow-up negotiation.
- Export a ranked recommendation with transcript receipts.

## Non-Goals

- Do not build a generic quote marketplace.
- Do not scrape quote aggregator websites instead of using conversations.
- Do not pretend the agent can make binding legal decisions.
- Do not use fake bids, fake inventory, or undisclosed AI impersonation.
- Do not support many verticals in the MVP; one vertical done well is stronger.

## Success Criteria

- The demo shows a price or term changing because of verified leverage.
- Every displayed quote total can be traced back to transcript spans.
- The system refuses an unsupported leverage prompt.
- Three negotiation styles produce structured outcomes.
- A judge can understand the before/after transformation in under 60 seconds.

## Constraints

- Hackathon-first scope: prioritize a reliable demo over broad integrations.
- Voice calls may be real, role-played, or counterparty-agent based.
- If external telephony is unreliable, use recorded or live role-play calls and preserve the same data contracts.
- Secrets must stay in `.env` and must never be committed.
