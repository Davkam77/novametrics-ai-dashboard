import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useTheme } from "../../context/ThemeContext";
import type { TimeSeriesPoint } from "../../types/analytics";

interface ApiUsageChartProps {
  title?: string;
  description?: string;
  seriesLabel?: string;
  data: TimeSeriesPoint[];
  className?: string;
}

export default function ApiUsageChart({
  title = "API Requests",
  description = "Traffic across model, usage, and automation endpoints",
  seriesLabel = "Requests",
  data,
  className = "",
}: ApiUsageChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const axisColor = isDark ? "#9AA9A0" : "#647067";
  const gridColor = isDark ? "#293A30" : "#DDE8E0";

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 320,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
      foreColor: axisColor,
    },
    colors: [isDark ? "#4ADE80" : "#16A34A"],
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: "42%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
    },
    xaxis: {
      categories: data.map((point) => point.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: axisColor } },
    },
    yaxis: {
      labels: {
        style: { colors: axisColor },
        formatter: (value: number) => `${Math.round(value / 1000)}k`,
      },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      y: {
        formatter: (value: number) => `${value.toLocaleString()} requests`,
      },
    },
  };

  const series = [
    {
      name: seriesLabel,
      data: data.map((point) => point.value),
    },
  ];

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
      <div className="w-full min-w-0">
        <Chart options={options} series={series} type="bar" height={320} width="100%" />
      </div>
    </section>
  );
}
