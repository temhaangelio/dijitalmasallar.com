import { BrandMark } from "@/components/ui/brand-mark";

/**
 * The visitor site's one loading state: the mark, large, its binary cells ticking, on frosted
 * glass over whatever is behind. Used as every public route's fallback and, smaller, where the
 * feed fetches more notes.
 */
export function VisitorLoading({ label, size = "page" }: { label: string; size?: "page" | "inline" }) {
  if (size === "inline") {
    return (
      <div className="feed-loading-inline" role="status" aria-live="polite" aria-atomic="true">
        <BrandMark className="visitor-logo-mark feed-loading-mark" />
        <span className="sr-only">{label}</span>
      </div>
    );
  }
  return (
    <div className="visitor-page feed-loading" role="status" aria-live="polite" aria-label={label}>
      <div className="feed-loading-glass" aria-hidden="true" />
      <BrandMark className="visitor-logo-mark feed-loading-mark feed-loading-mark-page" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
