import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import DateRangeSelector from "../../components/common/DateRangeSelector";
import MetricCard from "../../components/analytics/MetricCard";
import TokenUsageChart from "../../components/analytics/TokenUsageChart";
import ModelDistributionChart from "../../components/analytics/ModelDistributionChart";
import TopAIModelsTable from "../../components/analytics/TopAIModelsTable";
import RecentActivityTable from "../../components/analytics/RecentActivityTable";
import RecentRequestsTable from "../../components/analytics/RecentRequestsTable";
import RealAnalyticsPlaceholder from "../../components/analytics/RealAnalyticsPlaceholder";
import { useAuth } from "../../context/AuthContext";
import { useAppMode } from "../../context/ModeContext";
import {
  analyticsDateRanges,
  defaultAnalyticsRange,
  getAnalyticsSnapshot,
} from "../../data/analyticsMockData";
import { AlertIcon, BoltIcon, GroupIcon, DollarLineIcon } from "../../icons";
import {
  getNovaMetricsUsageSummary,
  listNovaMetricsUsageRequests,
  type NovaMetricsUsageRequest,
  type NovaMetricsUsageSummary,
  NovaMetricsApiError,
} from "../../lib/novaMetricsApi";

type UsageTotals = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

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

function sumUsageTotals(requests: NovaMetricsUsageRequest[]): UsageTotals {
  return requests.reduce<UsageTotals>(
    (totals, request) => ({
      inputTokens: totals.inputTokens + request.input_tokens,
      outputTokens: totals.outputTokens + request.output_tokens,
      totalTokens: totals.totalTokens + request.total_tokens,
    }),
    {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    },
  );
}

function buildRealMetrics(
  summary: NovaMetricsUsageSummary,
  totals: UsageTotals,
): RealMetricCard[] {
  return [
    {
      key: "tokens-this-month",
      label: "Tokens This Month",
      value: formatCount(summary.tokens_this_month),
      change: "Current month",
      comparisonPeriod: "Workspace usage summary",
      tone: "neutral",
      tooltip: "Total tokens recorded for the current month.",
      icon: <BoltIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-4",
    },
    {
      key: "input-tokens",
      label: "Input Tokens",
      value: formatCount(totals.inputTokens),
      change: "Recent 10 requests",
      comparisonPeriod: "Loaded request page only",
      tone: "neutral",
      tooltip:
        "Sum of input tokens across the loaded recent requests, not the full period.",
      icon: <DollarLineIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-4",
    },
    {
      key: "output-tokens",
      label: "Output Tokens",
      value: formatCount(totals.outputTokens),
      change: "Recent 10 requests",
      comparisonPeriod: "Loaded request page only",
      tone: "neutral",
      tooltip:
        "Sum of output tokens across the loaded recent requests, not the full period.",
      icon: <BoltIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-4",
    },
    {
      key: "total-tokens",
      label: "Total Tokens",
      value: formatCount(totals.totalTokens),
      change: "Recent 10 requests",
      comparisonPeriod: "Loaded request page only",
      tone: "neutral",
      tooltip:
        "Sum of total tokens across the loaded recent requests, not the full period.",
      icon: <GroupIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-4",
    },
    {
      key: "remaining-monthly",
      label: "Remaining Monthly Tokens",
      value: formatCount(summary.remaining_monthly_tokens),
      change: "Quota",
      comparisonPeriod: "Workspace monthly limit",
      tone: "positive",
      tooltip: "Monthly token quota remaining for this workspace.",
      icon: <BoltIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-4",
    },
    {
      key: "successful-requests",
      label: "Successful Requests",
      value: formatCount(summary.successful_requests),
      change: "Success",
      comparisonPeriod: "Current month",
      tone: "positive",
      tooltip: "Requests that completed successfully in the current month.",
      icon: <GroupIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-4",
    },
    {
      key: "failed-requests",
      label: "Failed Requests",
      value: formatCount(summary.failed_requests),
      change: "Errors",
      comparisonPeriod: "Current month",
      tone: "negative",
      tooltip: "Requests that failed in the current month.",
      icon: <AlertIcon />,
      className: "col-span-12 sm:col-span-6 xl:col-span-4",
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
            Loading AI usage...
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400 sm:text-base">
            Reading live usage summary and the latest request page for this
            workspace.
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
          Loading recent AI requests...
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The table will appear once the API replies.
        </p>
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
          onClick={() => window.location.assign("/signin?returnTo=/ai-usage")}
          className="inline-flex items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-amber-800 shadow-theme-sm transition hover:bg-amber-100 dark:border-amber-400/30 dark:bg-white/[0.04] dark:text-amber-50 dark:hover:bg-white/[0.08]"
        >
          Sign in again
        </button>
      </div>
    </section>
  );
}

function RealUserAIUsage({
  accessToken,
}: {
  accessToken: string;
}) {
  const [summary, setSummary] = useState<NovaMetricsUsageSummary | null>(null);
  const [requests, setRequests] = useState<NovaMetricsUsageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const loadUsage = useCallback(async () => {
    const token = accessToken.trim();
    if (!token) {
      setSummary(null);
      setRequests([]);
      setLoading(false);
      setSessionExpired(true);
      setErrorMessage("Your session expired. Please sign in again.");
      return;
    }

    setLoading(true);
    setSummary(null);
    setRequests([]);
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
      if (error instanceof NovaMetricsApiError && error.status === 401) {
        setSessionExpired(true);
        setErrorMessage("Your session expired. Please sign in again.");
      } else if (error instanceof NovaMetricsApiError) {
        setSessionExpired(false);
        setErrorMessage(error.message);
      } else {
        setSessionExpired(false);
        setErrorMessage("Unable to load AI usage data.");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  if (loading && !summary && requests.length === 0) {
    return <LoadingOverview />;
  }

  if (errorMessage && !summary && requests.length === 0) {
    return (
      <RealModeAccessIssue
        title={sessionExpired ? "Session expired" : "Unable to load AI usage"}
        message={errorMessage}
        onRetry={loadUsage}
        showRetry={!sessionExpired}
      />
    );
  }

  const totals = sumUsageTotals(requests);
  const metrics = summary ? buildRealMetrics(summary, totals) : [];

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-50 p-6 shadow-theme-sm dark:border-brand-500/20 dark:from-brand-500/10 dark:via-white/[0.03] dark:to-brand-500/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 shadow-theme-xs dark:border-brand-500/20 dark:bg-white/[0.03] dark:text-brand-300">
              Real User AI Usage
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Live workspace usage
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400 sm:text-base">
              Tokens This Month comes from the usage summary. Input, output, and
              total tokens are summed only from the latest loaded request page.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadUsage()}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
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
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Usage summary
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Current period usage for this workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 dark:border-gray-800 dark:bg-white/[0.02]">
                Requests: {formatCount(summary.requests_this_month)}
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 dark:border-gray-800 dark:bg-white/[0.02]">
                Active: {formatCount(summary.active_processing)}
              </span>
            </div>
          </div>
        </section>
      ) : null}

      <RecentRequestsTable
        requests={requests}
        loading={loading && requests.length === 0}
      />

      {errorMessage && summary ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}

export default function AIUsage() {
  const [range, setRange] = useState(defaultAnalyticsRange);
  const { mode } = useAppMode();
  const { status, session, profile, accountErrorKind, refreshProfile } = useAuth();
  const snapshot = getAnalyticsSnapshot(range);
  const isRealMode = mode === "real";
  const isRealAdmin = profile?.platformRole === "admin";

  const metrics = snapshot.metrics.filter((metric) =>
    ["token-usage", "active-users", "mrr", "error-rate"].includes(metric.key),
  );

  if (isRealMode && status === "guest") {
    return <Navigate to="/signin?returnTo=/ai-usage" replace />;
  }

  return (
    <>
      <PageMeta
        title="NovaMetrics AI | AI Usage"
        description="Token consumption, model mix, and AI usage trends."
      />

      <div className="space-y-6">
        <PageBreadCrumb pageTitle="AI Usage" />

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
                  ? "We could not load your workspace context. The real view stays empty until the authenticated account is healthy again."
                  : "Your account context is incomplete. The real view is unavailable until the workspace is ready."
              }
              onRetry={() => {
                void refreshProfile();
              }}
              showRetry={Boolean(session)}
            />
          ) : isRealAdmin ? (
            <RealAnalyticsPlaceholder
              role="admin"
              pageTitle="AI Usage"
              description="Real platform analytics are not connected yet, so this view stays empty until the backend analytics pipeline is ready."
              details={[
                "Demo Mode keeps the portfolio mock token charts separate from the real workspace.",
                "Global token and model analytics will be connected in Stage 4.",
              ]}
            />
          ) : session?.access_token && profile ? (
            <RealUserAIUsage accessToken={session.access_token} />
          ) : (
            <RealModeAccessIssue
              title="Unable to load AI usage"
              message="The authenticated workspace context is not ready yet."
              onRetry={() => {
                void refreshProfile();
              }}
              showRetry={Boolean(session)}
            />
          )
        ) : (
          <>
            <DateRangeSelector
              ranges={analyticsDateRanges}
              value={range}
              onChange={setRange}
            />

            <section className="grid grid-cols-12 gap-4 md:gap-6">
              {metrics.map((metric) => {
                const iconMap = {
                  mrr: <DollarLineIcon />,
                  "active-users": <GroupIcon />,
                  "token-usage": <BoltIcon />,
                  "error-rate": <AlertIcon />,
                } as const;

                return (
                  <MetricCard
                    key={metric.key}
                    label={metric.label}
                    value={metric.value}
                    change={metric.change}
                    comparisonPeriod={metric.comparisonPeriod}
                    tone={
                      metric.key === "error-rate"
                        ? metric.change.startsWith("-")
                          ? "positive"
                          : "negative"
                        : metric.change.startsWith("-")
                          ? "negative"
                          : "positive"
                    }
                    tooltip={metric.tooltip}
                    icon={iconMap[metric.key as keyof typeof iconMap]}
                    className="col-span-12 sm:col-span-6 xl:col-span-3"
                  />
                );
              })}
            </section>

            <section className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12 xl:col-span-7">
                <TokenUsageChart data={snapshot.tokenUsageSeries} />
              </div>
              <div className="col-span-12 xl:col-span-5">
                <ModelDistributionChart data={snapshot.modelDistribution} />
              </div>
              <div className="col-span-12 xl:col-span-6">
                <TopAIModelsTable rows={snapshot.topModels} />
              </div>
              <div className="col-span-12 xl:col-span-6">
                <RecentActivityTable rows={snapshot.recentActivity} />
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
