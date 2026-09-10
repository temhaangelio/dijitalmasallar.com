// All responsive layouts share the same URL and server-rendered feed. Complete
// two-card rows also prevent a partial row immediately before loading more.
const columns = 2;
const maxVisible = 498; // Leave room for the look-ahead record under the 500-row query cap.

export function getFeedPagination(configuredSize: number, requestedLimit?: string) {
  const roundToRow = (count: number) => Math.min(Math.ceil(count / columns) * columns, maxVisible);
  const pageSize = roundToRow(Number.isFinite(configuredSize) ? Math.max(columns, configuredSize) : columns);
  const requested = Number.parseInt(requestedLimit ?? "", 10);
  const visibleCount = roundToRow(Number.isFinite(requested) ? Math.max(pageSize, requested) : pageSize);
  return { pageSize, visibleCount, fetchCount: visibleCount + 1, nextCount: Math.min(visibleCount + pageSize, maxVisible), canLoadMore: visibleCount < maxVisible };
}
