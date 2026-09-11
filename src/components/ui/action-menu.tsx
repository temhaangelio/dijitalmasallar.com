"use client";

import Link from "next/link";
import { Check, MoreHorizontal } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ActionMenuItem = {
  label: string;
  icon?: ReactNode;
  href?: string;
  /** Opens `href` in a new tab — for the public site, which should not replace the panel. */
  external?: boolean;
  onSelect?: () => void;
  destructive?: boolean;
  checked?: boolean;
  keepOpen?: boolean;
  /** Draws a hairline above this item, grouping it apart from the ones before. */
  separated?: boolean;
};

export function ActionMenu({ label = "İşlemler", items, trigger, triggerClassName, disabled = false, placement = "anchor" }: { label?: string; items: ActionMenuItem[]; trigger?: ReactNode; triggerClassName?: string; disabled?: boolean; placement?: "anchor" | "center" }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function toggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
    }
    setOpen((value) => !value);
  }

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    menuRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const itemClass = (item: ActionMenuItem) => cn(
    "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors",
    item.destructive ? "text-danger hover:bg-danger-surface" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
    item.separated && "mt-1.5 border-t border-line pt-1.5 rounded-t-none",
  );

  return (
    <>
      <button ref={triggerRef} type="button" disabled={disabled} aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={toggle} className={cn("grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink", triggerClassName)}>
        {trigger ?? <MoreHorizontal size={18} />}
      </button>
      {open && createPortal(
        <>
        {placement === "center" ? <div className="fixed inset-0 z-[99] bg-black/20 backdrop-blur-[1px]" aria-hidden="true" /> : null}
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          style={placement === "center" ? { left: "50%", top: "50%", transform: "translate(-50%, -50%)" } : position}
          className={cn("fixed z-[100] min-w-[190px] max-w-[calc(100vw-16px)] rounded-field border border-line bg-surface p-1.5 shadow-pop", placement === "center" && "w-[min(90vw,320px)] p-3")}
        >
          {items.map((item) => item.href ? (
            item.external
              ? <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" role="menuitem" onClick={() => setOpen(false)} className={itemClass(item)}>{item.icon}{item.label}</a>
              : <Link key={item.label} href={item.href} role="menuitem" onClick={() => setOpen(false)} className={itemClass(item)}>{item.icon}{item.label}</Link>
          ) : (
            <button key={item.label} type="button" role={item.checked === undefined ? "menuitem" : "menuitemcheckbox"} aria-checked={item.checked} onClick={() => { if (!item.keepOpen) setOpen(false); item.onSelect?.(); }} className={itemClass(item)}>
              {item.checked === undefined ? item.icon : <span className="grid size-4 place-items-center">{item.checked ? <Check size={14} strokeWidth={2.5} /> : null}</span>}{item.label}
            </button>
          ))}
        </div>
        </>,
        document.body,
      )}
    </>
  );
}
