import type {
  ExtractedQuoteAssertion,
  ExtractionResponse,
  TranscriptInput,
} from "@quote-delta/types";
import { extractedQuoteAssertionSchema, feeStatusSchema } from "@quote-delta/validation";
import { z } from "zod";
import { fixtureExtractTranscript } from "./fixtures";

export interface OpenAIExtractionAdapter {
  extract(input: TranscriptInput): Promise<ExtractionResponse>;
}

const liveAssertionSchema = z.object({
  id: z.string().min(1).optional(),
  label: z.string().min(1),
  amount: z.number().nonnegative(),
  status: feeStatusSchema,
  confidence: z.number().min(0).max(1).optional(),
  quote: z.string().min(1),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
});

const liveExtractionSchema = z.object({
  assertions: z.array(liveAssertionSchema).min(1),
  warnings: z.array(z.string()).optional(),
});

function toExtractedAssertion(
  transcriptId: string,
  assertion: z.infer<typeof liveAssertionSchema>,
  index: number,
): ExtractedQuoteAssertion {
  const candidate = {
    id: assertion.id ?? `${transcriptId}-live-${index + 1}`,
    label: assertion.label,
    amount: assertion.amount,
    status: assertion.status,
    confidence: assertion.confidence ?? 0.75,
    evidence: {
      kind: "transcript" as const,
      id: transcriptId,
      startLine: assertion.startLine,
      endLine: assertion.endLine,
      quote: assertion.quote,
    },
    leverageEligible:
      assertion.status === "confirmed" && assertion.quote.trim().length > 0,
  };

  return extractedQuoteAssertionSchema.parse(candidate);
}

function parseLiveContent(content: string, input: TranscriptInput): ExtractionResponse | null {
  try {
    const parsed = liveExtractionSchema.parse(JSON.parse(content));
    return {
      mode: "live",
      vendorName: input.vendorName,
      assertions: parsed.assertions.map((assertion, index) =>
        toExtractedAssertion(input.transcriptId, assertion, index),
      ),
      warnings: parsed.warnings ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * Live OpenAI adapter. Without OPENAI_API_KEY (or when FORCE_FIXTURE_PROVIDERS=true),
 * returns deterministic fixture extraction.
 */
export function createOpenAIExtractionAdapter(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): OpenAIExtractionAdapter {
  return {
    async extract(input: TranscriptInput): Promise<ExtractionResponse> {
      const apiKey = env.OPENAI_API_KEY?.trim();
      if (!apiKey || env.FORCE_FIXTURE_PROVIDERS === "true") {
        return fixtureExtractTranscript(input);
      }

      try {
        const response = await fetchImpl("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: env.OPENAI_MODEL || "gpt-4o-mini",
            temperature: 0,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: [
                  "Extract itemized moving quote assertions from a vendor call transcript.",
                  "Return JSON: { assertions: [{ id?, label, amount, status, confidence?, quote, startLine, endLine }], warnings?: string[] }",
                  "status must be one of confirmed|vague|hidden|contradicted|waived|declined.",
                  "Every assertion must include an exact transcript quote and 1-based line numbers.",
                  "Do not invent fees that are not in the transcript.",
                ].join(" "),
              },
              {
                role: "user",
                content: JSON.stringify({
                  vendorName: input.vendorName,
                  jobSpec: input.jobSpec,
                  transcriptId: input.transcriptId,
                  transcript: input.text,
                }),
              },
            ],
          }),
        });

        if (!response.ok) {
          const fallback = fixtureExtractTranscript(input);
          return {
            ...fallback,
            warnings: [
              ...fallback.warnings,
              `OpenAI request failed with ${response.status}; fixture extraction used.`,
            ],
          };
        }

        const payload = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = payload.choices?.[0]?.message?.content;
        if (!content) {
          const fallback = fixtureExtractTranscript(input);
          return {
            ...fallback,
            warnings: [...fallback.warnings, "OpenAI returned empty content; fixture extraction used."],
          };
        }

        const live = parseLiveContent(content, input);
        if (!live) {
          const fallback = fixtureExtractTranscript(input);
          return {
            ...fallback,
            warnings: [
              ...fallback.warnings,
              "OpenAI JSON failed schema validation; fixture extraction used.",
            ],
          };
        }

        return live;
      } catch (error) {
        const fallback = fixtureExtractTranscript(input);
        return {
          ...fallback,
          warnings: [
            ...fallback.warnings,
            `OpenAI adapter error: ${error instanceof Error ? error.message : "unknown"}; fixture used.`,
          ],
        };
      }
    },
  };
}
