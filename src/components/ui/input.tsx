"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldBase, useControlProps } from "@/components/ui/field";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...useControlProps(props)} className={cn(fieldBase, "h-12", className)} />;
}
