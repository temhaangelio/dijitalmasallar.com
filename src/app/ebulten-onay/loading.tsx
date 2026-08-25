import { AuthPageLoading } from "@/components/feedback/route-skeletons";

/** The opt-in pages use `AuthShell`, not the visitor frame, so they opt out of the root fallback. */
export default function Loading() { return <AuthPageLoading />; }
