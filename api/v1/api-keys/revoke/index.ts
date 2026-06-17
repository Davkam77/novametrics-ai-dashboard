import type { IncomingMessage, ServerResponse } from "node:http";
import { errorResponse, methodNotAllowed, parseJsonBody } from "../../../_lib/http.js";
import { requireVerifiedUser } from "../../../_lib/auth.js";
import { resolveWorkspaceForUser } from "../../../_lib/workspace.js";
import { revokeApiKeyInWorkspace } from "../../../_lib/apiKeys.js";
import { isUuid } from "../../../_lib/validation.js";
import { handleNodeRequest } from "../../../_lib/vercel.js";

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

  const bodyResult = await parseJsonBody<Record<string, unknown>>(request, 4_096);
  const url = new URL(request.url);

  const bodyId =
    bodyResult.ok && typeof bodyResult.data.id === "string" ? bodyResult.data.id : "";
  const queryId = url.searchParams.get("id") ?? "";
  const apiKeyId = bodyId || queryId;

  if (!bodyResult.ok && !queryId) {
    return bodyResult.response;
  }

  if (!isUuid(apiKeyId)) {
    return errorResponse(400, "invalid_request", "Invalid API key identifier.");
  }

  return revokeApiKeyInWorkspace({
    workspaceId: workspaceResult.workspace.workspaceId,
    apiKeyId,
    revokedByUserId: sessionResult.user.id,
  });
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleNodeRequest(req, res, webHandler);
}
