"use client";

import { createContext, useContext, useId } from "react";

type FieldContextValue = { controlId: string; describedBy?: string; invalid: boolean };

const FieldContext = createContext<FieldContextValue | null>(null);

export function FieldProvider({ value, children }: { value: FieldContextValue; children: React.ReactNode }) {
  return <FieldContext.Provider value={value}>{children}</FieldContext.Provider>;
}

export function useFieldIds() {
  return useContext(FieldContext);
}

/**
 * Lets `FormField` wire `id`, `aria-invalid` and `aria-describedby` onto the control without every
 * call site repeating them. Explicit props always win.
 */
export function useControlProps(props: { id?: string; "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling"; "aria-describedby"?: string }) {
  const field = useFieldIds();
  if (!field) return props;
  return {
    ...props,
    id: props.id ?? field.controlId,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
    "aria-describedby": props["aria-describedby"] ?? field.describedBy,
  };
}

export function useFieldId(preferred?: string) {
  const generated = useId();
  return preferred ?? generated;
}

/**
 * Shared shape for every text control so inputs, selects and textareas stay visually identical.
 * `outline-none` is deliberately absent: keyboard focus keeps a real, visible ring.
 */
export const fieldBase = [
  "w-full rounded-field border border-transparent bg-surface-2 px-4 text-[15px] text-ink transition-colors",
  "placeholder:text-muted",
  "focus:border-ink focus:bg-surface",
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ink",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-surface",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");
