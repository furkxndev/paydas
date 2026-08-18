# Paydaş — Mobil Uygulama (Frontend)

Ev arkadaşlarının ortak giderlerini, faturalarını ve ev işlerini tek yerden yönettiği
**dijital ev asistanı**. React Native + Expo (SDK 57) ile geliştirilmiştir.

## Hızlı başlangıç

```bash
cd frontend
npm install
npm start          # Expo geliştirme sunucusu
npm run ios        # iOS simülatör
npm run android    # Android emülatör
npm run web        # Tarayıcı
```

Uygulama varsayılan olarak **mock modunda** açılır: backend gerekmez, tüm veriler cihaz
üzerindeki mock servisten gelir ve AsyncStorage'da saklanır.

**İlk açılışta veritabanı boştur.** Kayıt olan **ilk kullanıcı otomatik olarak platform
yöneticisi** (`platformRole: 'admin'`) olur; sonraki kayıtlar normal kullanıcıdır.

## Özellikler

| Alan | Kapsam |
|---|---|
| **Kullanıcı yönetimi** | Kayıt, giriş, oturum kalıcılığı, profil düzenleme |
| **Ev yönetimi** | Ev oluşturma, 6 haneli davet kodu ile katılma, kod paylaşma/yenileme, üye rolleri (ev sahibi / yönetici / üye), üye çıkarma, evden ayrılma, çoklu ev desteği |
| **Ortak giderler** | Tutar, kategori, ödeyen kişi ve tarih; eşit / elle tutar / yüzde bölüşümü; kuruş artıklarını kaybetmeyen dağıtım; filtreleme ve kategori dağılımı |
| **Borç hesabı** | Üye bazlı net bakiye, **en az sayıda transfere indirgenmiş** borç listesi, ödeme kaydetme ve ödeme geçmişi |
| **Fatura takibi** | Elektrik, su, doğalgaz, internet, kira, aidat; son ödeme tarihi, gecikme durumu, tekrar (aylık/2 aylık/3 aylık/yıllık), ödendiğinde otomatik ortak gider oluşturma ve bir sonraki dönemi açma |
| **Ev işleri** | Görev oluşturma ve kişiye atama, öncelik, son tarih, tekrarlayan görevler, tamamlandı işaretleme, katkı puanı sıralaması |
| **Yönetim paneli** | Uygulama içinde, Profil → Yönetim bölümünde (yalnızca yöneticide görünür): sistem özeti, kullanıcı listesi, arama ve rol/durum filtreleri, kullanıcı detayı, bilgi düzenleme, yönetici yetkisi verme/alma, hesabı askıya alma, kullanıcı silme, ev listesi |
| **Bildirimler** | Uygulama içi bildirim akışı + cihazda planlanan yerel hatırlatmalar (fatura yaklaşıyor / bugün son gün / gecikti, görev hatırlatması), tür bazlı tercihler, hatırlatma saati, push token altyapısı |
| **Hesap güvenliği** | Şifremi unuttum, şifre değiştirme, uygulama içi hesap silme (KVKK) |
| **Ana ekran** | Net borç/alacak kartı, bu ayki pay, bekleyen faturalar, sana ait ev işleri, son harcamalar, hızlı eylemler |

## Klasör yapısı

```
src/
├── components/          # Sunum bileşenleri
│   ├── ui/              # Tasarım sistemi (Button, Card, Input, BottomSheet, Calendar…)
│   ├── admin/           # Yönetim paneli kullanıcı satırı
│   ├── home/            # Ana ekran kartları
│   ├── expenses/        # Gider satırı
│   ├── bills/           # Fatura satırı
│   ├── chores/          # Görev satırı
│   ├── balances/        # Borç ve bakiye satırları
│   ├── household/       # Üye satırı, davet kartı
│   └── notifications/   # Bildirim satırı
├── config/              # Ortam değişkenleri (env.ts)
├── constants/           # Kategori, fatura türü, görev sabitleri
├── context/             # Auth, Household, HouseholdData, Notification, Toast sağlayıcıları
├── hooks/               # useAuth, useExpenses, useBills, useChores, useBalances…
├── navigation/          # Stack/Tab navigatörleri ve tip tanımları
├── screens/             # Ekranlar (auth, onboarding, home, expenses, balances, bills,
│                        #           chores, household, notifications, profile, admin)
├── services/
│   ├── api/             # Sözleşme (contracts.ts), HTTP istemcisi, gerçek API uygulaması
│   ├── mock/            # Cihaz üzerinde çalışan sahte backend + demo veri
│   ├── notifications/   # expo-notifications sarmalayıcısı, hatırlatma planlayıcı
│   └── storage/         # AsyncStorage tip güvenli katman
├── theme/               # Renk, boşluk, tipografi, gölge token'ları
├── types/               # Alan modelleri (User, Household, Expense, Bill, Chore…)
└── utils/               # Para, tarih, borç hesabı, bölüşüm, doğrulama yardımcıları
```

### Mimari notlar

- **Tek veri sözleşmesi.** `services/api/contracts.ts` uygulamanın veri katmanı arayüzünü
  tanımlar. Hem `httpApi` (NestJS) hem `mockApi` (cihaz içi) bu arayüzü uygular.
  `services/api/index.ts` hangisinin kullanılacağını `config/env.ts` üzerinden seçer —
  **backend hazır olduğunda ekranlarda tek satır değişiklik gerekmez.**
- **Katmanlı durum yönetimi.** `Auth → Household → HouseholdData → Notification` sırasıyla
  iç içe sağlayıcılar. Ekranlar doğrudan context'e değil, `hooks/` altındaki amaca özel
  hook'lara bağlanır.
- **Borç sadeleştirme.** `utils/debt.ts` net bakiyeleri hesaplayıp açgözlü minimum nakit
  akışı algoritmasıyla en az sayıda transfere indirger ("herkes herkese ödesin" yerine
  tek bir "A → C" transferi).
- **İki ayrı rol sistemi.** `PlatformRole` (`admin` / `user`) uygulama genelindeki yetkiyi,
  `MemberRole` (`owner` / `admin` / `member`) ev içindeki yetkiyi tanımlar. İkisi bağımsızdır:
  bir ev sahibi platform yöneticisi olmak zorunda değildir.
- **Açılış deneyimi.** `AnimatedSplash`, yerel açılış ekranını devralıp marka işaretini
  canlandırır; "hareketi azalt" erişilebilirlik ayarında animasyon atlanır.
  `ErrorBoundary` beklenmeyen bir render hatasında beyaz ekran yerine kurtarma ekranı gösterir.
- **Kuruş güvenliği.** `utils/money.ts` ve `utils/split.ts` bölüşümde oluşan kuruş
  artıklarını dağıtır; payların toplamı her zaman gider tutarına eşittir.

## Ortam değişkenleri

`.env.example` dosyasını `.env` olarak kopyalayın:

```bash
cp .env.example .env
```

| Değişken | Açıklama |
|---|---|
| `EXPO_PUBLIC_API_URL` | NestJS backend adresi. Fiziksel cihazda test ederken `localhost` yerine bilgisayarınızın LAN IP'sini yazın. |
| `EXPO_PUBLIC_USE_MOCK_API` | `true` iken backend gerekmez. Backend hazır olduğunda `false` yapın. |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | Expo push token alabilmek için EAS proje kimliği. |

Aynı değerler `app.json` içindeki `expo.extra` alanından da okunur.

## Bildirimler hakkında

- **Yerel hatırlatmalar** (fatura ve görev) Expo Go dahil her ortamda çalışır; fatura veya
  görev değiştiğinde `NotificationContext` planlamayı otomatik yeniler.
- **Uzak (push) bildirimler** için `EXPO_PUBLIC_EAS_PROJECT_ID` ve bir development build
  gerekir; Expo Go Android'de SDK 53'ten beri uzak bildirim desteklemez. Token alma ve
  sunucuya kaydetme akışı (`notifications/push-token`) hazırdır.

## Kalite kontrolleri

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format      # prettier
npx expo-doctor     # Expo yapılandırma kontrolü
```

## Backend'e geçiş

Backend hazırdır (bkz. [../backend](../backend)). Bağlamak için:

1. `.env` içinde `EXPO_PUBLIC_USE_MOCK_API=false` yapın.
2. `EXPO_PUBLIC_API_URL` değerini NestJS sunucunuza yönlendirin
   (fiziksel cihazda `localhost` yerine LAN IP).
3. `npx expo start --clear` ile başlatın — ortam değişkeni değişikliği
   Metro önbelleğinin temizlenmesini gerektirir.

Backend aşağıdaki uçları karşılar (`services/api/httpApi.ts` ile birebir eşleşir):

```
POST   /auth/register           POST   /auth/login          GET    /auth/me
PATCH  /users/me                POST   /auth/logout
GET    /households              POST   /households          POST   /households/join
GET    /households/:id          PATCH  /households/:id      POST   /households/:id/invite-code
DELETE /households/:id/members/:userId                      POST   /households/:id/leave
GET    /households/:id/summary
GET    /households/:id/expenses POST   /households/:id/expenses
GET    /expenses/:id            PATCH  /expenses/:id        DELETE /expenses/:id
GET    /households/:id/balances
GET    /households/:id/settlements                          POST   /households/:id/settlements
GET    /households/:id/bills    POST   /households/:id/bills
GET    /bills/:id               PATCH  /bills/:id           POST   /bills/:id/pay
DELETE /bills/:id
GET    /households/:id/chores   POST   /households/:id/chores
PATCH  /chores/:id              POST   /chores/:id/complete POST   /chores/:id/reopen
DELETE /chores/:id
GET    /notifications           PATCH  /notifications/:id/read
POST   /notifications/read-all  GET    /notifications/preferences
PATCH  /notifications/preferences                           POST   /notifications/push-token
GET    /admin/stats             GET    /admin/users         GET    /admin/users/:id
PATCH  /admin/users/:id         DELETE /admin/users/:id     GET    /admin/households
```

`/admin/*` uçları yalnızca `platformRole === 'admin'` olan kullanıcıya açılmalıdır; backend
tarafında bir guard ile korunması gerekir.

## Yönetim paneli

Ayrı bir web uygulaması değildir — mobil uygulamanın içindedir.

1. Sistemdeki ilk kayıt otomatik olarak yönetici olur.
2. Yönetici, **Profil → Yönetim → Kullanıcı yönetimi** yolundan panele girer.
   (Henüz evi olmayan yönetici, ev kurulum ekranındaki kısayoldan da erişebilir.)
3. Panelde: sistem özeti, kullanıcı arama/filtreleme, kullanıcı detayı, bilgi düzenleme,
   yönetici yetkisi verme/alma, hesap askıya alma ve kullanıcı silme.

Korumalar: son yöneticinin yetkisi alınamaz veya silinemez; yönetici kendi hesabını askıya
alamaz veya silemez; askıya alınan kullanıcı giriş yapamaz (verileri korunur).

Tüm verileri sıfırlamak için **Profil → Uygulama → Tüm verileri sıfırla**. Bu işlem
kullanıcılar dahil her şeyi siler; sonraki ilk kayıt yeniden yönetici olur.
