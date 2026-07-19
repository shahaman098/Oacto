import type {
  FeeStatus,
  JobSpec,
  NegotiationDelta,
  NegotiationPhase,
  QuoteAssertion,
  RankedOffer,
  Recommendation,
  TruthGateProbe,
  VendorQuote,
} from "../../types/negotiation";

const countedStatuses: FeeStatus[] = ["confirmed", "waived"];

export function quoteTotal(vendor: VendorQuote): number {
  return vendor.assertions
    .filter((assertion) => countedStatuses.includes(assertion.status))
    .reduce((sum, assertion) => sum + (assertion.status === "waived" ? 0 : assertion.amount), 0);
}

export function bestOffer(vendors: VendorQuote[]): { vendor: VendorQuote; total: number } {
  const ranked = rankOffers(vendors);

  if (!ranked[0]) {
    throw new Error("Cannot rank an empty vendor list");
  }

  const vendor = vendors.find((candidate) => candidate.id === ranked[0].vendorId);
  if (!vendor) {
    throw new Error("Ranked vendor missing from ledger");
  }

  return { vendor, total: ranked[0].total };
}

export function negotiationDelta(beforeTotal: number, afterTotal: number): number {
  return Math.max(0, beforeTotal - afterTotal);
}

export function canUseAsLeverage(assertion: QuoteAssertion | undefined): boolean {
  return Boolean(assertion && assertion.status === "confirmed" && assertion.evidence.quote.trim());
}

export function leverageDecision(
  vendors: VendorQuote[],
  negotiation: NegotiationDelta,
): { allowed: boolean; reason: string } {
  const assertion = vendors
    .flatMap((vendor) => vendor.assertions)
    .find((candidate) => candidate.id === negotiation.leverageAssertionId);

  if (!assertion) {
    return { allowed: false, reason: "Blocked: competing bid is not present in the ledger." };
  }

  if (!canUseAsLeverage(assertion)) {
    return { allowed: false, reason: "Blocked: leverage is not confirmed by transcript evidence." };
  }

  return {
    allowed: true,
    reason: `Allowed: leverage cites ${assertion.evidence.transcriptId} lines ${assertion.evidence.startLine}-${assertion.evidence.endLine}.`,
  };
}

export function evaluateTruthGateProbe(
  probe: TruthGateProbe,
  vendors: VendorQuote[],
): { allowed: boolean; reason: string; evidenceRef?: string } {
  if (!probe.sourceAssertionId) {
    return {
      allowed: false,
      reason: "Blocked: no matching confirmed quote exists in the ledger.",
    };
  }

  const assertion = vendors
    .flatMap((vendor) => vendor.assertions)
    .find((candidate) => candidate.id === probe.sourceAssertionId);

  if (!assertion || !canUseAsLeverage(assertion)) {
    return {
      allowed: false,
      reason: "Blocked: the cited leverage is not confirmed by transcript evidence.",
    };
  }

  return {
    allowed: true,
    reason: "Allowed: claim is traceable to a confirmed transcript span.",
    evidenceRef: `${assertion.evidence.transcriptId} lines ${assertion.evidence.startLine}-${assertion.evidence.endLine}`,
  };
}

export function vendorsForPhase(
  phase: NegotiationPhase,
  before: VendorQuote[],
  after: VendorQuote[],
): VendorQuote[] {
  return phase === "complete" ? after : before;
}

export function nextNegotiationPhase(phase: NegotiationPhase): NegotiationPhase {
  if (phase === "ready") {
    return "running";
  }

  if (phase === "running") {
    return "complete";
  }

  return "complete";
}

export function riskFlags(vendor: VendorQuote): string[] {
  const flags: string[] = [];

  for (const assertion of vendor.assertions) {
    if (assertion.status === "vague") {
      flags.push(`${assertion.label} is vague`);
    }
    if (assertion.status === "hidden") {
      flags.push(`${assertion.label} was hidden`);
    }
    if (assertion.status === "contradicted") {
      flags.push(`${assertion.label} is contradicted`);
    }
    if (assertion.status === "declined") {
      flags.push(`${assertion.label} was declined / not itemized`);
    }
  }

  return flags;
}

export function rankOffers(vendors: VendorQuote[]): RankedOffer[] {
  return [...vendors]
    .map((vendor) => ({
      vendorId: vendor.id,
      vendorName: vendor.name,
      total: quoteTotal(vendor),
      riskFlags: riskFlags(vendor),
    }))
    .sort((left, right) => {
      if (left.total !== right.total) {
        return left.total - right.total;
      }

      return left.riskFlags.length - right.riskFlags.length;
    })
    .map((offer, index) => ({ ...offer, rank: index + 1 }));
}

export function buildRecommendation(
  job: JobSpec,
  vendors: VendorQuote[],
  negotiation: NegotiationDelta,
  phase: NegotiationPhase,
): Recommendation {
  const rankings = rankOffers(vendors);
  const winner = rankings[0];

  if (!winner) {
    throw new Error("Cannot recommend without ranked offers");
  }

  const savings = phase === "complete" ? negotiationDelta(negotiation.beforeTotal, negotiation.afterTotal) : 0;
  const evidenceRefs = vendors
    .flatMap((vendor) => vendor.assertions)
    .filter((assertion) => assertion.status === "confirmed")
    .map(
      (assertion) =>
        `${assertion.evidence.transcriptId} lines ${assertion.evidence.startLine}-${assertion.evidence.endLine}`,
    );

  const negotiatedVendor = vendors.find((vendor) => vendor.id === negotiation.vendorId);
  const negotiatedName = negotiatedVendor?.name ?? negotiation.vendorId;

  const rationale =
    phase === "complete"
      ? `${winner.vendorName} wins at ${formatCurrency(winner.total)} for ${job.origin} → ${job.destination} after verified leverage saved ${formatCurrency(savings)} with ${negotiatedName} and converted the quote to all-in terms.`
      : `${winner.vendorName} leads at ${formatCurrency(winner.total)} with the fewest fee risks for ${job.origin} → ${job.destination}. Run follow-up negotiation only with verified leverage.`;

  return {
    winnerVendorId: winner.vendorId,
    winnerName: winner.vendorName,
    winnerTotal: winner.total,
    rationale,
    rankings,
    negotiatedSavings: savings,
    evidenceRefs,
  };
}

export function formatExportReport(recommendation: Recommendation, job: JobSpec): string {
  const rankingLines = recommendation.rankings
    .map((offer) => {
      const risks = offer.riskFlags.length > 0 ? offer.riskFlags.join("; ") : "none";
      return `${offer.rank}. ${offer.vendorName} — ${formatCurrency(offer.total)} (risks: ${risks})`;
    })
    .join("\n");

  const evidenceLines = recommendation.evidenceRefs.map((ref) => `- ${ref}`).join("\n");

  return [
    "# Quote Delta Ledger — Recommendation Report",
    "",
    `Job: ${job.origin} → ${job.destination} (${job.homeSize})`,
    `Winner: ${recommendation.winnerName} at ${formatCurrency(recommendation.winnerTotal)}`,
    `Negotiated savings: ${formatCurrency(recommendation.negotiatedSavings)}`,
    "",
    "## Rationale",
    recommendation.rationale,
    "",
    "## Rankings",
    rankingLines,
    "",
    "## Confirmed evidence",
    evidenceLines || "- none",
    "",
  ].join("\n");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
