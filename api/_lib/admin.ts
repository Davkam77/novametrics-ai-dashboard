import { errorResponse } from "./http.js";
import { getAdminSupabaseClient } from "./supabase.js";
import { requireVerifiedUser } from "./auth.js";

export type AdminSession =
  | {
      ok: true;
      userId: string;
      token: string;
    }
  | {
      ok: false;
      response: Response;
    };

export async function requireAdminUser(request: Request): Promise<AdminSession> {
  const sessionResult = await requireVerifiedUser(request);

  if (!sessionResult.ok) {
    return sessionResult;
  }

  const client = getAdminSupabaseClient();
  const { data, error } = await client
    .from("platform_roles")
    .select("role")
    .eq("user_id", sessionResult.user.id)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      response: errorResponse(500, "internal_error", "Unable to verify admin access."),
    };
  }

  if (data?.role !== "admin") {
    return {
      ok: false,
      response: errorResponse(403, "forbidden", "Admin access required."),
    };
  }

  return {
    ok: true,
    userId: sessionResult.user.id,
    token: sessionResult.token,
  };
}
