"use client";

import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/(auth)/actions";
import { AiNavigationStatus } from "./ai-navigation-status";

const items = [["Dashboard", "/dashboard", null], ["Yazılar", "/yazilar", "posts"], ["Yapay zekâ", "/yapay-zeka", "ai"], ["RSS", "/rss", "rss"], ["Reklamlar", "/reklamlar", "ads"], ["İstatistik", "/istatistik", "analytics"]] as const;

export function MobileNavigation({ active, siteName, modules, aiScanRunning }: { active: string; siteName: string; modules: Record<"posts" | "ai" | "rss" | "ads" | "analytics", boolean>; aiScanRunning: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    document.body.style.overflow = open ? "hidden" : "";
    return () => { window.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [open]);
  return <>
    <div className="mobile-bar"><Link href="/dashboard" className="flex items-center gap-3"><span className="brand-mark !size-10" /><strong>{siteName}</strong></Link><button aria-label="Menüyü aç" aria-expanded={open} onClick={() => setOpen(true)} className="grid size-11 place-items-center rounded-full bg-surface-2"><Menu size={20} /></button></div>
    {open && <div className="fixed inset-0 z-50 bg-ink/25" role="presentation" onMouseDown={() => setOpen(false)}><aside role="dialog" aria-modal="true" aria-label="Ana menü" className="ml-auto flex h-full w-[min(88vw,360px)] flex-col bg-canvas p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="mb-8 flex items-center justify-between"><strong className="text-lg">{siteName}</strong><button autoFocus aria-label="Menüyü kapat" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full bg-surface-2"><X size={20} /></button></div><nav className="flex flex-col gap-2">{items.filter(([, , module]) => !module || modules[module]).map(([label, href]) => { const selected = active === href; return <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex min-h-12 items-center gap-2 rounded-field px-4 font-semibold ${selected ? "bg-ink text-ink-contrast" : "hover:bg-surface-2"}`}>{label}{href === "/yapay-zeka" ? <AiNavigationStatus initiallyRunning={aiScanRunning} /> : null}</Link>; })}<form action={logoutAction}><button type="submit" className="flex min-h-12 w-full items-center gap-3 rounded-field px-4 text-left font-semibold hover:bg-surface-2"><LogOut className="size-4" aria-hidden="true" />Çıkış yap</button></form></nav><Link href="/" className="mt-auto rounded-field bg-surface-2 p-4 font-semibold">Siteyi gör ↗</Link></aside></div>}
  </>;
}
