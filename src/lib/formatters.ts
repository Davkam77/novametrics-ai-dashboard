export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
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

export function formatShortId(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

export function buildRangeLabel(
  offset: number,
  total: number,
  itemCount: number,
) {
  if (total === 0) {
    return "0 of 0";
  }

  const start = offset + 1;
  const end = Math.min(offset + itemCount, total);
  return `${start}–${end} of ${total}`;
}
