import type {
  ExtractedQuoteAssertion,
  ExtractionResponse,
  TranscriptInput,
} from "@quote-delta/types";

function findSnippet(text: string, patterns: RegExp[]): { startLine: number; endLine: number; quote: string } {
  const lines = text.split(/\r?\n/);

  for (const pattern of patterns) {
    const index = lines.findIndex((line) => pattern.test(line));
    if (index >= 0) {
      return {
        startLine: index + 1,
        endLine: index + 1,
        quote: lines[index]?.trim() || text.trim().slice(0, 160),
      };
    }
  }

  const first = lines.find((line) => line.trim())?.trim() || text.trim().slice(0, 160);
  return { startLine: 1, endLine: 1, quote: first };
}

function withLeverage(
  assertion: Omit<ExtractedQuoteAssertion, "leverageEligible">,
): ExtractedQuoteAssertion {
  const hasTranscriptEvidence =
    assertion.evidence.kind === "transcript" && assertion.evidence.quote.trim().length > 0;

  return {
    ...assertion,
    leverageEligible: assertion.status === "confirmed" && hasTranscriptEvidence,
  };
}

/** Deterministic extraction used when OpenAI is unavailable. */
export function fixtureExtractTranscript(input: TranscriptInput): ExtractionResponse {
  const text = input.text;
  const assertions: ExtractedQuoteAssertion[] = [];

  if (/eighteen\s*fifty|1,?850|\$\s*1,?850|nineteen\s*hundred|1,?900|\$\s*1,?900/i.test(text)) {
    const amount = /nineteen\s*hundred|1,?900|\$\s*1,?900/i.test(text) ? 1900 : 1850;
    const span = findSnippet(text, [
      /nineteen\s*hundred|1,?900|\$\s*1,?900/i,
      /eighteen\s*fifty|1,?850|\$\s*1,?850/i,
      /base/i,
    ]);

    assertions.push(
      withLeverage({
        id: `${input.transcriptId}-base`,
        label: "Base move",
        amount,
        status: "confirmed",
        confidence: 0.92,
        evidence: {
          kind: "transcript",
          id: input.transcriptId,
          startLine: span.startLine,
          endLine: span.endLine,
          quote: span.quote,
        },
      }),
    );
  }

  if (/stairs/i.test(text)) {
    const span = findSnippet(text, [/stairs/i]);
    const vague = /may be|can be|depending|extra/i.test(span.quote);

    assertions.push(
      withLeverage({
        id: `${input.transcriptId}-stairs`,
        label: "Stairs fee",
        amount: vague ? 150 : 0,
        status: vague ? "vague" : "waived",
        confidence: vague ? 0.55 : 0.84,
        evidence: {
          kind: "transcript",
          id: input.transcriptId,
          startLine: span.startLine,
          endLine: span.endLine,
          quote: span.quote,
        },
      }),
    );
  }

  if (/long carry|carry charge|parking is far/i.test(text)) {
    const span = findSnippet(text, [/long carry|carry charge|parking is far|carry/i]);
    assertions.push(
      withLeverage({
        id: `${input.transcriptId}-carry`,
        label: "Long carry",
        amount: 125,
        status: "hidden",
        confidence: 0.7,
        evidence: {
          kind: "transcript",
          id: input.transcriptId,
          startLine: span.startLine,
          endLine: span.endLine,
          quote: span.quote,
        },
      }),
    );
  }

  if (assertions.length === 0) {
    const span = findSnippet(text, [/.+/]);
    assertions.push(
      withLeverage({
        id: `${input.transcriptId}-unparsed`,
        label: "Unparsed quote claim",
        amount: 0,
        status: "vague",
        confidence: 0.2,
        evidence: {
          kind: "transcript",
          id: input.transcriptId,
          startLine: span.startLine,
          endLine: span.endLine,
          quote: span.quote,
        },
      }),
    );
  }

  return {
    mode: "fixture",
    vendorName: input.vendorName,
    assertions,
    warnings: ["OpenAI key absent or live call skipped; using deterministic fixture extraction."],
  };
}
