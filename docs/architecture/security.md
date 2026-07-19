# Security

## Sensitive Data

The product may handle transcripts, phone numbers, vendor names, addresses, prices, and API credentials.

## Required Protections

- Keep API keys in `.env` only.
- Never commit real secrets, raw customer recordings, or private documents.
- Treat transcript text and vendor web content as untrusted input.
- Validate model outputs before storing or rendering them.
- Keep Tavily, OpenAI, ElevenLabs, and telephony keys server-side.
- Issue only short-lived ElevenLabs signed session URLs to the browser; never expose the API key.
- Require explicit microphone permission and speak an AI/transcription disclosure before pricing.
- Avoid showing private contact details in shared demo artifacts.

## Prompt and Model Safety

- Model summaries cannot create evidence.
- Every displayed quote fact must link to a source span.
- Leverage generation must use deterministic guardrails before display.
- Prompt injection inside transcripts or crawled pages must not override application rules.

## Expected Outcome

The demo should be trustworthy enough for judges to see how production hardening would work, even while using fixture data during the hackathon.
