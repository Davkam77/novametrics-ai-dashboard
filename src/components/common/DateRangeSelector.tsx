import type { DateRangeKey, DateRangeOption } from "../../types/analytics";

interface DateRangeSelectorProps {
  ranges: DateRangeOption[];
  value: DateRangeKey;
  onChange: (value: DateRangeKey) => void;
  className?: string;
}

export default function DateRangeSelector({
  ranges,
  value,
  onChange,
  className = "",
}: DateRangeSelectorProps) {
  const currentRange = ranges.find((range) => range.key === value);

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Date range
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {currentRange?.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {ranges.map((range) => {
            const isActive = range.key === value;

            return (
              <button
                key={range.key}
                type="button"
                onClick={() => onChange(range.key)}
                aria-pressed={isActive}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-300"
                    : "border-gray-200 bg-white text-gray-600 hover:border-brand-200 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-white"
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
