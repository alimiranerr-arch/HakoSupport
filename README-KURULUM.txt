HAKO DESTEK MERKEZİ — GÜNCEL KURULUM

Bu paket ana Matematik Macerası sitesinden BAĞIMSIZDIR. Ayrı Firebase projesi kullanın.

1) GITHUB PAGES
- GitHub'da HakoDestek adlı yeni bir depo oluşturun.
- ZIP içindeki dosyaları deponun kök dizinine yükleyin.
- Settings > Pages > Deploy from a branch > main / root seçin.

2) FIREBASE PROJESİ
- Firebase Console'da yalnızca destek sitesi için ayrı proje oluşturun.
- Authentication > Sign-in method > Email/Password sağlayıcısını açın.
- Authentication > Settings > Authorized domains bölümüne GitHub Pages alan adınızı ekleyin.
- Firestore Database oluşturun.
- Project settings > General > Your apps > Web app oluşturun.
- Firebase web yapılandırmasını firebase-config.js dosyasına girin.
- Firestore > Rules bölümüne firestore.rules içeriğini yapıştırıp Publish'e basın.

3) SENİ ANA YÖNETİCİ YAPMA (BİR KERELİK GÜVENLİ KURULUM)
- Site üzerinden önce alimiranerr@gmail.com adresinle destek hesabı oluştur.
- Firebase Admin SDK'yı kendi bilgisayarında güvenli bir klasörde kur ve Firebase projesinin service account kimlik bilgilerini güvenli biçimde ayarla.
- Aşağıdaki kodu yalnızca kendi bilgisayarında çalıştır. Service account JSON dosyasını ZIP'e veya GitHub'a ASLA koyma:

  const admin = require('firebase-admin');
  admin.initializeApp();
  async function makeOwner() {
    const user = await admin.auth().getUserByEmail('alimiranerr@gmail.com');
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log('Ana yönetici yetkisi verildi.');
  }
  makeOwner().catch(console.error);

- Bu işlem tamamlanınca destek sitesinden çıkış yapıp tekrar giriş yap. Admin paneli açılır.
- Yönetici yetkisi e-posta adresiyle tarayıcıda taklit edilmez; Firebase Custom Claims ile güvenli biçimde atanır.

4) KULLANICI ONAYI VE SİTE SEÇİMİ
- Kayıt ekranında kullanıcı destek sitesi seçer. İlk açılışta varsayılan tek seçenek MatematikSİTE'dir.
- Kullanıcı e-posta ve kendi destek hesabı şifresiyle kayıt olur. Şifre Firebase Authentication tarafından yönetilir; yönetici şifreyi göremez.
- Kayıt sonrası kullanıcı hesabı beklemede kalır. Ana yönetici, Yönetici Paneli > Kullanıcı başvuruları bölümünden onaylayınca kullanıcı destek alanına erişebilir.
- Ana yönetici Site yönetimi bölümünden yeni site ekleyebilir veya eklenen siteleri devre dışı bırakabilir.
- İlk varsayılan MatematikSİTE kodda sabittir. Yeni siteler Firestore sites koleksiyonunda saklanır.

5) GMAIL E-POSTA
- Bu sürümde admin panelindeki e-posta yanıtı düğmesi kullanıcının e-posta uygulamasında taslak açar; otomatik gönderim henüz etkin değildir.
- Otomatik gönderim için Firebase Extensions içindeki Trigger Email ve güvenli Cloud Function akışı ayrıca kurulmalıdır.
- Gmail hesabında 2 Adımlı Doğrulama açıp Uygulama Şifresi kullanın. Normal Gmail şifresini siteye veya koda yazmayın.
- Service account anahtarını, Gmail uygulama şifresini ve özel anahtarları GitHub'a yüklemeyin.

6) CANLI SOHBET
- Kullanıcı sohbet başlatabilir ve yönetici panelindeki Canlı sohbetler listesinden sohbeti seçerek yanıtlayabilir.
- Firestore sorguları için Firebase bir indeks isterse konsoldaki oluşturma bağlantısını kullanın.

GÜVENLİK NOTLARI
- Bu site ana Matematik Macerası hesabıyla ortak giriş yapmaz; kullanıcı ayrı destek hesabı oluşturur.
- Kullanıcının şifresi hiçbir zaman destek talebine veya yönetici ekranına gönderilmez.
- Firebase kurallarını yayına almadan önce test edin. Gerçek kullanıcı verisi toplamadan önce gizlilik ve iletişim metni ekleyin.
- Firebase yapılandırmasındaki web API anahtarı gizli anahtar değildir; ancak service account anahtarı kesinlikle gizlidir.
