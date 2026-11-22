# HakoSupport canlı kurulum notları

HakoSupport'un `main` dalı GitHub Pages'e başarıyla dağıtılmıştır. Ancak kaynak depodaki `firebase-config.js` dosyası hâlâ `BURAYA_API_KEY`, `BURAYA_PROJECT_ID` gibi yer tutucular içeriyor. Bu nedenle Pages dağıtımının başarılı olması, Firebase uygulamasının hazır olduğu anlamına gelmez.

## Firebase web yapılandırması
Firebase Console > Project settings > Your apps bölümündeki HakoSupport web uygulaması yapılandırması `firebase-config.js` dosyasına girilmelidir. Gerçek proje kimliği ve uygulama değerleri olmadan giriş, Firestore ve canlı destek çalışmaz.

## Helpy API anahtarı
API anahtarı sohbet mesajına, HTML/JavaScript dosyalarına veya Git deposuna yazılmamalıdır. HakoSupport Firebase projesinde Functions Secret Manager'a güvenli biçimde eklenmelidir:

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

Komutun istediği gizli anahtar terminale girilir. Ardından HakoSupport projesi seçilerek:

```bash
firebase deploy --only functions
```

Helpy fonksiyonu `OPENAI_API_KEY` secret'ını sunucu tarafında okur. Secret tanımlanmadan `askHelpy` canlı AI yanıtı veremez.

## HakoSupport / Helpy animasyonları
`helpy.js` içinde idle, asking, thinking, confused, noting, bored, surprised, happy ve dreaming durumları tanımlıdır. Bunlar animasyonlu GIF dosyalarına bağlanır; kullanıcı yazarken, yanıt beklerken, yanıt geldiğinde ve hata oluştuğunda ruh hâli değiştirilir.
