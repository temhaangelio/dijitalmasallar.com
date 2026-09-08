"use client";

import type { CSSProperties } from "react";
import { Bookmark, Info, Newspaper } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/ui/brand-mark";
import { PushNavButton } from "@/components/features/visitor/push";
import { VisitorMenu } from "@/components/features/visitor/visitor-menu";
import { visitorNavItems } from "@/components/features/visitor/visitor-nav-items";
import { languageHref, type VisitorLanguage } from "@/lib/visitor-language";

const sideNavPaths = new Set(["/", "/about", "/favoriler"]);

/** One glyph per row, from the same set as the controls at the foot of the rail. */
const sideNavIcons = { "/": Newspaper, "/about": Info, "/favoriler": Bookmark } as const;

/** The masthead's binary signals, re-placed for a tall column. Fixed positions: no hydration drift. */
const sideSignals = [
  // The top-right corner and the band between the tagline and the navigation: the two places the
  // rail leaves empty, so a glyph never sits behind a word.
  { value: "1", left: 80, top: 1, size: 64, opacity: .11 },
  { value: "0", left: 84, top: 14, size: 40, opacity: .08 },
  { value: "0", left: 8, top: 27, size: 56, opacity: .1 },
  { value: "1", left: 46, top: 30, size: 44, opacity: .08 },
  { value: "1", left: 74, top: 36, size: 36, opacity: .06 },
  { value: "0", left: 24, top: 62, size: 40, opacity: .05 },
  { value: "1", left: 62, top: 70, size: 32, opacity: .045 },
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
      {description ? <p className="visitor-side-tagline visitor-copy visitor-sans">{description}</p> : null}

      <nav aria-label={language === "en" ? "Main navigation" : "Ana navigasyon"} className="visitor-side-links">
        {visitorNavItems.filter((item) => sideNavPaths.has(item.href)).map((item) => {
          const current = pathname === item.href;
          const Icon = sideNavIcons[item.href as keyof typeof sideNavIcons];
          return (
            <Link
              key={item.href}
              href={languageHref(item.href, language)}
              aria-current={current ? "page" : undefined}
              className="visitor-nav-link visitor-side-link visitor-sans"
            >
              <Icon className="visitor-side-link-icon" size={22} strokeWidth={1.7} aria-hidden="true" />
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
