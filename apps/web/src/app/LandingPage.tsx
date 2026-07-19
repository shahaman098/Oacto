import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import { ArrowRight, Check, FileAudio, Phone, Play, ShieldCheck, Workflow } from "lucide-react";
import { OactoLogo } from "./OactoLogo";

type LandingTab = "product" | "solutions" | "customers" | "resources";

const TABS: { id: LandingTab; label: string }[] = [
  { id: "product", label: "Product" },
  { id: "solutions", label: "Solutions" },
  { id: "customers", label: "Customers" },
  { id: "resources", label: "Resources" },
];

function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2;
}

function formatUsd(value: number, fractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function AnimatedUsd({
  value,
  active,
  durationMs = 2000,
  delayMs = 160,
  smoothDecimals = false,
  className,
  ...rest
}: {
  value: number;
  active: boolean;
  durationMs?: number;
  delayMs?: number;
  smoothDecimals?: boolean;
  className?: string;
} & HTMLAttributes<HTMLSpanElement>) {
  const ref = useRef<HTMLSpanElement>(null);
  const frameRef = useRef(0);
  const timeoutRef = useRef(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const write = (amount: number, fractionDigits: number) => {
      node.textContent = formatUsd(amount, fractionDigits);
    };

    window.cancelAnimationFrame(frameRef.current);
    window.clearTimeout(timeoutRef.current);

    if (!active) {
      write(0, 0);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      write(value, 0);
      return;
    }

    write(0, smoothDecimals ? 1 : 0);

    timeoutRef.current = window.setTimeout(() => {
      let start: number | null = null;
      let lastDrawn = "";

      const tick = (now: number) => {
        if (start === null) {
          start = now;
        }

        const progress = Math.min(1, (now - start) / durationMs);
        const eased = easeInOutQuint(progress);
        const current = value * eased;
        const fractionDigits = smoothDecimals && progress < 1 ? 1 : 0;
        const next = formatUsd(current, fractionDigits);

        if (next !== lastDrawn) {
          lastDrawn = next;
          write(current, fractionDigits);
        }

        if (progress < 1) {
          frameRef.current = window.requestAnimationFrame(tick);
          return;
        }

        write(value, 0);
      };

      frameRef.current = window.requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutRef.current);
      window.cancelAnimationFrame(frameRef.current);
    };
  }, [active, delayMs, durationMs, smoothDecimals, value]);

  return (
    <span ref={ref} className={className} {...rest}>
      {formatUsd(0)}
    </span>
  );
}

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [activeTab, setActiveTab] = useState<LandingTab>("product");

  return (
    <div className="landing" data-testid="landing-page">
      <div className="landing-atmosphere" aria-hidden="true">
        <span className="landing-arc landing-arc-a" />
        <span className="landing-arc landing-arc-b" />
        <span className="landing-arc landing-arc-c" />
        <span className="landing-spark s1" />
        <span className="landing-spark s2" />
        <span className="landing-spark s3" />
        <span className="landing-spark s4" />
        <span className="landing-beam" />
      </div>

      <header className="landing-nav">
        <div className="landing-brand">
          <OactoLogo className="landing-logo" size={36} title="Oacto" />
          <strong>Oacto</strong>
        </div>

        <nav className="landing-links" aria-label="Marketing">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "is-active" : undefined}
              aria-current={activeTab === tab.id ? "page" : undefined}
              data-testid={`landing-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <button type="button" className="landing-signin" onClick={onEnter}>
          Sign in
        </button>
      </header>

      <main className="landing-hero" data-testid={`landing-panel-${activeTab}`}>
        {activeTab === "product" ? <ProductPanel onEnter={onEnter} active /> : null}
        {activeTab === "solutions" ? <SolutionsPanel onEnter={onEnter} /> : null}
        {activeTab === "customers" ? <CustomersPanel onEnter={onEnter} /> : null}
        {activeTab === "resources" ? <ResourcesPanel onEnter={onEnter} /> : null}
      </main>

      <section className="landing-strip" aria-label="Platform proof">
        <article>
          <strong>Evidence-backed quotes</strong>
          <p>Every fee links to a transcript span before it becomes leverage.</p>
        </article>
        <article>
          <strong>Honesty gates</strong>
          <p>Unsupported competing-bid claims are blocked by deterministic checks.</p>
        </article>
        <article>
          <strong>Verified delta</strong>
          <p>Show the before/after negotiation result judges can audit in under a minute.</p>
        </article>
      </section>
    </div>
  );
}

function ProductPanel({ onEnter, active }: { onEnter: () => void; active: boolean }) {
  return (
    <>
      <section className="landing-copy">
        <h1>
          <span>Verify every quote.</span>
          <span className="landing-accent-line">Unlock every dollar.</span>
        </h1>

        <div className="landing-wave-rule" aria-hidden="true">
          <i />
          <span className="landing-mini-wave">
            {Array.from({ length: 18 }, (_, index) => (
              <em key={index} style={{ animationDelay: `${index * 0.05}s` }} />
            ))}
          </span>
          <i />
        </div>

        <p>
          We verify, listen, and surface what matters—so you can negotiate with confidence and
          protect revenue.
        </p>

        <div className="landing-actions">
          <button
            type="button"
            className="landing-primary"
            data-testid="enter-app"
            onClick={onEnter}
          >
            See it in action
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button type="button" className="landing-secondary" onClick={onEnter}>
            Explore the platform
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </section>

      <PreviewCard active={active} />
    </>
  );
}

function SolutionsPanel({ onEnter }: { onEnter: () => void }) {
  return (
    <>
      <section className="landing-copy">
        <h1>
          <span>Live calls with</span>
          <span className="landing-accent-line">proof attached.</span>
        </h1>
        <p>
          Run the negotiator, capture transcript evidence, and only promote claims that pass the
          honesty gate into the quote ledger.
        </p>
        <ul className="landing-bullets">
          <li>
            <Phone size={16} aria-hidden="true" />
            ElevenLabs voice console with live-only startup
          </li>
          <li>
            <FileAudio size={16} aria-hidden="true" />
            Span-linked evidence for every fee and inclusion
          </li>
          <li>
            <ShieldCheck size={16} aria-hidden="true" />
            Deterministic blocks on fabricated competitor quotes
          </li>
        </ul>
        <div className="landing-actions">
          <button type="button" className="landing-primary" onClick={onEnter}>
            Open live call console
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="landing-visual" aria-label="Solutions preview">
        <div className="landing-stage">
          <div className="landing-card landing-card-steps">
            <span className="landing-metric-label">Negotiation workflow</span>
            <ol>
              <li>
                <strong>Confirm job spec</strong>
                <span>Rock Hill → Charlotte · stairs · long carry</span>
              </li>
              <li>
                <strong>Verify leverage</strong>
                <span>Queen City $1,850 all-in · call-b 18–21</span>
              </li>
              <li>
                <strong>Negotiate live</strong>
                <span>Carolina Quick Move · target $1,800</span>
              </li>
              <li>
                <strong>Export delta</strong>
                <span>$50 verified savings with provider proof</span>
              </li>
            </ol>
          </div>
          <div className="landing-podium" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>
    </>
  );
}

function CustomersPanel({ onEnter }: { onEnter: () => void }) {
  return (
    <>
      <section className="landing-copy">
        <h1>
          <span>Built for teams</span>
          <span className="landing-accent-line">that buy under pressure.</span>
        </h1>
        <p>
          Procurement and ops leads use Oacto when competing quotes disagree, terms are vague, and
          every unsupported claim risks margin.
        </p>
        <div className="landing-actions">
          <button type="button" className="landing-primary" onClick={onEnter}>
            View the moving demo
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="landing-visual" aria-label="Customer scenarios">
        <div className="landing-stage">
          <div className="landing-card landing-card-list">
            <span className="landing-metric-label">Who it serves</span>
            <ul>
              <li>
                <strong>Procurement</strong>
                <span>Compare all-in offers without fabricated leverage</span>
              </li>
              <li>
                <strong>Ops / facilities</strong>
                <span>Keep stairs, carry, and access constraints honest</span>
              </li>
              <li>
                <strong>Demo judges</strong>
                <span>Audit evidence, gate, and delta in under a minute</span>
              </li>
            </ul>
          </div>
          <div className="landing-podium" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>
    </>
  );
}

function ResourcesPanel({ onEnter }: { onEnter: () => void }) {
  return (
    <>
      <section className="landing-copy">
        <h1>
          <span>Demo lab &</span>
          <span className="landing-accent-line">honesty toolkit.</span>
        </h1>
        <p>
          Jump straight into the Command Center resources: truth-gate probes, evidence inspector,
          recommendation export, and AI extraction merge.
        </p>
        <ul className="landing-bullets">
          <li>
            <ShieldCheck size={16} aria-hidden="true" />
            Fabricated $1,700 claim stays blocked
          </li>
          <li>
            <FileAudio size={16} aria-hidden="true" />
            Supported $1,850 claim stays allowed
          </li>
          <li>
            <Workflow size={16} aria-hidden="true" />
            Workflow stepper tracks ready → live → complete
          </li>
        </ul>
        <div className="landing-actions">
          <button type="button" className="landing-primary" onClick={onEnter}>
            Enter demo lab
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="landing-visual" aria-label="Resources preview">
        <div className="landing-stage">
          <div className="landing-card landing-card-list">
            <span className="landing-metric-label">In the workspace</span>
            <ul>
              <li>
                <strong>Truth gate panel</strong>
                <span>Deterministic allow / block probes</span>
              </li>
              <li>
                <strong>Evidence vault</strong>
                <span>Transcript spans with quote + line refs</span>
              </li>
              <li>
                <strong>Recommendation report</strong>
                <span>Export markdown judges can review</span>
              </li>
            </ul>
          </div>
          <div className="landing-podium" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>
    </>
  );
}

function PreviewCard({ active }: { active: boolean }) {
  return (
    <section className="landing-visual" aria-label="Product preview">
      <div className="landing-stage">
        <div className="landing-card landing-card-live" key="product-preview">
          <span className="landing-card-glow" aria-hidden="true" />
          <span className="landing-card-sheen" aria-hidden="true" />

          <div className="landing-verified">
            <Check size={12} aria-hidden="true" />
            Verified
          </div>

          <span className="landing-metric-label">Negotiated Delta</span>
          <strong className="landing-metric-value">
            <AnimatedUsd
              value={50}
              active={active}
              durationMs={2200}
              delayMs={140}
              smoothDecimals
              data-testid="landing-delta"
            />
          </strong>
          <div className="landing-metric-meta">
            <span className="landing-cyan-dot" aria-hidden="true" />
            <span>
              <AnimatedUsd
                className="landing-count"
                value={1850}
                active={active}
                durationMs={2400}
                delayMs={260}
              />
              {" → "}
              <AnimatedUsd
                className="landing-count"
                value={1800}
                active={active}
                durationMs={2400}
                delayMs={420}
              />
              {" all-in · Queen City leverage"}
            </span>
          </div>

          <svg className="landing-chart" viewBox="0 0 280 88" aria-hidden="true">
            <defs>
              <linearGradient id="landing-chart-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                <stop offset="45%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#6ee7b7" />
              </linearGradient>
              <linearGradient id="landing-chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
              <filter id="landing-chart-glow" x="-20%" y="-40%" width="140%" height="180%">
                <feGaussianBlur stdDeviation="2.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g className="landing-chart-grid" aria-hidden="true">
              {[22, 44, 66].map((y) => (
                <line key={y} x1="0" y1={y} x2="280" y2={y} />
              ))}
            </g>

            <path
              className="landing-chart-area"
              d="M8 62 C36 58, 48 34, 72 40 S108 78, 136 58 S176 18, 204 28 S244 54, 272 22 L272 88 L8 88 Z"
              fill="url(#landing-chart-fill)"
            />

            <path
              className="landing-chart-path"
              d="M8 62 C36 58, 48 34, 72 40 S108 78, 136 58 S176 18, 204 28 S244 54, 272 22"
              fill="none"
              stroke="url(#landing-chart-stroke)"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#landing-chart-glow)"
              pathLength={1}
            />

            <path
              className="landing-chart-flow"
              d="M8 62 C36 58, 48 34, 72 40 S108 78, 136 58 S176 18, 204 28 S244 54, 272 22"
              fill="none"
              stroke="#a7f3d0"
              strokeWidth="2.2"
              strokeLinecap="round"
              pathLength={1}
            />

            {[
              [8, 62],
              [40, 48],
              [72, 40],
              [104, 66],
              [136, 58],
              [168, 36],
              [204, 28],
              [236, 44],
              [272, 22],
            ].map(([x, y], index) => (
              <g
                key={`${x}-${y}`}
                className="landing-chart-point"
                style={{ animationDelay: `${0.5 + index * 0.09}s` }}
              >
                <circle
                  className="landing-chart-halo"
                  cx={x}
                  cy={y}
                  r="7"
                  style={{ animationDelay: `${index * 0.22}s` }}
                />
                <circle className="landing-chart-dot" cx={x} cy={y} r="3.2" fill="#6ee7b7" />
              </g>
            ))}

            <g className="landing-chart-runner">
              <circle r="5.5" fill="rgba(167, 243, 208, 0.22)" />
              <circle r="3" fill="#ecfdf5" />
              <animateMotion
                dur="3.4s"
                repeatCount="indefinite"
                rotate="auto"
                path="M8 62 C36 58, 48 34, 72 40 S108 78, 136 58 S176 18, 204 28 S244 54, 272 22"
              />
            </g>
          </svg>

          <div className="landing-transcript">
            <button type="button" className="landing-play" aria-label="Play clip">
              <span className="landing-play-ring" aria-hidden="true" />
              <Play size={14} aria-hidden="true" />
            </button>
            <span className="landing-time">call-b · 18–21</span>
            <p>“That is eighteen fifty all-in, stairs included.”</p>
          </div>
        </div>
        <div className="landing-podium" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}
