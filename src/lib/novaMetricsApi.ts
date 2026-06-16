export type NovaMetricsApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  key_last_four: string;
  masked_key: string;
  status: "active" | "revoked";
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type NovaMetricsApiKeyCreateResponse = {
  raw_key: string;
  api_key: NovaMetricsApiKey;
  warning: string;
};

export type NovaMetricsUsageSummary = {
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

export type NovaMetricsUsageRequest = {
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

export type NovaMetricsUsageRequestsResponse = {
  workspace_id: string;
  items: NovaMetricsUsageRequest[];
  limit: number;
  offset: number;
  next_offset: number | null;
};

export class NovaMetricsApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "NovaMetricsApiError";
    this.status = status;
    this.code = code;
  }
}

const API_BASE = "/api/v1";

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : {};
}

async function requestJson<TResponse>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (!response.ok) {
    const body = (await readJsonResponse(response)) as {
      error?: { code?: string; message?: string };
      message?: string;
    };

    throw new NovaMetricsApiError(
      response.status,
      body.error?.code ?? "request_failed",
      body.error?.message ?? body.message ?? "Request failed.",
    );
  }

  return (await readJsonResponse(response)) as TResponse;
}

export async function createNovaMetricsApiKey(
  token: string,
  name: string,
) {
  return requestJson<NovaMetricsApiKeyCreateResponse>("/api-keys", token, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function listNovaMetricsApiKeys(token: string) {
  return requestJson<{ workspace_id: string; max_active_keys: number; items: NovaMetricsApiKey[] }>(
    "/api-keys",
    token,
    {
      method: "GET",
      cache: "no-store",
    },
  );
}

export async function revokeNovaMetricsApiKey(token: string, id: string) {
  return requestJson<{ api_key: NovaMetricsApiKey; revoked: boolean; idempotent?: boolean }>(
    `/api-keys/${id}/revoke`,
    token,
    {
      method: "POST",
    },
  );
}

export async function getNovaMetricsUsageSummary(token: string) {
  return requestJson<{
    workspace_id: string;
    workspace_name: string;
    workspace_plan: string;
    summary: NovaMetricsUsageSummary;
  }>("/usage/summary", token, {
    method: "GET",
    cache: "no-store",
  });
}

export async function listNovaMetricsUsageRequests(
  token: string,
  params?: { limit?: number; offset?: number },
) {
  const query = new URLSearchParams();

  if (params?.limit !== undefined) {
    query.set("limit", String(params.limit));
  }

  if (params?.offset !== undefined) {
    query.set("offset", String(params.offset));
  }

  return requestJson<NovaMetricsUsageRequestsResponse>(
    `/usage/requests${query.toString() ? `?${query.toString()}` : ""}`,
    token,
    {
      method: "GET",
      cache: "no-store",
    },
  );
}
