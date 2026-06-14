import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import DateRangeSelector from "../../components/common/DateRangeSelector";
import MetricCard from "../../components/analytics/MetricCard";
import ApiUsageChart from "../../components/analytics/ApiUsageChart";
import EndpointPerformanceTable from "../../components/analytics/EndpointPerformanceTable";
import RecentActivityTable from "../../components/analytics/RecentActivityTable";
import {
  analyticsDateRanges,
  defaultAnalyticsRange,
  getAnalyticsSnapshot,
} from "../../data/analyticsMockData";
import { AlertIcon, TableIcon, BoltIcon, TaskIcon } from "../../icons";

export default function APIAnalytics() {
  const [range, setRange] = useState(defaultAnalyticsRange);
  const snapshot = getAnalyticsSnapshot(range);

  const metrics = snapshot.metrics.filter((metric) =>
    ["api-requests", "error-rate", "token-usage", "automation-runs"].includes(metric.key),
  );

  return (
    <>
      <PageMeta
        title="NovaMetrics AI | API Analytics"
        description="Request volume, latency, and reliability across the API surface."
      />

      <div className="space-y-6">
        <PageBreadCrumb pageTitle="API Analytics" />
        <DateRangeSelector
          ranges={analyticsDateRanges}
          value={range}
          onChange={setRange}
        />

        <section className="grid grid-cols-12 gap-4 md:gap-6">
          {metrics.map((metric) => {
            const iconMap = {
              "api-requests": <TableIcon />,
              "error-rate": <AlertIcon />,
              "token-usage": <BoltIcon />,
              "automation-runs": <TaskIcon />,
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
            <ApiUsageChart data={snapshot.apiUsageSeries} />
          </div>
          <div className="col-span-12 xl:col-span-5">
            <EndpointPerformanceTable rows={snapshot.endpointPerformance} />
          </div>
          <div className="col-span-12">
            <RecentActivityTable rows={snapshot.recentActivity} />
          </div>
        </section>
      </div>
    </>
  );
}
