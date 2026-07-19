export type FeeStatus = "confirmed" | "vague" | "hidden" | "contradicted" | "waived" | "declined";

export interface EvidenceSpan {
  transcriptId: string;
  startLine: number;
  endLine: number;
  quote: string;
}

export interface QuoteAssertion {
  id: string;
  label: string;
  amount: number;
  status: FeeStatus;
  evidence: EvidenceSpan;
}

export interface VendorQuote {
  id: string;
  name: string;
  style: string;
  transcriptSummary: string;
  assertions: QuoteAssertion[];
}

export interface JobSpec {
  id: string;
  origin: string;
  destination: string;
  distanceMiles: number;
  homeSize: string;
  largeItems: string[];
  constraints: string[];
}

export interface NegotiationDelta {
  vendorId: string;
  beforeTotal: number;
  afterTotal: number;
  changedTerms: string[];
  leverageAssertionId: string;
  evidence: EvidenceSpan;
}

export type NegotiationPhase = "ready" | "running" | "complete";

export interface VoiceCallProof {
  id: string;
  vendorName: string;
  provider: string;
  disclosure: string;
  audioTimestamp: string;
  transcriptId: string;
  outcome: string;
  snippets: EvidenceSpan[];
}

export interface TruthGateProbe {
  id: string;
  label: string;
  requestedClaim: string;
  sourceAssertionId?: string;
  expected: "allowed" | "blocked";
}

export interface CallConsoleStep {
  id: string;
  speaker: "agent" | "vendor" | "truth-gate";
  label: string;
  text: string;
  evidenceRef?: string;
}

export interface RankedOffer {
  rank: number;
  vendorId: string;
  vendorName: string;
  total: number;
  riskFlags: string[];
}

export interface Recommendation {
  winnerVendorId: string;
  winnerName: string;
  winnerTotal: number;
  rationale: string;
  rankings: RankedOffer[];
  negotiatedSavings: number;
  evidenceRefs: string[];
}
