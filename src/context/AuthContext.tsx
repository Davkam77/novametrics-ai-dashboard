import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  supabase,
  supabaseConfigMessage,
} from "../lib/supabaseClient";
import type {
  AuthActionResult,
  AuthContextValue,
  AuthProfile,
  AuthStatus,
  WorkspaceMembership,
} from "../types/auth";

type LoadingState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  membership: WorkspaceMembership | null;
  errorMessage: string | null;
};

type LoadUserContextResult =
  | {
      profile: AuthProfile;
      membership: WorkspaceMembership;
      errorMessage: null;
    }
  | {
      profile: null;
      membership: null;
      errorMessage: string;
    };

const defaultState: LoadingState = {
  status: "loading",
  session: null,
  user: null,
  profile: null,
  membership: null,
  errorMessage: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function sanitizeSupabaseError(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const message = "message" in error ? String(error.message ?? "") : "";
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("email not confirmed") ||
    lowerMessage.includes("email address not confirmed")
  ) {
    return "Check your email to confirm your account.";
  }

  if (
    lowerMessage.includes("invalid login credentials") ||
    lowerMessage.includes("invalid credentials")
  ) {
    return "Invalid email or password.";
  }

  if (lowerMessage.includes("password should be")) {
    return "Password does not meet the minimum requirements.";
  }

  if (lowerMessage.includes("network")) {
    return "Network error. Please try again.";
  }

  if (lowerMessage.includes("expired")) {
    return "Your session expired. Please sign in again.";
  }

  if (lowerMessage.includes("rate limit")) {
    return "Too many email requests. Please wait and try again.";
  }

  return fallback;
}

function buildInitials(displayName: string, email: string) {
  const source = displayName.trim() || email.trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "GU";
}

function buildAccountSetupErrorMessage() {
  return "Your workspace setup is incomplete. Please contact support or try again.";
}

function buildAccountQueryErrorMessage() {
  return "Unable to load your workspace right now. Please try again.";
}

async function loadUserContext(user: User): Promise<LoadUserContextResult> {
  const client = supabase;

  if (!client) {
    return {
      profile: null,
      membership: null,
      errorMessage: supabaseConfigMessage ?? buildAccountQueryErrorMessage(),
    };
  }

  const profilePromise = client
    .from("profiles")
    .select("id, email, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const membershipPromise = client
    .from("workspace_members")
    .select("workspace_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const [profileResult, membershipResult] = await Promise.all([
    profilePromise,
    membershipPromise,
  ]);

  if (profileResult.error) {
    return {
      profile: null,
      membership: null,
      errorMessage: sanitizeSupabaseError(
        profileResult.error,
        buildAccountQueryErrorMessage(),
      ),
    };
  }

  if (membershipResult.error) {
    return {
      profile: null,
      membership: null,
      errorMessage: sanitizeSupabaseError(
        membershipResult.error,
        buildAccountQueryErrorMessage(),
      ),
    };
  }

  const profileRow = profileResult.data;
  const membershipRow = membershipResult.data;

  if (!profileRow || !membershipRow || membershipRow.status !== "active") {
    return {
      profile: null,
      membership: null,
      errorMessage: buildAccountSetupErrorMessage(),
    };
  }

  const workspaceResult = await client
    .from("workspaces")
    .select("id, name, plan, status")
    .eq("id", membershipRow.workspace_id)
    .maybeSingle();

  if (workspaceResult.error) {
    return {
      profile: null,
      membership: null,
      errorMessage: sanitizeSupabaseError(
        workspaceResult.error,
        buildAccountQueryErrorMessage(),
      ),
    };
  }

  const workspace = workspaceResult.data;

  if (!workspace) {
    return {
      profile: null,
      membership: null,
      errorMessage: buildAccountSetupErrorMessage(),
    };
  }

  const displayName = profileRow.display_name.trim();
  const email = profileRow.email?.trim() || user.email || "";
  const role = membershipRow.role === "owner" ? "owner" : "user";

  return {
    profile: {
      id: profileRow.id,
      email,
      displayName,
      initials: buildInitials(displayName, email),
      avatarUrl: profileRow.avatar_url ?? null,
      role,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspacePlan: workspace.plan,
      workspaceStatus: workspace.status,
    },
    membership: {
      workspaceId: membershipRow.workspace_id,
      role,
      status: membershipRow.status,
    },
    errorMessage: null,
  };
}

async function applySession(session: Session): Promise<LoadingState> {
  if (!session.user) {
    return {
      ...defaultState,
      status: "guest",
      errorMessage: null,
    };
  }

  const { profile, membership, errorMessage } = await loadUserContext(
    session.user,
  );

  if (errorMessage) {
    return {
      status: "error",
      session,
      user: session.user,
      profile: null,
      membership: null,
      errorMessage,
    };
  }

  return {
    status: "authenticated",
    session,
    user: session.user,
    profile,
    membership,
    errorMessage: null,
  };
}

function guestState(): LoadingState {
  return {
    status: isSupabaseConfigured ? "guest" : "error",
    session: null,
    user: null,
    profile: null,
    membership: null,
    errorMessage: supabaseConfigMessage,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LoadingState>(defaultState);

  useEffect(() => {
    const client = supabase;

    if (!isSupabaseConfigured || !client) {
      setState({
        ...guestState(),
        status: "error",
      });
      return;
    }

    let isActive = true;

    const bootstrap = async () => {
      const { data, error } = await client.auth.getSession();

      if (!isActive) {
        return;
      }

      if (error) {
        setState({
          ...guestState(),
          status: "error",
          errorMessage: sanitizeSupabaseError(
            error,
            "Unable to load the current authentication session.",
          ),
        });
        return;
      }

      if (data.session) {
        try {
          const hydrated = await applySession(data.session);
          if (isActive) {
            setState(hydrated);
          }
        } catch (sessionError) {
          setState({
            ...guestState(),
            status: "error",
            errorMessage: sanitizeSupabaseError(
              sessionError,
              "Unable to load the authenticated profile.",
            ),
          });
        }
        return;
      }

      setState(guestState());
    };

    bootstrap();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, session) => {
      if (!isActive) {
        return;
      }

      if (!session) {
        setState(guestState());
        return;
      }

      try {
        const hydrated = await applySession(session);
        if (isActive) {
          setState(hydrated);
        }
      } catch (sessionError) {
        setState({
          ...guestState(),
          status: "error",
          errorMessage: sanitizeSupabaseError(
            sessionError,
            "Unable to refresh the authenticated profile.",
          ),
        });
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!supabase || !state.session?.user) {
      return;
    }

    try {
      const hydrated = await applySession(state.session);
      setState(hydrated);
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        errorMessage: sanitizeSupabaseError(
          error,
          "Unable to refresh the authenticated profile.",
        ),
      }));
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthActionResult> => {
    if (!supabase) {
      return {
        ok: false,
        message: supabaseConfigMessage ?? "Supabase is not configured yet.",
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        ok: false,
        message: sanitizeSupabaseError(
          error,
          "Unable to sign in with the provided credentials.",
        ),
      };
    }

    if (!data.session) {
      return {
        ok: false,
        message: "Sign in did not return a session. Please try again.",
      };
    }

    const hydrated = await applySession(data.session);
    setState(hydrated);

    return {
      ok: true,
      message: "Signed in successfully.",
    };
  };

  const signUp = async (input: {
    displayName: string;
    email: string;
    password: string;
    redirectTo?: string;
  }): Promise<AuthActionResult> => {
    if (!supabase) {
      return {
        ok: false,
        message: supabaseConfigMessage ?? "Supabase is not configured yet.",
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: input.redirectTo,
        data: {
          display_name: input.displayName,
        },
      },
    });

    if (error) {
      return {
        ok: false,
        message: sanitizeSupabaseError(
          error,
          "Unable to create the account right now.",
        ),
      };
    }

    if (data.session) {
      const hydrated = await applySession(data.session);
      setState(hydrated);
      return {
        ok: true,
        message: "Signed up successfully.",
      };
    }

    return {
      ok: true,
      message: "Check your email to confirm your account.",
      requiresEmailConfirmation: true,
    };
  };

  const signOut = async (): Promise<AuthActionResult> => {
    if (!supabase) {
      setState(guestState());
      return {
        ok: true,
        message: "Signed out.",
      };
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        ok: false,
        message: sanitizeSupabaseError(error, "Unable to sign out right now."),
      };
    }

    setState(guestState());

    return {
      ok: true,
      message: "Signed out.",
    };
  };

  const resetPassword = async (email: string, redirectTo: string) => {
    if (!supabase) {
      return {
        ok: false,
        message: supabaseConfigMessage ?? "Supabase is not configured yet.",
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return {
        ok: false,
        message: sanitizeSupabaseError(
          error,
          "Unable to send the password reset email.",
        ),
      };
    }

    return {
      ok: true,
      message: "Check your email to reset your password.",
    };
  };

  const updatePassword = async (password: string) => {
    if (!supabase) {
      return {
        ok: false,
        message: supabaseConfigMessage ?? "Supabase is not configured yet.",
      };
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return {
        ok: false,
        message: sanitizeSupabaseError(error, "Unable to update the password."),
      };
    }

    return {
      ok: true,
      message: "Password updated successfully.",
    };
  };

  const updateDisplayName = async (displayName: string) => {
    if (!supabase || !state.user) {
      return {
        ok: false,
        message: supabaseConfigMessage ?? "Supabase is not configured yet.",
      };
    }

    const normalizedDisplayName = displayName.trim();
    if (!normalizedDisplayName) {
      return {
        ok: false,
        message: "Display name is required.",
      };
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        display_name: normalizedDisplayName,
      },
    });

    if (authError) {
      return {
        ok: false,
        message: sanitizeSupabaseError(
          authError,
          "Unable to update the display name.",
        ),
      };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: normalizedDisplayName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", state.user.id);

    if (profileError) {
      return {
        ok: false,
        message: sanitizeSupabaseError(
          profileError,
          "Unable to update the workspace profile.",
        ),
      };
    }

    await refreshProfile();

    return {
      ok: true,
      message: "Profile updated successfully.",
    };
  };

  const value: AuthContextValue = {
    status: state.status,
    isConfigured: isSupabaseConfigured,
    configurationError: state.errorMessage,
    session: state.session,
    user: state.user,
    profile: state.profile,
    membership: state.membership,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateDisplayName,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
