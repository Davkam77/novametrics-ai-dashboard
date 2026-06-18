import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
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
import { useAppMode } from "../../context/ModeContext";
import { useAuth } from "../../context/AuthContext";
import {
  analyticsDateRanges,
  defaultAnalyticsRange,
  getAnalyticsSnapshot,
} from "../../data/analyticsMockData";
import {
  GroupIcon,
  DollarLineIcon,
  AlertIcon,
  TaskIcon,
} from "../../icons";
import {
  listNovaMetricsAdminUsers,
  NovaMetricsApiError,
  type NovaMetricsAdminUser,
} from "../../lib/novaMetricsApi";

const statusColors = {
  Active: "success",
  Invited: "warning",
  Paused: "error",
} as const;

const roleColors = {
  admin: "success",
  user: "light",
} as const;

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShortId(value: string) {
  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function buildRangeLabel(offset: number, total: number, itemCount: number) {
  if (total === 0) {
    return "0 of 0";
  }

  const start = offset + 1;
  const end = Math.min(offset + itemCount, total);
  return `${start}–${end} of ${total}`;
}

function DemoUsersPage() {
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

function RealAdminUsersPage() {
  const navigate = useNavigate();
  const { session, status, profile } = useAuth();
  const [items, setItems] = useState<NovaMetricsAdminUser[]>([]);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [expiredSession, setExpiredSession] = useState(false);
  const canLoad = status !== "loading" && profile?.platformRole === "admin";

  useEffect(() => {
    if (!canLoad) {
      return;
    }

    const token = session?.access_token;
    if (!token) {
      setExpiredSession(true);
      setLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      setExpiredSession(false);

      try {
        const response = await listNovaMetricsAdminUsers(token, {
          limit,
          offset,
        });

        if (!active) {
          return;
        }

        setItems(response.items);
        setTotal(response.total);
        setNextOffset(response.next_offset);
      } catch (error) {
        if (!active) {
          return;
        }

        if (error instanceof NovaMetricsApiError) {
          if (error.status === 401) {
            setExpiredSession(true);
            setErrorMessage("Your session expired. Please sign in again.");
          } else if (error.status === 403) {
            setErrorMessage("Admin access required.");
          } else {
            setErrorMessage(error.message || "Unable to load users.");
          }
        } else {
          setErrorMessage("Unable to load users.");
        }

        setItems([]);
        setTotal(0);
        setNextOffset(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [canLoad, session?.access_token, limit, offset, reloadTick, profile?.platformRole, status]);

  const handleRefresh = () => {
    setReloadTick((value) => value + 1);
  };

  if (status === "loading" || (profile?.platformRole === "admin" && loading && items.length === 0)) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Users" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Loading admin users...
          </p>
        </div>
      </div>
    );
  }

  if (!profile || profile.platformRole !== "admin") {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Users" />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Admin access required.
          </p>
        </div>
      </div>
    );
  }

  const rangeLabel = buildRangeLabel(offset, total, items.length);

  return (
    <>
      <PageMeta
        title="NovaMetrics AI | Users"
        description="Admin user directory for the current workspace."
      />

      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Users" />

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">
                Real Admin Users
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                Total users: {total}
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {rangeLabel}
              </p>
            </div>
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {expiredSession ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              <p className="text-sm font-semibold">Session expired</p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-100/90">
                Please sign in again to load the admin user list.
              </p>
              <div className="mt-4">
                <Button variant="outline" onClick={() => navigate("/signin")}>
                  Sign in again
                </Button>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
              <p className="text-sm font-semibold">Unable to load users</p>
              <p className="mt-1 text-sm text-red-800 dark:text-red-100/90">
                {errorMessage}
              </p>
              <div className="mt-4">
                <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                  Retry
                </Button>
              </div>
            </div>
          ) : null}

          {!loading && !errorMessage && items.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-300">
              No users were found for this workspace.
            </div>
          ) : null}

          <div className="mt-5 overflow-x-auto">
            <Table className="w-full min-w-[920px] table-auto">
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Display Name
                  </TableCell>
                  <TableCell isHeader className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    User ID
                  </TableCell>
                  <TableCell isHeader className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Platform Role
                  </TableCell>
                  <TableCell isHeader className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Workspace Count
                  </TableCell>
                  <TableCell isHeader className="py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Created At
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item) => (
                  <TableRow key={item.user_id}>
                    <TableCell className="py-4 pr-4 text-sm font-medium text-gray-900 dark:text-white">
                      {item.display_name?.trim() ? item.display_name : "Unnamed user"}
                    </TableCell>
                    <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                      <span title={item.user_id}>{formatShortId(item.user_id)}</span>
                    </TableCell>
                    <TableCell className="py-4 pr-4 text-sm">
                      <Badge size="sm" color={roleColors[item.platform_role]}>
                        {item.platform_role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                      {item.workspace_count}
                    </TableCell>
                    <TableCell className="py-4 text-sm text-gray-700 dark:text-gray-300">
                      {formatCreatedAt(item.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {rangeLabel}
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setOffset(Math.max(0, offset - limit))} disabled={loading || offset === 0}>
                Previous
              </Button>
              <Button
                onClick={() => {
                  if (nextOffset !== null) {
                    setOffset(nextOffset);
                  }
                }}
                disabled={loading || nextOffset === null}
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default function Users() {
  const { mode } = useAppMode();
  const { profile } = useAuth();

  if (mode !== "real") {
    return <DemoUsersPage />;
  }

  if (profile?.platformRole === "admin") {
    return <RealAdminUsersPage />;
  }

  return <DemoUsersPage />;
}
