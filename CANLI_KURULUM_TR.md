# HakoSupport canlı kurulum notları

## Firebase web yapılandırması
HakoSupport web uygulamasının Firebase yapılandırması `firebase-config.js` dosyasında tutulur. Bu dosyadaki web API anahtarı istemci tarafı yapılandırmanın parçasıdır; sunucu gizli anahtarlarını buraya ekleme.

## Helpy API anahtarı
Helpy, NVIDIA API üzerinden `nvidia/nemotron-3.5-bolt-e4b` modelini kullanır. API anahtarı sohbet mesajına, HTML/JavaScript dosyalarına veya Git deposuna yazılmamalıdır. HakoSupport Firebase projesinde Functions Secret Manager'a `NVIDIA_API_KEY` adıyla eklenmelidir:

```bash
firebase use hakosupport-5cd3f
firebase functions:secrets:set NVIDIA_API_KEY
```

Komutun istediği NVIDIA API anahtarını terminale gir. Ardından:

```bash
firebase deploy --only functions --project hakosupport-5cd3f
```

Dağıtım için Firebase CLI kurulu olmalı ve Firebase hesabının `hakosupport-5cd3f` projesinde gerekli yetkileri bulunmalı. `askHelpy` fonksiyonu `NVIDIA_API_KEY` secret'ını sunucu tarafında okur; secret tanımlanmadan Helpy yapay zekâ yanıtı veremez.

## Misafir demo
Misafir demo erişimi hem `helpy.js` arayüzünde hem de `functions/index.js` içindeki `askHelpy` fonksiyonunda zaman sınırıyla korunur. Arayüzün görünmesi için GitHub Pages güncellemesinin yayınlanması, mesajlara yanıt alınması için Firebase Functions dağıtımının tamamlanması gerekir.

## HakoSupport / Helpy animasyonları
`helpy.js` içinde idle, asking, thinking, confused, noting, bored, surprised, happy ve dreaming durumları tanımlıdır. Bunlar animasyonlu GIF dosyalarına bağlanır; kullanıcı yazarken, yanıt beklerken, yanıt geldiğinde ve hata oluştuğunda ruh hâli değiştirilir.
