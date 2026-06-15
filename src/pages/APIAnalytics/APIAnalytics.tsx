import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import DateRangeSelector from "../../components/common/DateRangeSelector";
import MetricCard from "../../components/analytics/MetricCard";
import ApiUsageChart from "../../components/analytics/ApiUsageChart";
import EndpointPerformanceTable from "../../components/analytics/EndpointPerformanceTable";
import RecentActivityTable from "../../components/analytics/RecentActivityTable";
import RealAnalyticsPlaceholder from "../../components/analytics/RealAnalyticsPlaceholder";
import { useAuth } from "../../context/AuthContext";
import { useAppMode } from "../../context/ModeContext";
import {
  analyticsDateRanges,
  defaultAnalyticsRange,
  getAnalyticsSnapshot,
} from "../../data/analyticsMockData";
import { AlertIcon, TableIcon, BoltIcon, TaskIcon } from "../../icons";

export default function APIAnalytics() {
  const [range, setRange] = useState(defaultAnalyticsRange);
  const { mode } = useAppMode();
  const { profile } = useAuth();
  const snapshot = getAnalyticsSnapshot(range);
  const isRealMode = mode === "real";
  const realRole = profile?.platformRole === "admin" ? "admin" : "user";

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

        {isRealMode ? (
          <RealAnalyticsPlaceholder
            role={realRole}
            pageTitle="API Analytics"
            description={
              realRole === "admin"
                ? "Real platform analytics are not connected yet, so request and latency data stays empty until the backend analytics pipeline is ready."
                : "Your analytics will appear here after real API traffic starts flowing."
            }
            details={
              realRole === "admin"
                ? [
                    "Demo Mode keeps the portfolio mock API charts separate from the real workspace.",
                    "Global request, latency, and error analytics will be connected in Stage 4.",
                  ]
                : [
                    "Demo Mode still shows the portfolio mock API charts.",
                    "Real request and latency data will appear once production traffic is connected.",
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
          </>
        )}
      </div>
    </>
  );
}
