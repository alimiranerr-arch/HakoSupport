HAKO DESTEK MERKEZİ — KURULUM (LOGOSUZ / OTOMATİK ANA YÖNETİCİ)

Bu destek sitesi Matematik Macerası ana sitesinden BAĞIMSIZDIR. Ana siteye Firebase kurulu olması gerekmez. Destek için ayrı Firebase projesi oluşturacağız.

1) GITHUB PAGES
- GitHub'da HakoDestek adlı yeni bir depo oluştur.
- ZIP içindeki dosyaları deponun kök dizinine yükle.
- Settings > Pages > Deploy from a branch > main / root seç.
- GitHub Pages adresini not et: https://KULLANICI.github.io/HakoDestek/

2) DESTEK SİTESİ İÇİN FIREBASE (ANA SİTENİN FIREBASE'İ DEĞİL)
- https://console.firebase.google.com/ adresine gir ve Add project / Proje ekle seç.
- Proje adı örneğin: hako-destek. Bu proje yalnızca destek sitesi için olacak.
- Authentication > Get started > Sign-in method > Email/Password etkinleştir.
- Authentication > Settings > Authorized domains bölümüne GitHub Pages alan adını ekle (ör. KULLANICI.github.io).
- Firestore Database > Create database ile veritabanı oluştur.
- Project settings > General > Your apps > Web app (</>) ekle.
- Firebase'in verdiği apiKey, authDomain, projectId, storageBucket, messagingSenderId ve appId değerlerini firebase-config.js içine yerleştir.
- Firestore > Rules bölümüne firestore.rules dosyasının tamamını yapıştır ve Publish'e bas.

3) ANA YÖNETİCİ HESABI — OTOMATİK
- Sitede Hesap oluştur bölümünden TAM OLARAK alimiranerr@gmail.com adresiyle destek hesabı oluştur.
- Bu Gmail gelen kutusuna gelen Firebase doğrulama bağlantısına tıkla.
- Ardından siteye aynı e-posta ve şifreyle giriş yap.
- E-posta doğrulanmışsa yönetici paneli otomatik açılır. Ekstra Admin SDK / özel claim komutu gerekmez.
- Sadece e-posta yazmak yeterli değildir: güvenlik için bu e-postaya sahip hesabın şifresiyle giriş yapılmalı ve Gmail doğrulanmalıdır. E-posta adresini bilen herkesin admin olmasına izin vermiyoruz.
- Bu e-posta adresi Firestore güvenlik kurallarında da kontrol edilir. Yönetici yetkisi tarayıcıdaki görsel bir ayardan ibaret değildir.

4) KULLANICI KAYDI VE ONAY
- Kullanıcı Hesap oluştur ekranında destek almak istediği siteyi seçer. İlk seçenek MatematikSİTE'dir.
- Kullanıcı kendi e-postası ve destek hesabı şifresiyle kayıt olur; doğrulama e-postasını onaylaması gerekir.
- Ardından başvurusu yönetici paneline düşer. Sen onaylayınca destek alanına erişebilir.
- Yönetici panelinden yeni site ekleyebilir veya eklenen siteleri devre dışı bırakabilirsin.
- Şifreler Firebase Authentication tarafından korunur; yönetici kullanıcı şifrelerini göremez.

5) ANA SİTEYLE BAĞLANTI KONUSU
- Şu an ana Matematik Macerası sitesinde Firebase kurulu olmadığı için ona bağlanacak bir Firebase projesi/kimliği yok.
- Zaten bağımsız destek sitesi için ana site Firebase'i şart değil. Önce yukarıdaki ayrı hako-destek Firebase projesini kur.
- İleride ana siteye Firebase eklediğinde iki siteyi aynı Firebase projesine bağlamak teknik olarak mümkün; fakat bağımsız kalması ve kullanıcı verilerinin karışmaması için şimdilik ayrı proje önerilir.
- Ana sitedeki mevcut kullanıcıların destek sitesine otomatik giriş yapması istenirse bu ayrıca güvenli kimlik doğrulama entegrasyonu gerektirir; bu sürümde destek hesabı ayrıdır.

6) GMAIL'DEN E-POSTA
- Admin panelindeki “E-posta yanıtı hazırla” düğmesi e-posta uygulamasında taslak açar; otomatik gönderim henüz aktif değildir.
- Otomatik gönderim için Firebase Trigger Email uzantısı ve güvenli Cloud Function kurulumu gerekir.
- Normal Gmail şifreni veya uygulama şifreni HTML/JS dosyalarına kesinlikle yazma.

7) CANLI SOHBET
- Kullanıcı sohbet başlatır; yönetici panelindeki Canlı sohbetler listesinden seçip yanıtlar.
- Firestore indeks uyarısı çıkarsa Firebase Console'un verdiği indeks oluşturma bağlantısını aç.

GÜVENLİK
- Ana site şifresi istenmez; destek hesabı ayrıdır.
- Yönetici şifresi dahil hiçbir kullanıcının şifresi yönetici panelinde görünmez.
- Firebase web apiKey tarayıcıda bulunabilir; service account anahtarı, özel anahtar ve Gmail uygulama şifresi GitHub'a yüklenmez.
- Gerçek kullanıcı verisi toplamadan önce gizlilik/iletişim metni ekle ve Firestore kurallarını test et.


8) HELPY — ANİMASYONLU TEKNİK DESTEK ASİSTANI
- Helpy arayüzü yalnızca giriş yapmış ve destek hesabı onaylanmış kullanıcılara görünür.
- Helpy'nin 9 animasyon pozu MalzemeSevkiyatDeposuHAKO deposundan ham GitHub içerik bağlantılarıyla yüklenir. GIF dosyaları HakoSupport deposuna kopyalanmaz; kaynak depo değişirse animasyonlar da etkilenebilir.
- Helpy yalnızca Matematik Macerası / HakoSupport teknik destek kapsamına sınırlandırılmıştır.
- Yanıtlar, Firestore'daki aktif errorCodes kayıtlarıyla desteklenir. Bilinmeyen hata kodlarında tahmin üretmemesi ve destek talebine yönlendirmesi istenir.
- OpenAI API anahtarı tarayıcıya konulmaz. Firebase Functions secret olarak tanımlanır:
  firebase functions:secrets:set OPENAI_API_KEY
  Ardından HakoSupport deposunun kökünde: firebase deploy --only functions
- Functions ilk dağıtımından önce Firebase projesinin doğru proje olarak seçildiğini doğrula. Ücretlendirme ve kullanım limitlerini Firebase/OpenAI panellerinden kontrol et.
- Helpy mesaj sınırı: kullanıcı başına günde 30 istek. Model: gpt-6.2-luna. Model ve sınır functions/index.js içinde ayarlanabilir.
- Bu sürümde Helpy'nin görsel arayüzü ve güvenli sunucu çağrısı hazırlanmıştır; OPENAI_API_KEY tanımlanıp Functions dağıtılmadan gerçek AI yanıtı vermez.

ÖNEMLİ ENTEGRASYON NOTU
- Mevcut kayıt akışı hâlâ ayrı SupportSites hesabı oluşturur ve kendi e-posta doğrulamasını yapar.
- Ana Matematik Macerası hesabının sunucu tarafında doğrulanması ve onaydan sonra destek e-postası gönderilmesi bu değişiklikte henüz uygulanmadı. Önceki kurulum bölümlerindeki "bağımsız destek hesabı" açıklamaları mevcut kodun durumunu anlatır; istenen nihai ana-hesap köprüsü değildir.
