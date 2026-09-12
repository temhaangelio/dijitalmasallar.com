// All responsive layouts share the same URL and server-rendered feed. Complete
// two-card rows also prevent a partial row immediately before loading more.
const columns = 2;
const maxVisible = 498; // Leave room for the look-ahead record under the 500-row query cap.

/**
 * The first page carries the deck as well as the list.
 *
 * On a phone the newest notes are shown as a deck and skipped in the list below it, so a first page
 * of exactly one page-size would leave that list empty and make the infinite loader fire before the
 * reader had done anything. The floor is the deck plus a page, which is what the phone needs; a
 * wide screen has no deck and simply gets a slightly longer first page.
 */
export function getFeedPagination(configuredSize: number, requestedLimit?: string, deckSize = 0) {
  const roundToRow = (count: number) => Math.min(Math.ceil(count / columns) * columns, maxVisible);
  const pageSize = roundToRow(Number.isFinite(configuredSize) ? Math.max(columns, configuredSize) : columns);
  const firstPage = roundToRow(pageSize + Math.max(0, deckSize));
  const requested = Number.parseInt(requestedLimit ?? "", 10);
  const visibleCount = roundToRow(Number.isFinite(requested) ? Math.max(firstPage, requested) : firstPage);
  return { pageSize, visibleCount, fetchCount: visibleCount + 1, nextCount: Math.min(visibleCount + pageSize, maxVisible), canLoadMore: visibleCount < maxVisible };
}
