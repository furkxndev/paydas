# Paydaş

Ev arkadaşlarının **ortak giderlerini, faturalarını ve ev işlerini** birlikte yönettiği
dijital ev asistanı.

```
Paydaş/
├── frontend/   # React Native + Expo (SDK 54) mobil uygulama
└── backend/    # NestJS + TypeScript + PostgreSQL + Docker API
```

## Çalıştırma

**Backend + veritabanı**

```bash
cd backend
npm install
cp .env.example .env      # şifre ve JWT anahtarlarını doldurun
npm run db:up             # PostgreSQL (Docker)
npm run start:dev         # http://localhost:3000/api
```

**Mobil uygulama**

```bash
cd frontend
npm install
npm start                 # Expo Go ile QR okutun
```

Uygulama varsayılan olarak **mock modda** açılır; backend olmadan da tam işlevlidir.
Gerçek API'ye bağlamak için `frontend/.env` oluşturun:

```
EXPO_PUBLIC_USE_MOCK_API=false
EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000/api
```

> Fiziksel cihazda `localhost` çalışmaz; bilgisayarınızın LAN IP'sini yazın.

## Kapsam

- Kullanıcı yönetimi (kayıt, giriş, profil, oturum kalıcılığı)
- Ev oluşturma, davet koduyla katılma, üye rolleri, çoklu ev
- Ortak gider ekleme; eşit / elle tutar / yüzde bölüşümü, kuruş güvenli dağıtım
- Otomatik borç hesabı ve **en az sayıda transfere indirgenmiş** "kim kime borçlu" listesi
- Elektrik, su, doğalgaz, internet, kira takibi; tekrarlayan faturalar; ödendiğinde
  otomatik ortak gider; son ödeme uyarıları
- Ev işleri: görev oluşturma, kişiye atama, öncelik, tekrar, tamamlama, katkı puanı
- Bildirimler: uygulama içi akış, cihazda planlanan yerel hatırlatmalar, Expo push altyapısı
- **Yönetim paneli** (mobil uygulama içinde, Profil → Yönetim): sistemdeki ilk kayıt
  otomatik yönetici olur; kullanıcı takibi, düzenleme, yetkilendirme, askıya alma, silme

## Yayın durumu

Uygulama uçtan uca çalışır ve doğrulanmıştır. Yayın öncesi kalan adımlar
(HTTPS, SMTP, EAS build, mağaza içerikleri, yedekleme) için
[docs/YAYIN-KONTROL-LISTESI.md](docs/YAYIN-KONTROL-LISTESI.md) dosyasına bakın.
Gizlilik/KVKK taslağı: [docs/GIZLILIK-POLITIKASI.md](docs/GIZLILIK-POLITIKASI.md).

## Ayrıntılar

- [frontend/README.md](frontend/README.md) — ekranlar, klasör yapısı, tasarım sistemi
- [backend/README.md](backend/README.md) — uçlar, mimari kararlar, veritabanı, Docker
