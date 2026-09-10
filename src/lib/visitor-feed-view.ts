export type FeedView = "cards" | "rows";

export const feedViewAttribute = "data-visitor-feed-view";
export const feedViewStorageKey = "diji-news-feed-view";
export const feedViewChangedEvent = "diji-feed-view-changed";

export function resolveFeedView(value: unknown): FeedView {
  return value === "rows" ? "rows" : "cards";
}
