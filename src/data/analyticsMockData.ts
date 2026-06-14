import type {
  DashboardSnapshot,
  DateRangeKey,
  DateRangeOption,
  DualSeriesPoint,
  EndpointPerformanceItem,
  MetricCardData,
  ModelDistributionItem,
  PlanDistributionItem,
  RecentActivityItem,
  TopModelItem,
  UserItem,
  WorkspaceSettings,
} from "../types/analytics";
import { defaultPublicUserProfile } from "./publicUserProfile";

export const analyticsDateRanges: DateRangeOption[] = [
  {
    key: "7d",
    label: "Last 7 days",
    description: "Daily movement across the latest week",
  },
  {
    key: "30d",
    label: "Last 30 days",
    description: "Operational view for the current month",
  },
  {
    key: "90d",
    label: "Last 90 days",
    description: "Quarterly performance snapshot",
  },
  {
    key: "12m",
    label: "Last 12 months",
    description: "Year-over-year trend view",
  },
];

export const defaultAnalyticsRange: DateRangeKey = "30d";

export const defaultWorkspaceSettings: WorkspaceSettings = {
  workspaceName: "NovaMetrics AI",
  monthlyTokenLimit: 250000000,
  notifyApiThreshold: true,
  notifyAutomationSuccess: true,
  notifyErrorSpike: true,
  theme: "light",
};

const rangeConfig: Record<
  DateRangeKey,
  {
    label: string;
    factor: number;
    labels: string[];
  }
> = {
  "7d": {
    label: "Last 7 days",
    factor: 0.18,
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  "30d": {
    label: "Last 30 days",
    factor: 1,
    labels: [
      "Week 1",
      "Week 2",
      "Week 3",
      "Week 4",
      "Week 5",
      "Week 6",
      "Week 7",
      "Week 8",
      "Week 9",
      "Week 10",
    ],
  },
  "90d": {
    label: "Last 90 days",
    factor: 2.7,
    labels: [
      "Q1 W1",
      "Q1 W2",
      "Q1 W3",
      "Q1 W4",
      "Q2 W1",
      "Q2 W2",
      "Q2 W3",
      "Q2 W4",
      "Q3 W1",
      "Q3 W2",
      "Q3 W3",
      "Q3 W4",
    ],
  },
  "12m": {
    label: "Last 12 months",
    factor: 11.8,
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
  },
};

const revenueSeed = [
  35420, 36880, 38150, 37420, 39240, 40560, 41880, 43320, 44810, 45860, 47240,
  48680,
];

const tokenSeed = [
  12400000, 13280000, 13860000, 13540000, 14270000, 14920000, 15210000,
  15890000, 16540000, 17060000, 17680000, 18460000,
];

const apiSeed = [
  156000, 168500, 176200, 170800, 181900, 189400, 195200, 201600, 209100,
  214800, 222500, 240000,
];

const automationSuccessSeed = [1520, 1605, 1660, 1598, 1702, 1730, 1768, 1810, 1852, 1905, 1978, 2042];
const automationFailedSeed = [18, 20, 22, 19, 25, 24, 23, 21, 26, 22, 20, 18];

const modelDistributionBase: Omit<ModelDistributionItem, "requests" | "share">[] = [
  { model: "NovaGPT", provider: "Nova Labs" },
  { model: "Orion Code", provider: "Nova Labs" },
  { model: "Atlas Vision", provider: "Nova Labs" },
  { model: "Sage Lite", provider: "OpenBridge" },
  { model: "Spark Mini", provider: "OpenBridge" },
];

const topModelsBase: Omit<TopModelItem, "requests" | "tokens" | "averageLatency" | "estimatedCost" | "successRate">[] =
  [
    { model: "NovaGPT", provider: "Nova Labs" },
    { model: "Orion Code", provider: "Nova Labs" },
    { model: "Atlas Vision", provider: "Nova Labs" },
    { model: "Sage Lite", provider: "OpenBridge" },
    { model: "Spark Mini", provider: "OpenBridge" },
  ];

const endpointBase: Omit<EndpointPerformanceItem, "requestCount" | "averageResponseTime" | "errorRate" | "uptime" | "status">[] =
  [
    { endpoint: "/v1/chat/completions" },
    { endpoint: "/v1/responses" },
    { endpoint: "/v1/embeddings" },
    { endpoint: "/v1/automations/run" },
    { endpoint: "/v1/usage" },
  ];

const userRows: UserItem[] = [
  {
    initials: defaultPublicUserProfile.initials,
    name: defaultPublicUserProfile.name,
    email: defaultPublicUserProfile.email,
    plan: "Enterprise",
    status: "Active",
    lastActive: "2 min ago",
  },
  {
    initials: "SK",
    name: "Sofia Kim",
    email: "sofia.kim@novametrics.ai",
    plan: "Growth",
    status: "Active",
    lastActive: "14 min ago",
  },
  {
    initials: "DR",
    name: "Daniel Reed",
    email: "daniel.reed@novametrics.ai",
    plan: "Team",
    status: "Invited",
    lastActive: "Pending invite",
  },
  {
    initials: "TN",
    name: "Talia Nguyen",
    email: "talia.nguyen@novametrics.ai",
    plan: "Starter",
    status: "Paused",
    lastActive: "3 days ago",
  },
  {
    initials: "JB",
    name: "Jordan Brooks",
    email: "jordan.brooks@novametrics.ai",
    plan: "Growth",
    status: "Active",
    lastActive: "1 hr ago",
  },
];

const planDistribution: PlanDistributionItem[] = [
  { plan: "Enterprise", users: 168, share: 42 },
  { plan: "Growth", users: 136, share: 34 },
  { plan: "Team", users: 78, share: 19 },
  { plan: "Starter", users: 18, share: 5 },
];

const recentActivity: RecentActivityItem[] = [
  {
    timestamp: "10:42 AM",
    workflow: "Support summary",
    model: "NovaGPT",
    tokens: "24.8K",
    duration: "00:41",
    status: "Completed",
    cost: "$18.40",
  },
  {
    timestamp: "10:18 AM",
    workflow: "Lead enrichment",
    model: "Orion Code",
    tokens: "18.2K",
    duration: "00:29",
    status: "Completed",
    cost: "$12.80",
  },
  {
    timestamp: "09:54 AM",
    workflow: "Invoice classification",
    model: "Sage Lite",
    tokens: "11.4K",
    duration: "00:16",
    status: "Queued",
    cost: "$6.10",
  },
  {
    timestamp: "09:12 AM",
    workflow: "Knowledge base sync",
    model: "Atlas Vision",
    tokens: "31.6K",
    duration: "01:04",
    status: "Completed",
    cost: "$21.70",
  },
  {
    timestamp: "08:48 AM",
    workflow: "Anomaly check",
    model: "Spark Mini",
    tokens: "7.1K",
    duration: "00:09",
    status: "Failed",
    cost: "$2.10",
  },
];

function formatCompactNumber(value: number, digits = 1) {
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(digits)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(digits)}M`;
  }
  if (absValue >= 1_000) {
    return `${(value / 1_000).toFixed(digits)}K`;
  }
  return `${Math.round(value)}`;
}

function formatCurrency(value: number) {
  return `$${new Intl.NumberFormat("en-US").format(Math.round(value))}`;
}

function formatPercent(value: number, digits = 2) {
  return `${value.toFixed(digits)}%`;
}

function buildSeries(
  seed: number[],
  labels: string[],
  factor: number,
  formatter: (value: number) => number = Math.round,
) {
  return labels.map((label, index) => ({
    label,
    value: formatter(seed[index] * factor),
  }));
}

function buildDualSeries(
  successSeed: number[],
  failedSeed: number[],
  labels: string[],
  factor: number,
): DualSeriesPoint[] {
  return labels.map((label, index) => ({
    label,
    success: Math.round(successSeed[index] * factor),
    failed: Math.max(1, Math.round(failedSeed[index] * Math.max(0.9, factor * 0.7))),
  }));
}

function buildMetrics(range: DateRangeKey, factor: number): MetricCardData[] {
  const mrr = 48240 * factor;
  const activeUsers = 12480 * factor;
  const tokensUsed = 184600000 * factor;
  const apiRequests = 2400000 * factor;
  const automationRuns = 86420 * factor;
  const errorRate = 0.42 - (factor - 1) * 0.03;

  const changes: Record<DateRangeKey, string> = {
    "7d": "+5.8%",
    "30d": "+12.4%",
    "90d": "+18.9%",
    "12m": "+34.7%",
  };

  const comparisonPeriod: Record<DateRangeKey, string> = {
    "7d": "vs previous 7 days",
    "30d": "vs previous 30 days",
    "90d": "vs previous 90 days",
    "12m": "vs previous 12 months",
  };

  return [
    {
      key: "mrr",
      label: "Monthly Recurring Revenue",
      value: formatCurrency(mrr),
      change: changes[range],
      comparisonPeriod: comparisonPeriod[range],
      tone: "positive",
      tooltip: "Recurring contract value from active subscriptions",
    },
    {
      key: "active-users",
      label: "Active Users",
      value: formatCompactNumber(activeUsers, 1),
      change: "+8.6%",
      comparisonPeriod: comparisonPeriod[range],
      tone: "positive",
      tooltip: "Unique users with meaningful product activity",
    },
    {
      key: "token-usage",
      label: "AI Tokens Used",
      value: formatCompactNumber(tokensUsed, 1),
      change: "+9.1%",
      comparisonPeriod: comparisonPeriod[range],
      tone: "positive",
      tooltip: "Total tokens processed across all model requests",
    },
    {
      key: "api-requests",
      label: "API Requests",
      value: formatCompactNumber(apiRequests, 1),
      change: "+6.4%",
      comparisonPeriod: comparisonPeriod[range],
      tone: "neutral",
      tooltip: "Successful and retried requests across the API surface",
    },
    {
      key: "automation-runs",
      label: "Automation Runs",
      value: formatCompactNumber(automationRuns, 1),
      change: "+14.8%",
      comparisonPeriod: comparisonPeriod[range],
      tone: "positive",
      tooltip: "Executed workflow runs, including scheduled jobs",
    },
    {
      key: "error-rate",
      label: "Error Rate",
      value: formatPercent(Math.max(0.18, errorRate), 2),
      change: "-0.08%",
      comparisonPeriod: comparisonPeriod[range],
      tone: "positive",
      tooltip: "Share of failed requests and automation runs",
    },
  ];
}

function buildModelDistribution(factor: number): ModelDistributionItem[] {
  const total = 100;
  const shares = [32, 24, 18, 16, 10];

  return modelDistributionBase.map((item, index) => ({
    ...item,
    requests: Math.round((1200 + index * 260) * factor),
    share: shares[index] ?? Math.max(4, total - shares.reduce((acc, share) => acc + share, 0)),
  }));
}

function buildTopModels(factor: number): TopModelItem[] {
  const requestsBase = [18420, 14360, 10240, 8820, 6740];
  const tokensBase = [42_300_000, 35_800_000, 28_500_000, 19_400_000, 13_600_000];
  const latencyBase = [420, 365, 302, 245, 188];
  const costBase = [1480, 1125, 980, 745, 520];
  const successRateBase = [99.4, 99.1, 98.7, 98.2, 97.8];

  return topModelsBase.map((item, index) => ({
    ...item,
    requests: formatCompactNumber(requestsBase[index] * factor, 1),
    tokens: formatCompactNumber(tokensBase[index] * factor, 1),
    averageLatency: `${Math.round(latencyBase[index] * Math.max(0.92, 1 + (factor - 1) * 0.03))} ms`,
    estimatedCost: formatCurrency(costBase[index] * factor),
    successRate: `${(successRateBase[index] - Math.min(0.4, Math.max(0, factor - 1) * 0.03)).toFixed(1)}%`,
  }));
}

function buildEndpointPerformance(factor: number): EndpointPerformanceItem[] {
  const requestBase = [985000, 742000, 435000, 286000, 192000];
  const responseBase = [210, 184, 128, 245, 96];
  const errorBase = [0.12, 0.18, 0.09, 0.31, 0.04];
  const uptimeBase = [99.98, 99.91, 99.94, 99.76, 99.99];
  const status: EndpointPerformanceItem["status"][] = [
    "Healthy",
    "Healthy",
    "Healthy",
    "Degraded",
    "Healthy",
  ];

  return endpointBase.map((item, index) => ({
    ...item,
    requestCount: formatCompactNumber(requestBase[index] * factor, 1),
    averageResponseTime: `${Math.round(responseBase[index] * Math.max(0.9, 1 + (factor - 1) * 0.02))} ms`,
    errorRate: formatPercent(errorBase[index] * Math.max(0.9, 1 + (factor - 1) * 0.015), 2),
    uptime: `${Math.min(99.99, uptimeBase[index] + Math.min(0.02, factor * 0.002)).toFixed(2)}%`,
    status: status[index],
  }));
}

function buildRecentActivity(range: DateRangeKey): RecentActivityItem[] {
  const baseRows = recentActivity.map((row, index) => ({
    ...row,
    timestamp:
      range === "12m"
        ? `${String(2 + index * 3).padStart(2, "0")} ${index % 2 === 0 ? "Jan" : "Feb"}`
        : range === "90d"
          ? `${String(3 + index * 4).padStart(2, "0")} days ago`
          : range === "30d"
            ? `${String(10 - index * 2).padStart(2, "0")} days ago`
            : `${String(6 - index).padStart(2, "0")} hrs ago`,
  }));

  return baseRows;
}

function buildUsers(range: DateRangeKey): UserItem[] {
  if (range === "7d") {
    return userRows.slice(0, 4);
  }

  if (range === "30d") {
    return userRows;
  }

  return [
    ...userRows,
    {
      initials: "LP",
      name: "Leah Parker",
      email: "leah.parker@novametrics.ai",
      plan: "Enterprise",
      status: "Active",
      lastActive: "Today",
    },
  ];
}

function buildPlanDistribution(factor: number): PlanDistributionItem[] {
  return planDistribution.map((item) => ({
    ...item,
    users: Math.max(1, Math.round(item.users * Math.max(0.75, Math.min(1.35, factor * 0.5)))),
    share: item.share,
  }));
}

function createSnapshot(range: DateRangeKey): DashboardSnapshot {
  const config = rangeConfig[range];
  const seriesCount = config.labels.length;
  const revenueSeries = buildSeries(revenueSeed.slice(0, seriesCount), config.labels, config.factor);
  const tokenUsageSeries = buildSeries(tokenSeed.slice(0, seriesCount), config.labels, config.factor);
  const apiUsageSeries = buildSeries(apiSeed.slice(0, seriesCount), config.labels, config.factor);
  const automationStatusSeries = buildDualSeries(
    automationSuccessSeed.slice(0, seriesCount),
    automationFailedSeed.slice(0, seriesCount),
    config.labels,
    config.factor,
  );

  return {
    range,
    rangeLabel: config.label,
    metrics: buildMetrics(range, config.factor),
    revenueSeries,
    tokenUsageSeries,
    apiUsageSeries,
    automationStatusSeries,
    modelDistribution: buildModelDistribution(config.factor),
    costTrendSeries: buildSeries(
      revenueSeed.slice(0, seriesCount).map((value) => value * 0.38),
      config.labels,
      config.factor,
    ),
    recentActivity: buildRecentActivity(range),
    topModels: buildTopModels(config.factor),
    endpointPerformance: buildEndpointPerformance(config.factor),
    users: buildUsers(range),
    planDistribution: buildPlanDistribution(config.factor),
  };
}

export const analyticsSnapshots: Record<DateRangeKey, DashboardSnapshot> = {
  "7d": createSnapshot("7d"),
  "30d": createSnapshot("30d"),
  "90d": createSnapshot("90d"),
  "12m": createSnapshot("12m"),
};

export function getAnalyticsSnapshot(range: DateRangeKey) {
  return analyticsSnapshots[range];
}

export function getMetricValue(snapshot: DashboardSnapshot, key: string) {
  return snapshot.metrics.find((metric) => metric.key === key);
}

export function buildDashboardCsv(snapshot: DashboardSnapshot) {
  const lines: string[] = [];

  lines.push("section,label,value");
  snapshot.metrics.forEach((metric) => {
    lines.push(`metrics,${metric.label},${metric.value}`);
  });

  lines.push("");
  lines.push("section,label,value");
  snapshot.revenueSeries.forEach((point) => {
    lines.push(`revenue,${point.label},${point.value}`);
  });

  lines.push("");
  lines.push("section,workflow,status,cost");
  snapshot.recentActivity.forEach((row) => {
    lines.push(`activity,${row.workflow},${row.status},${row.cost}`);
  });

  return lines.join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function formatLargeNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function formatRelativeValue(value: number) {
  return value >= 1_000_000 ? formatCompactNumber(value, 1) : formatLargeNumber(value);
}
