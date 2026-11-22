HAKO DESTEK MERKEZİ — KURULUM (LOGOSUZ / OTOMATİK ANA YÖNETİCİ)

Bu destek sitesi ayrı bir Firebase projesi kullanır; ancak kullanıcı kimliği Matematik Macerası ana sitesindeki doğrulanmış hesaptan güvenli bir imzalı bağlantıyla kontrol edilir.

1) GITHUB PAGES
- Kod deposu: https://github.com/alimiranerr-arch/HakoSupport
- GitHub Pages için Settings > Pages > Deploy from a branch > main / root seç.
- Site adresi: https://alimiranerr-arch.github.io/HakoSupport/

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

5) ANA SİTE HESABIYLA GÜVENLİ BAĞLANTI
- Ana site ve HakoSupport ayrı Firebase projeleri olarak kalır.
- Ana sitede oturum açmış kullanıcıya “Hako Destek” düğmesi gösterilir. Düğme ana Cloud Function üzerinden 5 dakikalık, tek kullanımlık imzalı doğrulama bileti oluşturur.
- Bilet HakoSupport tarafında doğrulanır; aynı e-posta adresiyle ayrı destek hesabı açılmasına izin verir. Ana site şifresi hiçbir zaman destek sitesine gönderilmez.
- Kullanıcı HakoSupport için ayrı bir şifre belirler. Ana hesap doğrulandıktan sonra destek hesabına ayrıca e-posta doğrulama bağlantısı gönderilir; yönetici onayı da gerekir.
- İmzalama sırrı iki Firebase projesinde de aynı olmalıdır. Her iki projede de `firebase functions:secrets:set SUPPORT_HANDOFF_SECRET` komutunu çalıştırıp aynı uzun, rastgele değeri gir. Bu değeri GitHub'a veya HTML/JS dosyalarına yazma.
- Ana site Firebase projesi: hakomatonline261. Ana Firebase Web API key mevcut kodda boş olduğundan Firebase Console > Project settings > Your apps içinden gerçek Web API key eklenmelidir.
- HakoSupport için ayrı bir Firebase projesi oluştur ve firebase-config.js içindeki web config alanlarını doldur. Authentication Email/Password ve Firestore etkin olmalı.
- İki projede de Functions dağıtımı, Firestore kuralları ve secret tanımları tamamlanmadan canlı bağlantı çalışmaz.
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


## Hako Storage Network bağlantısı
1. Firebase Console'da HakoSupport için ayrı bir proje oluştur.
2. Authentication > Email/Password ve Google sign-in yöntemlerini etkinleştir.
3. Firestore Database oluştur.
4. Project settings > Your apps > Web app bölümünden gerçek web config'i alıp `firebase-config.js` içindeki placeholder'ları doldur. Bu config'deki Web API key public client config'tir; Service Account private key değildir.
5. `media-config.js` içindeki Worker URL'ini Cloudflare Worker dağıtıldıktan sonra doldur.
6. Worker `FIREBASE_PROJECT_IDS` değişkenine hem `hakomatonline261` hem HakoSupport project ID'yi ekle; `MAIN_FIREBASE_PROJECT_ID` ana proje olarak kalmalı.
7. Worker `ALLOWED_ORIGINS` içinde GitHub Pages origin'ini tut. HakoSupport ayrı path olsa da aynı GitHub Pages origin'ini kullanır.
8. Cloudflare Worker Secrets olarak `GITHUB_TOKEN` ve `MEDIA_SIGNING_SECRET` ekle. Bu değerleri sohbete veya repoya koyma.
9. Test onayı verilmeden test, deploy veya PR merge yapma.

HakoSupport projesi açılmadan ve config değerleri eklenmeden uygulama canlı kullanıma hazır değildir.


HATA / GÜVENLİK AÇIĞI BİLDİRİMİ VE ALTIN ÖDÜLÜ
- Kullanıcılar onaylı ve ana Matematik Macerası hesabına bağlanmış HakoSupport hesaplarıyla bugReports koleksiyonuna sunucu callable üzerinden bildirim gönderir.
- Bildirimler varsayılan olarak review durumundadır; kullanıcı önem seviyesini veya ödülü belirleyemez.
- Yalnızca doğrulanmış Hako yöneticisi 1 Ciddi açık / 2 Normal açık / 3 Risksiz açık sınıfını, altın miktarını (0-100.000) ve güvenli yayın özetini seçebilir.
- Yayın sırasında HakoSupport Functions, SUPPORT_HANDOFF_SECRET ile imzalı sunucu isteğini ana Matematik Macerası projesindeki grantSupportBugReward endpoint'ine gönderir.
- Ana site ödülü kendi Firestore kullanıcı belgesindeki coins alanına transaction ile ekler. supportBugRewardLedger/{reportId} aynı raporun ikinci kez ödüllendirilmesini engeller.
- Aynı uzun ve rastgele SUPPORT_HANDOFF_SECRET değeri iki Firebase projesinde de Functions Secret olarak tanımlanmalıdır. Değeri sohbete, GitHub dosyalarına veya istemci koduna koyma.
- Ana site Functions secret'ı zaten SUPPORT_HANDOFF_SECRET adını kullanır. HakoSupport projesinde de aynı adla tanımla.
- Kritik açıkların istismar adımları ve hassas ayrıntıları herkese açık özete yazılmamalıdır; yalnızca düzeltilmiş/güvenli özet yayınlanır.
- Canlıya alma için HakoSupport Firebase projesinin oluşturulması, iki projede secret tanımı ve Functions/Firestore rules dağıtımı gerekir. Firebase Functions dağıtımı plan/billing koşullarına tabi olabilir; ücretli yükseltme onayı olmadan dağıtım yapma.
