import type { SupabaseClient } from "@supabase/supabase-js";
import { errorResponse } from "./http.js";
import { getAdminSupabaseClient } from "./supabase.js";

export type WorkspaceContext = {
  workspaceId: string;
  workspaceName: string;
  workspacePlan: string;
  workspaceStatus: string;
  membershipRole: "owner" | "member";
  platformRole: "user" | "admin";
};

export type WorkspaceResult =
  | {
      ok: true;
      workspace: WorkspaceContext;
    }
  | {
      ok: false;
      response: Response;
    };

function missingWorkspaceResponse() {
  return errorResponse(403, "workspace_missing", "No active workspace is available for this account.");
}

function selectionRequiredResponse() {
  return errorResponse(
    409,
    "workspace_selection_required",
    "Multiple active workspaces were found. Workspace selection is required.",
  );
}

export async function resolveWorkspaceForUser(
  userId: string,
  client: SupabaseClient = getAdminSupabaseClient(),
): Promise<WorkspaceResult> {
  const [membershipResult, platformRoleResult] = await Promise.all([
    client
      .from("workspace_members")
      .select("workspace_id, role, status")
      .eq("user_id", userId)
      .eq("status", "active"),
    client.from("platform_roles").select("role").eq("user_id", userId).maybeSingle(),
  ]);

  if (membershipResult.error) {
    return {
      ok: false,
      response: errorResponse(500, "internal_error", "Unable to resolve the active workspace."),
    };
  }

  if (platformRoleResult.error) {
    return {
      ok: false,
      response: errorResponse(500, "internal_error", "Unable to resolve the platform role."),
    };
  }

  const memberships = membershipResult.data ?? [];

  if (memberships.length === 0) {
    return {
      ok: false,
      response: missingWorkspaceResponse(),
    };
  }

  if (memberships.length > 1) {
    return {
      ok: false,
      response: selectionRequiredResponse(),
    };
  }

  const membership = memberships[0];
  const workspaceResult = await client
    .from("workspaces")
    .select("id, name, plan, status")
    .eq("id", membership.workspace_id)
    .maybeSingle();

  if (workspaceResult.error || !workspaceResult.data) {
    return {
      ok: false,
      response: missingWorkspaceResponse(),
    };
  }

  if (workspaceResult.data.status !== "active") {
    return {
      ok: false,
      response: errorResponse(403, "workspace_disabled", "The active workspace is currently disabled."),
    };
  }

  return {
    ok: true,
    workspace: {
      workspaceId: workspaceResult.data.id,
      workspaceName: workspaceResult.data.name,
      workspacePlan: workspaceResult.data.plan,
      workspaceStatus: workspaceResult.data.status,
      membershipRole: membership.role === "owner" ? "owner" : "member",
      platformRole: platformRoleResult.data?.role === "admin" ? "admin" : "user",
    },
  };
}
