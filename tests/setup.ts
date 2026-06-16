import { afterEach, vi } from "vitest";

vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "public-key");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
vi.stubEnv("GROQ_API_KEY", "groq-key");
vi.stubEnv("NVM_KEY_PEPPER", "pepper-value");

afterEach(() => {
  vi.restoreAllMocks();
});
