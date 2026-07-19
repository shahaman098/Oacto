import { useEffect } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Gift,
  X,
} from "lucide-react";
import type { EvidenceInspection, EvidenceTone } from "./evidence";

export function EvidenceDrawer({
  inspection,
  onClose,
}: {
  inspection: EvidenceInspection | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!inspection) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inspection, onClose]);

  if (!inspection) {
    return null;
  }

  const lineNumbers = buildLineNumbers(inspection.lineRange);

  return (
    <div className="evidence-drawer-root" data-testid="evidence-drawer">
      <button
        type="button"
        className="evidence-drawer-backdrop"
        aria-label="Close evidence inspector"
        onClick={onClose}
      />
      <aside
        className={`evidence-drawer panel-tone-${inspection.tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-drawer-title"
      >
        <div className="evidence-drawer-header">
          <div className="evidence-drawer-heading">
            <span className="section-kicker">Transcript span inspector</span>
            <h2 id="evidence-drawer-title">{inspection.label}</h2>
            <p>{inspection.vendorName}</p>
          </div>
          <button
            type="button"
            className="evidence-drawer-close"
            aria-label="Close evidence drawer"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <dl className="evidence-drawer-meta">
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`status-badge status-${inspection.status}`}>
                <ToneIcon tone={inspection.tone} />
                {inspection.status}
              </span>
            </dd>
          </div>
          <div>
            <dt>Amount / term</dt>
            <dd>{inspection.amountLabel}</dd>
          </div>
          <div>
            <dt>Transcript source</dt>
            <dd className="mono-ref">{inspection.transcriptId}</dd>
          </div>
          <div>
            <dt>Line range</dt>
            <dd className="mono-ref">{inspection.lineRange}</dd>
          </div>
        </dl>

        <div className={`transcript-pane tone-${inspection.tone}`}>
          <div className="transcript-pane-header">
            <span className="mono-ref">{inspection.transcriptId}.txt</span>
            <span className="mono-ref">L{inspection.lineRange}</span>
          </div>
          <div className="transcript-span" aria-label="Highlighted transcript span">
            <div className="transcript-gutter" aria-hidden="true">
              {lineNumbers.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
            <blockquote data-testid="evidence-drawer-quote">{inspection.quote}</blockquote>
          </div>
          <p className="transcript-caption">Exact spoken claim used as ledger evidence.</p>
        </div>
      </aside>
    </div>
  );
}

function buildLineNumbers(lineRange: string): number[] {
  const [startRaw, endRaw] = lineRange.split("-");
  const start = Number(startRaw);
  const end = Number(endRaw);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return [start || 1];
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function ToneIcon({ tone }: { tone: EvidenceTone }) {
  switch (tone) {
    case "confirmed":
      return <CheckCircle2 size={14} aria-hidden="true" />;
    case "concession":
      return <Gift size={14} aria-hidden="true" />;
    case "declined":
      return <Ban size={14} aria-hidden="true" />;
    case "caution":
      return <AlertTriangle size={14} aria-hidden="true" />;
  }
}
