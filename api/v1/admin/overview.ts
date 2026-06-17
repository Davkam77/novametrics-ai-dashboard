import type { IncomingMessage, ServerResponse } from "node:http";
import { errorResponse, jsonResponse, methodNotAllowed } from "../../_lib/http.js";
import { requireAdminUser } from "../../_lib/admin.js";
import { getGlobalAdminOverview } from "../../_lib/usage.js";
import { handleNodeRequest } from "../../_lib/vercel.js";

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

  const adminResult = await requireAdminUser(request);

  if (!adminResult.ok) {
    return adminResult.response;
  }

  const overview = await getGlobalAdminOverview();

  if (!overview) {
    return errorResponse(500, "internal_error", "Unable to load admin overview.");
  }

  return jsonResponse(overview, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export { webHandler };

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleNodeRequest(req, res, webHandler);
}
