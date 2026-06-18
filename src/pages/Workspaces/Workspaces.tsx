import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import { useAppMode } from "../../context/ModeContext";
import { useAuth } from "../../context/AuthContext";
import { listNovaMetricsAdminWorkspaces, NovaMetricsApiError, type NovaMetricsAdminWorkspace } from "../../lib/novaMetricsApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

const planColors = {
  free: "light",
  starter: "info",
  team: "primary",
  growth: "success",
  pro: "success",
  enterprise: "dark",
} as const;

const statusColors = {
  active: "success",
  paused: "warning",
  disabled: "error",
} as const;

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShortId(value: string) {
  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function buildRangeLabel(offset: number, total: number, itemCount: number) {
  if (total === 0) {
    return "0 of 0";
  }

  const start = offset + 1;
  const end = Math.min(offset + itemCount, total);
  return `${start}–${end} of ${total}`;
}

function DemoWorkspacesPage() {
  return (
    <>
      <PageMeta
        title="NovaMetrics AI | Workspaces"
        description="Workspace administration is reserved for Admin."
      />

      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Workspaces" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">
            Demo mode
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Workspace administration is disabled in Demo Mode
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            Demo Mode keeps real workspace records separate from the live
            Admin workspace list.
          </p>
        </div>
      </div>
    </>
  );
}

function WorkspacesDenied() {
  const navigate = useNavigate();

  return (
    <>
      <PageMeta
        title="NovaMetrics AI | Workspaces"
        description="Workspaces is not available for this account."
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-500">
            Access denied
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Workspaces is reserved for Admin
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            Real user accounts do not have access to the global workspaces
            directory.
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

function WorkspacesLoading() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        Loading account context...
      </p>
    </div>
  );
}

function WorkspacesAccountError() {
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

function RealAdminWorkspacesPage() {
  const { session, status, profile } = useAuth();
  const [items, setItems] = useState<NovaMetricsAdminWorkspace[]>([]);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [expiredSession, setExpiredSession] = useState(false);

  useEffect(() => {
    if (status === "loading" || profile?.platformRole !== "admin") {
      return;
    }

    const token = session?.access_token;
    if (!token) {
      setExpiredSession(true);
      setLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      setExpiredSession(false);

      try {
        const response = await listNovaMetricsAdminWorkspaces(token, {
          limit,
          offset,
        });

        if (!active) {
          return;
        }

        setItems(response.items);
        setTotal(response.total);
        setNextOffset(response.next_offset);
      } catch (error) {
        if (!active) {
          return;
        }

        if (error instanceof NovaMetricsApiError) {
          if (error.status === 401) {
            setExpiredSession(true);
            setErrorMessage("Your session expired. Please sign in again.");
          } else if (error.status === 403) {
            setErrorMessage("Admin access required.");
          } else {
            setErrorMessage(error.message || "Unable to load workspaces.");
          }
        } else {
          setErrorMessage("Unable to load workspaces.");
        }

        setItems([]);
        setTotal(0);
        setNextOffset(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [session?.access_token, limit, offset, reloadTick, profile?.platformRole, status]);

  const rangeLabel = buildRangeLabel(offset, total, items.length);

  if (status === "loading" || (profile?.platformRole === "admin" && loading && items.length === 0)) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Workspaces" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Loading admin workspaces...
          </p>
        </div>
      </div>
    );
  }

  if (!profile || profile.platformRole !== "admin") {
    return <WorkspacesDenied />;
  }

  return (
    <>
      <PageMeta
        title="NovaMetrics AI | Workspaces"
        description="Admin workspace directory for the current platform."
      />

      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Workspaces" />

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">
                Real Admin Workspaces
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                Total workspaces: {total}
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {rangeLabel}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setReloadTick((value) => value + 1)}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {expiredSession ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              <p className="text-sm font-semibold">Session expired</p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-100/90">
                Please sign in again to load the workspace list.
              </p>
            </div>
          ) : errorMessage ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
              <p className="text-sm font-semibold">Unable to load workspaces</p>
              <p className="mt-1 text-sm text-red-800 dark:text-red-100/90">
                {errorMessage}
              </p>
              <div className="mt-4">
                <Button variant="outline" onClick={() => setReloadTick((value) => value + 1)} disabled={loading}>
                  Retry
                </Button>
              </div>
            </div>
          ) : null}

          {!loading && !errorMessage && items.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-300">
              No workspaces were found.
            </div>
          ) : null}

          <div className="mt-5 overflow-x-auto">
            <Table className="w-full min-w-[960px] table-auto">
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Workspace Name
                  </TableCell>
                  <TableCell isHeader className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Workspace ID
                  </TableCell>
                  <TableCell isHeader className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Plan
                  </TableCell>
                  <TableCell isHeader className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </TableCell>
                  <TableCell isHeader className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Member Count
                  </TableCell>
                  <TableCell isHeader className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Active API Keys
                  </TableCell>
                  <TableCell isHeader className="py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Created At
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item) => (
                  <TableRow key={item.workspace_id}>
                    <TableCell className="py-4 pr-4 text-sm font-medium text-gray-900 dark:text-white">
                      {item.name?.trim() ? item.name : "Unnamed workspace"}
                    </TableCell>
                    <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                      <span title={item.workspace_id}>{formatShortId(item.workspace_id)}</span>
                    </TableCell>
                    <TableCell className="py-4 pr-4 text-sm">
                      <Badge size="sm" color={planColors[(item.plan as keyof typeof planColors) ?? "free"] ?? "light"}>
                        {item.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 pr-4 text-sm">
                      <Badge size="sm" color={statusColors[(item.status as keyof typeof statusColors) ?? "active"] ?? "light"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                      {item.member_count}
                    </TableCell>
                    <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                      {item.active_api_keys}
                    </TableCell>
                    <TableCell className="py-4 text-sm text-gray-700 dark:text-gray-300">
                      {formatCreatedAt(item.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {rangeLabel}
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={loading || offset === 0}
              >
                Previous
              </Button>
              <Button
                onClick={() => {
                  if (nextOffset !== null) {
                    setOffset(nextOffset);
                  }
                }}
                disabled={loading || nextOffset === null}
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default function Workspaces() {
  const { mode } = useAppMode();
  const { status, session, profile, accountErrorKind } = useAuth();

  if (mode !== "real") {
    return <DemoWorkspacesPage />;
  }

  if (status === "loading") {
    return <WorkspacesLoading />;
  }

  if (status === "error" && session) {
    return <WorkspacesAccountError />;
  }

  if (accountErrorKind) {
    return <WorkspacesAccountError />;
  }

  if (profile?.platformRole === "admin") {
    return <RealAdminWorkspacesPage />;
  }

  return <WorkspacesDenied />;
}
