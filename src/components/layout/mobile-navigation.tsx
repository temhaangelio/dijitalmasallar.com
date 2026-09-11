"use client";

import Link from "next/link";
import { ExternalLink, LogOut, Monitor, Moon, MoreHorizontal, Sun } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { setThemePreference, useThemePreference } from "@/components/features/visitor/theme";
import { ActionMenu } from "@/components/ui/action-menu";
import { BrandMark } from "@/components/ui/brand-mark";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { adminNavItems, type AdminModules } from "./admin-nav-items";

/**
 * Phone chrome, in two parts.
 *
 * The bar on top is deliberately thin: the mark as a way home, and one menu for the actions that
 * are needed once a session — the public site, the appearance, signing out. The sections
 * themselves are not here; they sit in `AdminTabBar` at the bottom of the screen, under the thumb,
 * where a scrolling strip of links under the title used to ask for a reach across the whole phone.
 */
export function MobileNavigation({ siteName }: { siteName: string }) {
  const preference = useThemePreference();
  const themes = [
    { value: "light" as const, label: "Açık görünüm", icon: <Sun size={16} aria-hidden="true" /> },
    { value: "dark" as const, label: "Koyu görünüm", icon: <Moon size={16} aria-hidden="true" /> },
    { value: "system" as const, label: "Sistemi izle", icon: <Monitor size={16} aria-hidden="true" /> },
  ];
  return (
    <div className="mobile-bar admin-chrome">
      <Link href="/dashboard" aria-label={`${siteName} · Genel bakış`} className="flex min-w-0 items-center gap-3">
        <BrandMark className="!size-9 !rounded-[12px]" />
        <span className="min-w-0">{siteName === "Dijital Masallar" ? <BrandWordmark className="w-[132px] max-w-full" /> : <strong className="admin-brand block truncate text-sm">{siteName}</strong>}</span>
      </Link>
      <ActionMenu
        label="Hesap ve görünüm"
        trigger={<MoreHorizontal size={20} strokeWidth={1.8} aria-hidden="true" />}
        triggerClassName="admin-icon-control !size-11 !rounded-[14px]"
        items={[
          { label: "Siteye git", href: "/", external: true, icon: <ExternalLink size={16} aria-hidden="true" /> },
          ...themes.map((theme, index) => ({ label: theme.label, checked: preference === theme.value, separated: index === 0, onSelect: () => setThemePreference(theme.value) })),
          { label: "Çıkış yap", separated: true, icon: <LogOut size={16} aria-hidden="true" />, onSelect: () => { void logoutAction(); } },
        ]}
      />
    </div>
  );
}

/** The bottom tab bar. Static links, so it renders on the server and stands in the skeleton too. */
export function AdminTabBar({ active, modules }: { active: string; modules?: AdminModules }) {
  return (
    <nav aria-label="Bölümler" className="admin-tabbar admin-chrome">
      {adminNavItems.filter(({ module }) => !module || !modules || modules[module]).map(({ label, href, icon: Icon }) => (
        <Link key={href} href={href} aria-current={active === href ? "page" : undefined}>
          <span><Icon size={20} strokeWidth={active === href ? 2 : 1.7} aria-hidden="true" /></span>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
