# Paydaş — API (Backend)

Ev arkadaşlarının ortak giderlerini, faturalarını ve ev işlerini yöneten
**dijital ev asistanı**nın sunucu tarafı. NestJS 11 + TypeScript + PostgreSQL 17 + Docker.

## Hızlı başlangıç

```bash
cd backend
npm install
cp .env.example .env      # değerleri doldurun (özellikle şifre ve JWT anahtarları)

npm run db:up             # PostgreSQL'i Docker ile başlat
npm run start:dev         # API'yi geliştirme modunda çalıştır
```

API `http://localhost:3000/api` adresinde açılır.

Tamamını (API + veritabanı) Docker ile çalıştırmak için:

```bash
docker compose --profile full up -d
```

> **Port notu:** Makinenizde PostgreSQL kuruluysa (ör. Postgres.app) 5432 doludur.
> `.env` içindeki `DB_PORT` hem Docker yayın portunu hem API'nin bağlanacağı portu
> belirler; varsayılan **5433** olarak bırakıldı.

## Ortam değişkenleri

Tüm gizli bilgiler `.env` üzerinden gelir; kodda sabit değer yoktur.
`.env` sürüm kontrolüne dahil değildir. Şablon için `.env.example`.

Uygulama açılırken değişkenler doğrulanır (`src/config/env.validation.ts`); eksik ya da
32 karakterden kısa bir JWT anahtarıyla başlamaz. Anahtar üretmek için:

```bash
openssl rand -base64 48
```

## Mimari

```
src/
├── auth/            # Kayıt, giriş, JWT stratejisi, guard'lar, @Public/@CurrentUser
├── users/           # Kullanıcı varlığı ve profil
├── households/      # Ev, üyelik, davet kodu + ana ekran özeti
├── expenses/        # Ortak giderler ve pay dağıtımı
├── balances/        # Net bakiye, borç sadeleştirme, ödeme kaydı
├── bills/           # Fatura takibi, ödeme, tekrarlayan dönem
├── chores/          # Ev işleri, atama, tekrar, tamamlama
├── notifications/   # Bildirim akışı, tercihler, Expo push token/gönderim
├── reminders/       # Saatlik zamanlanmış hatırlatma görevi
├── admin/           # Platform yöneticisi uçları
├── common/          # Enum'lar, para/tarih/bakiye yardımcıları, hata filtresi
└── config/          # Ortam yapılandırması, doğrulama, TypeORM ayarları
```

### Öne çıkan kararlar

- **Tüm uçlar varsayılan olarak korumalı.** `JwtAuthGuard` global guard olarak bağlanır;
  yalnızca `@Public()` ile işaretlenen kayıt/giriş uçları muaftır.
- **İki ayrı rol sistemi.** `PlatformRole` (`admin`/`user`) uygulama genelindeki yetkiyi,
  `MemberRole` (`owner`/`admin`/`member`) ev içindeki yetkiyi tanımlar.
  **Sistemdeki ilk kayıt otomatik olarak platform yöneticisi olur.**
- **Yetki kontrolü servis katmanında.** `HouseholdsService.requireMembership` /
  `requireAdmin`, ev verisine erişen her işlemin başında çağrılır; başka bir evin
  verisine erişim 403 döner.
- **Borç sadeleştirme.** `common/utils/balance.util.ts` net bakiyeleri hesaplayıp açgözlü
  minimum nakit akışı algoritmasıyla en az sayıda transfere indirger.
- **Kuruş güvenliği.** `splitEvenly` bölüşümde oluşan kuruş artıklarını dağıtır; payların
  toplamı her zaman gider tutarına eşittir. Para alanları `numeric(12,2)` olarak saklanır.
- **Şifreler bcrypt ile saklanır**, `passwordHash` alanı `@Exclude()` ile yanıtlardan çıkarılır.
- **Oturum jetonları iptal edilebilir.** Refresh token'ların yalnızca SHA-256 özeti
  saklanır; çıkışta iptal edilir, yenilemede rotasyona uğrar, şifre değişiminde
  kullanıcının tüm oturumları kapatılır. Her token benzersiz bir `jti` taşır.
- **Kaba kuvvet koruması.** Global istek limiti (dakikada 120), kimlik uçlarında
  daha sıkı limit (dakikada 10).
- **Hata biçimi tek tip.** `HttpExceptionFilter` tüm hataları `{ statusCode, message, ... }`
  gövdesine indirger; beklenmeyen hataların ayrıntısı istemciye sızmaz, yalnızca loglanır.

## Bildirimler

- Her olayda (gider eklendi, fatura ödendi, görev atandı, ödeme kaydedildi…) ilgili
  üyelere **veritabanı bildirimi** yazılır ve tercihleri açıksa **Expo push** gönderilir.
- `RemindersService` saat başı çalışır: son ödeme tarihi yaklaşan / bugün olan / gecikmiş
  faturaları ve zamanı gelen ev işlerini hatırlatır. Aynı hatırlatmanın tekrarını
  `dueReminderSentAt` / `overdueReminderSentAt` / `reminderSentAt` alanları engeller.
- Push için `EXPO_ACCESS_TOKEN` isteğe bağlıdır; tanımlı değilse yalnızca uygulama içi
  bildirimler çalışır.

## Uçlar

| Alan | Uçlar |
|---|---|
| Sağlık | `GET /health` (kimlik istemez) |
| Kimlik | `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `GET /auth/me` · `POST /auth/logout` · `POST /auth/logout-all` |
| Şifre | `POST /auth/forgot-password` · `POST /auth/reset-password` · `POST /auth/change-password` |
| E-posta | `POST /auth/verify-email` · `POST /auth/resend-verification` |
| Kullanıcı | `GET /users/me` · `PATCH /users/me` · `DELETE /users/me` (hesap silme) |
| Ev | `GET/POST /households` · `POST /households/join` · `GET/PATCH /households/:id` · `POST /households/:id/invite-code` · `DELETE /households/:id/members/:userId` · `POST /households/:id/leave` · `GET /households/:id/summary` |
| Gider | `GET/POST /households/:id/expenses` · `GET/PATCH/DELETE /expenses/:id` |
| Bakiye | `GET /households/:id/balances` · `GET/POST /households/:id/settlements` |
| Fatura | `GET/POST /households/:id/bills` · `GET/PATCH/DELETE /bills/:id` · `POST /bills/:id/pay` |
| Ev işi | `GET/POST /households/:id/chores` · `PATCH/DELETE /chores/:id` · `POST /chores/:id/complete` · `POST /chores/:id/reopen` |
| Bildirim | `GET /notifications` · `PATCH /notifications/:id/read` · `POST /notifications/read-all` · `GET/PATCH /notifications/preferences` · `POST /notifications/push-token` |
| Yönetim | `GET /admin/stats` · `GET /admin/users` · `GET/PATCH/DELETE /admin/users/:id` · `GET /admin/households` |

`/admin/*` uçları `PlatformAdminGuard` ile korunur; normal kullanıcı 403 alır.

## Veritabanı

Şema **migration** ile yönetilir; `DB_SYNCHRONIZE` varsayılan olarak kapalıdır
(açmak TypeORM'un şemayı otomatik hizalamasına ve veri kaybına yol açabilir).

```bash
npm run migration:run        # bekleyen migration'ları uygula
npm run migration:generate src/migrations/Ad   # varlık değişikliğinden migration üret
npm run migration:revert     # son migration'ı geri al
```

Tablolar: `users`, `households`, `household_members`, `expenses`, `expense_shares`,
`bills`, `bill_participants`, `chores`, `settlements`, `notifications`,
`notification_preferences`, `push_tokens`, `refresh_tokens`, `verification_tokens`.

## Kalite kontrolleri

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # nest build
```

## Frontend'i bağlama

`frontend/.env` içinde:

```
EXPO_PUBLIC_USE_MOCK_API=false
EXPO_PUBLIC_API_URL=http://<bilgisayarınızın-LAN-IP>:3000/api
```

> Fiziksel cihazda test ederken `localhost` yerine LAN IP'nizi yazın; telefon
> kendi `localhost`'una bakar. Ayrıca `.env` değişikliğinden sonra Expo'yu
> `npx expo start --clear` ile başlatın.
