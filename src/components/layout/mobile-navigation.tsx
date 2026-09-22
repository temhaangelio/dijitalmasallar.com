"use client";

import Link from "next/link";
import { useState } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import { ExternalLink, LogOut, Monitor, Moon, MoreHorizontal, Sun, Menu, Plus, ChevronRight, LayoutDashboard } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { setThemePreference, useThemePreference } from "@/components/features/visitor/theme";
import { ActionMenu } from "@/components/ui/action-menu";
import { BrandMark } from "@/components/ui/brand-mark";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { adminNavItems, type AdminModules } from "./admin-nav-items";

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

/** Keep destinations in a roomy sheet; creation is always one tap away. */
export function AdminTabBar({ active, modules }: { active: string; modules?: AdminModules }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const items = adminNavItems.filter(({ module }) => !module || !modules || modules[module]);
  const postsEnabled = !modules || modules.posts;
  return <>
    <nav aria-label="Hızlı erişim" className="admin-tabbar admin-chrome">
      <Link href="/dashboard" aria-current={active === "/dashboard" ? "page" : undefined}>
        <span><LayoutDashboard size={21} aria-hidden="true" /></span><span>Genel bakış</span>
      </Link>
      {postsEnabled && <Link href="/yazilar/yeni" className="admin-create-link">
        <span><Plus size={22} aria-hidden="true" /></span><span>Yazı ekle</span>
      </Link>}
      <button type="button" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
        <span><Menu size={22} aria-hidden="true" /></span><span>Menü</span>
      </button>
    </nav>
    {menuOpen && <AppDialog title="Yönetim" hideIdentity headline="Yönetim" onClose={() => setMenuOpen(false)} panelClassName="admin-navigation-sheet">
      <nav aria-label="Tüm bölümler" className="admin-section-list">
        {items.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} aria-current={active === href ? "page" : undefined}>
          <span className="admin-section-icon"><Icon size={22} aria-hidden="true" /></span>
          <span>{label}</span>
          <ChevronRight size={18} aria-hidden="true" className="ml-auto text-muted" />
        </Link>)}
      </nav>
    </AppDialog>}
  </>;
}
