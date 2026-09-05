"use client";

import Link from "next/link";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/(auth)/actions";
import { BrandMark } from "@/components/ui/brand-mark";
import { adminNavItems, type AdminModules } from "./admin-nav-items";

export function MobileNavigation({ active, siteName, modules }: { active: string; siteName: string; modules: AdminModules }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const panel = dialog.current;
    const opener = trigger.current;
    const previousOverflow = document.body.style.overflow;
    panel.showModal();
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      panel.close();
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [open]);
  return <>
    <div className="mobile-bar">
      <Link href="/dashboard" className="flex min-w-0 items-center gap-3"><BrandMark className="!size-9" /><strong className="admin-brand truncate text-sm">{siteName}</strong></Link>
      <button ref={trigger} type="button" aria-label="Menüyü aç" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)} className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-3"><Menu size={19} strokeWidth={1.6} /></button>
    </div>
    <dialog ref={dialog} onCancel={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_32px)] max-w-sm overflow-y-auto rounded-[18px] border border-line bg-surface p-0 text-ink backdrop:bg-black/25">
      <div className="p-5">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-[family-name:var(--font-source-serif)] text-2xl">Yönetim menüsü</h2><button type="button" aria-label="Menüyü kapat" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full hover:bg-surface-2"><X size={19} /></button></div>
        <nav aria-label="Mobil yönetim menüsü" className="space-y-1">
          {adminNavItems.filter(({ module }) => !module || modules[module]).map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active === href ? "page" : undefined} className={`flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm ${active === href ? "bg-surface-3 font-semibold" : "text-ink-2 hover:bg-surface-2"}`}><Icon size={18} strokeWidth={1.6} />{label}</Link>)}
        </nav>
        <div className="mt-5 space-y-1 border-t border-line pt-4">
          <Link href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm text-muted"><ExternalLink size={17} />Siteye git</Link>
          <form action={logoutAction}><button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 text-left text-sm text-muted hover:bg-surface-2"><LogOut size={17} />Çıkış yap</button></form>
        </div>
      </div>
    </dialog>
  </>;
}
