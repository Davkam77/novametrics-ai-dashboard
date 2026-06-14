import Badge from "../ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import type { TopModelItem } from "../../types/analytics";

interface TopAIModelsTableProps {
  rows: TopModelItem[];
  title?: string;
  description?: string;
  className?: string;
}

export default function TopAIModelsTable({
  rows,
  title = "Top AI Models",
  description = "Model mix, cost, and reliability across the workspace",
  className = "",
}: TopAIModelsTableProps) {
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
        <Table className="w-full min-w-[960px] table-auto lg:min-w-0">
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
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
                Provider
              </TableCell>
              <TableCell
                isHeader
                className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Requests
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
                Avg Latency
              </TableCell>
              <TableCell
                isHeader
                className="py-3 pr-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Estimated Cost
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                Success Rate
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => (
              <TableRow key={row.model}>
                <TableCell className="py-4 pr-4 text-sm font-medium text-gray-900 dark:text-white/95">
                  {row.model}
                </TableCell>
                <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                  {row.provider}
                </TableCell>
                <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                  {row.requests}
                </TableCell>
                <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                  {row.tokens}
                </TableCell>
                <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                  {row.averageLatency}
                </TableCell>
                <TableCell className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                  {row.estimatedCost}
                </TableCell>
                <TableCell className="py-4 text-sm">
                  <Badge
                    size="sm"
                    color={Number(row.successRate.replace("%", "")) >= 99 ? "success" : "warning"}
                  >
                    {row.successRate}
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
