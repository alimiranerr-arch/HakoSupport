# Hako Helpy Worker

Bu Worker yalnızca HakoSupport'un geçici, giriş gerektirmeyen Helpy demosunu NVIDIA API'ye bağlar. Firebase Functions/Secret Manager gerektirmez.

## Cloudflare ayarları

1. Worker adı: `hako-helpy-server`
2. Secret ekle: `NVIDIA_API_KEY` (NVIDIA anahtarını yalnızca Cloudflare Secret alanına gir).
3. KV namespace oluştur ve Worker'a `HELPY_KV` adıyla binding olarak bağla.
4. Bu klasörü Worker projesi olarak deploy et.

Worker endpoint'i: `https://hako-helpy-server.alimiranerr.workers.dev/ask`

KV binding olmadan Worker istekleri 503 döndürür. Demo bitişi kodda 26 Kasım 2026 00:31:09 (Türkiye saati) olarak sabittir. KV sayacı sınırlandırma içindir; Cloudflare KV eşzamanlı işlemlerde kesin atomiklik sağlamaz.
