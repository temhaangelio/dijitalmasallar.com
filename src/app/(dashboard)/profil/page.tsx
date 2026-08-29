import { CalendarDays, FileText, LogOut, Mail, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import { ProfileForm } from "@/components/features/profile/profile-form";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/services/users";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("tr-TR");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/giris");
  const lastSignIn = profile.last_seen === "—" ? "—" : new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(profile.last_seen));

  return (
    <AppShell active="/profil">
      <PageHeader title="Profil" />
      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="grid size-24 shrink-0 place-items-center rounded-[30px] bg-ink text-[28px] font-bold !text-white">{initials(profile.full_name)}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3"><h2 className="text-[30px] font-bold tracking-[-.045em]">{profile.full_name}</h2><Badge variant="solid">Yönetici</Badge></div>
              <p className="mt-2 flex items-center gap-2 text-muted"><Mail className="size-4" />{profile.email}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">Bu bilgiler aktif Supabase hesabınızdan alınır.</p>
            </div>
          </div>
          <div className="mt-8 grid gap-3 border-t border-line pt-6 sm:grid-cols-3">
            <div className="rounded-field bg-surface-2 p-4"><FileText className="mb-5 size-5 text-muted" /><small className="text-muted">Yazılarım</small><strong className="mt-1 block text-2xl">{profile.post_count}</strong></div>
            <div className="rounded-field bg-surface-2 p-4"><CalendarDays className="mb-5 size-5 text-muted" /><small className="text-muted">Hesap oluşturma</small><strong className="mt-1 block text-sm">{formatDate(profile.created_at)}</strong></div>
            <div className="rounded-field bg-surface-2 p-4"><ShieldCheck className="mb-5 size-5 text-muted" /><small className="text-muted">Son giriş</small><strong className="mt-1 block text-sm">{lastSignIn}</strong></div>
          </div>
        </Card>

        <div className="space-y-5 xl:col-span-4">
          <Card>
            <ProfileForm fullName={profile.full_name} email={profile.email} />
          </Card>
          <Card>
            <h2 className="section-title">Hesap</h2>
            <div className="mt-5 divide-y divide-line"><div className="flex items-center justify-between gap-4 py-4 first:pt-0"><span className="text-sm text-muted">Yetki</span><strong className="text-sm">Yönetici</strong></div><div className="flex items-center justify-between gap-4 py-4"><span className="text-sm text-muted">Hesap durumu</span><span className="inline-flex items-center gap-2 text-sm font-semibold"><span className="size-2 rounded-full bg-success-surface0" />Aktif</span></div></div>
          </Card>
          <Card>
            <h2 className="text-lg font-bold">Oturum</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">Bu cihazdaki yönetim paneli oturumunuzu güvenli biçimde kapatır.</p>
            <form action={logoutAction} className="mt-5">
              <Button type="submit" variant="destructive" className="w-full"><LogOut className="size-4" aria-hidden="true" />Çıkış yap</Button>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
