import { describe, expect, it } from "vitest";
import {
  buildExtractedVendor,
  fixtureExtractAndVerify,
  sampleExtractionTranscript,
  toLedgerAssertions,
} from "../src/features/negotiation/extractionClient";
import type { ExtractedQuoteAssertion } from "@quote-delta/types";

const sampleAssertions: ExtractedQuoteAssertion[] = [
  {
    id: "paste-demo-base",
    label: "Base move",
    amount: 1900,
    status: "confirmed",
    confidence: 0.9,
    leverageEligible: true,
    evidence: {
      kind: "transcript",
      id: "paste-demo",
      startLine: 3,
      endLine: 3,
      quote: "For a two bedroom, base is nineteen hundred.",
    },
  },
  {
    id: "paste-demo-web-only",
    label: "Fake web price",
    amount: 100,
    status: "confirmed",
    confidence: 0.4,
    leverageEligible: false,
    evidence: {
      kind: "web",
      id: "web-1",
      url: "https://example.com",
      title: "Pricing page",
      quote: "Online special 100",
    },
  },
];

describe("extraction client helpers", () => {
  it("keeps only transcript-backed assertions for ledger merge", () => {
    const merged = toLedgerAssertions(sampleAssertions);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.evidence.transcriptId).toBe("paste-demo");
  });

  it("builds a vendor card from mergeable assertions", () => {
    const vendor = buildExtractedVendor("Piedmont Haulers", sampleAssertions);
    expect(vendor?.name).toBe("Piedmont Haulers");
    expect(vendor?.assertions).toHaveLength(1);
  });

  it("builds a deterministic fixture response for demo fallback", () => {
    const result = fixtureExtractAndVerify({
      transcriptId: "paste-demo",
      vendorName: "Piedmont Haulers",
      text: sampleExtractionTranscript,
    });

    expect(result.mode).toBe("fixture");
    expect(result.extraction.assertions.length).toBeGreaterThan(0);
    expect(result.verification.findings[0]?.severity).toBe("warning");
    expect(result.mergeableAssertions.length).toBeGreaterThan(0);
  });
});
