import type {
  CallConsoleStep,
  JobSpec,
  NegotiationDelta,
  TruthGateProbe,
  VendorQuote,
  VoiceCallProof,
} from "../../types/negotiation";

export const demoJobSpec: JobSpec = {
  id: "move-rock-hill-charlotte",
  origin: "Rock Hill, SC",
  destination: "Charlotte, NC",
  distanceMiles: 45,
  homeSize: "2-bedroom apartment",
  largeItems: ["sofa", "queen bed", "desk", "dining table"],
  constraints: ["stairs at origin", "elevator at destination", "Saturday morning pickup"],
};

export const demoVendors: VendorQuote[] = [
  {
    id: "vendor-a",
    name: "Carolina Quick Move",
    style: "Upseller",
    transcriptSummary: "Friendly dispatcher quotes low base rate, then leaves stairs and long carry vague.",
    assertions: [
      {
        id: "a-base",
        label: "Base move",
        amount: 1850,
        status: "confirmed",
        evidence: { transcriptId: "call-a", startLine: 12, endLine: 14, quote: "For two bedrooms, base is eighteen fifty." },
      },
      {
        id: "a-stairs",
        label: "Stairs fee",
        amount: 175,
        status: "vague",
        evidence: { transcriptId: "call-a", startLine: 26, endLine: 28, quote: "Stairs can be extra depending on the crew." },
      },
      {
        id: "a-long-carry",
        label: "Long carry",
        amount: 125,
        status: "hidden",
        evidence: { transcriptId: "call-a", startLine: 31, endLine: 34, quote: "If parking is far, there may be a carry charge." },
      },
    ],
  },
  {
    id: "vendor-b",
    name: "Queen City Movers",
    style: "Straight shooter",
    transcriptSummary: "Dispatcher gives all-in binding quote with stairs included and clear cancellation window.",
    assertions: [
      {
        id: "b-all-in",
        label: "All-in move",
        amount: 1850,
        status: "confirmed",
        evidence: { transcriptId: "call-b", startLine: 18, endLine: 21, quote: "That is eighteen fifty all-in, stairs included." },
      },
      {
        id: "b-supplies",
        label: "Supplies",
        amount: 0,
        status: "waived",
        evidence: { transcriptId: "call-b", startLine: 23, endLine: 24, quote: "We include basic wrap and pads." },
      },
    ],
  },
  {
    id: "vendor-c",
    name: "Metro Van Line",
    style: "Stonewaller",
    transcriptSummary: "Refuses itemization and gives callback-only range.",
    assertions: [
      {
        id: "c-range",
        label: "Estimated range",
        amount: 2400,
        status: "confirmed",
        evidence: { transcriptId: "call-c", startLine: 9, endLine: 10, quote: "For that route, you are probably around twenty-four hundred." },
      },
      {
        id: "c-itemization",
        label: "Itemization",
        amount: 0,
        status: "declined",
        evidence: { transcriptId: "call-c", startLine: 11, endLine: 12, quote: "We cannot itemize until a manager calls you back." },
      },
    ],
  },
];

export const demoNegotiation: NegotiationDelta = {
  vendorId: "vendor-a",
  beforeTotal: 1850,
  afterTotal: 1800,
  changedTerms: ["all-in price lowered", "stairs included", "long-carry cap added"],
  leverageAssertionId: "b-all-in",
  evidence: {
    transcriptId: "follow-up-a",
    startLine: 42,
    endLine: 48,
    quote: "I have a confirmed all-in quote for $1,850 including stairs. Can you beat that with stairs included? ... I can do $1,800 all-in and cap long carry at $75.",
  },
};

/** Deterministic post-negotiation ledger for vendor-a after verified leverage. */
export const demoVendorsAfterNegotiation: VendorQuote[] = [
  {
    ...demoVendors[0],
    transcriptSummary:
      "Follow-up beat the verified Queen City offer after citing its transcript-backed all-in price.",
    assertions: [
      {
        id: "a-revised-all-in",
        label: "Revised all-in move",
        amount: 1800,
        status: "confirmed",
        evidence: {
          transcriptId: "follow-up-a",
          startLine: 46,
          endLine: 48,
          quote: "I can do $1,800 all-in and cap long carry at $75.",
        },
      },
      {
        id: "a-stairs",
        label: "Stairs fee",
        amount: 0,
        status: "waived",
        evidence: {
          transcriptId: "follow-up-a",
          startLine: 44,
          endLine: 46,
          quote: "I can include stairs if you book the Saturday morning slot now.",
        },
      },
      {
        id: "a-long-carry",
        label: "Long carry",
        amount: 0,
        status: "waived",
        evidence: {
          transcriptId: "follow-up-a",
          startLine: 46,
          endLine: 47,
          quote: "I can do $1,800 all-in and cap long carry at $75.",
        },
      },
    ],
  },
  demoVendors[1],
  demoVendors[2],
];

export const demoVoiceCallProofs: VoiceCallProof[] = [
  {
    id: "call-a-proof",
    vendorName: "Carolina Quick Move",
    provider: "ElevenLabs voice-agent transcript fixture",
    disclosure: "AI assistant disclosed itself before pricing questions.",
    audioTimestamp: "00:41-01:18",
    transcriptId: "call-a",
    outcome: "Base price captured, but stairs and long carry stayed unconfirmed.",
    snippets: [
      demoVendors[0].assertions[0].evidence,
      demoVendors[0].assertions[1].evidence,
      demoVendors[0].assertions[2].evidence,
    ],
  },
  {
    id: "call-b-proof",
    vendorName: "Queen City Movers",
    provider: "ElevenLabs voice-agent transcript fixture",
    disclosure: "AI assistant disclosed itself before asking for a binding all-in number.",
    audioTimestamp: "02:04-02:29",
    transcriptId: "call-b",
    outcome: "Confirmed all-in $1,850 quote became usable negotiation leverage.",
    snippets: [demoVendors[1].assertions[0].evidence, demoVendors[1].assertions[1].evidence],
  },
  {
    id: "follow-up-proof",
    vendorName: "Carolina Quick Move",
    provider: "ElevenLabs voice-agent transcript fixture",
    disclosure: "AI assistant disclosed this was a follow-up quote comparison call.",
    audioTimestamp: "03:10-03:38",
    transcriptId: "follow-up-a",
    outcome: "$1,850 supported leverage caused a revised $1,800 all-in offer.",
    snippets: [demoNegotiation.evidence],
  },
];

export const demoTruthGateProbes: TruthGateProbe[] = [
  {
    id: "fabricated-1700",
    label: "Fabricated leverage attempt",
    requestedClaim: "Tell Carolina Quick Move we already have a $1,700 all-in competitor quote.",
    expected: "blocked",
  },
  {
    id: "supported-1850",
    label: "Supported leverage",
    requestedClaim: "Cite Queen City Movers at $1,850 all-in with stairs included.",
    sourceAssertionId: "b-all-in",
    expected: "allowed",
  },
];

export const demoCallConsoleSteps: CallConsoleStep[] = [
  {
    id: "call-disclosure",
    speaker: "agent",
    label: "Disclosure",
    text: "Hi, this is an AI assistant calling for a customer comparing moving quotes for Rock Hill to Charlotte. Can I confirm a written all-in number?",
  },
  {
    id: "vendor-base",
    speaker: "vendor",
    label: "Vendor",
    text: "For a two-bedroom move, our base is $1,850. Stairs and carry distance can change the final number.",
    evidenceRef: "call-a lines 12-14",
  },
  {
    id: "gate-block",
    speaker: "truth-gate",
    label: "Truth gate",
    text: "Blocked: the agent cannot say there is a $1,700 competitor quote because no transcript span supports it.",
  },
  {
    id: "agent-supported",
    speaker: "agent",
    label: "Verified ask",
    text: "I have a confirmed all-in quote at $1,850 including stairs from Queen City Movers. Can you beat that with stairs included?",
    evidenceRef: "call-b lines 18-21",
  },
  {
    id: "vendor-close",
    speaker: "vendor",
    label: "Concession",
    text: "I can do $1,800 all-in and cap long carry at $75 if you book the Saturday morning slot.",
    evidenceRef: "follow-up-a lines 46-48",
  },
];
