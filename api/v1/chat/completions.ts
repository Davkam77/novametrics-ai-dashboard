import type { IncomingMessage, ServerResponse } from "node:http";
import { env, isModelAllowed } from "../../_lib/env.js";
import { errorResponse, jsonResponse, methodNotAllowed, parseJsonBody, getBearerToken } from "../../_lib/http.js";
import { digestApiKey, isValidApiKeyFormat } from "../../_lib/apiKeys.js";
import { parseChatCompletionRequest, estimateChatTokens } from "../../_lib/validation.js";
import { admitRequest, completeRequest } from "../../_lib/usage.js";
import { callGroqChatCompletion } from "../../_lib/groq.js";
import { handleNodeRequest } from "../../_lib/vercel.js";

function buildRequestIdResponse(requestId: string, body: unknown, status = 200) {
  return jsonResponse(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Request-Id": requestId,
    },
  });
}

function buildError(
  status: number,
  code: string,
  message: string,
  requestId?: string | null,
) {
  return errorResponse(status, code, message, requestId);
}

async function webHandler(request: Request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: "POST, OPTIONS",
        "Cache-Control": "no-store",
      },
    });
  }

  if (request.method !== "POST") {
    return methodNotAllowed("POST, OPTIONS");
  }

  const token = getBearerToken(request);

  if (!token || !isValidApiKeyFormat(token)) {
    return buildError(401, "invalid_key", "Invalid NovaMetrics API key.");
  }

  const bodyResult = await parseJsonBody<Record<string, unknown>>(request, env.maxBodyBytes);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  if (bodyResult.data.stream === true) {
    return buildError(400, "stream_not_supported", "Streaming is not supported in this version.");
  }

  const requestedModel =
    typeof bodyResult.data.model === "string" && bodyResult.data.model.trim()
      ? bodyResult.data.model.trim()
      : env.defaultModel;

  if (bodyResult.data.model !== undefined && typeof bodyResult.data.model !== "string") {
    return buildError(400, "invalid_request", "Model must be a string.");
  }

  if (!isModelAllowed(requestedModel)) {
    return buildError(404, "unsupported_model", "Requested model is not available.");
  }

  const parsedRequest = parseChatCompletionRequest(bodyResult.data);

  if (!parsedRequest) {
    return buildError(400, "invalid_request", "Invalid chat completion request.");
  }

  const estimatedTotalTokens =
    estimateChatTokens(parsedRequest.messages) + parsedRequest.maxCompletionTokens;
  const processingExpiresAt = new Date(
    Date.now() + env.requestTimeoutMs + 90_000,
  ).toISOString();
  const keyDigest = digestApiKey(token);

  const admission = await admitRequest({
    keyDigest,
    model: parsedRequest.model,
    estimatedTotalTokens,
    processingExpiresAt,
  });

  if (!admission.accepted) {
    return buildError(
      admission.http_status,
      admission.error_code,
      admission.message,
      admission.request_id,
    );
  }

  const startedAt = Date.now();
  const groqResult = await callGroqChatCompletion(
    {
      model: parsedRequest.model,
      messages: parsedRequest.messages,
      temperature: parsedRequest.temperature,
      max_completion_tokens: parsedRequest.maxCompletionTokens,
      stream: false,
    },
    env.requestTimeoutMs,
  );
  const latencyMs = Math.max(0, Date.now() - startedAt);

  if (!groqResult.ok) {
    const completeResult = await completeRequest({
      requestId: admission.request_id,
      status: groqResult.code === "timeout" ? "timeout" : "provider_error",
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      latencyMs,
      errorCode: groqResult.code,
      errorMessage: groqResult.message,
    });

    if (!completeResult.ok) {
      return buildError(500, "internal_error", "Unable to finalize the request.", admission.request_id);
    }

    return buildError(
      groqResult.code === "timeout" ? 504 : 502,
      groqResult.code === "timeout" ? "timeout" : "provider_error",
      groqResult.message,
      admission.request_id,
    );
  }

  const usage = groqResult.response.usage;
  const finalizeResult = await completeRequest({
    requestId: admission.request_id,
    status: "success",
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    totalTokens: usage.total_tokens,
    latencyMs,
    providerRequestId: groqResult.response.provider_request_id,
  });

  if (!finalizeResult.ok) {
    return buildError(500, "internal_error", "Unable to finalize the request.", admission.request_id);
  }

  return buildRequestIdResponse(admission.request_id, {
    id: admission.request_id,
    object: "chat.completion",
    created: groqResult.response.created,
    model: groqResult.response.model,
    choices: groqResult.response.choices,
    usage: {
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      total_tokens: usage.total_tokens,
    },
  });
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleNodeRequest(req, res, webHandler);
}
