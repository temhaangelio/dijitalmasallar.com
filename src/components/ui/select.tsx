"use client";

import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldBase, useControlProps } from "@/components/ui/field";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...useControlProps(props)} className={cn(fieldBase, "h-12", className)}>{children}</select>;
}
