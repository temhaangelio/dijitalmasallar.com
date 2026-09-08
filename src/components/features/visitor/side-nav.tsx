"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/ui/brand-mark";
import { PushNavButton } from "@/components/features/visitor/push";
import { VisitorMenu } from "@/components/features/visitor/visitor-menu";
import { visitorNavItems } from "@/components/features/visitor/visitor-nav-items";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

const sideNavPaths = new Set(["/", "/about", "/favoriler"]);

/** The masthead's binary signals, re-placed for a tall column. Fixed positions: no hydration drift. */
const sideSignals = [
  { value: "1", left: 4, top: 3, size: 58, opacity: .12 },
  { value: "0", left: 62, top: 8, size: 46, opacity: .1 },
  { value: "0", left: 26, top: 19, size: 40, opacity: .09 },
  { value: "1", left: 74, top: 27, size: 52, opacity: .11 },
  { value: "1", left: 10, top: 38, size: 36, opacity: .07 },
  { value: "0", left: 52, top: 47, size: 44, opacity: .06 },
  { value: "1", left: 30, top: 62, size: 34, opacity: .05 },
];

/**
 * The masthead as wide screens see it: the same masthead the phone shows, turned into a column
 * down the left that never scrolls away.
 *
 * Nothing here is invented for the column. The mark, the mono wordmark, the highlighted tagline
 * and the tracked capitals of the navigation are the phone's masthead, stacked and left-aligned;
 * the two controls stand at the foot. Below 1280px
 * the centred masthead does this job and the column does not exist.
 */
export function VisitorSideNav({
  language,
  siteName,
  description,
  showPush,
  pushPublicKey,
}: {
  language: VisitorLanguage;
  siteName: string;
  /** The tagline the centred masthead shows. The rail keeps it on every page, subject page or not. */
  description?: string;
  showPush: boolean;
  pushPublicKey: string;
}) {
  const pathname = usePathname();

  return (
    <div className="visitor-side-nav visitor-card">
      <div className="visitor-side-signals" aria-hidden="true">
        {sideSignals.map((signal, index) => (
          <span
            key={index}
            className="visitor-header-signal"
            style={{ left: `${signal.left}%`, top: `${signal.top}%`, fontSize: `${signal.size}px`, "--signal-opacity": signal.opacity, animationDelay: `${-index * 2.1}s`, animationDuration: `${13 + (index % 3) * 3}s` } as CSSProperties}
          >
            <span>{signal.value}</span>
          </span>
        ))}
      </div>
      <Link
        href={languageHref("/", language)}
        aria-label={language === "en" ? `${siteName} home` : `${siteName} ana sayfa`}
        className="visitor-side-brand"
      >
        <BrandMark className="visitor-logo-mark visitor-side-brand-mark block" />
        <span className="visitor-side-brand-name">{siteName}</span>
      </Link>
      {description ? <p className="visitor-side-tagline visitor-copy visitor-serif">{description}</p> : null}

      <nav aria-label={language === "en" ? "Main navigation" : "Ana navigasyon"} className="visitor-side-links">
        {visitorNavItems.filter((item) => sideNavPaths.has(item.href)).map((item) => {
          const current = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={languageHref(item.href, language)}
              aria-current={current ? "page" : undefined}
              className="visitor-nav-link visitor-side-link visitor-sans"
            >
              {item[language]}
            </Link>
          );
        })}
      </nav>

      <div className="visitor-side-tools">
        {showPush ? <PushNavButton language={language} publicKey={pushPublicKey} showLabel /> : null}
        <VisitorMenu language={language} pushPublicKey={pushPublicKey} showLabel />
      </div>
    </div>
  );
}
