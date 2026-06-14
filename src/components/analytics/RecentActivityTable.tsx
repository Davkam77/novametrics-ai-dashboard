import Badge from "../ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import type { RecentActivityItem } from "../../types/analytics";

interface RecentActivityTableProps {
  rows: RecentActivityItem[];
  title?: string;
  description?: string;
  className?: string;
}

const statusColors = {
  Completed: "success",
  Failed: "error",
  Queued: "warning",
} as const;

export default function RecentActivityTable({
  rows,
  title = "Recent Activity",
  description = "Latest AI workflow executions and outcomes",
  className = "",
}: RecentActivityTableProps) {
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
        <Table className="w-full min-w-[820px] table-auto lg:min-w-0">
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Time
              </TableCell>
              <TableCell
                isHeader
                className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Workflow
              </TableCell>
              <TableCell
                isHeader
                className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Model
              </TableCell>
              <TableCell
                isHeader
                className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Tokens
              </TableCell>
              <TableCell
                isHeader
                className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Duration
              </TableCell>
              <TableCell
                isHeader
                className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Cost
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  className="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  isHeader={false}
                  colSpan={7}
                >
                  No activity for this time range.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={`${row.timestamp}-${row.workflow}`}>
                  <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                    {row.timestamp}
                  </TableCell>
                  <TableCell className="py-4 pr-4 text-sm font-medium text-gray-900 dark:text-white/95">
                    {row.workflow}
                  </TableCell>
                  <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                    {row.model}
                  </TableCell>
                  <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                    {row.tokens}
                  </TableCell>
                  <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                    {row.duration}
                  </TableCell>
                  <TableCell className="py-4 pr-4 text-sm">
                    <Badge size="sm" color={statusColors[row.status]}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-sm text-gray-700 dark:text-gray-300">
                    {row.cost}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
