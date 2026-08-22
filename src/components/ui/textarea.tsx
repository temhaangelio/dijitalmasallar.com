import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ref, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> }) {
  return <textarea ref={ref} className={cn("min-h-28 w-full resize-y rounded-2xl border border-transparent bg-[#f5f5f5] px-4 py-3 text-[15px] outline-none transition focus:border-black focus:bg-white disabled:opacity-50", className)} {...props} />;
}
