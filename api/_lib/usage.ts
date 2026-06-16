import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabaseClient } from "./supabase.js";
import { limitText } from "./http.js";

export type UsageSummary = {
  workspace_id: string;
  current_period_start: string;
  current_period_end: string;
  requests_today: number;
  requests_this_month: number;
  successful_requests: number;
  failed_requests: number;
  tokens_this_month: number;
  remaining_requests_per_day: number;
  remaining_monthly_tokens: number;
  configured_limits: {
    requests_per_minute: number;
    requests_per_day: number;
    concurrent_requests: number;
    monthly_token_limit: number;
    enabled_models: string[];
    plan: string;
  };
  active_processing: number;
};

export type UsageRequestRow = {
  request_id: string;
  model: string;
  status: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  latency_ms: number | null;
  error_code: string | null;
  created_at: string;
  completed_at: string | null;
};

export type UsageRequestListResult = {
  items: UsageRequestRow[];
  limit: number;
  offset: number;
  next_offset: number | null;
};

export type CompleteRequestInput = {
  requestId: string;
  status:
    | "success"
    | "rate_limited"
    | "quota_exceeded"
    | "invalid_request"
    | "invalid_key"
    | "revoked_key"
    | "provider_error"
    | "timeout"
    | "internal_error";
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs?: number | null;
  providerRequestId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};

export type AdmissionResult =
  | {
      accepted: true;
      request_id: string;
      api_request_id: string;
      workspace_id: string;
      api_key_id: string;
      user_id: string | null;
      status: "processing";
      processing_expires_at: string;
    }
  | {
      accepted: false;
      request_id: string | null;
      api_request_id: string | null;
      workspace_id: string | null;
      api_key_id: string | null;
      user_id: string | null;
      status:
        | "rate_limited"
        | "quota_exceeded"
        | "invalid_request"
        | "invalid_key"
        | "revoked_key"
        | "provider_error"
        | "timeout"
        | "internal_error";
      http_status: number;
      error_code: string;
      message: string;
    };

function monthBounds(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function dayStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

function sanitizeFailureMessage(message: string) {
  return limitText(message, 240);
}

export async function admitRequest(
  input: {
    keyDigest: string;
    model: string;
    estimatedTotalTokens: number;
    processingExpiresAt: string;
  },
  client: SupabaseClient = getAdminSupabaseClient(),
): Promise<AdmissionResult> {
  const { data, error } = await client.rpc("novametrics_admit_request", {
    p_api_key_digest: input.keyDigest,
    p_model: input.model,
    p_estimated_total_tokens: input.estimatedTotalTokens,
    p_processing_expires_at: input.processingExpiresAt,
  });

  if (error) {
    return {
      accepted: false,
      request_id: null,
      api_request_id: null,
      workspace_id: null,
      api_key_id: null,
      user_id: null,
      status: "internal_error",
      http_status: 500,
      error_code: "internal_error",
      message: "Unable to admit the request.",
    };
  }

  const result = typeof data === "string" ? (JSON.parse(data) as AdmissionResult) : (data as AdmissionResult);
  return result;
}

export async function completeRequest(
  input: CompleteRequestInput,
  client: SupabaseClient = getAdminSupabaseClient(),
) {
  const { data, error } = await client.rpc("novametrics_complete_request", {
    p_request_id: input.requestId,
    p_status: input.status,
    p_input_tokens: input.inputTokens,
    p_output_tokens: input.outputTokens,
    p_total_tokens: input.totalTokens,
    p_latency_ms: input.latencyMs ?? null,
    p_provider_request_id: input.providerRequestId ?? null,
    p_error_code: input.errorCode ?? null,
    p_error_message: input.errorMessage ? sanitizeFailureMessage(input.errorMessage) : null,
  });

  if (error) {
    return {
      ok: false as const,
      error,
    };
  }

  return {
    ok: true as const,
    data,
  };
}

export async function getUsageSummary(
  workspaceId: string,
  client: SupabaseClient = getAdminSupabaseClient(),
): Promise<UsageSummary | null> {
  const now = new Date();
  const month = monthBounds(now);
  const day = dayStart(now);

  const [limitsResult, monthRequestsResult, dayRequestsResult, activeProcessingResult] = await Promise.all([
    client
      .from("usage_limits")
      .select(
        "workspace_id, plan, requests_per_minute, requests_per_day, concurrent_requests, monthly_token_limit, enabled_models, current_period_start, current_period_end",
      )
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
    client
      .from("api_requests")
      .select("status, total_tokens, created_at")
      .eq("workspace_id", workspaceId)
      .gte("created_at", month.start),
    client
      .from("api_requests")
      .select("status, total_tokens, created_at")
      .eq("workspace_id", workspaceId)
      .gte("created_at", day),
    client
      .from("api_requests")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "processing")
      .gt("processing_expires_at", now.toISOString()),
  ]);

  if (limitsResult.error || !limitsResult.data) {
    return null;
  }

  const monthRequests = monthRequestsResult.data ?? [];
  const dayRequests = dayRequestsResult.data ?? [];
  const activeProcessing = activeProcessingResult.count ?? 0;

  const requestsThisMonth = monthRequests.length;
  const requestsToday = dayRequests.length;
  const successfulRequests = monthRequests.filter((row) => row.status === "success").length;
  const failedRequests = monthRequests.filter(
    (row) => row.status !== "success" && row.status !== "processing",
  ).length;
  const tokensThisMonth = monthRequests
    .filter((row) => row.status === "success")
    .reduce((sum, row) => sum + Number(row.total_tokens ?? 0), 0);

  return {
    workspace_id: workspaceId,
    current_period_start: limitsResult.data.current_period_start,
    current_period_end: limitsResult.data.current_period_end,
    requests_today: requestsToday,
    requests_this_month: requestsThisMonth,
    successful_requests: successfulRequests,
    failed_requests: failedRequests,
    tokens_this_month: tokensThisMonth,
    remaining_requests_per_day: Math.max(0, limitsResult.data.requests_per_day - requestsToday),
    remaining_monthly_tokens: Math.max(
      0,
      Number(limitsResult.data.monthly_token_limit) - tokensThisMonth,
    ),
    configured_limits: {
      requests_per_minute: limitsResult.data.requests_per_minute,
      requests_per_day: limitsResult.data.requests_per_day,
      concurrent_requests: limitsResult.data.concurrent_requests,
      monthly_token_limit: Number(limitsResult.data.monthly_token_limit),
      enabled_models: limitsResult.data.enabled_models ?? [],
      plan: limitsResult.data.plan,
    },
    active_processing: activeProcessing,
  };
}

export async function listUsageRequests(
  workspaceId: string,
  options: {
    limit: number;
    offset: number;
  },
  client: SupabaseClient = getAdminSupabaseClient(),
): Promise<UsageRequestListResult | null> {
  const limit = Math.min(Math.max(options.limit, 1), 100);
  const offset = Math.max(options.offset, 0);
  const rangeStart = offset;
  const rangeEnd = offset + limit - 1;

  const { data, error } = await client
    .from("api_requests")
    .select(
      "request_id, model, status, input_tokens, output_tokens, total_tokens, latency_ms, error_code, created_at, completed_at",
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .order("request_id", { ascending: false })
    .range(rangeStart, rangeEnd);

  if (error) {
    return null;
  }

  const items = (data ?? []).map((row) => ({
    request_id: row.request_id,
    model: row.model,
    status: row.status,
    input_tokens: row.input_tokens,
    output_tokens: row.output_tokens,
    total_tokens: row.total_tokens,
    latency_ms: row.latency_ms,
    error_code: row.error_code,
    created_at: row.created_at,
    completed_at: row.completed_at,
  }));

  return {
    items,
    limit,
    offset,
    next_offset: items.length === limit ? offset + limit : null,
  };
}
