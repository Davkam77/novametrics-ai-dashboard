import type { IncomingMessage, ServerResponse } from "node:http";
import { env } from "../../_lib/env.js";
import { errorResponse, jsonResponse, methodNotAllowed, parseJsonBody } from "../../_lib/http.js";
import { requireVerifiedUser } from "../../_lib/auth.js";
import { resolveWorkspaceForUser } from "../../_lib/workspace.js";
import {
  buildKeyLastFour,
  buildKeyPrefix,
  digestApiKey,
  generateRawApiKey,
  normalizeApiKeyName,
  toApiKeyListItem,
} from "../../_lib/apiKeys.js";
import { getAdminSupabaseClient } from "../../_lib/supabase.js";
import { handleNodeRequest } from "../../_lib/vercel.js";

async function webHandler(request: Request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: "GET, POST, OPTIONS",
        "Cache-Control": "no-store",
      },
    });
  }

  if (request.method !== "GET" && request.method !== "POST") {
    return methodNotAllowed("GET, POST, OPTIONS");
  }

  const sessionResult = await requireVerifiedUser(request);

  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const workspaceResult = await resolveWorkspaceForUser(sessionResult.user.id);

  if (!workspaceResult.ok) {
    return workspaceResult.response;
  }

  const client = getAdminSupabaseClient();

  if (request.method === "GET") {
    const { data, error } = await client
      .from("api_keys")
      .select(
        "id, workspace_id, created_by_user_id, name, key_prefix, key_last_four, status, created_at, last_used_at, revoked_at, revoked_by_user_id",
      )
      .eq("workspace_id", workspaceResult.workspace.workspaceId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      return errorResponse(500, "internal_error", "Unable to load API keys.");
    }

    return jsonResponse(
      {
        workspace_id: workspaceResult.workspace.workspaceId,
        max_active_keys: env.maxActiveKeys,
        items: (data ?? []).map((row) => toApiKeyListItem(row)),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const bodyResult = await parseJsonBody<Record<string, unknown>>(request, 4_096);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const name = normalizeApiKeyName(bodyResult.data.name);

  if (!name) {
    return errorResponse(400, "invalid_request", "API key name is required.");
  }

  const activeCountResult = await client
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceResult.workspace.workspaceId)
    .eq("status", "active");

  if (activeCountResult.error) {
    return errorResponse(500, "internal_error", "Unable to check API key limits.");
  }

  const activeCount = activeCountResult.count ?? 0;

  if (activeCount >= env.maxActiveKeys) {
    return errorResponse(
      409,
      "max_active_keys_reached",
      "Maximum active API key limit reached for this workspace.",
    );
  }

  const rawKey = generateRawApiKey();
  const keyPrefix = buildKeyPrefix(rawKey);
  const keyLastFour = buildKeyLastFour(rawKey);
  const keyDigest = digestApiKey(rawKey);
  const now = new Date().toISOString();

  const insertResult = await client
    .from("api_keys")
    .insert({
      workspace_id: workspaceResult.workspace.workspaceId,
      created_by_user_id: sessionResult.user.id,
      name,
      key_prefix: keyPrefix,
      key_last_four: keyLastFour,
      key_digest: keyDigest,
      hash_version: env.apiKeyHashVersion,
      status: "active",
      created_at: now,
    })
    .select(
      "id, workspace_id, created_by_user_id, name, key_prefix, key_last_four, status, created_at, last_used_at, revoked_at, revoked_by_user_id",
    )
    .single();

  if (insertResult.error || !insertResult.data) {
    return errorResponse(500, "internal_error", "Unable to create the API key.");
  }

  return jsonResponse(
    {
      raw_key: rawKey,
      api_key: {
        ...toApiKeyListItem(insertResult.data),
      },
      warning:
        "Copy this key now. NovaMetrics never stores the raw secret and it cannot be shown again.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleNodeRequest(req, res, webHandler);
}
