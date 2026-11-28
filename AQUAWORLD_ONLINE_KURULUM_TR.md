# OCTOPUS AquaWorld — Firebase çevrim içi kurulumu

AquaWorld, HakoSupport'un mevcut Firebase projesini kullanır: `hakosupport-5cd3f`.

## Tek seferlik sunucu dağıtımı

PowerShell'de yerel **HakoSupport** klasörüne geç ve şu komutu çalıştır:

```powershell
firebase deploy --only functions,firestore:rules --project hakosupport-5cd3f
```

Bu dağıtım:
- `submitAquaWorldError` Cloud Function'ını yayımlar.
- AquaWorld oyuncu profili ve özel bulut kayıtları için Firestore kurallarını yayımlar.
- HakoSupport yönetici panelindeki AquaWorld hata raporu listesini etkinleştirir.

Dağıtım sırasında Firebase eksik bir secret isterse, mevcut HakoSupport kurulumunda kullanılan `NVIDIA_API_KEY` ve `SUPPORT_HANDOFF_SECRET` değerlerini yalnızca yerel terminalde gir. Bu değerleri sohbetlere, GitHub kaynak koduna veya istemci dosyalarına koyma.

## Firebase Console kontrolü

1. Authentication → Sign-in method bölümünde Email/Password açık olmalı.
2. Authentication → Settings → Authorized domains listesinde `alimiranerr-arch.github.io` bulunmalı.
3. AquaWorld ve HakoSupport aynı Firebase projesinde kalmalı.

## Güvenlik notu

AquaWorld özel oyun kaydını `aquaPrivate/{uid}` altında yalnızca hesap sahibine açar. Genel oyuncu kartları `aquaPlayers/{uid}` içindedir. Şu anki istemci tabanlı ekonomi, ileri seviye hile önleme ve sunucu taraflı coin doğrulaması içermez; gerçek para/ödül, oyuncular arası takas veya rekabetçi sıralama açılmadan önce ekonomi işlemleri Cloud Functions'a taşınmalıdır.
