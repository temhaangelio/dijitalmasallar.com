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
      <PageHeader title="Profil" note="Hesap bilgileriniz ve oturum ayarlarınız" />
      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="grid size-24 shrink-0 place-items-center rounded-[30px] bg-black text-[28px] font-bold !text-white">{initials(profile.full_name)}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3"><h2 className="text-[30px] font-bold tracking-[-.045em]">{profile.full_name}</h2><Badge className="bg-black !text-white">Yönetici</Badge></div>
              <p className="mt-2 flex items-center gap-2 text-[#777]"><Mail className="size-4" />{profile.email}</p>
              <p className="mt-3 text-sm leading-relaxed text-[#a1a1a1]">Bu bilgiler aktif Supabase hesabınızdan alınır.</p>
            </div>
          </div>
          <div className="mt-8 grid gap-3 border-t border-[#f1f1f1] pt-6 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#f7f7f7] p-4"><FileText className="mb-5 size-5 text-[#777]" /><small className="text-[#a1a1a1]">Yazılarım</small><strong className="mt-1 block text-2xl">{profile.post_count}</strong></div>
            <div className="rounded-2xl bg-[#f7f7f7] p-4"><CalendarDays className="mb-5 size-5 text-[#777]" /><small className="text-[#a1a1a1]">Hesap oluşturma</small><strong className="mt-1 block text-sm">{formatDate(profile.created_at)}</strong></div>
            <div className="rounded-2xl bg-[#f7f7f7] p-4"><ShieldCheck className="mb-5 size-5 text-[#777]" /><small className="text-[#a1a1a1]">Son giriş</small><strong className="mt-1 block text-sm">{lastSignIn}</strong></div>
          </div>
        </Card>

        <div className="space-y-5 xl:col-span-4">
          <Card>
            <ProfileForm fullName={profile.full_name} email={profile.email} />
          </Card>
          <Card>
            <h2 className="section-title">Hesap</h2>
            <div className="mt-5 divide-y divide-[#f1f1f1]"><div className="flex items-center justify-between gap-4 py-4 first:pt-0"><span className="text-sm text-[#777]">Yetki</span><strong className="text-sm">Yönetici</strong></div><div className="flex items-center justify-between gap-4 py-4"><span className="text-sm text-[#777]">Hesap durumu</span><span className="inline-flex items-center gap-2 text-sm font-semibold"><span className="size-2 rounded-full bg-emerald-500" />Aktif</span></div></div>
          </Card>
          <Card>
            <h2 className="text-lg font-bold">Oturum</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#a1a1a1]">Bu cihazdaki yönetim paneli oturumunuzu güvenli biçimde kapatır.</p>
            <form action={logoutAction} className="mt-5">
              <Button type="submit" variant="destructive" className="w-full"><LogOut className="mr-2 size-4" />Çıkış yap</Button>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
