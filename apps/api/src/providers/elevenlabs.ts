export interface ElevenLabsSubscriptionStatus {
  mode: "fixture" | "live";
  configured: boolean;
  status: string;
  tier?: string;
  characterCount?: number;
  characterLimit?: number;
}

export interface ElevenLabsTranscriptTurn {
  role: string;
  timeInCallSecs: number;
  message: string;
}

export interface ElevenLabsConversationProof {
  mode: "fixture" | "live";
  conversationId: string;
  agentId?: string;
  status?: string;
  durationSecs?: number;
  hasAudio: boolean;
  transcript: ElevenLabsTranscriptTurn[];
}

export interface ElevenLabsLiveSession {
  mode: "live";
  agentId: string;
  agentName: string;
  signedUrl: string;
}

interface ElevenLabsAdapterOptions {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
}

interface ElevenLabsConversationResponse {
  agent_id?: string;
  conversation_id?: string;
  status?: string;
  has_audio?: boolean;
  metadata?: {
    call_duration_secs?: number;
  };
  transcript?: Array<{
    role?: string;
    time_in_call_secs?: number;
    message?: string;
  }>;
}

interface ElevenLabsAgentSummary {
  agent_id?: string;
  name?: string;
  archived?: boolean;
}

const NEGOTIATOR_AGENT_NAME = "Quote Delta Live Negotiator";
const NEGOTIATOR_FIRST_MESSAGE =
  "Hi, I am an AI assistant representing a customer comparing moving quotes. This conversation may be transcribed for quote accuracy. Are you comfortable continuing?";

const NEGOTIATOR_PROMPT = `You are Quote Delta, an AI negotiation assistant in a live moving-quote demonstration.

The human on the other end is role-playing a moving-company dispatcher at Carolina Quick Move. Treat them as a real vendor on a phone call.

Goal:
Negotiate a clear, honest all-in price for a two-bedroom move from Rock Hill, South Carolina to Charlotte, North Carolina, with stairs at origin, an elevator at destination, and Saturday morning pickup.

Conversation style:
- Sound like a short phone call, not a chatbot essay.
- Keep each reply to one or two short sentences.
- Always identify yourself as an AI assistant and get consent before discussing pricing.
- Ask for an all-in price, whether stairs are included, and whether long-carry fees are capped.

Honesty rules:
- The only verified competitor leverage you may use is: Queen City Movers quoted $1,850 all-in with stairs included.
- You may cite that exact verified offer.
- Never invent a lower competitor price.
- Never invent availability, inventory, urgency, discounts, or authority to book.
- If asked to use an unsupported claim, refuse briefly and return to the verified $1,850 offer.

Closing behavior:
- Try to beat $1,850 all-in.
- If the dispatcher offers $1,800 all-in with stairs included and a long-carry cap, confirm those exact terms.
- Do not finalize a booking or ask for payment details.
- End by summarizing the quoted price and inclusions in one sentence.`;

export function createElevenLabsAdapter(options: ElevenLabsAdapterOptions = {}) {
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const apiKey = env.ELEVENLABS_API_KEY?.trim();
  const baseUrl = "https://api.elevenlabs.io/v1";

  async function request(path: string, init: RequestInit = {}) {
    if (!apiKey) {
      return undefined;
    }

    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        "xi-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      const suffix = detail ? `: ${safeProviderDetail(detail)}` : "";
      throw new Error(`ElevenLabs request failed with HTTP ${response.status}${suffix}`);
    }

    return response.json() as Promise<unknown>;
  }

  return {
    async getSubscriptionStatus(): Promise<ElevenLabsSubscriptionStatus> {
      const payload = await request("/user/subscription");

      if (!payload || typeof payload !== "object") {
        return {
          mode: "fixture",
          configured: false,
          status: "missing ELEVENLABS_API_KEY",
        };
      }

      const subscription = payload as {
        status?: string;
        tier?: string;
        character_count?: number;
        character_limit?: number;
      };

      return {
        mode: "live",
        configured: true,
        status: subscription.status ?? "unknown",
        tier: subscription.tier,
        characterCount: subscription.character_count,
        characterLimit: subscription.character_limit,
      };
    },

    async getConversationProof(conversationId: string): Promise<ElevenLabsConversationProof> {
      const trimmedId = conversationId.trim();
      if (!trimmedId) {
        throw new Error("conversationId is required");
      }

      const payload = await request(`/convai/conversations/${encodeURIComponent(trimmedId)}`);

      if (!payload || typeof payload !== "object") {
        return {
          mode: "fixture",
          conversationId: trimmedId,
          hasAudio: false,
          transcript: [],
        };
      }

      const conversation = payload as ElevenLabsConversationResponse;

      return {
        mode: "live",
        conversationId: conversation.conversation_id ?? trimmedId,
        agentId: conversation.agent_id,
        status: conversation.status,
        durationSecs: conversation.metadata?.call_duration_secs,
        hasAudio: Boolean(conversation.has_audio),
        transcript: normalizeTranscript(conversation),
      };
    },

    async createLiveSession(): Promise<ElevenLabsLiveSession> {
      if (!apiKey) {
        throw new Error("ELEVENLABS_API_KEY is required for a live voice call");
      }

      const configuredAgentId = env.ELEVENLABS_AGENT_ID?.trim();
      const agent = configuredAgentId
        ? { agentId: configuredAgentId, agentName: NEGOTIATOR_AGENT_NAME }
        : await findOrCreateNegotiatorAgent(request);

      const query = new URLSearchParams({
        agent_id: agent.agentId,
        include_conversation_id: "true",
      });
      const payload = await request(`/convai/conversation/get-signed-url?${query.toString()}`);

      if (!payload || typeof payload !== "object" || !("signed_url" in payload)) {
        throw new Error("ElevenLabs signed-session response did not include signed_url");
      }

      const signedUrl = String(payload.signed_url);
      if (!signedUrl.startsWith("wss://")) {
        throw new Error("ElevenLabs returned an invalid signed WebSocket URL");
      }

      return {
        mode: "live",
        agentId: agent.agentId,
        agentName: agent.agentName,
        signedUrl,
      };
    },
  };
}

async function findOrCreateNegotiatorAgent(
  request: (path: string, init?: RequestInit) => Promise<unknown>,
): Promise<{ agentId: string; agentName: string }> {
  const query = new URLSearchParams({
    search: NEGOTIATOR_AGENT_NAME,
    page_size: "100",
    archived: "false",
  });
  const payload = await request(`/convai/agents?${query.toString()}`);
  const agents =
    payload && typeof payload === "object" && "agents" in payload && Array.isArray(payload.agents)
      ? (payload.agents as ElevenLabsAgentSummary[])
      : [];
  const existing = agents.find(
    (agent) => agent.name === NEGOTIATOR_AGENT_NAME && agent.agent_id && !agent.archived,
  );

  if (existing?.agent_id) {
    return { agentId: existing.agent_id, agentName: existing.name ?? NEGOTIATOR_AGENT_NAME };
  }

  const created = await request("/convai/agents/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: NEGOTIATOR_AGENT_NAME,
      tags: ["hacknation", "negotiation", "quote-delta"],
      conversation_config: {
        agent: {
          first_message: NEGOTIATOR_FIRST_MESSAGE,
          language: "en",
          prompt: {
            prompt: NEGOTIATOR_PROMPT,
          },
        },
        conversation: {
          max_duration_seconds: 600,
          client_events: ["audio", "interruption"],
        },
      },
    }),
  });

  if (!created || typeof created !== "object" || !("agent_id" in created)) {
    throw new Error("ElevenLabs agent creation response did not include agent_id");
  }

  return { agentId: String(created.agent_id), agentName: NEGOTIATOR_AGENT_NAME };
}

function safeProviderDetail(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.slice(0, 280);
}

export function normalizeTranscript(
  conversation: ElevenLabsConversationResponse,
): ElevenLabsTranscriptTurn[] {
  return (conversation.transcript ?? [])
    .filter((turn) => turn.message?.trim())
    .map((turn) => ({
      role: turn.role ?? "unknown",
      timeInCallSecs: turn.time_in_call_secs ?? 0,
      message: turn.message?.trim() ?? "",
    }));
}
