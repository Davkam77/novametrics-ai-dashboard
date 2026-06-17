import type { NovaMetricsUsageRequest } from "../../lib/novaMetricsApi";

type RecentRequestsTableProps = {
  requests: NovaMetricsUsageRequest[];
  loading?: boolean;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatCount(value: number | null | undefined) {
  return value === null || value === undefined
    ? "-"
    : new Intl.NumberFormat(undefined).format(value);
}

function shortRequestId(requestId: string) {
  const id = requestId.trim();
  if (id.length <= 12) {
    return id;
  }

  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function statusTone(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "success") return "success";
  if (normalized === "processing") return "info";
  if (normalized === "rate_limited" || normalized === "quota_exceeded") return "warning";
  if (
    normalized === "invalid_request" ||
    normalized === "invalid_key" ||
    normalized === "revoked_key" ||
    normalized === "provider_error" ||
    normalized === "timeout" ||
    normalized === "internal_error"
  ) {
    return "danger";
  }

  return "neutral";
}

function statusLabel(status: string) {
  const normalized = status.trim().replace(/_/g, " ");
  if (!normalized) {
    return "-";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function statusClasses(status: string) {
  switch (statusTone(status)) {
    case "success":
      return "border border-success-200 bg-success-50 text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-300";
    case "info":
      return "border border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300";
    case "warning":
      return "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200";
    case "danger":
      return "border border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200";
    default:
      return "border border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-800 dark:bg-white/[0.04] dark:text-gray-300";
  }
}

export default function RecentRequestsTable({
  requests,
  loading = false,
}: RecentRequestsTableProps) {
  const hasRows = requests.length > 0;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Requests
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Read-only workspace metadata from the usage endpoints.
          </p>
        </div>
        {loading ? (
          <span className="inline-flex w-fit rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
            Refreshing
          </span>
        ) : null}
      </div>

      {!hasRows ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center dark:border-gray-800 dark:bg-white/[0.02]">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            No recent requests yet
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            The table fills once your workspace starts sending production
            requests.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
          <table className="min-w-[920px] w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Request ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Input
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Output
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Latency
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {requests.map((request) => (
                <tr key={request.request_id} className="align-top">
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {formatDateTime(request.created_at)}
                  </td>
                  <td
                    className="px-4 py-4 text-sm font-mono text-gray-900 dark:text-white"
                    title={request.request_id}
                  >
                    {shortRequestId(request.request_id)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {request.model}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClasses(
                        request.status,
                      )}`}
                    >
                      {statusLabel(request.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {formatCount(request.input_tokens)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {formatCount(request.output_tokens)}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {formatCount(request.total_tokens)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {request.latency_ms === null
                      ? "-"
                      : `${formatCount(request.latency_ms)} ms`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
