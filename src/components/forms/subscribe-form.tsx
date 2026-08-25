"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { subscribeAction } from "@/app/actions/subscribe";
import { showToast } from "@/components/ui/toast";
import { emailSchema } from "@/lib/validations/auth";

const schema = z.object({ email: emailSchema });

/** A single-line editorial subscription form. */
export function SubscribeForm({ language = "tr" }: { language?: "tr" | "en" }) {
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
    <form onSubmit={handleSubmit(submit)} className="min-w-0" noValidate>
      <div className="flex items-center gap-4 border-b border-line-strong pb-2 transition-colors focus-within:border-ink">
        <label htmlFor={inputId} className="sr-only">{language === "en" ? "Your email address" : "E-posta adresiniz"}</label>
        <input
          id={inputId}
          type="email"
          autoComplete="email"
          placeholder={language === "en" ? "your email address" : "e-posta adresiniz"}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? errorId : undefined}
          className="h-9 min-w-0 flex-1 bg-transparent px-0 text-[14px] font-normal text-ink placeholder:text-faint"
          {...register("email")}
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-[.16em] text-accent transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 sm:text-[11px]"
        >
          {pending ? "…" : language === "en" ? "Join" : "Katıl"}
        </button>
      </div>
      {errors.email?.message ? <p id={errorId} role="alert" className="mt-2 text-[12px] text-danger">{errors.email.message}</p> : null}
    </form>
  );
}
