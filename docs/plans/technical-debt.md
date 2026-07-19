# Technical Debt

## Current Debt

- Live OpenAI response parsing still returns fixture-shaped assertions after a successful HTTP call; full structured live parsing is gated for demo reliability.
- Outbound PSTN transport still needs a Twilio number or SIP trunk; the current completed slice is a real browser-to-ElevenLabs voice conversation.
- Live transcript proof is held in browser state for the hackathon demo; production persistence and webhook signature validation remain future work.
- Root `dist` may exist from the earlier single-package build and can be ignored.

## Rules

- Do not work on technical debt unless it improves the hackathon demo or reduces immediate risk.
- Convert a debt item into an active plan before implementing it.
