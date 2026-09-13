# Günün özeti: yerel kayıt, onayla yayın

Google Gemini (`gemini-3.1-flash-tts-preview`) sesi üretir. Tam kayıtların ses
dosyaları bu bilgisayardaki `ses-kayitlari/` klasöründe, kayıt listesi ve metinleri
`data/speech.db` SQLite veritabanında saklanır. İkisi de Git dışında tutulur.
`SPEECH_DIR` ve `SPEECH_DB_PATH` ile konumları değiştirilebilir.

## Kullanım

1. Yerel `.env.local` dosyasında sunucuya özel `GEMINI_API_KEY` tanımlayın.
2. Yerel yönetim panelinde Günün özeti ekranından bir gün açın. Türkçe ve İngilizce metinler aynı pencerede birlikte görünür. Okunacak metinler o gün yayımlanan haberlerden doğrudan hazırlanır; tarihli giriş ve kapanış otomatik eklenir. Yerel modelle yeniden yazma adımı yoktur. Metinleri elle değiştirebilirsiniz. Sıfırlama ve kopyalama iki metne birlikte uygulanır.
3. Haberler arasında Sıcak ton geçiş sesi otomatik eklenir. Her haber ayrı paragrafta, aralarında boş satır olacak şekilde yazılmalıdır. Karşılama ve kapanış ayrı paragraflarda tutulur. Geçiş sesi yerelde eklenir, ayrıca Google isteği yapılmaz.
4. Her iki dilde Kore sesi ve Sıcak ton geçişi sabittir; modalde ses ayarı gösterilmez.
5. “İki dilde kayıt oluştur” Türkçe ve İngilizce WAV dosyalarını sırayla üretir ve kayıt bilgilerini yalnızca yerelde saklar. Bir dil başarısız olursa “Eksik kaydı tamamla” aynı metin ve ayarlarla başarılı kaydı tekrar üretmez.
   Sonraki ziyaretlerde aynı listeden dinleyebilir, indirebilir veya silebilirsiniz.
6. Yalnızca “İki kaydı yayınla” düğmesi her dilin en son yerel kaydını web sitesine yükler.
   Yayınlama başarısız olsa da yerel kayıt korunur. Yerel kopyayı silmek,
   yayındaki kopyayı silmez; “Yayından kaldır” ayrı bir işlemdir.

Metin ses üretimi için Google'a gönderilir. Supabase'de taslak tablosu, taslak bucket'ı veya üretim kilidi gerekmez;
üretim kilidi yerel SQLite veritabanındadır. Yerel kayıtlara erişen işlemler ve
dinleme/indirme yolu yönetici yetkisini denetler. Taslak aracı production
ortamında kapalıdır; yayındaki sesler ziyaretçilere sunulmaya devam eder.

## Web sitesine yayın hazırlığı

`20260912120000_daily_summary_audio.sql` yalnızca onaylanan yayınların tablosunu
ve herkese açık `daily-summary-audio` bucket'ını hazırlar. Bu uzak veritabanı
geçişi 13 Eylül 2026 tarihinde kullanıcı onayıyla dijitalmasallar projesine uygulandı.
Yerel kayıt oluşturmak için gerekmez. Herhangi bir kayıt otomatik yayımlanmaz.

## Sınırlar ve doğrulama

Metin 40–6.000 karakterdir. Uzun metinler sırayla küçük parçalarda seslendirilir.
Çıktı 24 kHz mono WAV'dır. Üretim dört dakikada zaman aşımına uğrar ve otomatik
tekrar denenmez. Aynı anda tek ses işlemi yapılır. Önceki yerel MP3 kayıtları
korunur; yeni veritabanı alanları mevcut kayıtlar silinmeden eklenir.

`npm test`, Gemini isteklerini taklit yanıtlarla, yerel kayıtların kalıcılığını,
dil ayrımını, üretim kilidini ve ses dosyalarının aralıklı indirilmesini sınar.

## Podcast introsu

Kullanıcının sağladığı `intro.MP3` (yaklaşık 5,25 saniye), `assets/audio/podcast-intro.pcm`
içinde 24 kHz mono PCM olarak bulunur. Yeni Türkçe ve İngilizce kayıtların başına bir kez
eklenir; ardından 0,25 saniye duraklama ve karşılama gelir. Üretim sırasında FFmpeg gerekmez.
Aynı müzik kapanış cümlesinin altında yüzde 18 seviyede, yumuşak giriş ve çıkışla tekrar çalar. Tahmini ve gerçek kayıt süreleri introyu içerir. Önceden oluşturulan kayıtlar değiştirilmez.
