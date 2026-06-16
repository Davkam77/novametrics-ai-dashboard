import type { IncomingMessage, ServerResponse } from "node:http";
import { errorResponse, jsonResponse, methodNotAllowed } from "../../_lib/http.js";
import { requireVerifiedUser } from "../../_lib/auth.js";
import { resolveWorkspaceForUser } from "../../_lib/workspace.js";
import { listUsageRequests } from "../../_lib/usage.js";
import { handleNodeRequest } from "../../_lib/vercel.js";

function parsePositiveInteger(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

async function webHandler(request: Request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: "GET, OPTIONS",
        "Cache-Control": "no-store",
      },
    });
  }

  if (request.method !== "GET") {
    return methodNotAllowed("GET, OPTIONS");
  }

  const sessionResult = await requireVerifiedUser(request);

  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const workspaceResult = await resolveWorkspaceForUser(sessionResult.user.id);

  if (!workspaceResult.ok) {
    return workspaceResult.response;
  }

  const url = new URL(request.url);
  const limit = Math.min(parsePositiveInteger(url.searchParams.get("limit"), 25), 100);
  const offset = parsePositiveInteger(url.searchParams.get("offset"), 0);
  const list = await listUsageRequests(workspaceResult.workspace.workspaceId, {
    limit,
    offset,
  });

  if (!list) {
    return errorResponse(500, "internal_error", "Unable to load request history.");
  }

  return jsonResponse(
    {
      workspace_id: workspaceResult.workspace.workspaceId,
      items: list.items,
      limit: list.limit,
      offset: list.offset,
      next_offset: list.next_offset,
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
