import Badge from "../ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import type { EndpointPerformanceItem } from "../../types/analytics";

interface EndpointPerformanceTableProps {
  rows: EndpointPerformanceItem[];
  title?: string;
  description?: string;
  className?: string;
}

const statusColors = {
  Healthy: "success",
  Degraded: "warning",
  Offline: "error",
} as const;

export default function EndpointPerformanceTable({
  rows,
  title = "Endpoint Performance",
  description = "Latency, uptime, and error rate for core API endpoints",
  className = "",
}: EndpointPerformanceTableProps) {
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

      <div className="max-w-full overflow-x-auto lg:overflow-visible">
        <Table className="w-full min-w-[900px] table-auto lg:min-w-0">
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Endpoint
              </TableCell>
              <TableCell
                isHeader
                className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Request Count
              </TableCell>
              <TableCell
                isHeader
                className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Avg Response
              </TableCell>
              <TableCell
                isHeader
                className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Error Rate
              </TableCell>
              <TableCell
                isHeader
                className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Uptime
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => (
              <TableRow key={row.endpoint}>
                <TableCell className="py-4 pr-4 text-sm font-medium text-gray-900 dark:text-white/95">
                  {row.endpoint}
                </TableCell>
                <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                  {row.requestCount}
                </TableCell>
                <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                  {row.averageResponseTime}
                </TableCell>
                <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                  {row.errorRate}
                </TableCell>
                <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                  {row.uptime}
                </TableCell>
                <TableCell className="py-4 text-sm">
                  <Badge size="sm" color={statusColors[row.status]}>
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
