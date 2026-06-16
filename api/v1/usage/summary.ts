import type { IncomingMessage, ServerResponse } from "node:http";
import { errorResponse, jsonResponse, methodNotAllowed } from "../../_lib/http";
import { requireVerifiedUser } from "../../_lib/auth";
import { resolveWorkspaceForUser } from "../../_lib/workspace";
import { getUsageSummary } from "../../_lib/usage";
import { handleNodeRequest } from "../../_lib/vercel";

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

  const summary = await getUsageSummary(workspaceResult.workspace.workspaceId);

  if (!summary) {
    return errorResponse(500, "internal_error", "Unable to load usage summary.");
  }

  return jsonResponse(
    {
      workspace_id: workspaceResult.workspace.workspaceId,
      workspace_name: workspaceResult.workspace.workspaceName,
      workspace_plan: workspaceResult.workspace.workspacePlan,
      summary,
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
