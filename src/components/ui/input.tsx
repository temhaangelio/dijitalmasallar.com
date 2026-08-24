"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { fieldBase, useControlProps } from "@/components/ui/field";

// `ComponentProps` rather than `InputHTMLAttributes` so `ref` travels through as the ordinary prop
// it became in React 19 — the RSS dialog focuses its field on open.
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...useControlProps(props)} className={cn(fieldBase, "h-12", className)} />;
}
