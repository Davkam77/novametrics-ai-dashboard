import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import DateRangeSelector from "../../components/common/DateRangeSelector";
import MetricCard from "../../components/analytics/MetricCard";
import AutomationStatusChart from "../../components/analytics/AutomationStatusChart";
import RecentActivityTable from "../../components/analytics/RecentActivityTable";
import EndpointPerformanceTable from "../../components/analytics/EndpointPerformanceTable";
import RealAnalyticsPlaceholder from "../../components/analytics/RealAnalyticsPlaceholder";
import { useAuth } from "../../context/AuthContext";
import { useAppMode } from "../../context/ModeContext";
import {
  analyticsDateRanges,
  defaultAnalyticsRange,
  getAnalyticsSnapshot,
} from "../../data/analyticsMockData";
import { AlertIcon, TaskIcon, GroupIcon, BoltIcon } from "../../icons";

export default function Automations() {
  const [range, setRange] = useState(defaultAnalyticsRange);
  const { mode } = useAppMode();
  const { profile } = useAuth();
  const snapshot = getAnalyticsSnapshot(range);
  const isRealMode = mode === "real";
  const realRole = profile?.platformRole === "admin" ? "admin" : "user";

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

        {isRealMode ? (
          <RealAnalyticsPlaceholder
            role={realRole}
            pageTitle="Automations"
            description={
              realRole === "admin"
                ? "Real platform analytics are not connected yet, so workflow execution data stays empty until the backend analytics pipeline is ready."
                : "Your analytics will appear here after real workflow telemetry starts flowing."
            }
            details={
              realRole === "admin"
                ? [
                    "Demo Mode keeps the portfolio mock automation charts separate from the real workspace.",
                    "Global workflow and endpoint telemetry will be connected in Stage 4.",
                  ]
                : [
                    "Demo Mode still shows the portfolio mock automation charts.",
                    "Real workflow activity will appear once production telemetry is connected.",
                  ]
            }
          />
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
          </>
        )}
      </div>
    </>
  );
}
