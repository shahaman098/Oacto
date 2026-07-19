import { describe, expect, it } from "vitest";
import { extractAndVerify } from "../src/modules/extract-and-verify";
import { fixtureExtractTranscript } from "../src/providers/fixtures";
import { fixtureVerifyVendor } from "../src/providers/tavily";

const sampleTranscript = {
  transcriptId: "paste-demo",
  vendorName: "Piedmont Haulers",
  text: [
    "Dispatcher: Thanks for calling Piedmont Haulers.",
    "For a two bedroom, base is nineteen hundred.",
    "Stairs can be extra depending on the crew.",
    "If parking is far, there may be a carry charge.",
  ].join("\n"),
  jobSpec: {
    origin: "Rock Hill, SC",
    destination: "Charlotte, NC",
    homeSize: "2-bedroom apartment",
    distanceMiles: 45,
  },
};

describe("fixture extraction and verification", () => {
  it("extracts confirmed base and flags vague/hidden fees", () => {
    const extraction = fixtureExtractTranscript(sampleTranscript);
    expect(extraction.mode).toBe("fixture");
    expect(extraction.assertions.some((item) => item.label === "Base move" && item.status === "confirmed")).toBe(
      true,
    );
    expect(extraction.assertions.some((item) => item.label === "Stairs fee" && item.status === "vague")).toBe(true);
    expect(extraction.assertions.some((item) => item.label === "Long carry" && item.status === "hidden")).toBe(true);
    expect(
      extraction.assertions.find((item) => item.label === "Base move")?.leverageEligible,
    ).toBe(true);
    expect(
      extraction.assertions.find((item) => item.label === "Stairs fee")?.leverageEligible,
    ).toBe(false);
  });

  it("returns web verification warnings in fixture mode", () => {
    const verification = fixtureVerifyVendor(sampleTranscript);
    expect(verification.findings.length).toBeGreaterThan(0);
    expect(verification.findings.some((finding) => finding.evidence.kind === "web")).toBe(true);
    expect(verification.findings.some((finding) => finding.severity === "warning")).toBe(true);
  });

  it("only merges assertions that have transcript evidence", async () => {
    const result = await extractAndVerify(
      { transcript: sampleTranscript },
      {
        openai: { extract: async () => fixtureExtractTranscript(sampleTranscript) },
        tavily: { verify: async () => fixtureVerifyVendor(sampleTranscript) },
      },
    );

    expect(result.mode).toBe("fixture");
    expect(result.mergeableAssertions.length).toBeGreaterThan(0);
    expect(result.mergeableAssertions.every((item) => item.evidence.kind === "transcript")).toBe(true);
    expect(result.verification.findings[0]?.evidence.kind).toBe("web");
  });
});
