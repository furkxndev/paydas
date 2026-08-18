# Yayın Öncesi Kontrol Listesi

Kodla çözülen maddeler işaretlidir; kalanlar altyapı ve içerik kararları gerektirir.

## Tamamlandı

- [x] Veritabanı şeması **migration** ile yönetiliyor (`DB_SYNCHRONIZE=false`)
- [x] Giriş/kayıt/şifre sıfırlama uçlarında **istek limiti** (dakikada 10)
- [x] **Şifre sıfırlama** ve şifre değiştirme akışı
- [x] **E-posta doğrulama** altyapısı (`REQUIRE_EMAIL_VERIFICATION` ile zorunlu kılınabilir)
- [x] **Çıkış token'ı gerçekten iptal ediyor** — refresh token rotasyonu ve iptali
- [x] **Hesap silme** (uygulama içinde, KVKK / App Store zorunluluğu)
- [x] **Sağlık kontrolü ucu** (`GET /api/health`) — veritabanı bağlantısını doğrular
- [x] **ErrorBoundary** — beklenmeyen hatada beyaz ekran yerine anlaşılır ekran
- [x] Uygulama **ikonu ve splash** görselleri
- [x] **eas.json** — development / preview / production profilleri
- [x] Gizlilik politikası / KVKK taslağı
- [x] Sürüm kontrolü (git)

## Yayından önce yapılması gerekenler

### Altyapı
- [ ] **HTTPS**: API'yi TLS arkasına al (reverse proxy: Caddy/Nginx veya yönetilen platform)
- [ ] `CORS_ORIGINS` değerini `*` yerine gerçek alan adlarıyla sınırla
- [ ] Üretim `.env`: yeni ve güçlü `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DB_PASSWORD`
      (`openssl rand -base64 48`)
- [ ] **PostgreSQL yedekleme** planı (günlük otomatik yedek + geri yükleme provası)
- [ ] Hata izleme (Sentry vb.) ve log toplama
- [ ] `docker compose --profile full` yerine yönetilen bir ortam ya da orkestrasyon

### E-posta
- [ ] SMTP sağlayıcısı bağla (`SMTP_*` değişkenleri) — aksi halde şifre sıfırlama
      e-postaları yalnızca sunucu loguna yazılır
- [ ] SMTP çalıştıktan sonra `REQUIRE_EMAIL_VERIFICATION=true` yapmayı değerlendir

### Bildirimler
- [ ] EAS projesi oluştur, `EXPO_PUBLIC_EAS_PROJECT_ID` değerini doldur
- [ ] `eas build` ile development/production build al — **Expo Go uzak bildirim desteklemez**
- [ ] iOS için APNs, Android için FCM kimlik bilgilerini EAS'a tanımla

### Mağaza
- [ ] Gizlilik politikasını doldur ve genel erişime açık bir adreste yayınla
- [ ] App Store / Play Store listeleme metinleri ve ekran görüntüleri
- [ ] Apple: hesap silme akışının uygulama içinde olduğunu belirt (hazır)
- [ ] Play Store: Veri Güvenliği formu (yukarıdaki tabloya göre doldurulabilir)

### Kalite
- [ ] Kritik akışlar için otomatik test (kayıt, ev oluşturma, gider/borç hesabı)
- [ ] CI: her push'ta `typecheck` + `lint` + `build`
