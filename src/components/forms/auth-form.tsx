"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { forgotPasswordAction, loginAction, resetPasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { emailSchema, loginSchema, resetPasswordSchema } from "@/lib/validations/auth";

type Mode = "login" | "forgot" | "reset";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter(); const searchParams = useSearchParams(); const [pending, startTransition] = useTransition(); const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const schema = mode === "login" ? loginSchema : mode === "forgot" ? z.object({ email: emailSchema }) : resetPasswordSchema;
  type Values = z.infer<typeof schema>;
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });
  const onSubmit = (values: Values) => startTransition(async () => {
    try {
      const result = mode === "login" ? await loginAction(values) : mode === "forgot" ? await forgotPasswordAction((values as { email: string }).email) : await resetPasswordAction(values);
      setMessage({ ok: result.success, text: result.message });
      if (result.success && mode === "login") { router.push(searchParams.get("next")?.startsWith("/") ? searchParams.get("next")! : "/dashboard"); router.refresh(); }
      if (result.success && mode === "reset") router.push("/giris");
    } catch { setMessage({ ok: false, text: "Supabase bağlantısı yapılandırılmamış veya şu anda kullanılamıyor." }); }
  });
  const fieldError = (name: string) => (errors as Record<string, { message?: string }>)[name]?.message;
  return <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
    {(mode === "login" || mode === "forgot") && <FormField label="E-posta" htmlFor="email" error={fieldError("email")}><Input id="email" type="email" autoComplete="email" {...register("email" as never)} /></FormField>}
    {(mode === "login" || mode === "reset") && <FormField label="Şifre" htmlFor="password" error={fieldError("password")}><Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} {...register("password" as never)} /></FormField>}
    {mode === "reset" && <FormField label="Şifreyi tekrar girin" htmlFor="confirmPassword" error={fieldError("confirmPassword")}><Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword" as never)} /></FormField>}
    {mode === "login" && <div className="text-right"><Link className="text-sm font-semibold underline underline-offset-4" href="/sifremi-unuttum">Şifremi unuttum</Link></div>}
    {message && <p aria-live="polite" className={`rounded-2xl p-3 text-sm ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-[#fff1f0] text-[#b42318]"}`}>{message.text}</p>}
    <Button className="w-full" disabled={pending}>{pending ? "İşleniyor…" : mode === "login" ? "Giriş yap" : mode === "forgot" ? "Bağlantı gönder" : "Şifreyi güncelle"}</Button>
  </form>;
}
