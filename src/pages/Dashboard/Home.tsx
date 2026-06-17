import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import DateRangeSelector from "../../components/common/DateRangeSelector";
import MetricCard from "../../components/analytics/MetricCard";
import RevenueChart from "../../components/analytics/RevenueChart";
import TokenUsageChart from "../../components/analytics/TokenUsageChart";
import ApiUsageChart from "../../components/analytics/ApiUsageChart";
import AutomationStatusChart from "../../components/analytics/AutomationStatusChart";
import ModelDistributionChart from "../../components/analytics/ModelDistributionChart";
import RecentActivityTable from "../../components/analytics/RecentActivityTable";
import RecentRequestsTable from "../../components/analytics/RecentRequestsTable";
import TopAIModelsTable from "../../components/analytics/TopAIModelsTable";
import EndpointPerformanceTable from "../../components/analytics/EndpointPerformanceTable";
import { useAuth } from "../../context/AuthContext";
import { useAppMode } from "../../context/ModeContext";
import {
  analyticsDateRanges,
  defaultAnalyticsRange,
  getAnalyticsSnapshot,
  buildDashboardCsv,
  downloadCsv,
} from "../../data/analyticsMockData";
import {
  AlertIcon,
  BoltIcon,
  DollarLineIcon,
  GroupIcon,
  TableIcon,
  TaskIcon,
} from "../../icons";
import {
  getNovaMetricsAdminOverview,
  getNovaMetricsUsageSummary,
  listNovaMetricsUsageRequests,
  type NovaMetricsAdminOverview,
  type NovaMetricsUsageRequest,
  type NovaMetricsUsageSummary,
  NovaMetricsApiError,
} from "../../lib/novaMetricsApi";

type RealMetricCard = {
  key: string;
  label: string;
  value: string;
  change: string;
  comparisonPeriod: string;
  tone: "positive" | "neutral" | "negative";
  tooltip: string;
  icon: ReactNode;
  className: string;
};

function formatCount(value: number) {
  return new Intl.NumberFormat(undefined).format(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatShortDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

function buildRealMetrics(summary: NovaMetricsUsageSummary, workspaceName: string): RealMetricCard[] {
  return [
    {
      key: "requests-today",
      label: "Requests Today",
      value: formatCount(summary.requests_today),
      change: "Today",
      comparisonPeriod: `${workspaceName} - current day`,
      tone: "neutral",
      tooltip: "Production requests created today for this workspace.",
      icon: <TableIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-4",
    },
    {
      key: "requests-month",
      label: "Requests This Month",
      value: formatCount(summary.requests_this_month),
      change: "Month",
      comparisonPeriod: `${workspaceName} - current month`,
      tone: "neutral",
      tooltip: "Production requests created in the current month.",
      icon: <TableIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-4",
    },
    {
      key: "tokens-month",
      label: "Tokens This Month",
      value: formatCount(summary.tokens_this_month),
      change: "Month",
      comparisonPeriod: `${workspaceName} - current month`,
      tone: "neutral",
      tooltip: "Total tokens recorded for successful requests in the current month.",
      icon: <BoltIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-4",
    },
    {
      key: "successful-requests",
      label: "Successful Requests",
      value: formatCount(summary.successful_requests),
      change: "Success",
      comparisonPeriod: `${workspaceName} - current month`,
      tone: "positive",
      tooltip: "Requests that completed successfully in the current month.",
      icon: <TaskIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-4",
    },
    {
      key: "failed-requests",
      label: "Failed Requests",
      value: formatCount(summary.failed_requests),
      change: "Errors",
      comparisonPeriod: `${workspaceName} - current month`,
      tone: "negative",
      tooltip: "Requests that failed with a sanitized error code in the current month.",
      icon: <AlertIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-4",
    },
    {
      key: "remaining-daily",
      label: "Remaining Daily Requests",
      value: formatCount(summary.remaining_requests_per_day),
      change: "Daily",
      comparisonPeriod: `${workspaceName} - daily quota remaining`,
      tone: "positive",
      tooltip: "Requests remaining for the current daily limit window.",
      icon: <GroupIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-4",
    },
    {
      key: "remaining-monthly",
      label: "Remaining Monthly Tokens",
      value: formatCount(summary.remaining_monthly_tokens),
      change: "Monthly",
      comparisonPeriod: `${workspaceName} - monthly quota remaining`,
      tone: "positive",
      tooltip: "Tokens remaining for the current monthly quota window.",
      icon: <BoltIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-4",
    },
  ];
}

function buildAdminMetrics(overview: NovaMetricsAdminOverview): RealMetricCard[] {
  return [
    {
      key: "total-users",
      label: "Total Users",
      value: formatCount(overview.total_users),
      change: "Global",
      comparisonPeriod: "All authenticated users",
      tone: "neutral",
      tooltip: "Total user profiles in the platform.",
      icon: <GroupIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-3",
    },
    {
      key: "total-workspaces",
      label: "Total Workspaces",
      value: formatCount(overview.total_workspaces),
      change: "Global",
      comparisonPeriod: "All workspaces",
      tone: "neutral",
      tooltip: "Total active workspaces in the platform.",
      icon: <TableIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-3",
    },
    {
      key: "active-api-keys",
      label: "Active API Keys",
      value: formatCount(overview.active_api_keys),
      change: "Global",
      comparisonPeriod: "All active keys",
      tone: "neutral",
      tooltip: "Total active NovaMetrics API keys.",
      icon: <BoltIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-3",
    },
    {
      key: "requests-today",
      label: "Requests Today",
      value: formatCount(overview.requests_today),
      change: "Today",
      comparisonPeriod: "Platform-wide today",
      tone: "neutral",
      tooltip: "Platform requests created today.",
      icon: <TableIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-3",
    },
    {
      key: "requests-month",
      label: "Requests This Month",
      value: formatCount(overview.requests_this_month),
      change: "Month",
      comparisonPeriod: "Platform-wide current month",
      tone: "neutral",
      tooltip: "Platform requests created in the current month.",
      icon: <TableIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-3",
    },
    {
      key: "tokens-month",
      label: "Tokens This Month",
      value: formatCount(overview.tokens_this_month),
      change: "Month",
      comparisonPeriod: "Platform-wide current month",
      tone: "neutral",
      tooltip: "Tokens recorded across successful requests this month.",
      icon: <BoltIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-3",
    },
    {
      key: "successful-requests",
      label: "Successful Requests",
      value: formatCount(overview.successful_requests),
      change: "Success",
      comparisonPeriod: "Platform-wide current month",
      tone: "positive",
      tooltip: "Requests completed successfully this month.",
      icon: <TaskIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-3",
    },
    {
      key: "failed-requests",
      label: "Failed Requests",
      value: formatCount(overview.failed_requests),
      change: "Errors",
      comparisonPeriod: "Platform-wide current month",
      tone: "negative",
      tooltip: "Requests that failed this month.",
      icon: <AlertIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-3",
    },
  ];
}

function LoadingOverview() {
  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 shadow-theme-xs dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
            Real Mode
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Loading workspace usage...
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400 sm:text-base">
            Reading live usage summary and recent request metadata for the current workspace.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-4 md:gap-6">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="col-span-12 h-[156px] animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.04] sm:col-span-6 xl:col-span-4"
          />
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center dark:border-gray-800 dark:bg-white/[0.02]">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          Loading recent requests...
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The table will appear once the API replies.
        </p>
      </div>
    </section>
  );
}

function LoadingAdminOverview() {
  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 shadow-theme-xs dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
            Real Mode
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Loading global overview...
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400 sm:text-base">
            Reading live platform KPI for admin access.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="col-span-12 h-[156px] animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.04] sm:col-span-6 xl:col-span-3"
          />
        ))}
      </div>
    </section>
  );
}

function RealModeAccessIssue({
  title,
  message,
  onRetry,
  showRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  showRetry: boolean;
}) {
  return (
    <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-theme-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-200">
        Real Mode
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-amber-950 dark:text-white">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-900/90 dark:text-amber-100/90">
        {message}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {showRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-amber-700"
          >
            Retry load
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => window.location.assign("/signin?returnTo=/")}
          className="inline-flex items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-amber-800 shadow-theme-sm transition hover:bg-amber-100 dark:border-amber-400/30 dark:bg-white/[0.04] dark:text-amber-50 dark:hover:bg-white/[0.08]"
        >
          Sign in again
        </button>
      </div>
    </section>
  );
}

function RealAdminOverview() {
  const { session, profile } = useAuth();
  const [overview, setOverview] = useState<NovaMetricsAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const loadOverview = useCallback(async () => {
    const token = session?.access_token?.trim() ?? "";

    if (!token) {
      setOverview(null);
      setSessionExpired(true);
      setErrorMessage("Your session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSessionExpired(false);

    try {
      const result = await getNovaMetricsAdminOverview(token);
      setOverview(result);
    } catch (error) {
      setOverview(null);

      if (error instanceof NovaMetricsApiError && error.status === 401) {
        setSessionExpired(true);
        setErrorMessage("Your session expired. Please sign in again.");
      } else if (
        error instanceof NovaMetricsApiError &&
        error.status === 403 &&
        error.code === "forbidden"
      ) {
        setSessionExpired(false);
        setErrorMessage("Admin access required.");
      } else if (error instanceof NovaMetricsApiError) {
        setSessionExpired(false);
        setErrorMessage(error.message);
      } else {
        setSessionExpired(false);
        setErrorMessage("Unable to load admin overview.");
      }
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  if (loading && !overview) {
    return <LoadingAdminOverview />;
  }

  if (errorMessage && !overview) {
    return (
      <RealModeAccessIssue
        title={sessionExpired ? "Session expired" : "Unable to load admin overview"}
        message={errorMessage}
        onRetry={loadOverview}
        showRetry={!sessionExpired}
      />
    );
  }

  const metrics = overview ? buildAdminMetrics(overview) : [];
  const roleName = profile?.platformRole === "admin" ? "Admin" : "User";

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-50 p-6 shadow-theme-sm dark:border-brand-500/20 dark:from-brand-500/10 dark:via-white/[0.03] dark:to-brand-500/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 shadow-theme-xs dark:border-brand-500/20 dark:bg-white/[0.03] dark:text-brand-300">
              Real Admin Overview
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Global platform KPI
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400 sm:text-base">
              Live platform totals for {roleName} access. Demo Mode and Real User
              Overview remain unchanged.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadOverview()}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-12 gap-4 md:gap-6">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.key}
            label={metric.label}
            value={metric.value}
            change={metric.change}
            comparisonPeriod={metric.comparisonPeriod}
            tone={metric.tone}
            tooltip={metric.tooltip}
            icon={metric.icon}
            className={metric.className}
          />
        ))}
      </section>
    </div>
  );
}

function RealUserOverview({
  workspaceName,
  workspacePlan,
  accessToken,
}: {
  workspaceName: string;
  workspacePlan: string;
  accessToken: string;
}) {
  const [summary, setSummary] = useState<NovaMetricsUsageSummary | null>(null);
  const [requests, setRequests] = useState<NovaMetricsUsageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const loadOverview = useCallback(async () => {
    const token = accessToken.trim();
    if (!token) {
      setSummary(null);
      setRequests([]);
      setSessionExpired(true);
      setErrorMessage("Your session expired. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSessionExpired(false);

    try {
      const [summaryResult, requestsResult] = await Promise.all([
        getNovaMetricsUsageSummary(token),
        listNovaMetricsUsageRequests(token, { limit: 10, offset: 0 }),
      ]);

      setSummary(summaryResult.summary);
      setRequests(requestsResult.items);
    } catch (error) {
      setSummary(null);
      setRequests([]);

      if (error instanceof NovaMetricsApiError && error.status === 401) {
        setSessionExpired(true);
        setErrorMessage("Your session expired. Please sign in again.");
      } else if (error instanceof NovaMetricsApiError) {
        setSessionExpired(false);
        setErrorMessage(error.message);
      } else {
        setSessionExpired(false);
        setErrorMessage("Unable to load usage data.");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  if (loading && !summary && requests.length === 0) {
    return <LoadingOverview />;
  }

  if (errorMessage && !summary && requests.length === 0) {
    return (
      <RealModeAccessIssue
        title={sessionExpired ? "Session expired" : "Unable to load workspace usage"}
        message={errorMessage}
        onRetry={loadOverview}
        showRetry={!sessionExpired}
      />
    );
  }

  const metrics = summary ? buildRealMetrics(summary, workspaceName) : [];

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-50 p-6 shadow-theme-sm dark:border-brand-500/20 dark:from-brand-500/10 dark:via-white/[0.03] dark:to-brand-500/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 shadow-theme-xs dark:border-brand-500/20 dark:bg-white/[0.03] dark:text-brand-300">
              Real User Overview
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              {workspaceName}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400 sm:text-base">
              Live usage data for your workspace API keys. Demo Mode remains
              unchanged and continues to show the mock analytics dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadOverview()}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                Workspace plan
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {workspacePlan}
              </p>
            </div>
          </div>
        </div>
      </section>

      {summary ? (
        <section className="grid grid-cols-12 gap-4 md:gap-6">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.key}
              label={metric.label}
              value={metric.value}
              change={metric.change}
              comparisonPeriod={metric.comparisonPeriod}
              tone={metric.tone}
              tooltip={metric.tooltip}
              icon={metric.icon}
              className={metric.className}
            />
          ))}
        </section>
      ) : null}

      {summary ? (
        <section className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Usage summary
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Current period: {formatShortDate(summary.current_period_start)}{" "}
                  to {formatDateTime(summary.current_period_end)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 dark:border-gray-800 dark:bg-white/[0.02]">
                  Plan: {summary.configured_limits.plan}
                </span>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 dark:border-gray-800 dark:bg-white/[0.02]">
                  Models: {summary.configured_limits.enabled_models.length}
                </span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <RecentRequestsTable requests={requests} loading={loading && requests.length === 0} />

      {errorMessage && summary ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}

export default function Home() {
  const [range, setRange] = useState(defaultAnalyticsRange);
  const { mode } = useAppMode();
  const { status, session, profile, accountErrorKind, refreshProfile } = useAuth();
  const snapshot = getAnalyticsSnapshot(range);
  const isRealMode = mode === "real";
  const isRealAdmin = profile?.platformRole === "admin";
  const realPageTitle = isRealAdmin ? "Real Admin Overview" : "Real User Overview";
  const pageTitle = isRealMode ? realPageTitle : "AI SaaS Analytics Dashboard";
  const pageDescription = isRealMode
    ? isRealAdmin
      ? "Live platform KPI for admins."
      : "Live workspace usage from NovaMetrics API keys."
    : "Executive overview of revenue, AI token usage, API traffic, and automation reliability.";

  const handleExport = () => {
    downloadCsv(
      `novametrics-ai-${snapshot.range}-dashboard.csv`,
      buildDashboardCsv(snapshot),
    );
  };

  if (isRealMode && status === "guest") {
    return <Navigate to="/signin?returnTo=/" replace />;
  }

  return (
    <>
      <PageMeta title={`NovaMetrics AI | ${pageTitle}`} description={pageDescription} />

      <div className="space-y-6">
        <PageBreadCrumb pageTitle={pageTitle} />

        {isRealMode ? (
          status === "loading" ? (
            <LoadingOverview />
          ) : status === "error" ? (
            <RealModeAccessIssue
              title={
                accountErrorKind === "query_error"
                  ? "Unable to load workspace"
                  : "Workspace setup incomplete"
              }
              message={
                accountErrorKind === "query_error"
                  ? "We could not load your workspace context. The real overview stays empty until the authenticated account is healthy again."
                  : "Your account context is incomplete. The real overview is unavailable until the workspace is ready."
              }
              onRetry={() => {
                void refreshProfile();
              }}
              showRetry={Boolean(session)}
            />
          ) : isRealAdmin ? (
            <RealAdminOverview />
          ) : session?.access_token && profile ? (
            <RealUserOverview
              workspaceName={String(profile.workspaceName || "Workspace")}
              workspacePlan={String(profile.workspacePlan || "Standard")}
              accessToken={session.access_token}
            />
          ) : (
            <RealModeAccessIssue
              title="Unable to load workspace usage"
              message="The authenticated workspace context is not ready yet."
              onRetry={() => {
                void refreshProfile();
              }}
              showRetry={Boolean(session)}
            />
          )
        ) : (
          <>
            <section className="rounded-[28px] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-50 p-6 shadow-theme-sm dark:border-brand-500/20 dark:from-brand-500/10 dark:via-white/[0.03] dark:to-brand-500/5">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <span className="inline-flex rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 shadow-theme-xs dark:border-brand-500/20 dark:bg-white/[0.03] dark:text-brand-300">
                    NovaMetrics AI
                  </span>
                  <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                    Revenue, token spend, and platform reliability in one view.
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400 sm:text-base">
                    Track revenue, AI consumption, API performance, and
                    automation reliability across your workspace.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
                  >
                    Export CSV
                  </button>
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                      Selected range
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {snapshot.rangeLabel}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <DateRangeSelector
              ranges={analyticsDateRanges}
              value={range}
              onChange={setRange}
            />

            <section className="grid grid-cols-12 gap-4 md:gap-6">
              {snapshot.metrics.map((metric) => {
                const iconMap = {
                  mrr: <DollarLineIcon />,
                  "active-users": <GroupIcon />,
                  "token-usage": <BoltIcon />,
                  "api-requests": <TableIcon />,
                  "automation-runs": <TaskIcon />,
                  "error-rate": <AlertIcon />,
                } as const;

                const tone =
                  metric.key === "error-rate"
                    ? metric.change.startsWith("-")
                      ? "positive"
                      : "negative"
                    : metric.change.startsWith("-")
                      ? "negative"
                      : "positive";

                return (
                  <MetricCard
                    key={metric.key}
                    label={metric.label}
                    value={metric.value}
                    change={metric.change}
                    comparisonPeriod={metric.comparisonPeriod}
                    tone={tone}
                    tooltip={metric.tooltip}
                    icon={iconMap[metric.key as keyof typeof iconMap]}
                    className="col-span-12 sm:col-span-6 xl:col-span-4"
                  />
                );
              })}
            </section>

            <section className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12 xl:col-span-7">
                <RevenueChart data={snapshot.revenueSeries} />
              </div>
              <div className="col-span-12 xl:col-span-5">
                <ModelDistributionChart data={snapshot.modelDistribution} />
              </div>
              <div className="col-span-12 xl:col-span-6">
                <TokenUsageChart data={snapshot.tokenUsageSeries} />
              </div>
              <div className="col-span-12 xl:col-span-6">
                <ApiUsageChart data={snapshot.apiUsageSeries} />
              </div>
              <div className="col-span-12">
                <AutomationStatusChart data={snapshot.automationStatusSeries} />
              </div>
            </section>

            <section className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12 xl:col-span-7">
                <RecentActivityTable rows={snapshot.recentActivity} />
              </div>
              <div className="col-span-12 xl:col-span-5">
                <TopAIModelsTable rows={snapshot.topModels} />
              </div>
              <div className="col-span-12">
                <EndpointPerformanceTable rows={snapshot.endpointPerformance} />
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
