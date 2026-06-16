import { randomUUID } from "node:crypto";
import { env } from "./env";
import { sanitizeErrorText } from "./validation";

export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GroqChatResponse = {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: string | null;
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  provider_request_id: string | null;
};

export type GroqErrorResult = {
  ok: false;
  status: number;
  code: string;
  message: string;
  retryable: boolean;
};

export type GroqSuccessResult = {
  ok: true;
  response: GroqChatResponse;
};

export type GroqCompletionResult = GroqSuccessResult | GroqErrorResult;

function normalizeUsage(usage: unknown) {
  if (!usage || typeof usage !== "object") {
    return {
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
    };
  }

  const record = usage as Record<string, unknown>;
  const inputTokens = Number(record.input_tokens ?? record.prompt_tokens ?? 0);
  const outputTokens = Number(record.output_tokens ?? record.completion_tokens ?? 0);
  const totalTokens = Number(record.total_tokens ?? inputTokens + outputTokens);

  return {
    input_tokens: Number.isFinite(inputTokens) && inputTokens > 0 ? Math.floor(inputTokens) : 0,
    output_tokens: Number.isFinite(outputTokens) && outputTokens > 0 ? Math.floor(outputTokens) : 0,
    total_tokens:
      Number.isFinite(totalTokens) && totalTokens > 0 ? Math.floor(totalTokens) : 0,
  };
}

function extractAssistantContent(choice: unknown) {
  if (!choice || typeof choice !== "object") {
    return "";
  }

  const message = "message" in choice ? (choice as { message?: unknown }).message : undefined;

  if (!message || typeof message !== "object") {
    return "";
  }

  const content = "content" in message ? (message as { content?: unknown }).content : undefined;
  return typeof content === "string" ? content : "";
}

function extractFinishReason(choice: unknown) {
  if (!choice || typeof choice !== "object") {
    return null;
  }

  const reason = "finish_reason" in choice ? (choice as { finish_reason?: unknown }).finish_reason : null;
  return typeof reason === "string" ? reason : null;
}

function parseProviderRequestId(response: Response) {
  return (
    response.headers.get("x-request-id") ??
    response.headers.get("request-id") ??
    response.headers.get("x-groq-request-id")
  );
}

async function requestGroqCompletion(
  payload: Record<string, unknown>,
  timeoutMs: number,
): Promise<GroqCompletionResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${env.groqBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const retryable = response.status >= 500;
      const message = sanitizeErrorText(
        `Groq request failed with HTTP ${response.status}.`,
        240,
      );

      return {
        ok: false,
        status: response.status,
        code: response.status === 429 ? "provider_rate_limited" : "provider_error",
        message,
        retryable,
      };
    }

    const data = (await response.json()) as Record<string, unknown>;
    const choices = Array.isArray(data.choices) ? data.choices : [];
    const firstChoice = choices[0];
    const usage = normalizeUsage(data.usage);
    const content = extractAssistantContent(firstChoice);

    return {
      ok: true,
      response: {
        id: typeof data.id === "string" ? data.id : randomUUID(),
        object: "chat.completion",
        created:
          typeof data.created === "number"
            ? data.created
            : Math.floor(Date.now() / 1000),
        model: typeof data.model === "string" ? data.model : String(payload.model ?? ""),
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content,
            },
            finish_reason: extractFinishReason(firstChoice),
          },
        ],
        usage,
        provider_request_id: parseProviderRequestId(response),
      },
    };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";

    return {
      ok: false,
      status: aborted ? 504 : 502,
      code: aborted ? "timeout" : "provider_error",
      message: aborted
        ? "Groq request timed out."
        : sanitizeErrorText("Unable to reach Groq.", 240),
      retryable: !aborted,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function callGroqChatCompletion(
  payload: Record<string, unknown>,
  timeoutMs: number,
): Promise<GroqCompletionResult> {
  const firstAttempt = await requestGroqCompletion(payload, timeoutMs);

  if (firstAttempt.ok || !firstAttempt.retryable) {
    return firstAttempt;
  }

  return requestGroqCompletion(payload, timeoutMs);
}
