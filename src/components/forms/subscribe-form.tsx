"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { subscribeAction } from "@/app/actions/subscribe";
import { showToast } from "@/components/ui/toast";
import { emailSchema } from "@/lib/validations/auth";

const schema = z.object({ email: emailSchema });

/**
 * Sits inside the black newsletter panel, so it keeps its own inverted styling instead of the shared
 * field primitives — the surrounding surface is the only reason for the deviation.
 */
export function SubscribeForm() {
  const [pending, startTransition] = useTransition();
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const submit = ({ email }: z.infer<typeof schema>) =>
    startTransition(async () => {
      const result = await subscribeAction(email);
      showToast(result.message, result.success ? "success" : "error");
    });

  return (
    <form onSubmit={handleSubmit(submit)} className="on-dark min-w-0 sm:w-[320px]" noValidate>
      <div className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">E-posta adresiniz</label>
        <input
          id={inputId}
          type="email"
          autoComplete="email"
          placeholder="e-posta adresiniz"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? errorId : undefined}
          className="h-11 min-w-0 flex-1 rounded-full bg-ink-contrast/10 px-[18px] text-sm font-medium text-ink-contrast transition-colors outline-none placeholder:text-on-dark focus:bg-ink-contrast/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-contrast aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-danger"
          {...register("email")}
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 shrink-0 rounded-full bg-ink-contrast px-5 text-sm font-semibold text-ink transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "…" : "Katıl"}
        </button>
      </div>
      {errors.email?.message ? <p id={errorId} role="alert" className="mt-2 text-xs text-on-dark">{errors.email.message}</p> : null}
    </form>
  );
}
