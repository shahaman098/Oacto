import { describe, expect, it } from "vitest";
import {
  extractAndVerifyRequestSchema,
  extractedQuoteAssertionSchema,
  evidenceSourceSchema,
} from "../src/index";

describe("validation schemas", () => {
  it("accepts a valid transcript extraction request", () => {
    const parsed = extractAndVerifyRequestSchema.parse({
      transcript: {
        transcriptId: "paste-1",
        vendorName: "Piedmont Haulers",
        text: "Base is 1900. Stairs may be extra.",
        jobSpec: {
          origin: "Rock Hill, SC",
          destination: "Charlotte, NC",
          homeSize: "2-bedroom apartment",
          distanceMiles: 45,
        },
      },
    });

    expect(parsed.transcript.vendorName).toBe("Piedmont Haulers");
  });

  it("requires line ranges for transcript evidence", () => {
    const result = evidenceSourceSchema.safeParse({
      kind: "transcript",
      id: "call-x",
      quote: "Base is nineteen hundred.",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty quote evidence on assertions", () => {
    const result = extractedQuoteAssertionSchema.safeParse({
      id: "x",
      label: "Base",
      amount: 100,
      status: "confirmed",
      confidence: 0.9,
      evidence: {
        kind: "transcript",
        id: "call-x",
        startLine: 1,
        endLine: 2,
        quote: "",
      },
      leverageEligible: true,
    });

    expect(result.success).toBe(false);
  });
});
