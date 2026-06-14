import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useTheme } from "../../context/ThemeContext";
import type { ModelDistributionItem } from "../../types/analytics";

interface ModelDistributionChartProps {
  title?: string;
  description?: string;
  data: ModelDistributionItem[];
  className?: string;
}

export default function ModelDistributionChart({
  title = "Model Distribution",
  description = "How AI traffic is distributed across the model mix",
  data,
  className = "",
}: ModelDistributionChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const axisColor = isDark ? "#9AA9A0" : "#647067";
  const colors = [
    isDark ? "#4ADE80" : "#16A34A",
    isDark ? "#86EFAC" : "#22C55E",
    isDark ? "#A7F3D0" : "#4ADE80",
    isDark ? "#34D399" : "#15803D",
    isDark ? "#D1FAE5" : "#166534",
  ];

  const options: ApexOptions = {
    chart: {
      type: "donut",
      height: 320,
      fontFamily: "Outfit, sans-serif",
    },
    colors,
    labels: data.map((item) => item.model),
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      labels: { colors: axisColor },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 0,
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      y: {
        formatter: (value: number) => `${value.toLocaleString()} requests`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
        },
      },
    },
  };

  const series = data.map((item) => item.share);

  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white/95">
          {title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:items-center">
        <div className="mx-auto w-full max-w-[220px] min-w-0">
          <Chart options={options} series={series} type="donut" height={260} width="100%" />
        </div>
        <div className="min-w-0 space-y-3">
          {data.map((item, index) => (
            <div
              key={item.model}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white/95">
                  {item.model}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.provider}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white/95">
                  {item.share}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.requests.toLocaleString()} requests
                </p>
              </div>
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
