import { useState } from "react";
import { Globe2, LoaderCircle, Sparkles, TriangleAlert } from "lucide-react";
import type { ExtractAndVerifyResponse } from "@quote-delta/types";
import type { JobSpec, VendorQuote } from "../../types/negotiation";
import {
  buildExtractedVendor,
  runExtractAndVerify,
  sampleExtractionTranscript,
} from "./extractionClient";
import { formatCurrency } from "./ledger";

export function ExtractionPanel({
  jobSpec,
  onMergeVendor,
}: {
  jobSpec: JobSpec;
  onMergeVendor: (vendor: VendorQuote) => void;
}) {
  const [vendorName, setVendorName] = useState("Piedmont Haulers");
  const [transcript, setTranscript] = useState(sampleExtractionTranscript);
  const [result, setResult] = useState<ExtractAndVerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [merged, setMerged] = useState(false);

  const runExtraction = async () => {
    setPending(true);
    setError(null);
    setMerged(false);

    try {
      const response = await runExtractAndVerify({
        transcriptId: "paste-demo",
        vendorName: vendorName.trim() || "Extracted Vendor",
        text: transcript,
        jobSpec: {
          origin: jobSpec.origin,
          destination: jobSpec.destination,
          homeSize: jobSpec.homeSize,
          distanceMiles: jobSpec.distanceMiles,
        },
      });
      setResult(response);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setPending(false);
    }
  };

  const mergeIntoLedger = () => {
    if (!result) {
      return;
    }

    const vendor = buildExtractedVendor(result.extraction.vendorName, result.mergeableAssertions);
    if (!vendor) {
      setError("No evidence-backed assertions available to merge.");
      return;
    }

    onMergeVendor(vendor);
    setMerged(true);
  };

  return (
    <section className="extraction-panel" aria-label="AI extraction demo" data-testid="extraction-panel">
      <div className="recommendation-header">
        <div className="section-heading">
          <span>Optional live slice</span>
          <h2>Extract and verify a pasted transcript.</h2>
        </div>
        <p className="extraction-mode-note">
          Default path stays fixture-backed. Keys never leave the server middleware.
        </p>
      </div>

      <div className="extraction-grid">
        <div className="extraction-form">
          <label>
            Vendor name
            <input
              data-testid="extraction-vendor-name"
              value={vendorName}
              onChange={(event) => setVendorName(event.target.value)}
            />
          </label>
          <label>
            Transcript
            <textarea
              data-testid="extraction-transcript"
              rows={8}
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="primary-action"
            data-testid="run-extraction"
            disabled={pending || !transcript.trim()}
            onClick={() => void runExtraction()}
          >
            {pending ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />}
            Run AI extraction
          </button>
          {error ? (
            <p className="extraction-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="extraction-results">
          {result ? (
            <>
              <div className="extraction-meta">
                <span className={`mode-pill mode-${result.mode}`} data-testid="extraction-mode">
                  mode: {result.mode}
                </span>
                <button
                  type="button"
                  className="secondary-action"
                  data-testid="merge-extraction"
                  onClick={mergeIntoLedger}
                >
                  Merge evidence into ledger
                </button>
              </div>
              {merged ? (
                <p className="merge-success" data-testid="merge-success">
                  Merged into the quote ledger.
                </p>
              ) : null}

              <div className="extraction-columns">
                <article>
                  <h3>Transcript assertions</h3>
                  <ul data-testid="extracted-assertions">
                    {result.extraction.assertions.map((assertion) => (
                      <li key={assertion.id}>
                        <div className="assertion-topline">
                          <span>{assertion.label}</span>
                          <strong>{formatCurrency(assertion.amount)}</strong>
                        </div>
                        <p>
                          <span className={`status-badge status-${assertion.status}`}>{assertion.status}</span>
                          {" · "}
                          <span className="evidence-kind transcript-kind">transcript evidence</span>
                          {assertion.leverageEligible ? " · leverage eligible" : " · not leverage"}
                        </p>
                        <blockquote>{assertion.evidence.quote}</blockquote>
                      </li>
                    ))}
                  </ul>
                </article>

                <article>
                  <h3>
                    <Globe2 size={16} aria-hidden="true" /> Web verification
                  </h3>
                  <ul data-testid="verification-findings">
                    {result.verification.findings.map((finding) => (
                      <li key={finding.id}>
                        <div className="assertion-topline">
                          <span>{finding.severity}</span>
                          <span className="evidence-kind web-kind">web evidence</span>
                        </div>
                        <p>{finding.summary}</p>
                        <blockquote>{finding.evidence.quote}</blockquote>
                      </li>
                    ))}
                  </ul>
                  {result.extraction.warnings.length > 0 ? (
                    <div className="extraction-warnings">
                      <TriangleAlert size={16} aria-hidden="true" />
                      <ul>
                        {result.extraction.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </article>
              </div>
            </>
          ) : (
            <p className="extraction-empty">
              Paste a vendor call transcript and run extraction to see structured assertions plus Tavily-style web
              warnings.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
