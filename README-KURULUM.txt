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
- Authentication > Settings > Authorized domains bölümüne GitHub Pages alan adını ekle.
- Firestore Database > Create database ile veritabanı oluştur.
- Project settings > General > Your apps > Web app ekle.
- Firebase'in verdiği web yapılandırmasını firebase-config.js içine yerleştir.
- Firestore > Rules bölümüne firestore.rules dosyasının tamamını yapıştır ve Publish'e bas.

3) ANA YÖNETİCİ HESABI
- Destek sitesinde alimiranerr@gmail.com adresiyle hesap oluştur.
- E-postayı doğrula ve aynı hesapla giriş yap.
- Yönetici paneli yalnızca bu doğrulanmış hesap için açılır.
- Yönetici e-postası ve parolası istemcide yönetici yetkisi oluşturmaz; Firestore/Functions kontrolleri de uygulanır.

4) KULLANICI KAYDI VE ONAY
- Kullanıcı destek almak istediği siteyi seçer.
- Kullanıcı kendi e-postası ve destek hesabı şifresiyle kayıt olur; doğrulama e-postasını onaylar.
- Başvurusu yönetici paneline düşer. Yönetici onayından sonra destek alanına erişebilir.
- Yönetici yeni site ekleyebilir veya mevcut siteleri devre dışı bırakabilir.
- Şifreler Firebase Authentication tarafından korunur; yönetici kullanıcı şifrelerini göremez.

5) ANA SİTEYLE KİMLİK BAĞLANTISI — HENÜZ TAMAMLANMADI
- Bu sürümde destek sitesi ayrı Firebase Authentication hesabı kullanır.
- Ana Matematik Macerası hesabının sunucu tarafında doğrulanması ve ana hesap onayından sonra destek doğrulama e-postası gönderilmesi henüz uygulanmamıştır.
- Bu köprü tamamlanmadan “ana site hesabıyla otomatik doğrulama” özelliği varmış gibi kabul edilmemelidir.

6) E-POSTA
- Admin panelindeki “E-posta yanıtı hazırla” düğmesi e-posta uygulamasında taslak açar; otomatik gönderim aktif değildir.
- Otomatik gönderim için güvenli bir sunucu e-posta entegrasyonu gerekir.
- Gmail şifresi veya uygulama şifresi HTML/JS dosyalarına yazılmaz.

7) CANLI SOHBET
- Kullanıcı sohbet başlatır; yönetici panelindeki Canlı sohbetler listesinden seçip yanıtlar.
- Firestore indeks uyarısı çıkarsa Firebase Console'un verdiği indeks oluşturma bağlantısını kullan.

8) HELPY — ANİMASYONLU TEKNİK DESTEK ASİSTANI
- Helpy arayüzü yalnızca giriş yapmış ve destek hesabı onaylanmış kullanıcılara görünür.
- 9 GIF pozu MalzemeSevkiyatDeposuHAKO deposundan ham GitHub bağlantılarıyla yüklenir.
- Helpy yalnızca Matematik Macerası / HakoSupport teknik desteği verir; konu dışı istekleri reddeder.
- Onaylı hata kodları Firestore errorCodes koleksiyonundan okunur. Bilinmeyen kodlarda çözüm uydurmaz, destek talebine yönlendirir.
- OpenAI API anahtarı tarayıcıya konulmaz. Firebase Functions secret olarak tanımlanır:
  firebase functions:secrets:set OPENAI_API_KEY
- Doğru Firebase projesini seçtiğini doğruladıktan sonra ve açık onayınla Functions dağıtılır.
- Model: gpt-6-luna (Responses API). API kullanımı OpenAI tarafından ayrıca ücretlendirilir.
- Günlük mesaj kotası yoktur. Yalnızca spamı önlemek için aynı hesapta iki istek arasında kısa bir bekleme uygulanır.
- Gerçek AI yanıtı için OPENAI_API_KEY, geçerli Firebase yapılandırması ve Functions dağıtımı gerekir.

GÜVENLİK
- Ana site şifresi istenmez; mevcut sürüm ayrı destek hesabı kullanır.
- Yönetici hiçbir kullanıcının şifresini göremez.
- Firebase web apiKey tarayıcı yapılandırmasıdır; service account anahtarı ve OpenAI API anahtarı gizli tutulur.
- Firestore kurallarını test etmeden gerçek kullanıcı verisiyle yayına çıkma.
