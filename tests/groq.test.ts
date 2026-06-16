import { afterEach, describe, expect, it, vi } from "vitest";
import { callGroqChatCompletion } from "../api/_lib/groq";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Groq integration helpers", () => {
  it("normalizes a successful chat completion response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "chatcmpl_123",
          created: 1718580000,
          model: "llama-3.1-8b-instant",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "Hello" },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: 3,
            completion_tokens: 2,
            total_tokens: 5,
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-request-id": "req_abc123",
          },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await callGroqChatCompletion(
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: "Say hello" }],
      },
      1_000,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.response.usage).toEqual({
        input_tokens: 3,
        output_tokens: 2,
        total_tokens: 5,
      });
      expect(result.response.provider_request_id).toBe("req_abc123");
      expect(result.response.choices[0].message.content).toBe("Hello");
    }
  });

  it("returns a sanitized provider error after a retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "server crash" } }), {
          status: 500,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "server crash" } }), {
          status: 500,
          headers: { "content-type": "application/json" },
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await callGroqChatCompletion(
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: "Say hello" }],
      },
      1_000,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("provider_error");
      expect(result.message).toContain("Groq request failed");
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
