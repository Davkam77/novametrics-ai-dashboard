import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import DateRangeSelector from "../../components/common/DateRangeSelector";
import MetricCard from "../../components/analytics/MetricCard";
import TokenUsageChart from "../../components/analytics/TokenUsageChart";
import ModelDistributionChart from "../../components/analytics/ModelDistributionChart";
import TopAIModelsTable from "../../components/analytics/TopAIModelsTable";
import RecentActivityTable from "../../components/analytics/RecentActivityTable";
import RealAnalyticsPlaceholder from "../../components/analytics/RealAnalyticsPlaceholder";
import { useAuth } from "../../context/AuthContext";
import { useAppMode } from "../../context/ModeContext";
import {
  analyticsDateRanges,
  defaultAnalyticsRange,
  getAnalyticsSnapshot,
} from "../../data/analyticsMockData";
import { AlertIcon, BoltIcon, GroupIcon, DollarLineIcon } from "../../icons";

export default function AIUsage() {
  const [range, setRange] = useState(defaultAnalyticsRange);
  const { mode } = useAppMode();
  const { profile } = useAuth();
  const snapshot = getAnalyticsSnapshot(range);
  const isRealMode = mode === "real";
  const realRole = profile?.platformRole === "admin" ? "admin" : "user";

  const metrics = snapshot.metrics.filter((metric) =>
    ["token-usage", "active-users", "mrr", "error-rate"].includes(metric.key),
  );

  return (
    <>
      <PageMeta
        title="NovaMetrics AI | AI Usage"
        description="Token consumption, model mix, and AI usage trends."
      />

      <div className="space-y-6">
        <PageBreadCrumb pageTitle="AI Usage" />

        {isRealMode ? (
          <RealAnalyticsPlaceholder
            role={realRole}
            pageTitle="AI Usage"
            description={
              realRole === "admin"
                ? "Real platform analytics are not connected yet, so this view stays empty until the backend analytics pipeline is ready."
                : "Your analytics will appear here after you create an API key and start sending requests."
            }
            details={
              realRole === "admin"
                ? [
                    "Demo Mode keeps the portfolio mock token charts separate from the real workspace.",
                    "Global token and model analytics will be connected in Stage 4.",
                  ]
                : [
                    "Demo Mode still shows the portfolio mock token charts.",
                    "Real token usage will appear once production requests start flowing.",
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
