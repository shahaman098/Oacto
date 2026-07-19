import type {
  TranscriptInput,
  VendorVerificationFinding,
  VerificationResponse,
} from "@quote-delta/types";
import { vendorVerificationFindingSchema } from "@quote-delta/validation";
import { z } from "zod";

export function fixtureVerifyVendor(input: TranscriptInput): VerificationResponse {
  return {
    mode: "fixture",
    vendorName: input.vendorName,
    findings: [
      {
        id: `${input.transcriptId}-web-stairs`,
        severity: "warning",
        summary: `${input.vendorName} public site lists base rates but does not disclose stair surcharges clearly.`,
        evidence: {
          kind: "web",
          id: "tavily-fixture-stairs-policy",
          title: `${input.vendorName} pricing FAQ`,
          url: "https://example.com/vendor-pricing-faq",
          quote: "Base quotes exclude access fees unless confirmed in writing.",
        },
      },
      {
        id: `${input.transcriptId}-web-license`,
        severity: "confirmed",
        summary: `Public listing confirms ${input.vendorName} operates local residential moves near ${input.jobSpec.destination}.`,
        evidence: {
          kind: "web",
          id: "tavily-fixture-license",
          title: "Local mover directory",
          url: "https://example.com/local-movers",
          quote: "Licensed for household moves within the metro area.",
        },
      },
    ],
  };
}

export interface TavilyVerificationAdapter {
  verify(input: TranscriptInput): Promise<VerificationResponse>;
}

const tavilyResultSchema = z.object({
  title: z.string().optional(),
  url: z.string().url().optional(),
  content: z.string().optional(),
});

const tavilyResponseSchema = z.object({
  answer: z.string().optional(),
  results: z.array(tavilyResultSchema).optional(),
});

function mapLiveFindings(
  input: TranscriptInput,
  payload: z.infer<typeof tavilyResponseSchema>,
): VendorVerificationFinding[] {
  const findings: VendorVerificationFinding[] = [];

  if (payload.answer?.trim()) {
    findings.push(
      vendorVerificationFindingSchema.parse({
        id: `${input.transcriptId}-tavily-answer`,
        severity: /fee|stair|hidden|exclude|surcharge/i.test(payload.answer) ? "warning" : "info",
        summary: payload.answer.trim(),
        evidence: {
          kind: "web",
          id: "tavily-answer",
          title: "Tavily answer",
          url: "https://api.tavily.com/search",
          quote: payload.answer.trim().slice(0, 280),
        },
      }),
    );
  }

  for (const [index, result] of (payload.results ?? []).slice(0, 3).entries()) {
    const quote = (result.content ?? result.title ?? "").trim();
    if (!quote) {
      continue;
    }

    findings.push(
      vendorVerificationFindingSchema.parse({
        id: `${input.transcriptId}-tavily-${index + 1}`,
        severity: /fee|stair|hidden|exclude|surcharge|access/i.test(quote) ? "warning" : "confirmed",
        summary: `${result.title ?? "Web source"} mentions pricing or service terms for ${input.vendorName}.`,
        evidence: {
          kind: "web",
          id: `tavily-result-${index + 1}`,
          title: result.title ?? "Tavily result",
          url: result.url ?? "https://example.com/tavily-result",
          quote: quote.slice(0, 280),
        },
      }),
    );
  }

  return findings;
}

/**
 * Live Tavily adapter. Without TAVILY_API_KEY (or when FORCE_FIXTURE_PROVIDERS=true),
 * returns deterministic fixture findings.
 */
export function createTavilyVerificationAdapter(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): TavilyVerificationAdapter {
  return {
    async verify(input: TranscriptInput): Promise<VerificationResponse> {
      const apiKey = env.TAVILY_API_KEY?.trim();
      if (!apiKey || env.FORCE_FIXTURE_PROVIDERS === "true") {
        return fixtureVerifyVendor(input);
      }

      try {
        const response = await fetchImpl("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: apiKey,
            query: `${input.vendorName} moving fees stairs pricing policy ${input.jobSpec.destination}`,
            include_answer: true,
            max_results: 3,
          }),
        });

        if (!response.ok) {
          const fallback = fixtureVerifyVendor(input);
          return {
            ...fallback,
            mode: "fixture",
          };
        }

        const parsed = tavilyResponseSchema.safeParse(await response.json());
        if (!parsed.success) {
          return fixtureVerifyVendor(input);
        }

        const findings = mapLiveFindings(input, parsed.data);
        if (findings.length === 0) {
          return fixtureVerifyVendor(input);
        }

        return {
          mode: "live",
          vendorName: input.vendorName,
          findings,
        };
      } catch {
        return fixtureVerifyVendor(input);
      }
    },
  };
}
