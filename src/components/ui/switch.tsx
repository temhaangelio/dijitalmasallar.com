"use client";

import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "justify-end bg-ink" : "justify-start bg-line-strong",
      )}
    >
      <span className="size-5 rounded-full bg-surface shadow-card" />
    </button>
  );
}
