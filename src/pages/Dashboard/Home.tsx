import { useState } from "react";
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
import TopAIModelsTable from "../../components/analytics/TopAIModelsTable";
import EndpointPerformanceTable from "../../components/analytics/EndpointPerformanceTable";
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

export default function Home() {
  const [range, setRange] = useState(defaultAnalyticsRange);
  const snapshot = getAnalyticsSnapshot(range);

  const handleExport = () => {
    downloadCsv(
      `novametrics-ai-${snapshot.range}-dashboard.csv`,
      buildDashboardCsv(snapshot),
    );
  };

  return (
    <>
      <PageMeta
        title="NovaMetrics AI | Dashboard"
        description="Executive overview of revenue, AI token usage, API traffic, and automation reliability."
      />

      <div className="space-y-6">
        <PageBreadCrumb pageTitle="AI SaaS Analytics Dashboard" />

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
                Track revenue, AI consumption, API performance, and automation reliability across your workspace.
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
      </div>
    </>
  );
}
