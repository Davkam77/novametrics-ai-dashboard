export type DateRangeKey = "7d" | "30d" | "90d" | "12m";

export interface DateRangeOption {
  key: DateRangeKey;
  label: string;
  description: string;
}

export type MetricTone = "positive" | "neutral" | "negative";

export interface MetricCardData {
  key: string;
  label: string;
  value: string;
  change: string;
  comparisonPeriod: string;
  tone: MetricTone;
  tooltip: string;
}

export interface TimeSeriesPoint {
  label: string;
  value: number;
}

export interface DualSeriesPoint {
  label: string;
  success: number;
  failed: number;
}

export interface ModelDistributionItem {
  model: string;
  provider: string;
  requests: number;
  share: number;
}

export type ActivityStatus = "Completed" | "Failed" | "Queued";

export interface RecentActivityItem {
  timestamp: string;
  workflow: string;
  model: string;
  tokens: string;
  duration: string;
  status: ActivityStatus;
  cost: string;
}

export interface TopModelItem {
  model: string;
  provider: string;
  requests: string;
  tokens: string;
  averageLatency: string;
  estimatedCost: string;
  successRate: string;
}

export interface EndpointPerformanceItem {
  endpoint: string;
  requestCount: string;
  averageResponseTime: string;
  errorRate: string;
  uptime: string;
  status: "Healthy" | "Degraded" | "Offline";
}

export interface UserItem {
  initials: string;
  name: string;
  email: string;
  plan: string;
  status: "Active" | "Invited" | "Paused";
  lastActive: string;
}

export interface PlanDistributionItem {
  plan: string;
  users: number;
  share: number;
}

export interface DashboardSnapshot {
  range: DateRangeKey;
  rangeLabel: string;
  metrics: MetricCardData[];
  revenueSeries: TimeSeriesPoint[];
  tokenUsageSeries: TimeSeriesPoint[];
  apiUsageSeries: TimeSeriesPoint[];
  automationStatusSeries: DualSeriesPoint[];
  modelDistribution: ModelDistributionItem[];
  costTrendSeries: TimeSeriesPoint[];
  recentActivity: RecentActivityItem[];
  topModels: TopModelItem[];
  endpointPerformance: EndpointPerformanceItem[];
  users: UserItem[];
  planDistribution: PlanDistributionItem[];
}

export interface WorkspaceSettings {
  workspaceName: string;
  monthlyTokenLimit: number;
  notifyApiThreshold: boolean;
  notifyAutomationSuccess: boolean;
  notifyErrorSpike: boolean;
  theme: "light" | "dark";
}
