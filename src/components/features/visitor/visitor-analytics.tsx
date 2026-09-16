"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { isAdminRoute } from "@/lib/admin-routes";

function visitorEventsOnly(event: BeforeSendEvent) {
  return isAdminRoute(event.url) ? null : event;
}

export function VisitorAnalytics() {
  return <Analytics beforeSend={visitorEventsOnly} />;
}
