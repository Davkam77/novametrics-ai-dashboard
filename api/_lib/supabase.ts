import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let adminClient: SupabaseClient | null = null;

export function getAdminSupabaseClient() {
  if (!adminClient) {
    adminClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  return adminClient;
}
