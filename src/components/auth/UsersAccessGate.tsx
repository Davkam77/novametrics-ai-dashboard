import { useNavigate, Navigate } from "react-router";
import { useState } from "react";
import Button from "../ui/button/Button";
import PageMeta from "../common/PageMeta";
import { useAppMode } from "../../context/ModeContext";
import { useAuth } from "../../context/AuthContext";
import Users from "../../pages/Users/Users";

function AdminUsersPlaceholder() {
  return (
    <>
      <PageMeta
        title="NovaMetrics AI | Users"
        description="Global users access is reserved for Admin."
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">
            Admin access confirmed
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Global users analytics will be connected in Stage 4
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            This account has platform-level access. The real global Users view
            is intentionally deferred until the analytics backend is ready.
          </p>
        </div>
      </div>
    </>
  );
}

function UsersDenied() {
  const navigate = useNavigate();

  return (
    <>
      <PageMeta
        title="NovaMetrics AI | Users"
        description="Users is not available for this account."
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-500">
            Access denied
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Users is reserved for Admin
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            Real user accounts do not have access to the global Users page.
            Return to the dashboard to continue working in your own workspace.
          </p>
          <div className="mt-5">
            <Button onClick={() => navigate("/", { replace: true })}>
              Back to dashboard
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function UsersLoading() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        Loading account context...
      </p>
    </div>
  );
}

function UsersAccountError() {
  const navigate = useNavigate();
  const { accountErrorKind, refreshProfile, signOut } = useAuth();
  const { setMode, setPendingMode } = useAppMode();
  const [retrying, setRetrying] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const title =
    accountErrorKind === "query_error"
      ? "Unable to load workspace"
      : "Workspace setup incomplete";
  const description =
    accountErrorKind === "query_error"
      ? "Unable to load your workspace right now. Please try again."
      : "Your workspace setup is incomplete. Please contact support or try again.";

  const handleRetry = async () => {
    setRetrying(true);

    try {
      await refreshProfile();
    } finally {
      setRetrying(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutError(null);
    const result = await signOut();

    if (result.ok) {
      setMode("demo");
      setPendingMode(null);
      navigate("/", { replace: true });
      return;
    }

    setSignOutError(result.message);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-theme-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600 dark:text-amber-300">
          Account error
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-800 dark:text-amber-100/90">
          {description}
        </p>
        {signOutError && (
          <p className="mt-3 text-sm text-red-700 dark:text-red-200">
            {signOutError}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={handleRetry} disabled={retrying}>
            {retrying ? "Retrying..." : "Retry load"}
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function UsersAccessGate() {
  const { mode } = useAppMode();
  const { status, session, profile, accountErrorKind } = useAuth();

  if (mode !== "real") {
    return <Users />;
  }

  if (status === "loading") {
    return <UsersLoading />;
  }

  if (status === "error" && session) {
    return <UsersAccountError />;
  }

  if (!profile) {
    return <Navigate to="/" replace />;
  }

  if (profile.platformRole !== "admin") {
    return <UsersDenied />;
  }

  if (accountErrorKind) {
    return <UsersAccountError />;
  }

  return <AdminUsersPlaceholder />;
}
