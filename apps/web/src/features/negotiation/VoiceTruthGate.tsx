import {
  AudioLines,
  Ban,
  CheckCircle2,
  FileAudio,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import type { TruthGateProbe, VendorQuote, VoiceCallProof } from "../../types/negotiation";
import { evaluateTruthGateProbe } from "./ledger";

export function VoiceTruthGate({
  proofs,
  probes,
  vendors,
}: {
  proofs: VoiceCallProof[];
  probes: TruthGateProbe[];
  vendors: VendorQuote[];
}) {
  return (
    <section className="voice-proof-grid" aria-label="Voice proof and truth gate">
      <article className="voice-proof-panel">
        <div className="section-heading">
          <span>Voice proof</span>
          <h2>Calls become evidence before they become leverage.</h2>
        </div>
        <div className="call-proof-list">
          {proofs.map((proof) => (
            <div className="call-proof-row" key={proof.id}>
              <span className="call-proof-icon" aria-hidden="true">
                <FileAudio size={17} />
              </span>
              <div>
                <div className="call-proof-topline">
                  <strong>{proof.vendorName}</strong>
                  <span>{proof.audioTimestamp}</span>
                </div>
                <p>{proof.outcome}</p>
                <dl className="call-proof-meta">
                  <div>
                    <dt>Source</dt>
                    <dd>{proof.provider}</dd>
                  </div>
                  <div>
                    <dt>Transcript</dt>
                    <dd>{proof.transcriptId}</dd>
                  </div>
                  <div>
                    <dt>Disclosure</dt>
                    <dd>{proof.disclosure}</dd>
                  </div>
                </dl>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="truth-gate-panel" data-testid="truth-gate-panel">
        <div className="section-heading">
          <span>Truth gate</span>
          <h2>Unsupported bargaining claims are stopped.</h2>
        </div>
        <div className="gate-list">
          {probes.map((probe) => {
            const result = evaluateTruthGateProbe(probe, vendors);
            const isAllowed = result.allowed;

            return (
              <div
                className={isAllowed ? "gate-row allowed" : "gate-row blocked"}
                data-testid={`truth-gate-${probe.id}`}
                key={probe.id}
              >
                <span className="gate-status-icon" aria-hidden="true">
                  {isAllowed ? <ShieldCheck size={18} /> : <ShieldX size={18} />}
                </span>
                <div>
                  <div className="gate-topline">
                    <strong>{probe.label}</strong>
                    <span>{isAllowed ? "allowed" : "blocked"}</span>
                  </div>
                  <blockquote>{probe.requestedClaim}</blockquote>
                  <p>{result.reason}</p>
                  {result.evidenceRef ? (
                    <span className="gate-evidence">
                      <AudioLines size={14} aria-hidden="true" />
                      {result.evidenceRef}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="gate-outcome">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>Use the supported $1,850 all-in quote; never invent the $1,700 claim.</span>
        </div>
        <div className="gate-outcome blocked-note">
          <Ban size={18} aria-hidden="true" />
          <span>Demo mode keeps fixture transcripts visible so judges can audit every claim.</span>
        </div>
      </article>
    </section>
  );
}
