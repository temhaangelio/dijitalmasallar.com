import Link from "next/link";
import { AuthShell } from "@/components/layout/auth-shell";

export default async function NewsletterResultPage({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  const success = (await searchParams).durum === "onaylandi";
  return (
    <AuthShell
      title={success ? "Aboneliğiniz onaylandı" : "Onay tamamlanamadı"}
      note={success ? "Bundan sonraki teknoloji seçkileri e-posta adresinize gelecek." : "Bağlantının süresi dolmuş olabilir. Ana sayfadan yeniden abone olabilirsiniz."}
      footer={<Link className="font-semibold underline" href="/">Ana sayfaya dön</Link>}
    >
      <div className={`rounded-field p-4 text-sm ${success ? "bg-success-surface text-success" : "bg-warning-surface text-warning"}`}>
        {success ? "Her şey hazır." : "Yeni bir doğrulama bağlantısı isteyin."}
      </div>
    </AuthShell>
  );
}
