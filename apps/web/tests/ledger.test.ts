import { describe, expect, it } from "vitest";
import {
  demoJobSpec,
  demoNegotiation,
  demoVendors,
  demoVendorsAfterNegotiation,
  demoTruthGateProbes,
} from "../src/features/negotiation/fixtures";
import {
  bestOffer,
  buildRecommendation,
  canUseAsLeverage,
  evaluateTruthGateProbe,
  formatExportReport,
  leverageDecision,
  negotiationDelta,
  nextNegotiationPhase,
  quoteTotal,
  rankOffers,
  riskFlags,
  vendorsForPhase,
} from "../src/features/negotiation/ledger";
import type { QuoteAssertion } from "../src/types/negotiation";

describe("quote ledger", () => {
  it("computes quote totals from confirmed and waived fee statuses only", () => {
    expect(quoteTotal(demoVendors[0])).toBe(1850);
    expect(quoteTotal(demoVendors[1])).toBe(1850);
  });

  it("ranks the lowest comparable offer", () => {
    const offer = bestOffer(demoVendors);
    expect(offer.vendor.name).toBe("Queen City Movers");
    expect(offer.total).toBe(1850);
  });

  it("computes negotiated savings without negative deltas", () => {
    expect(negotiationDelta(1850, 1800)).toBe(50);
    expect(negotiationDelta(1800, 1900)).toBe(0);
  });

  it("allows leverage only when a confirmed assertion has transcript evidence", () => {
    const confirmed = demoVendors[1].assertions[0];
    const vague = demoVendors[0].assertions[1];
    expect(canUseAsLeverage(confirmed)).toBe(true);
    expect(canUseAsLeverage(vague)).toBe(false);
  });

  it("blocks missing or unsupported leverage", () => {
    const decision = leverageDecision(demoVendors, {
      ...demoNegotiation,
      leverageAssertionId: "missing",
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("not present");
  });

  it("blocks fabricated evidence even with a confirmed status", () => {
    const assertion: QuoteAssertion = {
      ...demoVendors[1].assertions[0],
      evidence: { ...demoVendors[1].assertions[0].evidence, quote: "" },
    };

    expect(canUseAsLeverage(assertion)).toBe(false);
  });

  it("evaluates truth-gate probes against confirmed transcript evidence", () => {
    const fabricated = evaluateTruthGateProbe(demoTruthGateProbes[0], demoVendors);
    const supported = evaluateTruthGateProbe(demoTruthGateProbes[1], demoVendors);

    expect(fabricated.allowed).toBe(false);
    expect(fabricated.reason).toContain("Blocked");
    expect(supported.allowed).toBe(true);
    expect(supported.evidenceRef).toBe("call-b lines 18-21");
  });
});

describe("negotiation phase and recommendation", () => {
  it("advances ready → running → complete", () => {
    expect(nextNegotiationPhase("ready")).toBe("running");
    expect(nextNegotiationPhase("running")).toBe("complete");
    expect(nextNegotiationPhase("complete")).toBe("complete");
  });

  it("swaps vendor fixtures when negotiation completes", () => {
    const before = vendorsForPhase("ready", demoVendors, demoVendorsAfterNegotiation);
    const after = vendorsForPhase("complete", demoVendors, demoVendorsAfterNegotiation);

    expect(quoteTotal(before[0])).toBe(1850);
    expect(quoteTotal(after[0])).toBe(1800);
  });

  it("flags fee risks for ranking", () => {
    expect(riskFlags(demoVendors[0])).toEqual([
      "Stairs fee is vague",
      "Long carry was hidden",
    ]);
    expect(riskFlags(demoVendors[1])).toEqual([]);
  });

  it("ranks offers by total then risk", () => {
    const ranked = rankOffers(demoVendors);
    expect(ranked.map((offer) => offer.vendorName)).toEqual([
      "Queen City Movers",
      "Carolina Quick Move",
      "Metro Van Line",
    ]);
  });

  it("builds a recommendation and exportable markdown report", () => {
    const afterVendors = vendorsForPhase("complete", demoVendors, demoVendorsAfterNegotiation);
    const recommendation = buildRecommendation(
      demoJobSpec,
      afterVendors,
      demoNegotiation,
      "complete",
    );

    expect(recommendation.winnerName).toBe("Carolina Quick Move");
    expect(recommendation.negotiatedSavings).toBe(50);
    expect(recommendation.rankings).toHaveLength(3);

    const report = formatExportReport(recommendation, demoJobSpec);
    expect(report).toContain("Carolina Quick Move");
    expect(report).toContain("$50");
    expect(report).toContain("## Rankings");
  });
});
