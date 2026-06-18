import type { IncomingMessage, ServerResponse } from "node:http";
import { errorResponse, jsonResponse, methodNotAllowed } from "../../_lib/http.js";
import { requireAdminUser } from "../../_lib/admin.js";
import { getAdminSupabaseClient } from "../../_lib/supabase.js";
import { handleNodeRequest } from "../../_lib/vercel.js";

type WorkspaceRow = {
  id: string;
  name: string;
  plan: string;
  status: string;
  created_at: string;
};

type AdminWorkspaceRow = {
  workspace_id: string;
  name: string;
  plan: string;
  status: string;
  member_count: number;
  active_api_keys: number;
  created_at: string;
};

function parsePositiveInteger(value: string | null, fallback: number) {
  if (value === null || value === "") {
    return fallback;
  }

  if (!/^(0|[1-9]\d*)$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

async function loadWorkspacesPage(limit: number, offset: number) {
  const client = getAdminSupabaseClient();

  const { data: workspaces, error: workspacesError, count: total } = await client
    .from("workspaces")
    .select("id, name, plan, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (workspacesError) {
    return null;
  }

  const rows = (workspaces ?? []) as WorkspaceRow[];
  const workspaceIds = rows.map((row) => row.id);

  if (workspaceIds.length === 0) {
    return {
      items: [] as AdminWorkspaceRow[],
      total: total ?? 0,
    };
  }

  const [membersResult, activeKeysResult] = await Promise.all([
    client
      .from("workspace_members")
      .select("workspace_id")
      .in("workspace_id", workspaceIds),
    client
      .from("api_keys")
      .select("workspace_id")
      .eq("status", "active")
      .in("workspace_id", workspaceIds),
  ]);

  if (membersResult.error || activeKeysResult.error) {
    return null;
  }

  const memberCounts = new Map<string, number>();
  for (const row of membersResult.data ?? []) {
    if (!row?.workspace_id) {
      continue;
    }

    memberCounts.set(row.workspace_id, (memberCounts.get(row.workspace_id) ?? 0) + 1);
  }

  const activeKeyCounts = new Map<string, number>();
  for (const row of activeKeysResult.data ?? []) {
    if (!row?.workspace_id) {
      continue;
    }

    activeKeyCounts.set(row.workspace_id, (activeKeyCounts.get(row.workspace_id) ?? 0) + 1);
  }

  return {
    items: rows.map((row) => ({
      workspace_id: row.id,
      name: row.name,
      plan: row.plan,
      status: row.status,
      member_count: memberCounts.get(row.id) ?? 0,
      active_api_keys: activeKeyCounts.get(row.id) ?? 0,
      created_at: row.created_at,
    })),
    total: total ?? 0,
  };
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

  const adminResult = await requireAdminUser(request);

  if (!adminResult.ok) {
    return adminResult.response;
  }

  const url = new URL(request.url);
  const limit = parsePositiveInteger(url.searchParams.get("limit"), 20);
  const offset = parsePositiveInteger(url.searchParams.get("offset"), 0);

  if (limit === null || offset === null || limit < 1 || offset < 0) {
    return errorResponse(400, "invalid_request", "Invalid pagination parameters.");
  }

  const cappedLimit = Math.min(limit, 100);
  const page = await loadWorkspacesPage(cappedLimit, offset);

  if (!page) {
    return errorResponse(500, "internal_error", "Unable to load admin workspaces.");
  }

  const nextOffset = offset + page.items.length < page.total ? offset + cappedLimit : null;

  return jsonResponse(
    {
      items: page.items,
      limit: cappedLimit,
      offset,
      total: page.total,
      next_offset: nextOffset,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export { webHandler };

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleNodeRequest(req, res, webHandler);
}
