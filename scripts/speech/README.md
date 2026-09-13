# Yerel ses üretimi

Günün özeti ekranında **Ollama ile düzenle**, düzenlenebilir konuşma metni,
**Kaydı oluştur** ayrı adımlardır. Oluşturma, ekrandaki
metni tekrar yazdırmadan okur.

- Ollama varsayılanı: `gemma3:12b`; `OLLAMA_MODEL` ile değiştirilebilir.
- Mevcut ses: Türkçede Piper (yoksa macOS Yelda), İngilizcede macOS Samantha.
- Deneysel seçenek: Apple Silicon üzerinde Chatterbox Multilingual v3 / MLX.
  Türkçe okunuş sözlüğü bu motora uygulanmaz. Çok dilli destek, her yabancı
  adın doğru okunacağı garantisi değildir; yayımlamadan önce kaydı dinleyin.

## Chatterbox kurulumu

`site` dizininde, Apple Silicon Mac ve Python 3.13 ile:

```sh
python3 -m venv data/chatterbox-venv
data/chatterbox-venv/bin/pip install -r scripts/speech/requirements.txt
HF_HOME="$PWD/data/chatterbox-cache" data/chatterbox-venv/bin/python -c 'from huggingface_hub import snapshot_download; snapshot_download("mlx-community/chatterbox-multilingual-v3", allow_patterns=["*.json", "*.safetensors"]); snapshot_download("mlx-community/S3TokenizerV2", allow_patterns=["config.json", "model.safetensors"])'
```

Model birkaç GB alan kullanır. Sanal ortam ve model önbelleği `data/` altında,
Git dışında kalır. Üretim sırasında model çevrimdışı yüklenir; metin buluta
gönderilmez. İlk kurulum için internet gerekir. MP3 dönüştürme için `ffmpeg`
ve ses referansı için mevcut Piper veya macOS sesi gereklidir.

Chatterbox için kişi kaydı kullanılmaz; kısa, sabit bir metinden mevcut sesle
sentetik referans üretilir. Böylece karşılaştırmaya bir kişinin sesini klonlamadan
başlanır. Uzun metinler cümle/kelime sınırlarında bölünür; aralarına kısa durak
eklenir. Tek seferde bir ses üretimi çalışır. On dakikada bitmeyen üretim durdurulur.

Kaydedilen MP3'ler `ses-kayitlari/` dizininde, kayıt bilgileri `data/speech.db`
içindedir. **Yayınla** ayrı bir işlemdir. Bu yerel araç üretim sitesinde kapalıdır.

Model: https://huggingface.co/mlx-community/chatterbox-multilingual-v3
Uygulama: https://github.com/Blaizzy/mlx-audio
# Eski yerel ses denemeleri

Yönetim paneli artık Gemini 3.1 Flash TTS kullanır. Bu dizin önceki yerel
denemeler için korunmuştur. Güncel kurulum: [Gemini sesi](../../docs/gemini-speech.md).
