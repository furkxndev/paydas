# Paydaş — Gizlilik Politikası ve KVKK Aydınlatma Metni

> **ŞABLON — YAYINDAN ÖNCE DOLDURULMALI VE HUKUKİ İNCELEMEDEN GEÇMELİDİR.**
> Köşeli parantezli alanlar veri sorumlusunun bilgileriyle değiştirilmelidir.
> Bu metin bir hukuki danışmanlık değildir; teknik gerçeklere dayanan bir taslaktır.

**Son güncelleme:** [GG.AA.YYYY]
**Veri sorumlusu:** [Şirket/Şahıs adı], [adres], [e-posta], [Mersis/VKN]

## 1. Hangi verileri işliyoruz

Uygulamanın gerçekte topladığı veriler şunlardır:

| Veri | Nerede toplanır | Neden |
|---|---|---|
| Ad soyad | Kayıt | Ev arkadaşlarının sizi tanıması |
| E-posta adresi | Kayıt | Hesap kimliği, şifre sıfırlama |
| Şifre | Kayıt | Yalnızca **bcrypt özeti** saklanır; açık metin tutulmaz |
| Telefon (isteğe bağlı) | Profil | Ev arkadaşlarının size ulaşması |
| Ev bilgileri (ad, adres, davet kodu) | Ev oluşturma | Ortak alanın tanımlanması |
| Gider, fatura, ev işi kayıtları | Uygulama kullanımı | Uygulamanın temel işlevi |
| Bildirim cihaz kimliği (Expo push token) | Bildirim izni verilirse | Fatura ve görev hatırlatmaları |
| Son giriş tarihi | Otomatik | Hesap güvenliği ve yönetim paneli |

**Toplamadıklarımız:** konum, rehber, fotoğraf galerisi, reklam kimliği, kullanım analitiği.

## 2. Verileri kimlerle paylaşıyoruz

- **Aynı evdeki üyeler:** girdiğiniz gider, fatura ve görev kayıtları ile ad-soyadınız,
  yalnızca üyesi olduğunuz evlerin diğer üyelerine görünür.
- **Platform yöneticisi:** hesap bilgilerinizi (ad, e-posta, kayıt tarihi, kullanım
  istatistikleri) yönetim paneli üzerinden görebilir. Gider ve fatura **içeriklerinize**
  erişemez.
- **Expo (bildirim altyapısı):** bildirim izni verdiyseniz cihaz kimliğiniz ve bildirim
  metni Expo sunucularından geçer.
- **[Barındırma sağlayıcısı]:** verileriniz [bölge/ülke] konumundaki sunucularda saklanır.

Verileriniz reklam amacıyla üçüncü taraflara **satılmaz veya aktarılmaz**.

## 3. Saklama süresi

Veriler hesabınız aktif olduğu sürece saklanır. Hesabınızı sildiğinizde:

- hesabınız, profil bilgileriniz ve bildirim kayıtlarınız **kalıcı olarak** silinir,
- kurduğunuz evler ve o evlere ait tüm gider/fatura/görev kayıtları silinir,
- katıldığınız diğer evlerdeki geçmiş kayıtlar, diğer üyelerin hesap bütünlüğü için korunur.

Süresi dolan oturum ve doğrulama kayıtları her gece otomatik temizlenir.

## 4. KVKK kapsamındaki haklarınız

6698 sayılı KVKK'nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme,
bilgi talep etme, düzeltilmesini veya silinmesini isteme ve işlemeye itiraz etme
haklarına sahipsiniz.

- **Düzeltme:** Profil → Profili düzenle
- **Silme:** Profil → Hesabı sil (uygulama içinde, aracısız)
- **Diğer talepler:** [e-posta adresi]

## 5. Güvenlik

- Şifreler bcrypt ile özetlenerek saklanır, hiçbir yerde açık metin tutulmaz.
- Oturum jetonları (refresh token) veritabanında yalnızca SHA-256 özeti olarak tutulur;
  çıkışta ve şifre değişiminde iptal edilir.
- Giriş ve şifre sıfırlama uçlarında kaba kuvvet saldırılarına karşı istek limiti vardır.
- Ev verilerine yalnızca o evin üyeleri erişebilir; erişim her istekte sunucuda doğrulanır.
- **[Yayın öncesi:] tüm trafik HTTPS üzerinden sunulmalıdır.**

## 6. Çocukların gizliliği

Uygulama 13 yaşın altındaki kullanıcılara yönelik değildir.

## 7. Değişiklikler

Bu politikada yapılan önemli değişiklikler uygulama içinde duyurulur.

## 8. İletişim

[e-posta adresi] · [adres]
