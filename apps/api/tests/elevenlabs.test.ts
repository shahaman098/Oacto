import { describe, expect, it, vi } from "vitest";
import { createElevenLabsAdapter, normalizeTranscript } from "../src/providers/elevenlabs";

describe("ElevenLabs provider", () => {
  it("returns fixture status when no API key is configured", async () => {
    const fetchImpl = vi.fn();
    const adapter = createElevenLabsAdapter({ env: {}, fetchImpl });

    await expect(adapter.getSubscriptionStatus()).resolves.toEqual({
      mode: "fixture",
      configured: false,
      status: "missing ELEVENLABS_API_KEY",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("checks subscription status with xi-api-key header", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "active",
        tier: "project",
        character_count: 120,
        character_limit: 8000,
      }),
    });
    const adapter = createElevenLabsAdapter({
      env: { ELEVENLABS_API_KEY: "test-key" },
      fetchImpl,
    });

    await expect(adapter.getSubscriptionStatus()).resolves.toEqual({
      mode: "live",
      configured: true,
      status: "active",
      tier: "project",
      characterCount: 120,
      characterLimit: 8000,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.elevenlabs.io/v1/user/subscription",
      { headers: { "xi-api-key": "test-key" } },
    );
  });

  it("normalizes conversation transcript turns", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        agent_id: "agent-1",
        conversation_id: "conv-1",
        has_audio: true,
        metadata: { call_duration_secs: 42 },
        transcript: [
          { role: "agent", time_in_call_secs: 2, message: "I am an AI assistant calling about a move." },
          { role: "user", time_in_call_secs: 14, message: "That is eighteen fifty all-in." },
          { role: "user", time_in_call_secs: 17, message: "   " },
        ],
      }),
    });
    const adapter = createElevenLabsAdapter({
      env: { ELEVENLABS_API_KEY: "test-key" },
      fetchImpl,
    });

    await expect(adapter.getConversationProof("conv-1")).resolves.toEqual({
      mode: "live",
      conversationId: "conv-1",
      agentId: "agent-1",
      durationSecs: 42,
      hasAudio: true,
      transcript: [
        {
          role: "agent",
          timeInCallSecs: 2,
          message: "I am an AI assistant calling about a move.",
        },
        {
          role: "user",
          timeInCallSecs: 14,
          message: "That is eighteen fifty all-in.",
        },
      ],
    });
  });

  it("can normalize transcript payloads independently", () => {
    expect(
      normalizeTranscript({
        transcript: [
          { role: "agent", time_in_call_secs: 1, message: " Hello " },
          { role: "user", message: "Ok" },
        ],
      }),
    ).toEqual([
      { role: "agent", timeInCallSecs: 1, message: "Hello" },
      { role: "user", timeInCallSecs: 0, message: "Ok" },
    ]);
  });

  it("fails live session creation when no API key is configured", async () => {
    const adapter = createElevenLabsAdapter({ env: {}, fetchImpl: vi.fn() });

    await expect(adapter.createLiveSession()).rejects.toThrow(
      "ELEVENLABS_API_KEY is required for a live voice call",
    );
  });

  it("reuses the dedicated negotiator agent and returns a signed URL", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          agents: [
            {
              agent_id: "agent-live",
              name: "Quote Delta Live Negotiator",
              archived: false,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ signed_url: "wss://api.elevenlabs.io/live-session" }),
      });
    const adapter = createElevenLabsAdapter({
      env: { ELEVENLABS_API_KEY: "test-key" },
      fetchImpl,
    });

    await expect(adapter.createLiveSession()).resolves.toEqual({
      mode: "live",
      agentId: "agent-live",
      agentName: "Quote Delta Live Negotiator",
      signedUrl: "wss://api.elevenlabs.io/live-session",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain("agent_id=agent-live");
  });

  it("creates the negotiator agent when no matching agent exists", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ agents: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ agent_id: "agent-created" }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ signed_url: "wss://api.elevenlabs.io/created-session" }),
      });
    const adapter = createElevenLabsAdapter({
      env: { ELEVENLABS_API_KEY: "test-key" },
      fetchImpl,
    });

    await adapter.createLiveSession();

    const createOptions = fetchImpl.mock.calls[1]?.[1] as RequestInit;
    expect(createOptions.method).toBe("POST");
    expect(String(createOptions.body)).toContain("Quote Delta Live Negotiator");
    expect(String(createOptions.body)).toContain("$1,850 all-in");
  });
});
