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

Yetkilendirme mevcut `is_admin()` RPC’si ve tablo RLS kurallarıyla uygulanır. `SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucu tarafındaki modüllerde kullanılır; `NEXT_PUBLIC_` öneki verilmez ve tarayıcı paketine girmez. Depodaki `diji_` önekli migration, ileride tamamen bağımsız bir Supabase projesine ayrılmak istenirse başlangıç referansı olarak tutulur; paylaşılan production projesine uygulanmamalıdır.

## Ortam değişkenleri

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL="diji.news <bulten@dijitalmasallar.com>"
```

`RESEND_API_KEY` yerine mevcut projedeki `MAIL_KEY` de kullanılabilir. Vercel Preview ortamının production verisini değiştirmemesi için Preview’a ayrı bir staging Supabase projesinin URL/key değerlerini verin.

## Auth callback adresleri

Supabase Authentication → URL Configuration bölümünde Site URL ve Redirect URLs alanlarına ortamlarınızı ekleyin:

```text
http://localhost:3000/auth/callback
https://your-preview.vercel.app/auth/callback
https://your-domain.com/auth/callback
```

Uygulama e-posta doğrulama ve şifre yenileme dönüşlerinde `/auth/callback` Route Handler’ını kullanır. Uygulama dışına yönlendiren `next` değerleri reddedilir.

## Kalite kontrolleri

```bash
npm run lint
npm run typecheck
npm run build
```

## Vercel’e bağlama

1. Bu repository’yi Vercel’de **New Project** ile bağlayın veya mevcut bağlantıda `vercel link` kullanın.
2. Preview ve Production ortam değişkenlerini ayrı ayrı ekleyin.
3. Preview oluşturun: `vercel deploy`.
4. Preview’da giriş, kayıt, callback, yazı ekleme, bülten onayı ve RLS akışlarını kontrol edin.
5. Kullanıcının açık onayından sonra production’a alın: `vercel deploy --prod`.

Özel domain için Vercel Project Settings → Domains alanından domaini ekleyin, DNS kayıtlarını doğrulayın ve `NEXT_PUBLIC_APP_URL` ile Supabase callback listesini yeni HTTPS adresine güncelleyin.
