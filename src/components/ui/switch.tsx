"use client";

import { cn } from "@/lib/utils";

export function Switch({ checked, onCheckedChange, label }: { checked: boolean; onCheckedChange: (value: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onCheckedChange(!checked)} className={cn("flex h-7 w-12 items-center rounded-full p-1 transition", checked ? "justify-end bg-black" : "justify-start bg-[#e2e2e2]")}><span className="size-5 rounded-full bg-white shadow-sm" /></button>;
}
