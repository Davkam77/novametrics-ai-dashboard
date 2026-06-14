import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import DateRangeSelector from "../../components/common/DateRangeSelector";
import MetricCard from "../../components/analytics/MetricCard";
import AutomationStatusChart from "../../components/analytics/AutomationStatusChart";
import RecentActivityTable from "../../components/analytics/RecentActivityTable";
import EndpointPerformanceTable from "../../components/analytics/EndpointPerformanceTable";
import {
  analyticsDateRanges,
  defaultAnalyticsRange,
  getAnalyticsSnapshot,
} from "../../data/analyticsMockData";
import { AlertIcon, TaskIcon, GroupIcon, BoltIcon } from "../../icons";

export default function Automations() {
  const [range, setRange] = useState(defaultAnalyticsRange);
  const snapshot = getAnalyticsSnapshot(range);

  const metrics = snapshot.metrics.filter((metric) =>
    ["automation-runs", "error-rate", "active-users", "token-usage"].includes(metric.key),
  );

  return (
    <>
      <PageMeta
        title="NovaMetrics AI | Automations"
        description="Automation throughput, failures, and workflow reliability."
      />

      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Automations" />
        <DateRangeSelector
          ranges={analyticsDateRanges}
          value={range}
          onChange={setRange}
        />

        <section className="grid grid-cols-12 gap-4 md:gap-6">
          {metrics.map((metric) => {
            const iconMap = {
              "automation-runs": <TaskIcon />,
              "error-rate": <AlertIcon />,
              "active-users": <GroupIcon />,
              "token-usage": <BoltIcon />,
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
            <AutomationStatusChart data={snapshot.automationStatusSeries} />
          </div>
          <div className="col-span-12 xl:col-span-5">
            <RecentActivityTable rows={snapshot.recentActivity} />
          </div>
          <div className="col-span-12">
            <EndpointPerformanceTable rows={snapshot.endpointPerformance} />
          </div>
        </section>
      </div>
    </>
  );
}
