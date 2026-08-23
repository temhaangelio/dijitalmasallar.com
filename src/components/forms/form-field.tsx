"use client";

import type { ReactNode } from "react";
import { FieldProvider, useFieldId } from "@/components/ui/field";

type FormFieldProps = {
  label: string;
  /** Optional; when omitted a generated id is used and forwarded to the control. */
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

/**
 * Owns the label/description/error wiring for a single control. The control itself picks the ids up
 * through context, so `aria-invalid` and `aria-describedby` cannot drift out of sync with the
 * message that is actually rendered.
 */
export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  const controlId = useFieldId(htmlFor);
  const messageId = error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined;

  return (
    <div>
      <label htmlFor={controlId} className="mb-2 block text-sm font-semibold text-ink">{label}</label>
      <FieldProvider value={{ controlId, describedBy: messageId, invalid: Boolean(error) }}>{children}</FieldProvider>
      {error ? (
        <p id={messageId} role="alert" className="mt-1.5 text-[13px] font-medium text-danger">{error}</p>
      ) : hint ? (
        <p id={messageId} className="mt-1.5 text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
