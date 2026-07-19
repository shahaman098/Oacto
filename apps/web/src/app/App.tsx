import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  AudioLines,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileAudio,
  FolderKanban,
  Gavel,
  Lock,
  Phone,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  Workflow,
  X,
} from "lucide-react";
import { ExtractionPanel } from "../features/negotiation/ExtractionPanel";
import { QuoteLedger } from "../features/negotiation/QuoteLedger";
import { RecommendationReport } from "../features/negotiation/RecommendationReport";
import { VoiceTruthGate } from "../features/negotiation/VoiceTruthGate";
import {
  demoJobSpec,
  demoNegotiation,
  demoTruthGateProbes,
  demoVendors,
  demoVendorsAfterNegotiation,
  demoVoiceCallProofs,
} from "../features/negotiation/fixtures";
import {
  bestOffer,
  buildRecommendation,
  formatCurrency,
  leverageDecision,
  negotiationDelta,
  quoteTotal,
  vendorsForPhase,
} from "../features/negotiation/ledger";
import { buildEvidenceInspection, type EvidenceInspection } from "../features/negotiation/evidence";
import { EvidenceDrawer } from "../features/negotiation/EvidenceDrawer";
import type { NegotiationPhase, VendorQuote } from "../types/negotiation";
import { LandingPage } from "./LandingPage";
import { OactoLogo } from "./OactoLogo";

const CallConsole = lazy(() =>
  import("../features/negotiation/CallConsole").then((module) => ({
    default: module.CallConsole,
  })),
);

const NAV_ITEMS: Array<{
  id: string;
  label: string;
  icon: typeof Activity;
  targetId: string;
}> = [
  { id: "command", label: "Command Center", icon: Activity, targetId: "command" },
  { id: "ledger", label: "Quote Ledger", icon: FolderKanban, targetId: "ledger" },
  { id: "calls", label: "Live Calls", icon: Phone, targetId: "calls" },
  { id: "evidence", label: "Evidence Vault", icon: FileAudio, targetId: "evidence" },
  { id: "vendors", label: "Vendors", icon: Store, targetId: "vendors" },
  { id: "workflows", label: "Workflows", icon: Workflow, targetId: "workflows" },
  { id: "analytics", label: "Analytics", icon: BarChart3, targetId: "analytics" },
  { id: "honesty", label: "Honesty Gates", icon: ShieldCheck, targetId: "honesty" },
  { id: "settings", label: "Settings", icon: Settings, targetId: "settings" },
];

const WORKSPACES = ["Project Atlas", "Project Beacon", "Move Demo"] as const;

const INITIAL_NOTIFICATIONS = [
  {
    id: "n1",
    title: "Verified leverage ready",
    body: "Queen City all-in $1,850 is cleared for the follow-up call.",
  },
  {
    id: "n2",
    title: "Vague fee flagged",
    body: "Carolina Quick Move stairs fee still lacks a hard number.",
  },
  {
    id: "n3",
    title: "Recording active",
    body: "Transcript capture is live for the current negotiation line.",
  },
];

export function App() {
  const [phase, setPhase] = useState<NegotiationPhase>("ready");
  const [extraVendors, setExtraVendors] = useState<VendorQuote[]>([]);
  const [callLive, setCallLive] = useState(false);
  const [elapsed, setElapsed] = useState(462);
  const [selectedInspection, setSelectedInspection] = useState<EvidenceInspection | null>(null);
  const [compareOn, setCompareOn] = useState(true);
  const [activeNav, setActiveNav] = useState("command");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspace, setWorkspace] = useState<(typeof WORKSPACES)[number]>("Project Atlas");
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [recording, setRecording] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const [autoExport, setAutoExport] = useState(true);
  const [strictGate, setStrictGate] = useState(true);
  const [enteredApp, setEnteredApp] = useState(false);

  const onPhaseChange = useCallback((next: NegotiationPhase) => {
    setPhase(next);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!callLive && phase !== "running") {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsed((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [callLive, phase]);

  useEffect(() => {
    if (!notificationsOpen && !workspaceOpen && !profileOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-chrome-menu], [data-chrome-trigger]")) {
        return;
      }
      setNotificationsOpen(false);
      setWorkspaceOpen(false);
      setProfileOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [notificationsOpen, workspaceOpen, profileOpen]);

  const scrollToSection = useCallback(
    (navId: string, targetId: string) => {
      setActiveNav(navId);
      setNotificationsOpen(false);
      setWorkspaceOpen(false);
      setProfileOpen(false);
      const target = document.getElementById(targetId);
      if (!target) {
        showToast(`Section “${targetId}” is not available yet.`);
        return;
      }
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [showToast],
  );

  const baseVendors = vendorsForPhase(phase, demoVendors, demoVendorsAfterNegotiation);
  const vendors = [...baseVendors, ...extraVendors];
  const winningOffer = bestOffer(vendors);
  const recommendation = buildRecommendation(demoJobSpec, vendors, demoNegotiation, phase);
  const displayedDelta =
    phase === "complete"
      ? negotiationDelta(demoNegotiation.beforeTotal, demoNegotiation.afterTotal)
      : 0;
  const decision = leverageDecision(vendors, demoNegotiation);
  const isComplete = phase === "complete";
  const isRunning = phase === "running";
  const percentBetter =
    displayedDelta > 0
      ? ((displayedDelta / demoNegotiation.beforeTotal) * 100).toFixed(1)
      : "0.0";

  const mergeVendor = useCallback((vendor: VendorQuote) => {
    setExtraVendors((current) => {
      const without = current.filter((item) => item.id !== vendor.id);
      return [...without, vendor];
    });
  }, []);

  const evidenceItems = vendors.flatMap((vendor) =>
    vendor.assertions.map((assertion) => ({
      vendor,
      assertion,
      inspection: buildEvidenceInspection(vendor, assertion),
    })),
  );

  const highlightedEvidenceId = "b-all-in";
  const portfolioTotal = vendors.reduce((sum, vendor) => sum + quoteTotal(vendor), 0);

  if (!enteredApp) {
    return <LandingPage onEnter={() => setEnteredApp(true)} />;
  }

  return (
    <div className="dashboard">
      <aside className="sidebar" aria-label="Primary navigation">
        <button
          type="button"
          className="sidebar-brand"
          onClick={() => scrollToSection("command", "command")}
        >
          <span className="brand-mark" aria-hidden="true">
            <OactoLogo size={34} />
          </span>
          <div>
            <strong>Oacto</strong>
          </div>
        </button>

        <nav className="sidebar-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={activeNav === item.id ? "nav-item active" : "nav-item"}
                aria-current={activeNav === item.id ? "page" : undefined}
                onClick={() => scrollToSection(item.id, item.targetId)}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          className="portfolio-card"
          onClick={() => scrollToSection("analytics", "analytics")}
        >
          <span className="portfolio-kicker">MTD Verified Savings</span>
          <strong>$618,540</strong>
          <div className="portfolio-trend">
            <span className="trend-up">↑ 18.7%</span>
            <span>vs prior month</span>
          </div>
          <svg className="portfolio-spark" viewBox="0 0 120 36" aria-hidden="true">
            <path
              d="M0 28 C18 26, 24 18, 36 20 S54 8, 66 12 S90 4, 120 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <div className="portfolio-stats">
            <div>
              <span>Verified Quotes</span>
              <strong>142</strong>
            </div>
            <div>
              <span>Disputes Won</span>
              <strong>87%</strong>
            </div>
          </div>
        </button>

        <div className="sidebar-user-wrap">
          <button
            type="button"
            className="sidebar-user"
            data-chrome-trigger
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotificationsOpen(false);
              setWorkspaceOpen(false);
            }}
          >
            <span className="avatar" aria-hidden="true">
              AP
            </span>
            <div>
              <strong>Alex Parker</strong>
              <span>Acme Construction</span>
            </div>
          </button>
          {profileOpen ? (
            <div className="chrome-menu profile-menu" role="menu" data-chrome-menu>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  showToast("Demo identity locked for judging.");
                }}
              >
                View demo identity
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  scrollToSection("settings", "settings");
                }}
              >
                Open settings
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <button
            type="button"
            className="live-pill"
            data-live={callLive || phase === "running" ? "true" : "false"}
            onClick={() => scrollToSection("calls", "calls")}
          >
            <span className="live-dot" aria-hidden="true" />
            <strong>LIVE</strong>
            <span>
              {phase === "running"
                ? "Follow-up in progress"
                : callLive
                  ? "Call in progress"
                  : "Standby"}
            </span>
            <span className="live-timer">{formatTimer(elapsed)}</span>
          </button>

          <div className="topbar-actions">
            <button
              type="button"
              className={recording ? "recording-pill active" : "recording-pill"}
              aria-pressed={recording}
              onClick={() => {
                setRecording((current) => {
                  const next = !current;
                  showToast(next ? "Recording & transcription resumed." : "Recording paused.");
                  return next;
                });
              }}
            >
              <span className="pulse-bars" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {recording ? "Recording & Transcribing" : "Recording paused"}
            </button>

            <div className="chrome-anchor">
              <button
                type="button"
                className="icon-btn"
                data-chrome-trigger
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  setWorkspaceOpen(false);
                  setProfileOpen(false);
                }}
              >
                <Bell size={16} aria-hidden="true" />
                {notifications.length > 0 ? <span className="badge">{notifications.length}</span> : null}
              </button>
              {notificationsOpen ? (
                <div className="chrome-menu notifications-menu" role="menu" data-chrome-menu>
                  <div className="chrome-menu-header">
                    <strong>Notifications</strong>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifications([]);
                        showToast("Notifications cleared.");
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="chrome-empty">You are caught up.</p>
                  ) : (
                    notifications.map((item) => (
                      <button
                        type="button"
                        className="notification-item"
                        role="menuitem"
                        key={item.id}
                        onClick={() => {
                          setNotifications((current) => current.filter((entry) => entry.id !== item.id));
                          showToast(`Opened: ${item.title}`);
                          if (item.id === "n1") {
                            scrollToSection("honesty", "honesty");
                          } else if (item.id === "n2") {
                            scrollToSection("evidence", "evidence");
                          } else {
                            scrollToSection("calls", "calls");
                          }
                        }}
                      >
                        <strong>{item.title}</strong>
                        <span>{item.body}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <div className="chrome-anchor">
              <button
                type="button"
                className="workspace-btn"
                data-chrome-trigger
                aria-expanded={workspaceOpen}
                onClick={() => {
                  setWorkspaceOpen((open) => !open);
                  setNotificationsOpen(false);
                  setProfileOpen(false);
                }}
              >
                {workspace}
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              {workspaceOpen ? (
                <div className="chrome-menu workspace-menu" role="menu" data-chrome-menu>
                  {WORKSPACES.map((item) => (
                    <button
                      type="button"
                      role="menuitem"
                      key={item}
                      className={item === workspace ? "menu-active" : undefined}
                      onClick={() => {
                        setWorkspace(item);
                        setWorkspaceOpen(false);
                        showToast(`Switched to ${item}.`);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="app-shell">
          <section className="hero-row" id="command">
            <div className="hero-copy">
              <div className="hero-orbit" aria-hidden="true">
                <span className="orbit-ring orbit-a" />
                <span className="orbit-ring orbit-b" />
                <span className="orbit-ring orbit-c" />
                <span className="orbit-core">
                  <OactoLogo size={28} />
                </span>
                <span className="orbit-dust d1" />
                <span className="orbit-dust d2" />
                <span className="orbit-dust d3" />
              </div>
              <h1>Truth gate for voice negotiators.</h1>
              <p>
                We capture every word, verify every claim, and surface the delta that moves margin.
              </p>
            </div>

            <aside className="ai-rec-card" aria-label="AI recommendation">
              <div className="ai-rec-header">
                <Sparkles size={14} aria-hidden="true" />
                <span>AI Recommendation</span>
              </div>
              <div className="ai-rec-body">
                <div className="delta-card" data-testid="negotiated-delta">
                  <span>{isComplete ? "Negotiated delta" : "Potential delta"}</span>
                  <div className="delta-value-row">
                    <strong data-testid="hero-delta" className={isComplete ? "delta-positive" : undefined}>
                      {formatCurrency(displayedDelta)}
                    </strong>
                    <em className={isComplete ? "delta-positive" : undefined}>
                      {isComplete ? `${percentBetter}% better` : "delta pending follow-up"}
                    </em>
                  </div>
                </div>

                <div className="best-offer-row">
                  <div>
                    <span>Best Offer</span>
                    <strong>{formatCurrency(winningOffer.total)}</strong>
                  </div>
                  <button
                    type="button"
                    className="vendor-chip"
                    onClick={() => scrollToSection("vendors", "vendors")}
                  >
                    {winningOffer.vendor.name}
                  </button>
                </div>

                <div className={decision.allowed ? "guardrail allowed" : "guardrail blocked"}>
                  {decision.allowed ? <CheckCircle2 size={15} /> : <Gavel size={15} />}
                  <span>{decision.reason}</span>
                </div>

                {phase === "ready" ? (
                  <button
                    type="button"
                    className="lock-offer-btn"
                    data-testid="run-negotiation"
                    disabled={!decision.allowed}
                    onClick={() => {
                      setFocusRequest((current) => current + 1);
                      scrollToSection("calls", "calls");
                      showToast("Live ElevenLabs call console is ready with verified leverage.");
                    }}
                  >
                    <Lock size={16} aria-hidden="true" />
                    Open Live Negotiation
                  </button>
                ) : null}

                {isRunning ? (
                  <div className="negotiation-running" data-testid="negotiation-running" role="status">
                    <Phone size={16} aria-hidden="true" />
                    Calling Carolina Quick Move with verified Queen City leverage…
                  </div>
                ) : null}

                {isComplete ? (
                  <div className="evidence-card" data-testid="follow-up-receipt">
                    <FileAudio size={16} aria-hidden="true" />
                    <div>
                      <strong>Follow-up transcript receipt</strong>
                      <p>
                        {demoNegotiation.evidence.transcriptId} lines {demoNegotiation.evidence.startLine}-
                        {demoNegotiation.evidence.endLine}
                      </p>
                      <blockquote>{demoNegotiation.evidence.quote}</blockquote>
                    </div>
                  </div>
                ) : null}

                <dl className="delta-list">
                  <div>
                    <dt>Before</dt>
                    <dd>{formatCurrency(demoNegotiation.beforeTotal)}</dd>
                  </div>
                  <div>
                    <dt>After</dt>
                    <dd data-testid="negotiation-after-total">
                      {isComplete ? formatCurrency(demoNegotiation.afterTotal) : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </section>

          <section className="job-spec-panel" aria-label="Confirmed job specification" id="job-spec">
            <div className="section-heading">
              <span>Confirmed job spec</span>
              <h2>
                {demoJobSpec.origin}
                <span className="spec-arrow" aria-hidden="true">
                  →
                </span>
                {demoJobSpec.destination}
              </h2>
            </div>
            <dl className="job-spec-grid">
              <div>
                <dt>Distance</dt>
                <dd>{demoJobSpec.distanceMiles} miles</dd>
              </div>
              <div>
                <dt>Home</dt>
                <dd>{demoJobSpec.homeSize}</dd>
              </div>
              <div>
                <dt>Inventory</dt>
                <dd className="spec-chips">
                  {demoJobSpec.largeItems.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </dd>
              </div>
              <div>
                <dt>Constraints</dt>
                <dd className="spec-chips">
                  {demoJobSpec.constraints.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          <section className="mid-row">
            <Suspense
              fallback={
                <section className="call-console call-console-loading" aria-label="Loading live call console">
                  <div className="call-empty">
                    <div className="call-empty-mark" aria-hidden="true">
                      <Phone size={20} />
                    </div>
                    <strong>Loading secure voice controls</strong>
                    <p>The ElevenLabs client is loading for this dashboard session.</p>
                  </div>
                </section>
              }
            >
              <CallConsole
                phase={phase}
                onPhaseChange={onPhaseChange}
                onLiveChange={setCallLive}
                focusRequest={focusRequest}
              />
            </Suspense>

            <aside className="evidence-proof" id="evidence" aria-label="Evidence and proof">
              <div className="evidence-proof-header">
                <h2>Evidence & Proof</h2>
                <span className="count-badge">{evidenceItems.length}</span>
              </div>
              <div className="evidence-feed">
                {evidenceItems.map(({ vendor, assertion, inspection }) => {
                  const highlighted = assertion.id === highlightedEvidenceId;
                  return (
                    <button
                      type="button"
                      className={highlighted ? "evidence-item featured" : "evidence-item"}
                      key={assertion.id}
                      data-testid={`inspect-evidence-${assertion.id}`}
                      aria-label={`Inspect evidence for ${assertion.label} from ${vendor.name}`}
                      onClick={() => setSelectedInspection(inspection)}
                    >
                      <div className="evidence-item-top">
                        <span className="evidence-time">
                          <AudioLines size={11} aria-hidden="true" />
                          {String(assertion.evidence.startLine).padStart(2, "0")}:
                          {String(assertion.evidence.endLine).padStart(2, "0")}
                        </span>
                        {highlighted ? <Sparkles size={12} className="star-mark" aria-hidden="true" /> : null}
                      </div>
                      <p className="evidence-quote">
                        <span className={assertion.status === "confirmed" ? "speaker-vendor" : "speaker-agent"}>
                          {vendor.name.split(" ")[0]}
                        </span>
                        <q>{assertion.evidence.quote}</q>
                      </p>
                      <div className="evidence-item-meta">
                        <span className={`verify-badge status-${assertion.status}`}>
                          {assertion.status === "confirmed" ? "Verified" : assertion.status}
                        </span>
                        <span className="tag-chip">{assertion.label}</span>
                        <span className="tag-chip">{inspection.evidenceRef}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="view-transcript"
                onClick={() => {
                  setFocusRequest((current) => current + 1);
                  scrollToSection("calls", "calls");
                  showToast("Opened live transcript console.");
                }}
              >
                View Full Transcript
                <span aria-hidden="true">→</span>
              </button>
            </aside>
          </section>

          <QuoteLedger
            vendors={vendors}
            negotiation={demoNegotiation}
            phase={phase}
            onPhaseChange={onPhaseChange}
            compareOn={compareOn}
            onCompareChange={(value) => {
              setCompareOn(value);
              showToast(value ? "Compare mode on." : "Showing best offer only.");
            }}
          />

          <WorkflowProgress phase={phase} callLive={callLive} />

          <section className="utility-panel" id="analytics" aria-label="Analytics">
            <div className="section-heading">
              <span>Analytics</span>
              <h2>Workspace pulse for {workspace}.</h2>
            </div>
            <div className="utility-grid">
              <article>
                <span>Active vendors</span>
                <strong>{vendors.length}</strong>
              </article>
              <article>
                <span>Evidence spans</span>
                <strong>{evidenceItems.length}</strong>
              </article>
              <article>
                <span>Ledger total in view</span>
                <strong>{formatCurrency(portfolioTotal)}</strong>
              </article>
              <article>
                <span>Negotiated savings</span>
                <strong>{formatCurrency(displayedDelta)}</strong>
              </article>
            </div>
          </section>

          <section className="secondary-stack" id="honesty" aria-label="Demo lab">
            <div className="lab-heading">
              <span>Demo lab</span>
              <h2>Honesty gates, ranked report, and extraction.</h2>
            </div>
            <VoiceTruthGate
              proofs={demoVoiceCallProofs}
              probes={demoTruthGateProbes}
              vendors={vendors}
            />
            <RecommendationReport job={demoJobSpec} recommendation={recommendation} />
            <ExtractionPanel jobSpec={demoJobSpec} onMergeVendor={mergeVendor} />
          </section>

          <section className="utility-panel" id="settings" aria-label="Settings">
            <div className="section-heading">
              <span>Settings</span>
              <h2>Demo controls for this workspace.</h2>
            </div>
            <div className="settings-list">
              <label className="settings-row">
                <span>
                  <strong>Strict honesty gate</strong>
                  <em>Block unsupported leverage before it reaches the call console.</em>
                </span>
                <input
                  type="checkbox"
                  checked={strictGate}
                  onChange={(event) => {
                    setStrictGate(event.target.checked);
                    showToast(
                      event.target.checked
                        ? "Strict honesty gate enabled."
                        : "Strict honesty gate relaxed for demo.",
                    );
                  }}
                />
              </label>
              <label className="settings-row">
                <span>
                  <strong>Auto-export recommendation</strong>
                  <em>Keep the ranked report download ready after negotiation.</em>
                </span>
                <input
                  type="checkbox"
                  checked={autoExport}
                  onChange={(event) => {
                    setAutoExport(event.target.checked);
                    showToast(
                      event.target.checked
                        ? "Auto-export remains available."
                        : "Auto-export preference saved.",
                    );
                  }}
                />
              </label>
              <button
                type="button"
                className="secondary-action settings-reset"
                onClick={() => {
                  setCompareOn(true);
                  setRecording(true);
                  setStrictGate(true);
                  setAutoExport(true);
                  setWorkspace("Project Atlas");
                  setNotifications(INITIAL_NOTIFICATIONS);
                  showToast("Demo settings reset.");
                }}
              >
                Reset demo settings
              </button>
            </div>
          </section>
        </main>
      </div>

      <EvidenceDrawer inspection={selectedInspection} onClose={() => setSelectedInspection(null)} />

      {toast ? (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}>
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function WorkflowProgress({
  phase,
  callLive,
}: {
  phase: NegotiationPhase;
  callLive: boolean;
}) {
  const callerActive = callLive || phase === "running" || phase === "ready";
  const closerDone = phase === "complete";

  return (
    <section className="workflow-progress" aria-label="Negotiation workflow" id="workflows">
      <WorkflowStage
        title="Estimator"
        text="Scope & Baseline"
        state="complete"
        icon={<ClipboardList size={16} />}
      />
      <WorkflowStage
        title="Caller"
        text="Live Negotiation"
        state={closerDone ? "complete" : callerActive ? "active" : "pending"}
        icon={<Phone size={16} />}
      />
      <WorkflowStage
        title="Closer"
        text="Best Offer Locked"
        state={closerDone ? "complete" : phase === "running" ? "active" : "pending"}
        icon={<UserRound size={16} />}
      />
      <WorkflowStage
        title="Honesty Gates"
        text="Verify & Validate"
        state={closerDone ? "complete" : "locked"}
        icon={<ShieldCheck size={16} />}
      />
    </section>
  );
}

function WorkflowStage({
  title,
  text,
  state,
  icon,
}: {
  title: string;
  text: string;
  state: "complete" | "active" | "pending" | "locked";
  icon: ReactNode;
}) {
  return (
    <div className={`workflow-stage state-${state}`}>
      <div className="stage-icon" aria-hidden="true">
        {state === "complete" ? <CheckCircle2 size={18} /> : state === "locked" ? <Lock size={16} /> : icon}
      </div>
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
      <em>
        {state === "complete"
          ? "Complete"
          : state === "active"
            ? "In Progress"
            : "Pending"}
      </em>
    </div>
  );
}

function formatTimer(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}
