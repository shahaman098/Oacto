import type { ExtractAndVerifyResponse, ExtractedQuoteAssertion } from "@quote-delta/types";
import type { QuoteAssertion, VendorQuote } from "../../types/negotiation";

export const sampleExtractionTranscript = [
  "Dispatcher: Thanks for calling Piedmont Haulers.",
  "Buyer: Need a two-bedroom move Rock Hill to Charlotte this Saturday.",
  "Dispatcher: For a two bedroom, base is nineteen hundred.",
  "Dispatcher: Stairs can be extra depending on the crew.",
  "Dispatcher: If parking is far, there may be a carry charge.",
].join("\n");

export function toLedgerAssertions(assertions: ExtractedQuoteAssertion[]): QuoteAssertion[] {
  return assertions
    .filter(
      (assertion) =>
        assertion.evidence.kind === "transcript" &&
        assertion.evidence.quote.trim() &&
        assertion.evidence.startLine !== undefined &&
        assertion.evidence.endLine !== undefined,
    )
    .map((assertion) => ({
      id: assertion.id,
      label: assertion.label,
      amount: assertion.amount,
      status: assertion.status,
      evidence: {
        transcriptId: assertion.evidence.id,
        startLine: assertion.evidence.startLine as number,
        endLine: assertion.evidence.endLine as number,
        quote: assertion.evidence.quote,
      },
    }));
}

export function buildExtractedVendor(
  vendorName: string,
  assertions: ExtractedQuoteAssertion[],
): VendorQuote | null {
  const ledgerAssertions = toLedgerAssertions(assertions);
  if (ledgerAssertions.length === 0) {
    return null;
  }

  return {
    id: `extracted-${vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: vendorName,
    style: "AI extracted",
    transcriptSummary: "Structured from pasted transcript with evidence-backed assertions only.",
    assertions: ledgerAssertions,
  };
}

/** Deterministic browser fallback when the Vite API middleware is unavailable. */
export function fixtureExtractAndVerify(input: {
  transcriptId: string;
  vendorName: string;
  text: string;
}): ExtractAndVerifyResponse {
  const lines = input.text.split(/\r?\n/);
  const findLine = (pattern: RegExp) => {
    const index = lines.findIndex((line) => pattern.test(line));
    return {
      startLine: index >= 0 ? index + 1 : 1,
      endLine: index >= 0 ? index + 1 : 1,
      quote: (index >= 0 ? lines[index] : lines.find((line) => line.trim()) || input.text)
        .trim()
        .slice(0, 160),
    };
  };

  const assertions: ExtractedQuoteAssertion[] = [];

  if (/nineteen\s*hundred|1,?900|eighteen\s*fifty|1,?850/i.test(input.text)) {
    const amount = /nineteen\s*hundred|1,?900/i.test(input.text) ? 1900 : 1850;
    const span = findLine(/nineteen\s*hundred|1,?900|eighteen\s*fifty|1,?850|base/i);
    assertions.push({
      id: `${input.transcriptId}-base`,
      label: "Base move",
      amount,
      status: "confirmed",
      confidence: 0.92,
      leverageEligible: true,
      evidence: { kind: "transcript", id: input.transcriptId, ...span },
    });
  }

  if (/stairs/i.test(input.text)) {
    const span = findLine(/stairs/i);
    assertions.push({
      id: `${input.transcriptId}-stairs`,
      label: "Stairs fee",
      amount: 150,
      status: "vague",
      confidence: 0.55,
      leverageEligible: false,
      evidence: { kind: "transcript", id: input.transcriptId, ...span },
    });
  }

  if (/carry|parking is far/i.test(input.text)) {
    const span = findLine(/carry|parking is far/i);
    assertions.push({
      id: `${input.transcriptId}-carry`,
      label: "Long carry",
      amount: 125,
      status: "hidden",
      confidence: 0.7,
      leverageEligible: false,
      evidence: { kind: "transcript", id: input.transcriptId, ...span },
    });
  }

  if (assertions.length === 0) {
    const span = findLine(/.+/);
    assertions.push({
      id: `${input.transcriptId}-unparsed`,
      label: "Unparsed quote claim",
      amount: 0,
      status: "vague",
      confidence: 0.2,
      leverageEligible: false,
      evidence: { kind: "transcript", id: input.transcriptId, ...span },
    });
  }

  return {
    mode: "fixture",
    extraction: {
      mode: "fixture",
      vendorName: input.vendorName,
      assertions,
      warnings: [
        "API middleware unavailable; using deterministic fixture extraction for demo reliability.",
      ],
    },
    verification: {
      mode: "fixture",
      vendorName: input.vendorName,
      findings: [
        {
          id: "web-stairs-policy",
          severity: "warning",
          summary: "Public moving guides warn stairs fees are often quoted vaguely.",
          evidence: {
            kind: "web",
            id: "fixture-web-stairs",
            quote: "Stairs and long-carry fees should be confirmed in writing before booking.",
            title: "Fixture web evidence",
          },
        },
      ],
    },
    mergeableAssertions: assertions.filter(
      (assertion) => assertion.evidence.kind === "transcript" && assertion.evidence.quote.trim(),
    ),
  };
}

export async function runExtractAndVerify(input: {
  transcriptId: string;
  vendorName: string;
  text: string;
  jobSpec: {
    origin: string;
    destination: string;
    homeSize: string;
    distanceMiles: number;
  };
}): Promise<ExtractAndVerifyResponse> {
  try {
    const response = await fetch("/api/extract-and-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: input,
      }),
    });

    const payload = (await response.json()) as ExtractAndVerifyResponse | { error: string };
    if (!response.ok) {
      throw new Error("error" in payload ? payload.error : "Extraction request failed");
    }

    return payload as ExtractAndVerifyResponse;
  } catch {
    return fixtureExtractAndVerify({
      transcriptId: input.transcriptId,
      vendorName: input.vendorName,
      text: input.text,
    });
  }
}
