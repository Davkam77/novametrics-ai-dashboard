import type { IncomingMessage, ServerResponse } from "node:http";
import { errorResponse, jsonResponse, methodNotAllowed } from "../../../_lib/http.js";
import { requireVerifiedUser } from "../../../_lib/auth.js";
import { resolveWorkspaceForUser } from "../../../_lib/workspace.js";
import { toApiKeyListItem } from "../../../_lib/apiKeys.js";
import { getAdminSupabaseClient } from "../../../_lib/supabase.js";
import { isUuid } from "../../../_lib/validation.js";
import { handleNodeRequest } from "../../../_lib/vercel.js";

function readRouteParam(request: Request) {
  const pathname = new URL(request.url).pathname;
  const parts = pathname.split("/");
  return parts[4] ?? "";
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

  const sessionResult = await requireVerifiedUser(request);

  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const workspaceResult = await resolveWorkspaceForUser(sessionResult.user.id);

  if (!workspaceResult.ok) {
    return workspaceResult.response;
  }

  const apiKeyId = readRouteParam(request);

  if (!isUuid(apiKeyId)) {
    return errorResponse(400, "invalid_request", "Invalid API key identifier.");
  }

  const client = getAdminSupabaseClient();
  const currentResult = await client
    .from("api_keys")
    .select(
      "id, workspace_id, created_by_user_id, name, key_prefix, key_last_four, status, created_at, last_used_at, revoked_at, revoked_by_user_id",
    )
    .eq("id", apiKeyId)
    .eq("workspace_id", workspaceResult.workspace.workspaceId)
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
        revoked_by_user_id: sessionResult.user.id,
      })
      .eq("id", apiKeyId)
      .eq("workspace_id", workspaceResult.workspace.workspaceId)
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

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleNodeRequest(req, res, webHandler);
}
