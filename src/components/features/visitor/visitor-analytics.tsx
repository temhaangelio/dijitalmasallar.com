"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/** Routes belonging to the admin panel or its authentication flow never enter visitor analytics. */
const privateRoutePrefixes = [
  "/dashboard",
  "/yazilar",
  "/rss",
  "/e-bulten",
  "/reklamlar",
  "/istatistik",
  "/ayarlar",
  "/profil",
  "/giris",
  "/sifremi-unuttum",
  "/sifre-yenile",
  "/auth",
];

function isPrivateRoute(url: string) {
  let pathname = url;
  try {
    pathname = new URL(url, window.location.origin).pathname;
  } catch {
    pathname = url.split(/[?#]/, 1)[0];
  }
  return privateRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function visitorEventsOnly(event: BeforeSendEvent) {
  return isPrivateRoute(event.url) ? null : event;
}

export function VisitorAnalytics() {
  return <Analytics beforeSend={visitorEventsOnly} />;
}
