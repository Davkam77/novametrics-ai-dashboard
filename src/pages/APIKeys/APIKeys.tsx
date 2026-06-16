import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import Badge from "../../components/ui/badge/Badge";
import { useAuth } from "../../context/AuthContext";
import { useAppMode } from "../../context/ModeContext";
import {
  createNovaMetricsApiKey,
  getNovaMetricsUsageSummary,
  listNovaMetricsApiKeys,
  listNovaMetricsUsageRequests,
  revokeNovaMetricsApiKey,
  type NovaMetricsApiKey,
  type NovaMetricsUsageRequest,
  type NovaMetricsUsageSummary,
  NovaMetricsApiError,
} from "../../lib/novaMetricsApi";
import {
  AlertIcon,
  CopyIcon,
  LockIcon,
  PlusIcon,
  TimeIcon,
  TrashBinIcon,
} from "../../icons";

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCount(value: number) {
  return new Intl.NumberFormat(undefined).format(value);
}

function formatMaybeCount(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : formatCount(value);
}

function StatusBadge({ status }: { status: NovaMetricsApiKey["status"] }) {
  return status === "active" ? (
    <Badge color="success" variant="light" size="sm">
      Active
    </Badge>
  ) : (
    <Badge color="error" variant="light" size="sm">
      Revoked
    </Badge>
  );
}

function DemoPrompt({ onOpenChooser }: { onOpenChooser: () => void }) {
  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">
        Real Mode required
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
        API Keys live only in Real Mode
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
        Demo Mode keeps showing mock analytics. Switch to Real Mode to create
        NovaMetrics API keys, inspect masked secrets, and use the production AI
        proxy.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={onOpenChooser}>Switch to Real Mode</Button>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  className = "",
}: {
  label: string;
  value: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

function ApiRequestRow({ request }: { request: NovaMetricsUsageRequest }) {
  return (
    <tr className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
        {request.request_id}
      </td>
      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
        {request.model}
      </td>
      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
        {request.status}
      </td>
      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
        {formatCount(request.total_tokens)}
      </td>
      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
        {request.latency_ms === null ? "—" : `${request.latency_ms} ms`}
      </td>
      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
        {request.error_code ?? "—"}
      </td>
      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
        {formatDateTime(request.created_at)}
      </td>
    </tr>
  );
}

export default function APIKeys() {
  const { mode, openChooser } = useAppMode();
  const {
    status,
    session,
    profile,
    accountErrorKind,
    refreshProfile,
    signOut,
  } = useAuth();

  const [keys, setKeys] = useState<NovaMetricsApiKey[]>([]);
  const [summary, setSummary] = useState<NovaMetricsUsageSummary | null>(null);
  const [requests, setRequests] = useState<NovaMetricsUsageRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [revokeLoadingId, setRevokeLoadingId] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealedLabel, setRevealedLabel] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [requestHistoryMessage, setRequestHistoryMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session?.access_token) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const [keysResult, summaryResult, requestsResult] = await Promise.all([
        listNovaMetricsApiKeys(session.access_token),
        getNovaMetricsUsageSummary(session.access_token),
        listNovaMetricsUsageRequests(session.access_token, { limit: 8, offset: 0 }),
      ]);

      setKeys(keysResult.items);
      setSummary(summaryResult.summary);
      setRequests(requestsResult.items);
      setRequestHistoryMessage(null);
    } catch (error) {
      const message =
        error instanceof NovaMetricsApiError
          ? error.message
          : "Unable to load API keys right now.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (status === "authenticated" && session && mode === "real") {
      void loadData();
    }
  }, [status, mode, session, loadData]);

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Loading account context...
        </p>
      </div>
    );
  }

  if (status === "guest") {
    return <Navigate to="/signin?returnTo=/api-keys" replace />;
  }

  if (status === "error" && session) {
    const title =
      accountErrorKind === "query_error"
        ? "Unable to load workspace"
        : "Workspace setup incomplete";

    const handleRetry = async () => {
      await refreshProfile();
    };

    const handleSignOut = async () => {
      const result = await signOut();
      if (result.ok) {
        window.location.replace("/");
      }
    };

    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-theme-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600 dark:text-amber-300">
          Account error
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-800 dark:text-amber-100/90">
          Unable to load your account context right now.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={handleRetry}>Retry load</Button>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  if (mode !== "real") {
    return <DemoPrompt onOpenChooser={openChooser} />;
  }

  if (!profile) {
    return <Navigate to="/" replace />;
  }

  async function handleCreateKey() {
    if (!session?.access_token) {
      return;
    }

    const name = createName.trim();
    if (!name) {
      setCreateMessage("API key name is required.");
      return;
    }

    setCreateLoading(true);
    setCreateMessage(null);
    setErrorMessage(null);

    try {
      const response = await createNovaMetricsApiKey(session.access_token, name);
      setRevealedKey(response.raw_key);
      setRevealedLabel(response.api_key.name);
      setCreateName("");
      await loadData();
      setCreateMessage("API key created successfully.");
    } catch (error) {
      setCreateMessage(
        error instanceof NovaMetricsApiError ? error.message : "Unable to create API key.",
      );
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleRevokeKey(apiKey: NovaMetricsApiKey) {
    if (!session?.access_token) {
      return;
    }

    const confirmed = window.confirm(
      `Revoke "${apiKey.name}"? This key will stop working immediately.`,
    );

    if (!confirmed) {
      return;
    }

    setRevokeLoadingId(apiKey.id);
    setErrorMessage(null);

    try {
      await revokeNovaMetricsApiKey(session.access_token, apiKey.id);
      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof NovaMetricsApiError ? error.message : "Unable to revoke API key.",
      );
    } finally {
      setRevokeLoadingId(null);
    }
  }

  async function handleCopyKey() {
    if (!revealedKey) {
      return;
    }

    await navigator.clipboard.writeText(revealedKey);
    setCopyMessage("Copied to clipboard.");
  }

  function handleCloseReveal() {
    setRevealedKey(null);
    setRevealedLabel(null);
    setCopyMessage(null);
  }

  const handleRetryHistory = async () => {
    if (!session?.access_token) {
      return;
    }

    setRequestHistoryMessage(null);

    try {
      const requestsResult = await listNovaMetricsUsageRequests(session.access_token, {
        limit: 8,
        offset: 0,
      });
      setRequests(requestsResult.items);
    } catch (error) {
      setRequestHistoryMessage(
        error instanceof NovaMetricsApiError
          ? error.message
          : "Unable to load request history.",
      );
    }
  };

  return (
    <>
      <PageMeta
        title="NovaMetrics AI | API Keys"
        description="Create, list, and revoke NovaMetrics API keys for the active workspace."
      />

      <div className="space-y-6">
        <PageBreadCrumb pageTitle="API Keys" />

        <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">
                Secure API access
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                Create a NovaMetrics API key for your workspace
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
                The raw secret is shown once, then only masked metadata, status,
                and timestamps remain visible. The public AI endpoint accepts
                `Authorization: Bearer nvm_live_...`.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-300">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                Endpoint
              </p>
              <p className="mt-1 font-mono text-xs text-gray-900 dark:text-white">
                POST /api/v1/chat/completions
              </p>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
            {errorMessage}
          </div>
        )}

        <section className="grid grid-cols-12 gap-4 md:gap-6">
          <MetricCard
            label="Requests today"
            value={formatMaybeCount(summary?.requests_today)}
            description="Counted against the daily request limit."
            className="col-span-12 md:col-span-6 xl:col-span-3"
          />
          <MetricCard
            label="Monthly tokens"
            value={formatMaybeCount(summary?.tokens_this_month)}
            description="Successful usage recorded for the current period."
            className="col-span-12 md:col-span-6 xl:col-span-3"
          />
          <MetricCard
            label="Active keys"
            value={formatMaybeCount(keys.filter((key) => key.status === "active").length)}
            description="Only active keys count against the active key cap."
            className="col-span-12 md:col-span-6 xl:col-span-3"
          />
          <MetricCard
            label="Concurrent"
            value={formatMaybeCount(summary?.active_processing)}
            description="Processing requests currently reserved for this workspace."
            className="col-span-12 md:col-span-6 xl:col-span-3"
          />
        </section>

        <section className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 xl:col-span-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                <PlusIcon />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create key
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Use a short, descriptive name so you can revoke it later.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Key name
                </span>
                <input
                  type="text"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  placeholder="Production integration"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white"
                />
              </label>

              {createMessage && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-300">
                  {createMessage}
                </div>
              )}

              <Button onClick={handleCreateKey} disabled={createLoading}>
                {createLoading ? "Creating..." : "Create API key"}
              </Button>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 dark:bg-white/[0.04] dark:text-gray-200">
                <LockIcon />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  API contract
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Minimal curl example for the public chat endpoint.
                </p>
              </div>
            </div>

            <pre className="overflow-x-auto rounded-2xl border border-gray-100 bg-gray-950 px-4 py-4 text-xs leading-6 text-gray-100 dark:border-gray-800">
{`curl https://novametrics-ai-dashboard.vercel.app/api/v1/chat/completions \\
  -H "Authorization: Bearer nvm_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "llama-3.1-8b-instant",
    "messages": [{"role": "user", "content": "Summarize this workspace"}]
  }'`}
            </pre>
            <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Streaming is disabled in Stage 3. The backend returns sanitized
              errors and request metadata only.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Usage summary
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Read-only metadata for the current workspace.
              </p>
            </div>
            <Button variant="outline" onClick={loadData} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {summary ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Requests / day"
                value={formatCount(summary.requests_today)}
                description={`Remaining: ${formatCount(summary.remaining_requests_per_day)}`}
                className="col-span-12 md:col-span-6 xl:col-span-3"
              />
              <MetricCard
                label="Requests / month"
                value={formatCount(summary.requests_this_month)}
                description={`Successful: ${formatCount(summary.successful_requests)} · Failed: ${formatCount(summary.failed_requests)}`}
                className="col-span-12 md:col-span-6 xl:col-span-3"
              />
              <MetricCard
                label="Monthly tokens"
                value={formatCount(summary.tokens_this_month)}
                description={`Remaining: ${formatCount(summary.remaining_monthly_tokens)}`}
                className="col-span-12 md:col-span-6 xl:col-span-3"
              />
              <MetricCard
                label="Period"
                value={new Intl.DateTimeFormat(undefined, {
                  month: "short",
                  day: "numeric",
                }).format(new Date(summary.current_period_start))}
                description={`Ends ${formatDateTime(summary.current_period_end)}`}
                className="col-span-12 md:col-span-6 xl:col-span-3"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
              {loading ? "Loading usage summary..." : "No usage summary yet."}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                API keys
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Masked secrets only. Raw keys are never shown again.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <AlertIcon />
              <span>Limit: {summary ? summary.configured_limits.requests_per_day : "—"} requests/day</span>
            </div>
          </div>

          {loading && keys.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
              Loading API keys...
            </div>
          ) : keys.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center dark:border-gray-800 dark:bg-white/[0.02]">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                No API keys yet
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Create the first key to start sending requests through the
                NovaMetrics AI proxy.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Key
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Last used
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Revoke
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {keys.map((key) => (
                    <tr key={key.id} className="align-top">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {key.name}
                      </td>
                      <td className="px-4 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                        <span>{key.key_prefix}</span>
                        <span className="mx-2 text-gray-400">…</span>
                        <span>{key.key_last_four}</span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={key.status} />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDateTime(key.created_at)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDateTime(key.last_used_at)}
                      </td>
                      <td className="px-4 py-4">
                        {key.status === "active" ? (
                          <button
                            type="button"
                            onClick={() => handleRevokeKey(key)}
                            disabled={revokeLoadingId === key.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                          >
                            <TrashBinIcon />
                            {revokeLoadingId === key.id ? "Revoking..." : "Revoke"}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">Already revoked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent requests
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Safe metadata only. Prompts and responses are never stored.
              </p>
            </div>
            <Button variant="outline" onClick={handleRetryHistory}>
              Refresh
            </Button>
          </div>

          {requestHistoryMessage && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
              {requestHistoryMessage}
            </div>
          )}

          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center dark:border-gray-800 dark:bg-white/[0.02]">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                No request history yet
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                The table fills once the backend proxy starts receiving requests.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Request ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Model
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Tokens
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Latency
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Error code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {requests.map((request) => (
                    <ApiRequestRow key={request.request_id} request={request} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <Modal
        isOpen={Boolean(revealedKey)}
        onClose={handleCloseReveal}
        className="max-w-[640px] bg-transparent shadow-none"
        showCloseButton
        closeOnEscape
        closeOnBackdrop
        trapFocus
      >
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">
            One-time reveal
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Save this key now
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
            NovaMetrics will not show the full secret again. Copy it before
            closing this dialog.
          </p>

          <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4 font-mono text-sm text-gray-900 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white">
            {revealedKey}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                void handleCopyKey();
              }}
              startIcon={<CopyIcon />}
            >
              Copy key
            </Button>
            <Button variant="outline" onClick={handleCloseReveal}>
              Close
            </Button>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <span className="inline-flex items-center gap-2 font-semibold">
              <TimeIcon />
              Label
            </span>
            <p className="mt-1">
              {revealedLabel ? `Created key "${revealedLabel}".` : "Created key."}
              {copyMessage ? ` ${copyMessage}` : ""}
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
