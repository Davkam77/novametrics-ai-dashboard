import { env, getMessageContentLimit, isModelAllowed } from "./env";
import { limitText } from "./http";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ParsedChatRequest = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxCompletionTokens: number;
  stream: boolean;
};

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function validateApiKeyName(value: unknown) {
  const name = limitText(value, 80);

  if (!name) {
    return null;
  }

  return name;
}

export function sanitizeErrorText(value: unknown, maxLength = 500) {
  return limitText(value, maxLength);
}

export function estimateChatTokens(messages: ChatMessage[]) {
  const characters = messages.reduce((count, message) => count + message.content.length, 0);
  return Math.max(1, Math.ceil(characters / 4) + messages.length * 4);
}

function parseTemperature(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 2) {
    return null;
  }

  return parsed;
}

function parseMaxCompletionTokens(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return env.maxCompletionTokens;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return Math.min(parsed, env.maxCompletionTokens);
}

function parseMessages(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > env.maxMessages) {
    return null;
  }

  const maxContentLength = getMessageContentLimit();
  const messages: ChatMessage[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const role = "role" in entry ? (entry as { role?: unknown }).role : undefined;
    const content = "content" in entry ? (entry as { content?: unknown }).content : undefined;

    if (role !== "system" && role !== "user" && role !== "assistant") {
      return null;
    }

    if (typeof content !== "string") {
      return null;
    }

    const normalizedContent = content.trim();

    if (!normalizedContent || normalizedContent.length > maxContentLength) {
      return null;
    }

    messages.push({
      role,
      content: normalizedContent,
    });
  }

  return messages;
}

export function parseChatCompletionRequest(body: unknown): ParsedChatRequest | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const input = body as Record<string, unknown>;
  const messages = parseMessages(input.messages);

  if (!messages) {
    return null;
  }

  const model =
    typeof input.model === "string" && input.model.trim()
      ? input.model.trim()
      : env.defaultModel;

  if (!isModelAllowed(model)) {
    return null;
  }

  const temperature = parseTemperature(input.temperature);

  if (temperature === null) {
    return null;
  }

  const maxCompletionTokens = parseMaxCompletionTokens(
    input.max_completion_tokens ?? input.maxTokens ?? input.max_tokens,
  );

  if (maxCompletionTokens === null) {
    return null;
  }

  const stream = input.stream === true;

  return {
    model,
    messages,
    temperature,
    maxCompletionTokens,
    stream,
  };
}
