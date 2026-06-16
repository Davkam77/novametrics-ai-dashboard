import { describe, expect, it } from "vitest";
import {
  estimateChatTokens,
  isUuid,
  parseChatCompletionRequest,
  sanitizeErrorText,
} from "../api/_lib/validation";

describe("validation helpers", () => {
  it("parses a valid chat request and applies defaults", () => {
    const parsed = parseChatCompletionRequest({
      messages: [{ role: "user", content: "Hello world" }],
      temperature: 0.4,
      max_completion_tokens: 256,
    });

    expect(parsed).toMatchObject({
      model: "llama-3.1-8b-instant",
      temperature: 0.4,
      maxCompletionTokens: 256,
      stream: false,
    });
  });

  it("rejects unsupported models", () => {
    expect(
      parseChatCompletionRequest({
        model: "unsupported-model",
        messages: [{ role: "user", content: "Hello world" }],
      }),
    ).toBeNull();
  });

  it("estimates tokens for quota admission", () => {
    expect(
      estimateChatTokens([
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi" },
      ]),
    ).toBeGreaterThan(0);
  });

  it("sanitizes control characters in error messages", () => {
    expect(sanitizeErrorText("bad\u0000value\nnext", 64)).toBe("bad value next");
  });

  it("validates UUIDs", () => {
    expect(isUuid("d68f6f8d-5e40-1881-a2ab-1801cde81861")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
  });
});
