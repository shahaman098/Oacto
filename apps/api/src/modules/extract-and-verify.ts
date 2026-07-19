import type {
  ExtractAndVerifyRequest,
  ExtractAndVerifyResponse,
  ExtractedQuoteAssertion,
  IntegrationMode,
} from "@quote-delta/types";
import {
  extractAndVerifyRequestSchema,
  extractAndVerifyResponseSchema,
} from "@quote-delta/validation";
import { createOpenAIExtractionAdapter, type OpenAIExtractionAdapter } from "../providers/openai";
import { createTavilyVerificationAdapter, type TavilyVerificationAdapter } from "../providers/tavily";

function isMergeable(assertion: ExtractedQuoteAssertion): boolean {
  return (
    assertion.evidence.kind === "transcript" &&
    Boolean(assertion.evidence.quote.trim()) &&
    assertion.evidence.startLine !== undefined &&
    assertion.evidence.endLine !== undefined
  );
}

function resolveMode(
  extractionMode: IntegrationMode,
  verificationMode: IntegrationMode,
): IntegrationMode {
  return extractionMode === "live" || verificationMode === "live" ? "live" : "fixture";
}

export async function extractAndVerify(
  rawRequest: ExtractAndVerifyRequest,
  deps?: {
    openai?: OpenAIExtractionAdapter;
    tavily?: TavilyVerificationAdapter;
  },
): Promise<ExtractAndVerifyResponse> {
  const request = extractAndVerifyRequestSchema.parse(rawRequest);
  const openai = deps?.openai ?? createOpenAIExtractionAdapter();
  const tavily = deps?.tavily ?? createTavilyVerificationAdapter();

  const extraction = await openai.extract(request.transcript);
  const verification = await tavily.verify(request.transcript);

  const mergeableAssertions = extraction.assertions
    .filter(isMergeable)
    .map((assertion) => ({
      ...assertion,
      leverageEligible:
        assertion.status === "confirmed" &&
        assertion.evidence.kind === "transcript" &&
        Boolean(assertion.evidence.quote.trim()),
    }));

  const response: ExtractAndVerifyResponse = {
    mode: resolveMode(extraction.mode, verification.mode),
    extraction: {
      ...extraction,
      assertions: extraction.assertions.map((assertion) => ({
        ...assertion,
        leverageEligible:
          assertion.status === "confirmed" &&
          assertion.evidence.kind === "transcript" &&
          Boolean(assertion.evidence.quote.trim()),
      })),
    },
    verification,
    mergeableAssertions,
  };

  return extractAndVerifyResponseSchema.parse(response);
}
