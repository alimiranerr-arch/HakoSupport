# Hako Helpy Worker

Bu Worker yalnızca HakoSupport'un geçici, giriş gerektirmeyen Helpy demosunu NVIDIA API'ye bağlar. Firebase Functions Secret Manager kullanmaz; NVIDIA anahtarı Cloudflare Worker Secret olarak tutulur.

## Cloudflare kurulumu

1. Cloudflare Dashboard > **Workers & Pages** > **Create** > **Import a repository** yolunu aç.
2. GitHub'dan `alimiranerr-arch/HakoSupport` deposunu seç.
3. Root directory / çalışma dizinini `cloudflare-helpy` yap.
4. Worker adını `hako-helpy-server` seç. Build/deploy komutu olarak `npx wrangler deploy` kullan.
5. Worker > **Settings > Variables and Secrets** bölümünde `NVIDIA_API_KEY` adında **Secret** ekle. NVIDIA anahtarını yalnızca bu gizli alana yapıştır.
6. Cloudflare > **Workers KV** bölümünde yeni bir namespace oluştur. Worker > **Settings > Bindings** bölümünde **KV namespace** binding ekle:
   - Variable name: `HELPY_KV`
   - KV namespace: az önce oluşturduğun namespace
7. Worker'ı yeniden deploy et.

Beklenen adres: `https://hako-helpy-server.alimiranerr.workers.dev/ask`. Hesabın workers.dev alt alan adı farklıysa `helpy.js` içindeki `HELPY_GUEST_ENDPOINT` adresini ona göre değiştir.

## Demo sınırları

- Yalnızca `https://alimiranerr-arch.github.io` origin'ine izin verilir.
- Kodda sabit bitiş: 26 Kasım 2026, 00:31:09 (Türkiye saati).
- IP başına 8 başarılı mesaj, genel toplamda 60 başarılı mesaj ve 5 saniye bekleme hedeflenir.
- KV eşzamanlı işlemlerde atomik sayaç sağlamaz; yoğun eşzamanlı isteklerde limitler yaklaşık uygulanır.
- KV binding veya NVIDIA secret eksikse Worker 503 döndürür.
