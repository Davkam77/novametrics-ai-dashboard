import type { IncomingMessage, ServerResponse } from "node:http";
import { errorResponse, jsonResponse, methodNotAllowed } from "../../_lib/http.js";
import { requireAdminUser } from "../../_lib/admin.js";
import { getAdminSupabaseClient } from "../../_lib/supabase.js";
import { handleNodeRequest } from "../../_lib/vercel.js";

type UserRow = {
  id: string;
  display_name: string;
  created_at: string;
};

type AdminUserRow = {
  user_id: string;
  display_name: string | null;
  platform_role: "admin" | "user";
  workspace_count: number;
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

async function loadUsersPage(limit: number, offset: number) {
  const client = getAdminSupabaseClient();

  const { data: profiles, error: profilesError, count: total } = await client
    .from("profiles")
    .select("id, display_name, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (profilesError) {
    return null;
  }

  const rows = (profiles ?? []) as UserRow[];
  const userIds = rows.map((row) => row.id);

  if (userIds.length === 0) {
    return {
      items: [] as AdminUserRow[],
      total: total ?? 0,
    };
  }

  const [rolesResult, membershipsResult] = await Promise.all([
    client
      .from("platform_roles")
      .select("user_id, role")
      .in("user_id", userIds),
    client
      .from("workspace_members")
      .select("user_id")
      .in("user_id", userIds),
  ]);

  if (rolesResult.error || membershipsResult.error) {
    return null;
  }

  const platformRoles = new Map<string, "admin" | "user">();
  for (const row of rolesResult.data ?? []) {
    if (row?.user_id) {
      platformRoles.set(row.user_id, row.role === "admin" ? "admin" : "user");
    }
  }

  const workspaceCounts = new Map<string, number>();
  for (const row of membershipsResult.data ?? []) {
    if (!row?.user_id) {
      continue;
    }

    workspaceCounts.set(row.user_id, (workspaceCounts.get(row.user_id) ?? 0) + 1);
  }

  return {
    items: rows.map((row) => ({
      user_id: row.id,
      display_name: row.display_name ?? null,
      platform_role: platformRoles.get(row.id) ?? "user",
      workspace_count: workspaceCounts.get(row.id) ?? 0,
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
  const page = await loadUsersPage(cappedLimit, offset);

  if (!page) {
    return errorResponse(500, "internal_error", "Unable to load admin users.");
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
