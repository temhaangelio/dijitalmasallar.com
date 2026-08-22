import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/feedback/states";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableWrap, Td, Th } from "@/components/ui/table";
import { getNewsletterDashboard } from "@/services/newsletters";
import type { Newsletter, NewsletterStatus } from "@/types/database";

const statusLabels: Record<NewsletterStatus, string> = { draft: "Taslak", scheduled: "Planlı", sent: "Gönderildi", cancelled: "İptal" };
const subscriberStatusLabels = { active: "Aktif", pending: "Bekliyor", unsubscribed: "Ayrıldı" } as const;

function rate(value: number, total: number) { return total ? `%${((value / total) * 100).toFixed(1).replace(".", ",")}` : "—"; }
function campaignDate(newsletter: Newsletter) {
  const value = newsletter.sent_at ?? newsletter.scheduled_at ?? newsletter.created_at;
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default async function NewsletterPage() {
  const { newsletters, subscribers, stats } = await getNewsletterDashboard();
  const scheduled = newsletters.filter((item) => item.status === "scheduled" && item.scheduled_at).sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0];
  const sentCampaigns = newsletters.filter((item) => item.status === "sent");
  const chartCampaigns = sentCampaigns.slice(0, 6).reverse();
  const cards = [
    ["Abone", stats.active.toLocaleString("tr-TR"), `${stats.pending} bekliyor`],
    ["Açılma", `%${stats.openRate.toFixed(1).replace(".", ",")}`, `${stats.sent} gönderim`],
    ["Tıklama", `%${stats.clickRate.toFixed(1).replace(".", ",")}`, "gerçek oran"],
    ["Çıkış", stats.unsubscribed.toLocaleString("tr-TR"), "kişi"],
  ];

  return (
    <AppShell active="/e-bulten">
      <div className="mx-auto w-full max-w-[1600px]">
      <PageHeader title="E-bülten" note={`${stats.active.toLocaleString("tr-TR")} aktif abone · ${stats.sent} sayı gönderildi`} actions={<Link href="/e-bulten/yeni" className={buttonVariants()}>Yeni bülten <ArrowRight className="ml-3 size-4" /></Link>} />
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {cards.map(([label, value, note]) => <Card key={label} className="flex h-[132px] flex-col justify-between"><strong className="text-[15px]">{label}</strong><div><span className="text-[42px] font-bold leading-none tracking-[-.05em]">{value}</span><small className="ml-2 text-[#a1a1a1]">{note}</small></div></Card>)}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          {scheduled ? <><div className="text-sm font-medium text-[#a1a1a1]">Sıradaki gönderim · {campaignDate(scheduled)}</div><div className="mt-4 flex items-start justify-between gap-4"><div><h2 className="section-title">#{scheduled.issue_number} · {scheduled.subject}</h2><p className="mt-1 text-[#a1a1a1]">{scheduled.preview_text || "Ön izleme metni eklenmedi"}</p></div><Badge className="bg-black text-white">Planlı</Badge></div><div className="mt-10 grid grid-cols-2 gap-4 border-y border-[#f1f1f1] py-5"><div><small className="text-[#a1a1a1]">Aktif alıcı</small><strong className="mt-1 block">{stats.active.toLocaleString("tr-TR")} kişi</strong></div><div><small className="text-[#a1a1a1]">Gönderim zamanı</small><strong className="mt-1 block">{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(scheduled.scheduled_at!))}</strong></div></div></> : <EmptyState title="Planlanmış bülten yok" description="Yeni bir bülten oluşturup gönderim tarihini planlayabilirsiniz." />}
        </Card>
        <Card className="xl:col-span-5">
          <div className="flex justify-between"><h2 className="section-title">Açılma oranı</h2><span className="text-[#a1a1a1]">Son {chartCampaigns.length} sayı</span></div>
          <div className="mt-5 text-[42px] font-bold tracking-[-.05em]">%{stats.openRate.toFixed(1).replace(".", ",")}</div>
          {chartCampaigns.length ? <div className="mt-8 flex h-28 items-end gap-3">{chartCampaigns.map((newsletter) => { const percentage = newsletter.recipient_count ? (newsletter.open_count / newsletter.recipient_count) * 100 : 0; return <div key={newsletter.id} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="w-full rounded bg-black" style={{ height: `${Math.max(percentage, 3)}%` }} title={`%${percentage.toFixed(1)}`} /><small className="text-[#a1a1a1]">#{newsletter.issue_number}</small></div>; })}</div> : <p className="mt-8 text-sm text-[#a1a1a1]">Gönderilmiş bülten verisi oluştuğunda grafik burada görünecek.</p>}
        </Card>
        <Card className="xl:col-span-12">
          <div className="mb-5 flex justify-between"><h2 className="section-title">Aboneler</h2><span className="text-[#a1a1a1]">{subscribers.length} kişi</span></div>
          {subscribers.length ? <TableWrap><Table><thead><tr><Th>E-posta</Th><Th>Durum</Th><Th>Kaynak</Th><Th className="text-right">Kayıt tarihi</Th></tr></thead><tbody>{subscribers.map((subscriber) => <tr key={subscriber.id}><Td className="font-semibold">{subscriber.email}</Td><Td><Badge className={subscriber.status === "active" ? "bg-black text-white" : ""}>{subscriberStatusLabels[subscriber.status]}</Badge></Td><Td className="text-[#777]">{subscriber.source || "Web sitesi"}</Td><Td className="text-right text-[#a1a1a1]">{new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(subscriber.created_at))}</Td></tr>)}</tbody></Table></TableWrap> : <EmptyState title="Henüz abone yok" description="Ziyaretçiler e-bültene kaydolduğunda burada görünecek." />}
        </Card>
        <Card className="xl:col-span-12">
          <div className="mb-5 flex justify-between"><h2 className="section-title">Bültenler</h2><span className="text-[#a1a1a1]">{newsletters.length} sayı</span></div>
          {newsletters.length ? <TableWrap><Table><thead><tr><Th>Sayı</Th><Th>Konu</Th><Th>Durum</Th><Th className="text-right">Alıcı</Th><Th className="text-right">Açılma</Th><Th className="text-right">Tıklama</Th><Th className="text-right">Tarih</Th></tr></thead><tbody>{newsletters.map((newsletter) => <tr key={newsletter.id}><Td className="font-bold">#{newsletter.issue_number}</Td><Td className="font-semibold">{newsletter.subject}</Td><Td><Badge className={newsletter.status === "sent" ? "bg-black text-white" : ""}>{statusLabels[newsletter.status]}</Badge></Td><Td className="text-right">{newsletter.recipient_count ? newsletter.recipient_count.toLocaleString("tr-TR") : "—"}</Td><Td className="text-right">{rate(newsletter.open_count, newsletter.recipient_count)}</Td><Td className="text-right">{rate(newsletter.click_count, newsletter.recipient_count)}</Td><Td className="text-right text-[#a1a1a1]">{campaignDate(newsletter)}</Td></tr>)}</tbody></Table></TableWrap> : <EmptyState title="Henüz bülten yok" description="Yeni bülten oluşturduğunuzda burada görünecek." />}
        </Card>
      </div>
      </div>
    </AppShell>
  );
}
