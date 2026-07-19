import { Download, Medal, ShieldCheck } from "lucide-react";
import type { JobSpec, Recommendation } from "../../types/negotiation";
import { formatCurrency, formatExportReport } from "./ledger";

export function RecommendationReport({
  job,
  recommendation,
}: {
  job: JobSpec;
  recommendation: Recommendation;
}) {
  const exportReport = () => {
    const content = formatExportReport(recommendation, job);
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "quote-delta-recommendation.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="recommendation-panel" aria-label="Ranked recommendation report" data-testid="recommendation-report">
      <div className="recommendation-header">
        <div className="section-heading">
          <span>Recommendation</span>
          <h2>Pick with receipts, not vibes.</h2>
        </div>
        <button
          type="button"
          className="primary-action"
          data-testid="export-report"
          onClick={exportReport}
        >
          <Download size={16} aria-hidden="true" />
          Export report
        </button>
      </div>

      <div className="recommendation-grid">
        <article className="winner-card">
          <div className="winner-card-header">
            <Medal size={18} aria-hidden="true" />
            <span>Best confirmed offer</span>
          </div>
          <h3>{recommendation.winnerName}</h3>
          <strong>{formatCurrency(recommendation.winnerTotal)}</strong>
          <p>{recommendation.rationale}</p>
          {recommendation.negotiatedSavings > 0 ? (
            <p className="savings-note" data-testid="report-savings">
              Verified follow-up savings: {formatCurrency(recommendation.negotiatedSavings)}
            </p>
          ) : null}
        </article>

        <ol className="ranking-list">
          {recommendation.rankings.map((offer) => (
            <li key={offer.vendorId} className={offer.rank === 1 ? "rank-winner" : undefined}>
              <div className="rank-topline">
                <span>
                  #{offer.rank} {offer.vendorName}
                </span>
                <strong>{formatCurrency(offer.total)}</strong>
              </div>
              <p>
                {offer.riskFlags.length > 0 ? offer.riskFlags.join(" · ") : "No fee risk flags"}
              </p>
            </li>
          ))}
        </ol>

        <aside className="evidence-refs-card">
          <ShieldCheck size={18} aria-hidden="true" />
          <div>
            <strong>Confirmed evidence cited</strong>
            <ul>
              {recommendation.evidenceRefs.map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
