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
  onSelect?: () => void;
  destructive?: boolean;
  checked?: boolean;
  keepOpen?: boolean;
};

export function ActionMenu({ label = "İşlemler", items, trigger, triggerClassName, disabled = false, placement = "anchor" }: { label?: string; items: ActionMenuItem[]; trigger?: ReactNode; triggerClassName?: string; disabled?: boolean; placement?: "anchor" | "center" }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function toggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
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

  const itemClass = (destructive?: boolean) => cn(
    "flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors",
    destructive ? "text-danger hover:bg-danger-surface" : "text-ink-2 hover:bg-surface-2",
  );

  return (
    <>
      <button ref={triggerRef} type="button" disabled={disabled} aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={toggle} className={cn("grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-white hover:text-ink", triggerClassName)}>
        {trigger ?? <MoreHorizontal size={18} />}
      </button>
      {open && createPortal(
        <>
        {placement === "center" ? <div className="fixed inset-0 z-[99] bg-ink/10 backdrop-blur-[1px]" aria-hidden="true" /> : null}
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          style={placement === "center" ? { left: "50%", top: "50%", transform: "translate(-50%, -50%)" } : position}
          className={cn("fixed z-[100] min-w-[170px] rounded-field border border-line bg-white p-1.5 shadow-pop", placement === "center" && "w-[min(90vw,320px)] p-3")}
        >
          {items.map((item) => item.href ? (
            <Link key={item.label} href={item.href} role="menuitem" onClick={() => setOpen(false)} className={itemClass(item.destructive)}>{item.icon}{item.label}</Link>
          ) : (
            <button key={item.label} type="button" role={item.checked === undefined ? "menuitem" : "menuitemcheckbox"} aria-checked={item.checked} onClick={() => { if (!item.keepOpen) setOpen(false); item.onSelect?.(); }} className={itemClass(item.destructive)}>
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
