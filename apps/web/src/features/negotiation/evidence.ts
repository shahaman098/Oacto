import type { EvidenceSpan, FeeStatus, QuoteAssertion, VendorQuote } from "../../types/negotiation";
import { formatCurrency } from "./ledger";

export type EvidenceTone = "confirmed" | "caution" | "concession" | "declined";

export interface EvidenceInspection {
  assertionId: string;
  vendorName: string;
  label: string;
  status: FeeStatus;
  amountLabel: string;
  transcriptId: string;
  lineRange: string;
  quote: string;
  evidenceRef: string;
  tone: EvidenceTone;
}

export function statusTone(status: FeeStatus): EvidenceTone {
  switch (status) {
    case "confirmed":
      return "confirmed";
    case "waived":
      return "concession";
    case "declined":
      return "declined";
    case "vague":
    case "hidden":
    case "contradicted":
      return "caution";
  }
}

export function formatEvidenceRef(evidence: EvidenceSpan): string {
  return `${evidence.transcriptId} lines ${evidence.startLine}-${evidence.endLine}`;
}

export function formatLineRange(evidence: EvidenceSpan): string {
  return `${evidence.startLine}-${evidence.endLine}`;
}

export function buildEvidenceInspection(
  vendor: VendorQuote,
  assertion: QuoteAssertion,
): EvidenceInspection {
  return {
    assertionId: assertion.id,
    vendorName: vendor.name,
    label: assertion.label,
    status: assertion.status,
    amountLabel: formatCurrency(assertion.amount),
    transcriptId: assertion.evidence.transcriptId,
    lineRange: formatLineRange(assertion.evidence),
    quote: assertion.evidence.quote,
    evidenceRef: formatEvidenceRef(assertion.evidence),
    tone: statusTone(assertion.status),
  };
}
