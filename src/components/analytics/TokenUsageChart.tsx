import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useTheme } from "../../context/ThemeContext";
import type { TimeSeriesPoint } from "../../types/analytics";

interface TokenUsageChartProps {
  title?: string;
  description?: string;
  seriesLabel?: string;
  data: TimeSeriesPoint[];
  className?: string;
}

export default function TokenUsageChart({
  title = "Token Usage",
  description = "AI token consumption by period",
  seriesLabel = "Tokens",
  data,
  className = "",
}: TokenUsageChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const axisColor = isDark ? "#9AA9A0" : "#647067";
  const gridColor = isDark ? "#293A30" : "#DDE8E0";

  const options: ApexOptions = {
    chart: {
      type: "area",
      height: 320,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
      foreColor: axisColor,
    },
    colors: [isDark ? "#86EFAC" : "#22C55E"],
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.15,
        opacityFrom: 0.28,
        opacityTo: 0.02,
      },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories: data.map((point) => point.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: axisColor } },
    },
    yaxis: {
      labels: {
        style: { colors: axisColor },
        formatter: (value: number) => `${Math.round(value / 1000000)}M`,
      },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      y: {
        formatter: (value: number) => `${value.toLocaleString()} tokens`,
      },
    },
    markers: {
      size: 0,
      hover: { size: 5 },
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
        <Chart options={options} series={series} type="area" height={320} width="100%" />
      </div>
    </section>
  );
}
