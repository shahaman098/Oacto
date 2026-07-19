export type FeeStatus =
  | "confirmed"
  | "vague"
  | "hidden"
  | "contradicted"
  | "waived"
  | "declined";

export type IntegrationMode = "fixture" | "live";

export type EvidenceSourceKind = "transcript" | "web";

export interface JobSpecSummary {
  origin: string;
  destination: string;
  homeSize: string;
  distanceMiles: number;
}

export interface TranscriptInput {
  transcriptId: string;
  vendorName: string;
  text: string;
  jobSpec: JobSpecSummary;
}

export interface EvidenceSource {
  kind: EvidenceSourceKind;
  id: string;
  quote: string;
  startLine?: number;
  endLine?: number;
  title?: string;
  url?: string;
}

export interface ExtractedQuoteAssertion {
  id: string;
  label: string;
  amount: number;
  status: FeeStatus;
  confidence: number;
  evidence: EvidenceSource;
  leverageEligible: boolean;
}

export interface VendorVerificationFinding {
  id: string;
  severity: "info" | "warning" | "confirmed";
  summary: string;
  evidence: EvidenceSource;
}

export interface ExtractionResponse {
  mode: IntegrationMode;
  vendorName: string;
  assertions: ExtractedQuoteAssertion[];
  warnings: string[];
}

export interface VerificationResponse {
  mode: IntegrationMode;
  vendorName: string;
  findings: VendorVerificationFinding[];
}

export interface ExtractAndVerifyRequest {
  transcript: TranscriptInput;
}

export interface ExtractAndVerifyResponse {
  mode: IntegrationMode;
  extraction: ExtractionResponse;
  verification: VerificationResponse;
  mergeableAssertions: ExtractedQuoteAssertion[];
}
