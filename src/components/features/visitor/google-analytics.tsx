"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { isAdminRoute } from "@/lib/admin-routes";

/**
 * Google Analytics, on the public site only.
 *
 * The tag is loaded after the page is interactive, so it never sits in front of the first paint,
 * and GA4's own history listener reports the reader's later navigations — the App Router changes
 * pages without a document load, and a second `config` call per route would double-count them.
 *
 * The panel is kept out twice over, because keeping it out once is not enough: the tag is not loaded
 * at all if the first page is a panel page, and `ga-disable-<id>` — Google's own opt-out flag — is
 * raised whenever the editor walks into the panel from the site, where the tag is already running
 * and would otherwise keep reporting their own work as readership.
 */
export function GoogleAnalytics({ id }: { id: string }) {
  const pathname = usePathname();
  const admin = isAdminRoute(pathname);

  useEffect(() => {
    const flag = `ga-disable-${id}` as keyof Window;
    (window as unknown as Record<string, boolean>)[flag] = admin;
  }, [admin, id]);

  if (admin) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  );
}
