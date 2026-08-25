import { VisitorFeedLoading } from "@/components/feedback/route-skeletons";

/**
 * The feed's fallback, and the safety net for any public route added later without one of its own.
 * `(auth)`, `(dashboard)` and `/ebulten-onay` each ship their own `loading.tsx`, so this visitor
 * frame never appears over a page that is not part of the visitor site.
 */
export default function Loading() { return <VisitorFeedLoading />; }
