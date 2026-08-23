import { AuthShell } from "@/components/layout/auth-shell";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function NewsletterConfirmationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = uuidPattern.test(token);
  return (
    <AuthShell
      title={valid ? "Aboneliğinizi onaylayın" : "Bağlantı geçersiz"}
      note={valid ? "Teknoloji seçkisini e-posta kutunuza almak için son bir adım kaldı." : "Bu onay bağlantısı eksik veya geçersiz görünüyor."}
    >
      {valid && (
        <form action="/api/newsletter/confirm" method="post">
          <input type="hidden" name="token" value={token} />
          <button className="h-12 w-full rounded-full bg-ink px-6 text-sm font-semibold text-white" type="submit">Aboneliği onayla</button>
        </form>
      )}
    </AuthShell>
  );
}
