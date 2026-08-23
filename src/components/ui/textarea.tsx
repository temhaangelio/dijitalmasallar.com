"use client";

import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldBase, useControlProps } from "@/components/ui/field";

export function Textarea({ className, ref, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> }) {
  return <textarea ref={ref} {...useControlProps(props)} className={cn(fieldBase, "min-h-28 resize-y py-3", className)} />;
}
