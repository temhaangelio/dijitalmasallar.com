"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { updateProfileAction } from "@/app/(dashboard)/profil/actions";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";
import { profileSchema, type ProfileFormValues } from "@/lib/validations/profile";

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: { fullName } });
  const submit = (values: ProfileFormValues) => startTransition(async () => {
    const result = await updateProfileAction(values);
    showToast(result.message, result.success ? "success" : "error");
    if (result.success) router.refresh();
  });
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
      <h2 className="section-title">Profil bilgileri</h2>
      <FormField label="Ad soyad" htmlFor="fullName" error={errors.fullName?.message}><Input id="fullName" autoComplete="name" {...register("fullName")} /></FormField>
      <FormField label="E-posta" htmlFor="profileEmail" hint="E-posta adresi Supabase Auth hesabınızdan gelir ve buradan değiştirilemez."><Input id="profileEmail" type="email" value={email} disabled readOnly /></FormField>
      <Button className="w-full" disabled={pending || !isDirty}>{pending ? "Kaydediliyor…" : "Değişiklikleri kaydet"}</Button>
    </form>
  );
}
