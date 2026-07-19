import { useEffect } from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import type { NegotiationDelta, NegotiationPhase, VendorQuote } from "../../types/negotiation";
import {
  formatCurrency,
  nextNegotiationPhase,
  quoteTotal,
  rankOffers,
  riskFlags,
} from "./ledger";

export function QuoteLedger({
  vendors,
  negotiation,
  phase,
  onPhaseChange,
  compareOn = true,
  onCompareChange,
}: {
  vendors: VendorQuote[];
  negotiation: NegotiationDelta;
  phase: NegotiationPhase;
  onPhaseChange: (phase: NegotiationPhase) => void;
  compareOn?: boolean;
  onCompareChange?: (value: boolean) => void;
}) {
  const rankings = rankOffers(vendors);
  const isRunning = phase === "running";

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const timer = window.setTimeout(() => {
      onPhaseChange(nextNegotiationPhase("running"));
    }, 700);

    return () => window.clearTimeout(timer);
  }, [phase, onPhaseChange]);

  const rows = vendors.map((vendor) => {
    const latest = quoteTotal(vendor);
    const base = listPrice(vendor);
    const delta = latest - base;
    const deltaPct = base === 0 ? 0 : (delta / base) * 100;
    const flags = riskFlags(vendor);
    const confidence = confidenceFor(flags.length, vendor);
    const rank = rankings.find((item) => item.vendorId === vendor.id)?.rank ?? vendors.length;
    const status = statusFor(vendor, rank, phase, negotiation.vendorId);

    return { vendor, base, latest, delta, deltaPct, confidence, status, rank };
  });

  const visibleRows = compareOn ? rows : rows.filter((row) => row.rank === 1);
  const avgSavings =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((sum, row) => sum + Math.max(0, -row.delta), 0) / rows.length);
  const avgPct =
    rows.length === 0
      ? 0
      : rows.reduce((sum, row) => sum + Math.max(0, -row.deltaPct), 0) / rows.length;

  return (
    <section className="quote-ledger-panel" aria-label="Quote delta ledger" id="ledger">
      <div className="ledger-toolbar">
        <div className="section-heading">
          <span>Quote Ledger</span>
          <h2>
            <strong>{vendors.length} Vendors</strong>
          </h2>
        </div>
        <label className="compare-toggle">
          <span>Compare</span>
          <input
            type="checkbox"
            checked={compareOn}
            aria-label="Toggle vendor compare mode"
            onChange={(event) => onCompareChange?.(event.target.checked)}
          />
          <span className="toggle-track" aria-hidden="true" />
        </label>
      </div>

      {isRunning ? (
        <div className="negotiation-running ledger-running" role="status">
          Updating ledger with verified follow-up terms…
        </div>
      ) : null}

      {!compareOn ? (
        <p className="compare-hint" role="status">
          Compare off — showing the current best offer only. Turn Compare on to rank every vendor.
        </p>
      ) : null}

      <div className="ledger-table-wrap" id="vendors">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Vendor</th>
              {compareOn ? <th>Base Quote (USD)</th> : null}
              <th>Latest Quote (USD)</th>
              {compareOn ? <th>Delta (USD)</th> : null}
              {compareOn ? <th>Delta (%)</th> : null}
              <th>Confidence</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.vendor.id} className={row.rank === 1 ? "row-best" : undefined}>
                <td>
                  <h3>{row.vendor.name}</h3>
                  <p>{row.vendor.style}</p>
                </td>
                {compareOn ? <td>{formatCurrency(row.base)}</td> : null}
                <td>{formatCurrency(row.latest)}</td>
                {compareOn ? (
                  <td className={deltaClass(row.delta)}>{formatSignedCurrency(row.delta)}</td>
                ) : null}
                {compareOn ? (
                  <td className={deltaClass(row.delta)}>{formatSignedPercent(row.deltaPct)}</td>
                ) : null}
                <td>
                  <div className={`confidence confidence-${row.confidence.toLowerCase()}`}>
                    <span className="bars" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    {row.confidence}
                  </div>
                </td>
                <td>
                  <span className={`status-pill status-${slug(row.status)}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ledger-footer">
        <div>
          <span>Average savings</span>
          <strong>
            {formatCurrency(avgSavings)} | {avgPct.toFixed(1)}%
          </strong>
        </div>
        <div className="verified-badge">
          <BadgeCheck size={14} aria-hidden="true" />
          Verified by QDL
        </div>
        <div className="ledger-footnote">
          <ShieldCheck size={14} aria-hidden="true" />
          Every latest quote total is backed by transcript evidence in the Evidence & Proof rail.
        </div>
      </div>
    </section>
  );
}

function listPrice(vendor: VendorQuote): number {
  const priced = vendor.assertions.filter(
    (assertion) => assertion.status !== "declined" && assertion.status !== "waived",
  );
  if (priced.length === 0) {
    return quoteTotal(vendor);
  }
  return priced.reduce((sum, assertion) => sum + assertion.amount, 0);
}

function confidenceFor(flagCount: number, vendor: VendorQuote): "High" | "Medium" | "Low" {
  const declined = vendor.assertions.some((assertion) => assertion.status === "declined");
  if (declined || flagCount >= 2) {
    return "Low";
  }
  if (flagCount === 1) {
    return "Medium";
  }
  return "High";
}

function statusFor(
  vendor: VendorQuote,
  rank: number,
  phase: NegotiationPhase,
  negotiatedVendorId: string,
): string {
  if (rank === 1) {
    return "Best Offer";
  }
  if (phase !== "complete" && vendor.assertions.some((a) => a.status === "vague" || a.status === "hidden")) {
    return "In Negotiation";
  }
  if (phase === "complete" && vendor.id === negotiatedVendorId) {
    return "Revised";
  }
  return "New";
}

function formatSignedCurrency(value: number): string {
  if (value === 0) {
    return formatCurrency(0);
  }
  const absolute = formatCurrency(Math.abs(value));
  return value < 0 ? `-${absolute}` : `+${absolute}`;
}

function formatSignedPercent(value: number): string {
  if (Math.abs(value) < 0.05) {
    return "0.0%";
  }
  const absolute = `${Math.abs(value).toFixed(1)}%`;
  return value < 0 ? `-${absolute}` : `+${absolute}`;
}

function deltaClass(value: number): string {
  if (value < 0) {
    return "delta-down";
  }
  if (value > 0) {
    return "delta-up";
  }
  return "delta-flat";
}

function slug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}
