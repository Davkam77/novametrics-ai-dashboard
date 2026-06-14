import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useTheme } from "../../context/ThemeContext";
import type { DualSeriesPoint } from "../../types/analytics";

interface AutomationStatusChartProps {
  title?: string;
  description?: string;
  data: DualSeriesPoint[];
  className?: string;
}

export default function AutomationStatusChart({
  title = "Automation Runs",
  description = "Successful versus failed automation executions",
  data,
  className = "",
}: AutomationStatusChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const axisColor = isDark ? "#9AA9A0" : "#647067";
  const gridColor = isDark ? "#293A30" : "#DDE8E0";

  const options: ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      height: 320,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
      foreColor: axisColor,
    },
    colors: [isDark ? "#4ADE80" : "#16A34A", isDark ? "#F87171" : "#DC2626"],
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: "48%",
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
      labels: { style: { colors: axisColor } },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      labels: { colors: axisColor },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
    },
  };

  const series = [
    {
      name: "Successful",
      data: data.map((point) => point.success),
    },
    {
      name: "Failed",
      data: data.map((point) => point.failed),
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
