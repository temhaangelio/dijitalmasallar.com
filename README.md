# diji.news

Claude Design referanslarından dönüştürülmüş, yayın ve e-bülten yönetimi için üretime hazır Next.js uygulaması. Yönetim paneli; yazılar, bültenler, ekip, istatistik ve yayın ayarlarını tek bir tasarım sistemi altında toplar. Ziyaretçi akışı ve bülten aboneliği de aynı projededir.

## Teknolojiler

- Next.js 16 App Router, React 19, TypeScript ve Tailwind CSS 4
- Supabase Auth, PostgreSQL Database ve Storage
- React Hook Form, Zod, Lucide React
- Vercel uyumlu Server Components, Server Actions ve Route Handlers

## Yerel kurulum

```bash
npm install
cp .env.example .env.local
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışır. Supabase değişkenleri girilmediğinde arayüz, referans tasarımdaki örnek verileri gösterir; kalıcı işlemler Supabase yapılandırıldıktan sonra veritabanına yazılır.

## Supabase hazırlığı

Bu uygulama, `dijitalmasallar.com` projesinin mevcut Supabase şemasını paylaşır. Yeni bir migration çalıştırmak gerekmez. Kullanılan kaynaklar:

- `posts`: yazı listeleme, oluşturma, güncelleme, silme ve ileri tarihli yayın
- `admin_users` + Supabase Auth Admin API: ekip ve rol bilgileri
- `newsletter_subscribers`: double opt-in bülten aboneliği ve canlı abone sayıları
- `site_settings`: diji.news’e ait `diji_*` anahtarlı yayın ayarları

### Migration ve RLS

- `supabase/migrations/` — uygulanmaya hazır, eklemeli migration'lar. En yenisi
  `20260825120000_push_subscriptions.sql`: web push abonelikleri için yeni bir tablo ve panelde
  `module_push` anahtarı. Tablo RLS açık ve **hiç politikası yok**; tüm okuma/yazma
  `src/services/push.ts` içindeki service-role istemcisinden geçer, yani abone listesi anon anahtarla
  okunamaz. Bir önceki migration
  `20260823210000_query_indexes.sql`: uygulamanın gerçekten çalıştırdığı sorgular için dört indeks
  ekler. Hiçbir sütun, kısıt, politika veya satıra dokunmaz; geri alma komutları dosyanın sonundadır.
- `supabase/audit/rls-audit.sql` — yalnızca `select` çalıştıran, RLS ve yetki denetim betiği.
  Aşağıdaki iki soruyu bu depo cevaplayamaz, çünkü paylaşılan şemadaki tabloların `create`
  migration'ı burada yok: tablolarda RLS açık mı, `is_admin()` fonksiyonunun `search_path`'i sabit mi?
- `supabase/proposed/` — **otomatik uygulanmaz.** Önerilen RLS sıkılaştırması burada bekler; önce
  denetim betiğini çalıştırıp çıktıyla karşılaştırın. Ayrıntılar `supabase/proposed/README.md` içinde.

Yetkilendirme mevcut `is_admin()` RPC’si ve tablo RLS kurallarıyla uygulanır. `SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucu tarafındaki modüllerde kullanılır; `NEXT_PUBLIC_` öneki verilmez ve tarayıcı paketine girmez. Depodaki `diji_` önekli migration, ileride tamamen bağımsız bir Supabase projesine ayrılmak istenirse başlangıç referansı olarak tutulur; paylaşılan production projesine uygulanmamalıdır.

## Ortam değişkenleri

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL="diji.news <bulten@dijitalmasallar.com>"
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:merhaba@diji.news
```

VAPID anahtarları web push için gerekir; ikisi de tanımlı değilse bildirim arayüzü hiç görünmez.
Yeni bir çift `npx web-push generate-vapid-keys` ile üretilir. Genel anahtar `NEXT_PUBLIC_` önekiyle
paketlenmez; ilgili sayfa onu sunucudan prop olarak geçirir.

`RESEND_API_KEY` yerine mevcut projedeki `MAIL_KEY` de kullanılabilir. Vercel Preview ortamının production verisini değiştirmemesi için Preview’a ayrı bir staging Supabase projesinin URL/key değerlerini verin.

## Auth callback adresleri

Supabase Authentication → URL Configuration bölümünde Site URL ve Redirect URLs alanlarına ortamlarınızı ekleyin:

```text
http://localhost:3000/auth/callback
https://your-preview.vercel.app/auth/callback
https://your-domain.com/auth/callback
```

Uygulama e-posta doğrulama ve şifre yenileme dönüşlerinde `/auth/callback` Route Handler’ını kullanır. Uygulama dışına yönlendiren `next` değerleri reddedilir.

## Tasarım sistemi

Tüm renk, köşe yuvarlaklığı ve gölge değerleri `src/app/globals.css` içindeki `@theme` bloğunda
tanımlıdır; bileşenler bunları `text-muted`, `bg-surface-2`, `rounded-card`, `shadow-pop` gibi
yardımcı sınıflarla kullanır. JSX içinde doğrudan hex değeri yazılmaz — istisna, canvas üzerine
çizim yapan `post-image-generator` bileşenidir.

Gri metin tonları göz kararıyla değil, WCAG kontrast oranına göre seçilmiştir:

| Token | Değer | Beyaz üzerinde | Sayfa zemininde (`#efefef`) |
|---|---|---|---|
| `--color-muted` | `#6a6a6a` | 5.41:1 (AA) | 4.70:1 (AA) |
| `--color-faint` | `#8a8a8a` | 3.45:1 (AA large) | 3.00:1 (AA large) |
| `--color-on-dark` | `#a1a1a1` | — | 7.66:1 (siyah panel üzerinde) |

İkincil metnin tonunu değiştirmek isterseniz tek yapmanız gereken `--color-muted` değerini
güncellemektir.

### Koyu tema

Ziyaretçi sayfalarında Açık / Koyu / Sistem seçimi üst çubuktaki menünün **Ayarlar**
bölümünden yapılır; tercih `localStorage` içinde `diji-news-theme` anahtarıyla saklanır. Kök
`layout.tsx` içindeki satır içi `ThemeScript`, ilk boyamadan önce `<html>` üzerine
`data-visitor-theme` özniteliğini yazar; böylece koyu temada açık renk bir sıçrama olmaz.

Koyu token'lar **yalnızca `.visitor-page` içinde** geçerlidir. Yönetim panelinde hâlâ çok sayıda
düz `bg-white` / `text-white` var; token'ları global çevirmek yarı ters çevrilmiş, okunamayan bir
panel üretirdi. Panelin koyu teması ayrı bir iş olarak duruyor.

`--color-ink-contrast` token'ı bu yüzden var: `bg-ink text-ink-contrast` kalıbı her iki temada da
okunur kalır — açık temada siyah zemin/beyaz yazı, koyu temada açık zemin/koyu yazı.

## Ziyaretçi sayfaları

Genel akış `/`, notlar `/haber/[id]`, arama `/search`, e-bülten `/newsletter`, iletişim `/contact`.
Hakkında sayfası (`/about`) siteyi ve yayın yaklaşımını anlatır. Dil, tema, yazı tipi ve boyutu,
bildirimler ile uygulama kurulumu tercihleri üst çubuktaki menünün **Ayarlar** bölümünde bulunur.

## PWA ve bildirimler

Ziyaretçi tarafı yüklenebilir bir uygulamadır: `src/app/manifest.ts` manifesti panel ayarlarından
üretir, ikonlar `scripts/generate-app-icons.mjs` ile `globals.css` içindeki `.brand-mark`
geometrisinden çizilir (`node scripts/generate-app-icons.mjs` ile yeniden üretilir).

`public/sw.js` bilinçli olarak **hiçbir şeyi önbelleğe almaz** — bir haber akışının dünkü notları
önbellekten servis etmesi, ağ gerektiğini söylemesinden kötüdür. Service worker yalnızca iki iş
yapar: push mesajını bildirime çevirmek ve bildirime dokunulduğunda ilgili notu açmak. `fetch`
dinleyicisi boştur; tarayıcıların yükleme istemini sunmadan önce aradığı imzayı karşılar.

Bildirimler yeni not yayınlandığında otomatik gider: `createPostAction` (ve planlı bir notu öne çeken
`updatePostAction`) yanıtı bekletmemek için `after()` içinden `notifyNewPost` çağırır. Her abone,
kaydolduğu dildeki metni alır; 404/410 dönen uçlar gönderim sırasında tablodan silinir.

**Planlı notlar bildirim üretmez**: ileri tarihli bir not kendi zaman damgasıyla görünür hale gelir,
arkasında bir istek yoktur. Bunun için ileride bir cron (örneğin Vercel Cron → route handler)
gerekir.

Yerel testte bildirimler `localhost` üzerinde çalışır (güvenli bağlam); ayrı bir cihazdan denemek
için `next dev --experimental-https` gerekir.

## Kalite kontrolleri

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Testler Node'un yerleşik test koşucusuyla çalışır; ek bir bağımlılık gerektirmez. Kapsam, saf
mantığa odaklanır: açık yönlendirme koruması (`safeNextPath`), UUID ve görsel host doğrulaması,
yazı içeriği ayrıştırma ve tüm Zod şemaları.

## Güvenlik başlıkları

`next.config.ts` her yanıta `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Strict-Transport-Security` ve
`frame-ancestors` / `base-uri` / `object-src` / `form-action` yönergelerini içeren bir CSP ekler;
`X-Powered-By` kapatılmıştır. `script-src` bilinçli olarak CSP'ye dahil edilmemiştir: Next'in satır
içi bootstrap script'leri istek başına nonce gerektirir, yarım bir politika ise güvenlik sağlamadan
uygulamayı bozar.

## Vercel’e bağlama

1. Bu repository’yi Vercel’de **New Project** ile bağlayın veya mevcut bağlantıda `vercel link` kullanın.
2. Preview ve Production ortam değişkenlerini ayrı ayrı ekleyin.
3. Preview oluşturun: `vercel deploy`.
4. Preview’da giriş, kayıt, callback, yazı ekleme, bülten onayı ve RLS akışlarını kontrol edin.
5. Kullanıcının açık onayından sonra production’a alın: `vercel deploy --prod`.

Özel domain için Vercel Project Settings → Domains alanından domaini ekleyin, DNS kayıtlarını doğrulayın ve `NEXT_PUBLIC_APP_URL` ile Supabase callback listesini yeni HTTPS adresine güncelleyin.
