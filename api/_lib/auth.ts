import type { User } from "@supabase/supabase-js";
import { getBearerToken, errorResponse } from "./http";
import { getAdminSupabaseClient } from "./supabase";

export type VerifiedSession =
  | {
      ok: true;
      user: User;
      token: string;
    }
  | {
      ok: false;
      response: Response;
    };

export async function requireVerifiedUser(request: Request): Promise<VerifiedSession> {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      response: errorResponse(401, "invalid_session", "Missing Supabase session token."),
    };
  }

  const client = getAdminSupabaseClient();
  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    return {
      ok: false,
      response: errorResponse(401, "invalid_session", "Invalid or expired Supabase session."),
    };
  }

  return {
    ok: true,
    user: data.user,
    token,
  };
}
