"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { ArrowDown } from "lucide-react";

function LoadMoreStatus({ label }: { label: string }) {
  const { pending } = useLinkStatus();

  return (
    <>
      <span className="transition-opacity group-hover:opacity-80" aria-live="polite">{pending ? `${label}…` : label}</span>
      <span className={`relative grid size-10 place-items-center overflow-hidden rounded-full transition-colors ${pending ? "bg-ink-contrast text-ink shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)]" : "text-ink-contrast"}`} aria-hidden="true">
        {pending ? (
          <span className="diji-loading-dot absolute left-1.5 top-1.5 size-2 rounded-full bg-ink" />
        ) : (
          <ArrowDown className="size-[17px] transition-transform duration-300 group-hover:translate-y-0.5" />
        )}
      </span>
    </>
  );
}

export function LoadMoreButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      prefetch={false}
      className="group flex h-14 items-center gap-4 rounded-full bg-ink py-0 pl-6 pr-2 text-[length:var(--vt-small)] font-semibold text-ink-contrast shadow-[0_8px_24px_rgba(0,0,0,.08)] transition-[transform,box-shadow,opacity] duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,.14)] active:translate-y-0 active:opacity-85"
    >
      <LoadMoreStatus label={label} />
    </Link>
  );
}
