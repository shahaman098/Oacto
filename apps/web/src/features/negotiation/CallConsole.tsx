import { ConversationProvider, useConversation } from "@elevenlabs/react";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Mic2,
  MicOff,
  PhoneCall,
  PhoneOff,
  Radio,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NegotiationPhase } from "../../types/negotiation";

interface LiveSessionResponse {
  mode: "live";
  agentId: string;
  agentName: string;
  signedUrl: string;
}

interface ConversationProofResponse {
  mode: "live";
  conversationId: string;
  agentId?: string;
  status?: string;
  durationSecs?: number;
  hasAudio: boolean;
  transcript: LiveTranscriptTurn[];
}

interface LiveTranscriptTurn {
  role: string;
  timeInCallSecs: number;
  message: string;
}

interface CallEvent {
  id: number;
  at: string;
  level: "info" | "success" | "error";
  stage: string;
  message: string;
}

export function CallConsole(props: {
  phase: NegotiationPhase;
  onPhaseChange: (phase: NegotiationPhase) => void;
  onLiveChange?: (live: boolean) => void;
  focusRequest?: number;
}) {
  return (
    <ConversationProvider>
      <LiveCallConsole {...props} />
    </ConversationProvider>
  );
}

function LiveCallConsole({
  phase,
  onPhaseChange,
  onLiveChange,
  focusRequest = 0,
}: {
  phase: NegotiationPhase;
  onPhaseChange: (phase: NegotiationPhase) => void;
  onLiveChange?: (live: boolean) => void;
  focusRequest?: number;
}) {
  const [events, setEvents] = useState<CallEvent[]>([]);
  const [transcript, setTranscript] = useState<LiveTranscriptTurn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("Quote Delta Live Negotiator");
  const [proof, setProof] = useState<ConversationProofResponse | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [starting, setStarting] = useState(false);
  const eventId = useRef(0);
  const conversationIdRef = useRef<string | null>(null);

  const addEvent = useCallback(
    (level: CallEvent["level"], stage: string, message: string) => {
      setEvents((current) => [
        ...current,
        {
          id: eventId.current++,
          at: new Date().toLocaleTimeString([], { hour12: false }),
          level,
          stage,
          message,
        },
      ]);
    },
    [],
  );

  const fetchProof = useCallback(
    async (id: string) => {
      addEvent("info", "proof", `Retrieving provider record ${id}.`);

      for (let attempt = 1; attempt <= 7; attempt += 1) {
        try {
          const response = await fetch(`/api/elevenlabs/conversations/${encodeURIComponent(id)}`);
          const payload = await readApiResponse<ConversationProofResponse>(response);

          if (payload.status === "processing" && attempt < 7) {
            addEvent("info", "proof", `Transcript is processing (attempt ${attempt}/7).`);
            await wait(900);
            continue;
          }

          setProof(payload);
          if (payload.transcript.length > 0) {
            setTranscript(payload.transcript);
          }
          addEvent(
            "success",
            "proof",
            `Provider proof attached: ${payload.transcript.length} turns, audio ${
              payload.hasAudio ? "available" : "not yet available"
            }.`,
          );
          return;
        } catch (error) {
          if (attempt < 7 && isRetryableProofError(error)) {
            addEvent("info", "proof", `Provider record not ready (attempt ${attempt}/7).`);
            await wait(900);
            continue;
          }
          addEvent("error", "proof", errorMessage(error));
          return;
        }
      }
    },
    [addEvent],
  );

  const conversation = useConversation({
    onConnect: ({ conversationId: id }) => {
      conversationIdRef.current = id;
      setConversationId(id);
      setStarting(false);
      addEvent("success", "connection", `ElevenLabs connected. Conversation ID: ${id}`);
    },
    onDisconnect: (details) => {
      setStarting(false);
      const reason = details.reason === "error" ? details.message : details.reason;
      addEvent(
        details.reason === "error" ? "error" : "info",
        "connection",
        `Call disconnected: ${reason}.`,
      );
      const id = conversationIdRef.current;
      if (id) {
        void fetchProof(id);
      }
    },
    onError: (message, context) => {
      setStarting(false);
      addEvent("error", "elevenlabs", `${message}${formatErrorContext(context)}`);
    },
    onMessage: ({ message, role }) => {
      setTranscript((current) => [
        ...current,
        {
          role,
          message,
          timeInCallSecs: elapsedFromTranscript(current),
        },
      ]);
    },
    onStatusChange: ({ status }) => {
      addEvent("info", "status", status);
    },
  });

  const isLive = conversation.status === "connecting" || conversation.status === "connected";
  const hasVerifiedOutcome = useMemo(() => transcriptSupportsOutcome(transcript), [transcript]);
  const canApplyOutcome =
    phase !== "complete" && conversation.status === "disconnected" && hasVerifiedOutcome;

  useEffect(() => {
    onLiveChange?.(isLive);
  }, [isLive, onLiveChange]);

  useEffect(() => {
    if (focusRequest <= 0) {
      return;
    }
    document.getElementById("call-stage")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusRequest]);

  const startCall = async () => {
    setEvents([]);
    setTranscript([]);
    setProof(null);
    setConversationId(null);
    conversationIdRef.current = null;
    setStarting(true);
    addEvent("info", "microphone", "Requesting browser microphone permission.");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not expose microphone access through mediaDevices.");
      }

      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      permissionStream.getTracks().forEach((track) => track.stop());
      addEvent("success", "microphone", "Microphone permission granted.");

      addEvent("info", "session", "Provisioning the ElevenLabs negotiator and signed session.");
      const response = await fetch("/api/elevenlabs/session", { method: "POST" });
      const session = await readApiResponse<LiveSessionResponse>(response);
      setAgentName(session.agentName);
      addEvent("success", "session", `Signed session created for ${session.agentName}.`);

      addEvent("info", "connection", "Opening the real-time ElevenLabs voice channel.");
      conversation.startSession({ signedUrl: session.signedUrl });
    } catch (error) {
      setStarting(false);
      addEvent("error", "startup", errorMessage(error));
    }
  };

  const endCall = () => {
    addEvent("info", "connection", "Ending the live call and requesting provider proof.");
    conversation.endSession();
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    conversation.setMuted(next);
    addEvent("info", "microphone", next ? "Microphone muted." : "Microphone unmuted.");
  };

  const applyOutcome = () => {
    onPhaseChange("complete");
    addEvent("success", "ledger", "Verified $1,800 all-in outcome applied to the quote ledger.");
  };

  return (
    <section
      className="call-console live-voice-console"
      aria-label="Live ElevenLabs voice call console"
      data-testid="call-console"
      id="calls"
    >
      <div className="call-participants">
        <div className="participant left">
          <span className="participant-dot vendor" aria-hidden="true" />
          <div>
            <strong>You are the vendor</strong>
            <span>Speak through this device</span>
          </div>
        </div>

        <div className={isLive ? "waveform live" : "waveform idle"} aria-hidden="true">
          {Array.from({ length: 32 }, (_, index) => (
            <span key={index} style={{ animationDelay: `${index * 0.035}s` }} />
          ))}
        </div>

        <div className="participant right">
          <div>
            <strong>{agentName}</strong>
            <span>ElevenLabs voice agent</span>
          </div>
          <span className="participant-dot agent" aria-hidden="true" />
        </div>
      </div>

      <div className="call-console-header">
        <div className="section-heading">
          <span>Real ElevenLabs call</span>
          <h2>Negotiate with the voice agent live.</h2>
        </div>
        <div className={isLive ? "call-status live" : "call-status"} data-testid="live-call-status">
          <Radio size={14} aria-hidden="true" />
          <span>{starting ? "starting" : formatStatus(conversation.status)}</span>
        </div>
      </div>

      <div className="call-demo-cue">
        <Mic2 size={18} aria-hidden="true" />
        <div>
          <strong>Judge role-play cue</strong>
          <p>
            Answer as Carolina Quick Move. For the closing proof, say: “I can do $1,800 all-in,
            include stairs, and cap long carry at $75.”
          </p>
        </div>
      </div>

      <div className="call-stage live-call-stage" id="call-stage">
        <div className="live-transcript-panel">
          <div className="call-panel-heading">
            <span>Live transcript</span>
            {conversationId ? <code>{conversationId}</code> : <em>waiting for connection</em>}
          </div>
          {transcript.length > 0 ? (
            <ol className="call-transcript" data-testid="call-transcript" aria-live="polite">
              {transcript.map((turn, index) => (
                <li className={`call-turn speaker-${turn.role === "agent" ? "agent" : "vendor"}`} key={`${turn.role}-${index}-${turn.message}`}>
                  <div className="call-turn-topline">
                    <span>{turn.role === "agent" ? "AI negotiator" : "Vendor"}</span>
                    <strong>{formatCallTime(turn.timeInCallSecs)}</strong>
                  </div>
                  <p>{turn.message}</p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="call-empty">
              <div className="call-empty-mark" aria-hidden="true">
                <Mic2 size={20} />
              </div>
              <strong>No simulated transcript</strong>
              <p>Start the live call. Transcript turns appear only after ElevenLabs hears real audio.</p>
            </div>
          )}
        </div>

        <div className="call-event-panel" data-testid="call-event-log">
          <div className="call-panel-heading">
            <span>Provider event log</span>
            <em>{events.length} events</em>
          </div>
          {events.length > 0 ? (
            <ol className="call-event-log" aria-live="polite">
              {events.map((event) => (
                <li className={`event-${event.level}`} key={event.id}>
                  {event.level === "error" ? (
                    <AlertTriangle size={14} aria-hidden="true" />
                  ) : event.level === "success" ? (
                    <CheckCircle2 size={14} aria-hidden="true" />
                  ) : (
                    <ScrollText size={14} aria-hidden="true" />
                  )}
                  <div>
                    <span>
                      {event.at} · {event.stage}
                    </span>
                    <p>{event.message}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="event-log-empty">Failures and provider status will be reported here. No fallback is used.</p>
          )}
        </div>
      </div>

      <div className="call-toolbar live-call-toolbar">
        <button
          type="button"
          className="primary-action"
          data-testid="start-voice-call"
          disabled={starting || conversation.status !== "disconnected"}
          onClick={() => void startCall()}
        >
          <PhoneCall size={16} aria-hidden="true" />
          Start live voice call
        </button>
        <button
          type="button"
          className="secondary-action danger-action"
          data-testid="end-voice-call"
          disabled={conversation.status !== "connected"}
          onClick={endCall}
        >
          <PhoneOff size={16} aria-hidden="true" />
          End call
        </button>
        <button
          type="button"
          className="secondary-action"
          data-testid="mute-voice-call"
          disabled={conversation.status !== "connected"}
          aria-pressed={isMuted}
          onClick={toggleMute}
        >
          {isMuted ? <MicOff size={16} aria-hidden="true" /> : <Mic2 size={16} aria-hidden="true" />}
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button
          type="button"
          className="secondary-action verified-send"
          data-testid="send-verified-ask"
          disabled={!canApplyOutcome}
          onClick={applyOutcome}
        >
          <FileCheck2 size={16} aria-hidden="true" />
          Apply verified outcome
        </button>
      </div>

      <div className="live-proof-strip">
        <span className={proof ? "proof-state ready" : "proof-state"}>
          <ShieldCheck size={16} aria-hidden="true" />
          {proof
            ? `Provider proof attached · ${proof.transcript.length} turns · ${proof.durationSecs ?? 0}s`
            : "Outcome unlocks only after a real transcript contains the verified $1,800 all-in offer."}
        </span>
        <span className="no-fallback-badge">Live-only · no fallback</span>
      </div>
    </section>
  );
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${payload.error ?? response.statusText}`);
  }
  return payload;
}

function transcriptSupportsOutcome(transcript: LiveTranscriptTurn[]): boolean {
  return transcript.some((turn) => {
    const normalized = turn.message.toLowerCase().replace(/,/g, "");
    const hasPrice = /(?:\$?1800|eighteen hundred)/.test(normalized);
    const hasTerms = /all[ -]?in|include(?:d|s)? stairs|stairs included/.test(normalized);
    return hasPrice && hasTerms;
  });
}

function elapsedFromTranscript(transcript: LiveTranscriptTurn[]): number {
  return transcript.length === 0 ? 0 : (transcript.at(-1)?.timeInCallSecs ?? 0) + 1;
}

function formatCallTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function formatStatus(status: string): string {
  if (status === "connected") return "live voice connected";
  if (status === "connecting") return "connecting to ElevenLabs";
  if (status === "disconnecting") return "ending call";
  return "ready for live call";
}

function formatErrorContext(context: unknown): string {
  if (!context) return "";
  try {
    const value = JSON.stringify(context);
    return value && value !== "{}" ? ` · ${value.slice(0, 220)}` : "";
  } catch {
    return "";
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || `${error.name}: the browser did not provide additional details`;
  }
  return "Unknown live-call error";
}

function isRetryableProofError(error: unknown): boolean {
  const message = errorMessage(error);
  return /HTTP 404|HTTP 409|HTTP 425|HTTP 502/.test(message);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
