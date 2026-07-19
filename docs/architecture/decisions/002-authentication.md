# ADR 002: Authentication

## Decision

Do not implement authentication in the first MVP.

## Rationale

The hackathon demo needs to prove quote extraction, evidence-backed comparison, and negotiation delta before account management. Adding auth now would increase build surface without improving the core judging moment.

## Future Direction

When persistence is added, use a managed auth provider such as Supabase Auth. Keep user data isolated by project/session owner and avoid storing raw recordings unless explicitly required.
