import type { ReactNode } from "react";

export function FormField({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode }) {
  return <div><label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold">{label}</label>{children}{error ? <p role="alert" className="mt-1.5 text-[13px] text-[#b42318]">{error}</p> : hint ? <p className="mt-1.5 text-[13px] text-[#a1a1a1]">{hint}</p> : null}</div>;
}
