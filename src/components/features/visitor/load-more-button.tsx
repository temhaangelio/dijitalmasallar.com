"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { ArrowDown, LoaderCircle } from "lucide-react";

function LoadMoreStatus({ label }: { label: string }) {
  const { pending } = useLinkStatus();

  return (
    <>
      <span>{pending ? `${label}…` : label}</span>
      <span className="grid size-8 place-items-center rounded-full bg-ink-contrast text-ink" aria-hidden="true">
        {pending ? <LoaderCircle className="size-[16px] animate-spin" /> : <ArrowDown size={15} />}
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
      className="flex h-12 items-center gap-3 rounded-full bg-ink py-0 pl-6 pr-2 text-[15px] font-semibold text-ink-contrast transition-opacity hover:opacity-85"
    >
      <LoadMoreStatus label={label} />
    </Link>
  );
}
