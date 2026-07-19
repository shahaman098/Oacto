import { describe, expect, it, vi } from "vitest";
import { createOpenAIExtractionAdapter } from "../src/providers/openai";
import { createTavilyVerificationAdapter } from "../src/providers/tavily";

const sampleInput = {
  transcriptId: "paste-demo",
  vendorName: "Piedmont Haulers",
  text: "For a two bedroom, base is nineteen hundred.\nStairs can be extra.",
  jobSpec: {
    origin: "Rock Hill, SC",
    destination: "Charlotte, NC",
    homeSize: "2-bedroom apartment",
    distanceMiles: 45,
  },
};

describe("live provider adapters", () => {
  it("parses OpenAI JSON into validated assertions", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                assertions: [
                  {
                    label: "Base move",
                    amount: 1900,
                    status: "confirmed",
                    confidence: 0.91,
                    quote: "For a two bedroom, base is nineteen hundred.",
                    startLine: 1,
                    endLine: 1,
                  },
                ],
              }),
            },
          },
        ],
      }),
    });

    const adapter = createOpenAIExtractionAdapter({ OPENAI_API_KEY: "test-key" }, fetchImpl);
    const result = await adapter.extract(sampleInput);

    expect(result.mode).toBe("live");
    expect(result.assertions[0]?.label).toBe("Base move");
    expect(result.assertions[0]?.leverageEligible).toBe(true);
    expect(fetchImpl).toHaveBeenCalled();
  });

  it("falls back to fixture when OpenAI JSON is invalid", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "{\"assertions\":[]}" } }],
      }),
    });

    const adapter = createOpenAIExtractionAdapter({ OPENAI_API_KEY: "test-key" }, fetchImpl);
    const result = await adapter.extract(sampleInput);

    expect(result.mode).toBe("fixture");
    expect(result.warnings.some((warning) => /schema validation/i.test(warning))).toBe(true);
  });

  it("maps Tavily search results into web findings", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: "Stair fees are often excluded from base moving quotes.",
        results: [
          {
            title: "Piedmont Haulers FAQ",
            url: "https://example.com/faq",
            content: "Base quotes exclude access fees such as stairs.",
          },
        ],
      }),
    });

    const adapter = createTavilyVerificationAdapter({ TAVILY_API_KEY: "test-key" }, fetchImpl);
    const result = await adapter.verify(sampleInput);

    expect(result.mode).toBe("live");
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings.every((finding) => finding.evidence.kind === "web")).toBe(true);
  });
});
