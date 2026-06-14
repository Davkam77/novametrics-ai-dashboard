import { useState } from "react";
import Badge from "../../components/ui/badge/Badge";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import DateRangeSelector from "../../components/common/DateRangeSelector";
import MetricCard from "../../components/analytics/MetricCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  analyticsDateRanges,
  defaultAnalyticsRange,
  getAnalyticsSnapshot,
} from "../../data/analyticsMockData";
import { GroupIcon, DollarLineIcon, AlertIcon, TaskIcon } from "../../icons";

const statusColors = {
  Active: "success",
  Invited: "warning",
  Paused: "error",
} as const;

export default function Users() {
  const [range, setRange] = useState(defaultAnalyticsRange);
  const snapshot = getAnalyticsSnapshot(range);

  const metrics = snapshot.metrics.filter((metric) =>
    ["active-users", "mrr", "automation-runs", "error-rate"].includes(metric.key),
  );

  return (
    <>
      <PageMeta
        title="NovaMetrics AI | Users"
        description="Workspace users, plan distribution, and account activity."
      />

      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Users" />
        <DateRangeSelector
          ranges={analyticsDateRanges}
          value={range}
          onChange={setRange}
        />

        <section className="grid grid-cols-12 gap-4 md:gap-6">
          {metrics.map((metric) => {
            const iconMap = {
              "active-users": <GroupIcon />,
              mrr: <DollarLineIcon />,
              "automation-runs": <TaskIcon />,
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
          <div className="col-span-12 xl:col-span-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Workspace members
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The current user list comes from local workspace data and supports the account overview.
              </p>
            </div>

            <div className="overflow-x-auto lg:overflow-visible">
              <Table className="w-full min-w-[760px] table-auto lg:min-w-0">
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      User
                    </TableCell>
                    <TableCell isHeader className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </TableCell>
                    <TableCell isHeader className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Plan
                    </TableCell>
                    <TableCell isHeader className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </TableCell>
                    <TableCell isHeader className="py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last active
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {snapshot.users.map((user) => (
                    <TableRow key={user.email}>
                      <TableCell className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-sm font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                            {user.initials}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Member profile
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                        {user.email}
                      </TableCell>
                      <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                        {user.plan}
                      </TableCell>
                      <TableCell className="py-4 pr-4 text-sm">
                        <Badge size="sm" color={statusColors[user.status]}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-sm text-gray-700 dark:text-gray-300">
                        {user.lastActive}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Plan distribution
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Active seats by subscription tier.
              </p>
            </div>

            <div className="space-y-4">
              {snapshot.planDistribution.map((plan) => (
                <div
                  key={plan.plan}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {plan.plan}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {plan.users} active users
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-brand-600 dark:text-brand-300">
                      {plan.share}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white dark:bg-gray-800">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{ width: `${plan.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
