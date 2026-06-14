import type { ReactNode } from "react";
import type { MetricTone } from "../../types/analytics";

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  comparisonPeriod: string;
  tone: MetricTone;
  tooltip: string;
  icon: ReactNode;
  className?: string;
}

const toneStyles: Record<
  MetricTone,
  {
    iconWrap: string;
    icon: string;
    change: string;
  }
> = {
  positive: {
    iconWrap: "bg-success-50 dark:bg-success-500/15",
    icon: "text-success-600 dark:text-success-400",
    change: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-300",
  },
  neutral: {
    iconWrap: "bg-gray-100 dark:bg-gray-800",
    icon: "text-gray-600 dark:text-gray-300",
    change: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300",
  },
  negative: {
    iconWrap: "bg-error-50 dark:bg-error-500/15",
    icon: "text-error-600 dark:text-error-400",
    change: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-300",
  },
};

export default function MetricCard({
  label,
  value,
  change,
  comparisonPeriod,
  tone,
  tooltip,
  icon,
  className = "",
}: MetricCardProps) {
  const colors = toneStyles[tone];

  return (
    <article
      title={tooltip}
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors.iconWrap}`}>
          <span className={`text-2xl ${colors.icon}`}>{icon}</span>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${colors.change}`}
        >
          {change}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/95">
          {value}
        </h3>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {comparisonPeriod}
        </p>
      </div>
    </article>
  );
}
