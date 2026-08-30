"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { forgotPasswordAction, loginAction, resetPasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { safeNextPath } from "@/lib/env";
import { emailSchema, loginSchema, resetPasswordSchema } from "@/lib/validations/auth";

type Mode = "login" | "forgot" | "reset";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter(); const searchParams = useSearchParams(); const [pending, startTransition] = useTransition(); const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null); const [showPassword, setShowPassword] = useState(false);
  const schema = mode === "login" ? loginSchema : mode === "forgot" ? z.object({ email: emailSchema }) : resetPasswordSchema;
  type Values = z.infer<typeof schema>;
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });
  const onSubmit = (values: Values) => startTransition(async () => {
    try {
      const result = mode === "login" ? await loginAction(values) : mode === "forgot" ? await forgotPasswordAction((values as { email: string }).email) : await resetPasswordAction(values);
      setMessage({ ok: result.success, text: result.message });
      if (result.success && mode === "login") { router.push(safeNextPath(searchParams.get("next"))); router.refresh(); }
      if (result.success && mode === "reset") router.push("/giris");
    } catch { setMessage({ ok: false, text: "Supabase bağlantısı yapılandırılmamış veya şu anda kullanılamıyor." }); }
  });
  const fieldError = (name: string) => (errors as Record<string, { message?: string }>)[name]?.message;
  return <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
    {(mode === "login" || mode === "forgot") && <FormField label="E-posta adresi" htmlFor="email" error={fieldError("email")}><Input id="email" type="email" inputMode="email" autoCapitalize="none" autoComplete="email" placeholder="adiniz@ornek.com" className="bg-surface" {...register("email" as never)} /></FormField>}
    {(mode === "login" || mode === "reset") && <FormField label={mode === "reset" ? "Yeni şifre" : "Şifre"} htmlFor="password" error={fieldError("password")}><div className="relative"><Input id="password" className="bg-surface pr-12" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="••••••••" {...register("password" as never)} /><button type="button" className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-field text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink" aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}</button></div></FormField>}
    {mode === "reset" && <FormField label="Şifreyi tekrar girin" htmlFor="confirmPassword" error={fieldError("confirmPassword")}><Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword" as never)} /></FormField>}
    {mode === "login" && <div className="flex justify-end"><Link className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 transition-colors hover:text-ink" href="/sifremi-unuttum">Şifremi unuttum <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link></div>}
    {message && <p aria-live="polite" className={`rounded-field p-3 text-sm ${message.ok ? "bg-success-surface text-success" : "bg-danger-surface text-danger"}`}>{message.text}</p>}
    <Button className="w-full" size="lg" disabled={pending}>{pending ? "İşleniyor…" : mode === "login" ? "Giriş yap" : mode === "forgot" ? "Yenileme bağlantısı gönder" : "Şifreyi güncelle"}</Button>
    {mode !== "login" ? <div className="pt-1 text-center"><Link href="/giris" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 transition-colors hover:text-ink"><ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" /> Giriş ekranına dön</Link></div> : null}
  </form>;
}
