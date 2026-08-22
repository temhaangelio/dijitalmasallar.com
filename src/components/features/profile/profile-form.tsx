"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { updateProfileAction } from "@/app/(dashboard)/profil/actions";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { profileSchema, type ProfileFormValues } from "@/lib/validations/profile";

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: { fullName } });
  const submit = (values: ProfileFormValues) => startTransition(async () => {
    const result = await updateProfileAction(values);
    setMessage({ success: result.success, text: result.message });
    if (result.success) router.refresh();
  });
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
      <h2 className="section-title">Profil bilgileri</h2>
      <FormField label="Ad soyad" htmlFor="fullName" error={errors.fullName?.message}><Input id="fullName" autoComplete="name" {...register("fullName")} /></FormField>
      <FormField label="E-posta" htmlFor="profileEmail" hint="E-posta adresi Supabase Auth hesabınızdan gelir ve buradan değiştirilemez."><Input id="profileEmail" type="email" value={email} disabled readOnly /></FormField>
      {message ? <p role={message.success ? "status" : "alert"} className={`rounded-2xl p-3 text-sm ${message.success ? "bg-[#eefbf5] text-[#067647]" : "bg-[#fff1f0] text-[#b42318]"}`}>{message.text}</p> : null}
      <Button className="w-full" disabled={pending || !isDirty}>{pending ? "Kaydediliyor…" : "Değişiklikleri kaydet"}</Button>
    </form>
  );
}
