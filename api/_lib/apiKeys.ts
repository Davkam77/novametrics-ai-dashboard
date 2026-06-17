import { createHmac, randomBytes } from "node:crypto";
import { errorResponse, jsonResponse } from "./http.js";
import { env } from "./env.js";
import { limitText } from "./http.js";
import { getAdminSupabaseClient } from "./supabase.js";

export type ApiKeyRow = {
  id: string;
  workspace_id: string;
  created_by_user_id: string | null;
  name: string;
  key_prefix: string;
  key_last_four: string;
  status: "active" | "revoked";
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  revoked_by_user_id: string | null;
};

export type ApiKeyListItem = {
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

export function generateRawApiKey() {
  return `${env.apiKeyPrefix}${randomBytes(env.apiKeySecretBytes).toString("base64url")}`;
}

export function digestApiKey(rawKey: string) {
  return createHmac("sha256", env.keyPepper).update(rawKey).digest("hex");
}

export function buildKeyPrefix(rawKey: string) {
  return rawKey.slice(0, env.apiKeyPrefixLength);
}

export function buildKeyLastFour(rawKey: string) {
  return rawKey.slice(-env.apiKeyLastFourLength);
}

export function maskApiKey(prefix: string, lastFour: string) {
  return `${prefix}…${lastFour}`;
}

export function normalizeApiKeyName(value: unknown) {
  return limitText(value, 80);
}

export function isValidApiKeyFormat(value: string) {
  return /^nvm_live_[A-Za-z0-9_-]+$/.test(value);
}

export function toApiKeyListItem(row: ApiKeyRow): ApiKeyListItem {
  return {
    id: row.id,
    name: row.name,
    key_prefix: row.key_prefix,
    key_last_four: row.key_last_four.trim(),
    masked_key: maskApiKey(row.key_prefix, row.key_last_four.trim()),
    status: row.status,
    created_at: row.created_at,
    last_used_at: row.last_used_at,
    revoked_at: row.revoked_at,
  };
}

export async function revokeApiKeyInWorkspace(input: {
  workspaceId: string;
  apiKeyId: string;
  revokedByUserId: string;
}) {
  const client = getAdminSupabaseClient();
  const currentResult = await client
    .from("api_keys")
    .select(
      "id, workspace_id, created_by_user_id, name, key_prefix, key_last_four, status, created_at, last_used_at, revoked_at, revoked_by_user_id",
    )
    .eq("id", input.apiKeyId)
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();

  if (currentResult.error) {
    return errorResponse(500, "internal_error", "Unable to load the API key.");
  }

  if (!currentResult.data) {
    return errorResponse(404, "not_found", "API key not found.");
  }

  const now = new Date().toISOString();

  if (currentResult.data.status !== "revoked") {
    const updateResult = await client
      .from("api_keys")
      .update({
        status: "revoked",
        revoked_at: now,
        revoked_by_user_id: input.revokedByUserId,
      })
      .eq("id", input.apiKeyId)
      .eq("workspace_id", input.workspaceId)
      .select(
        "id, workspace_id, created_by_user_id, name, key_prefix, key_last_four, status, created_at, last_used_at, revoked_at, revoked_by_user_id",
      )
      .single();

    if (updateResult.error || !updateResult.data) {
      return errorResponse(500, "internal_error", "Unable to revoke the API key.");
    }

    return jsonResponse(
      {
        api_key: toApiKeyListItem(updateResult.data),
        revoked: true,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return jsonResponse(
    {
      api_key: toApiKeyListItem(currentResult.data),
      revoked: true,
      idempotent: true,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
