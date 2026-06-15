import type { Session, User } from "@supabase/supabase-js";

export type AppMode = "unselected" | "demo" | "real";

export type PendingMode = "real" | null;

export type AuthStatus = "loading" | "guest" | "authenticated" | "error";

export type AuthAccountErrorKind = "query_error" | "incomplete_setup" | null;

export interface AuthProfile {
  id: string;
  email: string;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  role: "owner" | "user";
  workspaceId: string | null;
  workspaceName: string | null;
  workspacePlan: string | null;
  workspaceStatus: string | null;
}

export interface WorkspaceMembership {
  workspaceId: string;
  role: "owner" | "user";
  status: string;
}

export interface AuthActionResult {
  ok: boolean;
  message: string;
  requiresEmailConfirmation?: boolean;
  sessionCreated?: boolean;
}

export interface AuthContextValue {
  status: AuthStatus;
  accountErrorKind: AuthAccountErrorKind;
  isConfigured: boolean;
  configurationError: string | null;
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  membership: WorkspaceMembership | null;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (input: {
    displayName: string;
    email: string;
    password: string;
    redirectTo?: string;
  }) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  resetPassword: (email: string, redirectTo: string) => Promise<AuthActionResult>;
  updatePassword: (password: string) => Promise<AuthActionResult>;
  updateDisplayName: (displayName: string) => Promise<AuthActionResult>;
  refreshProfile: () => Promise<void>;
}
