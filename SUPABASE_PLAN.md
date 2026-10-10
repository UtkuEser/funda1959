# Funda 1959 — Supabase'e Geçiş Planı

> **Durum:** Planlama dokümanı + Aşama 0 uygulaması. Ortam/yönetim kararları (D1–D4) ve iş kararları (D5–D11) işlendi. Aşama 0 kodu ve `0006` hazır (2026-10-10). `funda1959-test` kuruldu (`0001`–`0006` + `test` işareti); `supabase-test` dalı (`e897090`) Vercel Preview'da. **Aşama 1 Preview'da doğrulandı (2026-10-10).** **Aşama 2: `0007` `funda1959-test`'e uygulandı; yerel + gerçek test Supabase doğrulaması tamamlandı (2026-10-10); Preview doğrulaması bekliyor.** Production projesi kurulmadı; `main` (`60355bf`) ve Production değişmedi.
> **Çalışma klasörü:** `funda1959-main` (tek kaynak). Plan ilk olarak `funda1959-git` — son commit `60355bf` + commit edilmemiş değişiklikler — üzerinde hazırlandı (bkz. §8).
> **Kapsam:** Site ve admin paneli aynı Next.js projesinde kalır; ayrıştırma kapsam dışıdır.
> **Son güncelleme:** 2026-10-10

**Gösterim.** Her iddianın yanında kaynağı belirtilir:

- **[K]** = mevcut kodda doğrulandı (dosya yolu verilir). Yollar `src/` altındadır; `src/` yazılmaz.
- **[D#]** = onaylanan karar (aşağıdaki tablolar).
- **[V]** = varsayım veya öneri. Onaylanmış değildir; açık olanlar §9'da.
- **[G]** = canlı ortamda gözlendi (2026-10-01, salt-okuma istekleriyle).

Önceki sürümdeki öneriler bu kararlarla çelişiyorsa kararlar geçerlidir.

---

## Kararlar

### Ortam ve yönetim

| # | Karar | Plana etkisi |
|---|---|---|
| **D1** | Supabase hesabı ve altyapı yönetimi **web ekibinde**. İşletme yalnızca mevcut admin panelini kullanır. | Supabase paneli, migration'lar, ortam değişkenleri, yedekleme ve izleme web ekibinin işidir. İşletmeye Supabase hesabı veya teknik kurulum sorumluluğu verilmez. İşletmenin yapacağı her işlem admin panelinde olmalıdır. |
| **D2** | Önce altyapı kurulumu, sonra test aşaması. **Kurulumun tamamlanması gerçek sipariş kabulünü açmaz.** | Gerçek sipariş kabulü ayrı bir kapıyla açılır (§6.1). |
| **D3** | Test ve canlı veri kesinlikle ayrı: **`funda1959-test`** ve **`funda1959-production`**. Aynı kod, aynı migration'lar. Local + Vercel Preview → test; Vercel Production → production. | Her projede ortam işareti (`app_environment`, `0004`) + yazma koruması (`lib/persistence.ts`, §7.4). Test işlemleri canlı veritabanına yazamaz. |
| **D4** | Site ve admin aynı Next.js projesinde. Gereksiz servis veya ek yönetim katmanı yok. | Supabase (veritabanı + gerektiğinde Auth/Storage) ve Vercel dışında servis eklenmez. |

### İş kararları (2026-10-05)

| # | Karar | Plana etkisi |
|---|---|---|
| **D5** | **Ürün yönetimi:** admin'den yalnızca **mevcut ürünlerin fiyatları** güncellenir. Ürün ekleme, silme, görsel veya içerik düzenleme ekranı **yapılmaz**. Şube bazında aktif/pasif stok yönetimi ayrıca korunur. Fiyat güncelleme yetkisi **Merkez yönetim** hesabındadır. | Katalog (ürün, kategori, içerik, görsel) **kodda kalır**. Veritabanına yalnızca fiyat geçersiz kılmaları (`product_prices`) taşınır. Ürün/kategori tabloları ve ürün görsel deposu **yapılmaz**. |
| **D6** | **Admin hesapları:** toplam 4 hesap: GOP, Panora, İncek TONA, Merkez yönetim. Kişi bazlı çalışan hesabı yok. Şube hesapları yalnızca kendi şubelerinin yetkili işlemlerini yapar; Merkez tüm şubeleri yönetir. | Mevcut env + imzalı çerez yapısı **kalıcı çözümdür** (önceki "Seçenek A"). Admin için Supabase Auth ("Seçenek B") **yapılmaz**. |
| **D7** | **Müşteri hesabı:** üyelik olacak; üye olmadan da sipariş verilebilecek. Misafir siparişlerinin sonradan üyeliğe bağlanması ve misafirlerin puan kazanma davranışı **kararlaştırılmadı**. | Müşteri için Supabase Auth (önceki "Seçenek C") yapılır. Misafir sipariş korunur. Misafir → üye bağlama ve misafir puanı için hiçbir varsayım yapılmaz (§9). |
| **D8** | **Ödeme:** sağlayıcı seçilmedi; entegrasyon bu aşamada **atlanır**. Ödeme alınmayan demo siparişleri **"ödendi" olarak kaydedilmez**. Bu kararlar gerçek sipariş kabulünü **otomatik açmaz**. | Demo siparişler `payment_status = pending`. Sipariş kabulü kapısı kapalı kalır (§6.1). |
| **D9** | **Funda Puan** kuralları:<br>• Online siparişlerde tutarın **%10'u** kadar puan (5.000 TL → 500 puan).<br>• **1 puan = 1 TL.**<br>• Her kazanım **kendi tarihinden itibaren 1 yıl** geçerli; yeni alışveriş eski puanların süresini uzatmaz.<br>• Puan **yalnızca online** alışverişte kullanılır.<br>• Kazanılan puan **sipariş verildikten hemen sonra** hesapta görünür.<br>• **Teslimat ücretinden puan verilmez.**<br>• **Puanla ödenen siparişten tekrar puan kazanılmaz.**<br>• **İptal/iadede** o siparişten kazanılan puan hesaptan **alınır**; o siparişte harcanan puan **iade edilir**. | Hareket kaydı + "puan partisi" (her kazanımın kendi son kullanma tarihi) tasarımı (§2.3). Kazanım sipariş oluşturulduğunda yazılır. Müşteri hesabına (D7) bağlıdır. |
| **D10** | **Minimum sipariş 500 TL.** Teslimat ücreti bölgeler netleşince girilecek ve **yapılandırılabilir** olacak. Ücret belirlenmedi diye **ücretsiz teslimat kabul edilmez**. | Bölge ücreti veritabanında. "Belirlenmedi" ile "0 TL" ayrı durumlar; belirlenmemiş bölgeye adrese teslim siparişi alınmaz. **Öneri [V]:** minimum tutar teslimat ücretinden önceki ürün toplamına uygulansın (karar değil; §9). |
| **D11** | **Teslimat kapasitesi:** şimdilik **saatlik sipariş sınırı yok**. Sahte "dolu" değerleri kaldırılır. Bir saatlik teslimat aralıkları, çalışma saatleri, hazırlık süreleri ve aktif/pasif stok kuralları korunur. Aktif/pasif stok ile teslimat kapasitesi **ayrı** kavramlardır. 10 dakikalık rezervasyonun gerekliliği değerlendirilecek; gereksiz karmaşıklık oluşturulmayacak. | Kapasite hesabı ve demo "dolu" sayıları kaldırılır. Rezervasyon **değerlendirmesi** aşağıda. Rezervasyon tablosu, kapasite RPC'si ve slot kapasite tabloları **yapılmaz**. |
| **D12** (A12, 2026-10-10) | **Sipariş işlemleri:** şube hesabı **yalnızca kendi şubesinin** siparişlerini ilerletebilir ve iptal edebilir; Merkez **tüm şubelerde** aynı yetkilere sahiptir. İptalde **gerekçe zorunlu**; işlemi yapan hesap, tarih ve gerekçe kaydedilir. **Teslim edilmiş siparişin iptali ve ödeme iadesi bu aşamada yok.** Yetkiler sunucuda kontrol edilir. | `PATCH /api/admin/orders` + RPC `update_order_status` (`0007`): durum yalnızca bir adım ilerler (teslimatta "Yolda" atlanmaz); kapsam imzalı oturumdan gelir ve veritabanında yeniden kontrol edilir; her değişiklik `order_status_events` tablosuna, iptal ayrıca `orders.cancel_*` alanlarına yazılır. |
| **D13** (A10, 2026-10-10) | **Demo siparişler Funda Puan kazandırmaz** — bellek dahil hiçbir depoda. Gerçek puan kazanımı bu aşamada etkinleştirilmez. | `lib/funda-points/service.ts` → `awardPointsForOrder` demo siparişi `DEMO_ORDER` ile reddeder; `lib/orders/engine.ts` puan çağırmaz. Kazanım Aşama 6'da veritabanı defteriyle bağlanır. |

**Henüz kararlaştırılmayanlar:** kampanya tarihleri ve koşulları, ve §9'daki diğer konular **onaylanmış sayılmaz**.

### D11 değerlendirmesi: 10 dakikalık rezervasyon gerekli mi? → **Hayır**

- **Bugün tek işlevi slot kapasitesi tutmak.** Rezervasyon bu kapasiteyi `reservedSlotUnits` ile düşüyor (`lib/reservations/index.ts` → `lib/availability/engine.ts` **[K]**). Ürün adedi tutan `reservedProductUnits` hiçbir yerde kullanılmıyor **[K]**.
- **Tutulacak bir şey kalmadı.** Stok artık yalnızca aktif/pasif; ayrılacak adet yok **[K]**. Saatlik sınır da yok (D11), dolayısıyla korunacak kapasite yok.
- **Siparişin geçerliliği sipariş anında yeniden kontrol edilir:** çalışma saati, hazırlık süresi, aynı gün kuralı, pasif ürün (Aşama 2). Bekletme gerekmez.
- **Bugünkü ödeme ekranındaki "Teslimat kapasiteniz ayrıldı · kalan süre" sayacı gerçek bir şeyi tutmuyor** (canlıda zaten sunucu örneğinin belleğinde **[K]**). Müşteriye yanlış güvence veriyor.
- **Sonuç:** rezervasyon adımı ve altyapısı **kaldırılır** (Aşama 0):
  - ödeme sayfasındaki bekletme ve sayaç,
  - `app/api/reservations`, `lib/reservations`,
  - motor bağlantısı,
  - admin "Rezervasyonlar" bölümü.

  Saatlik sınır ileride gelirse bu konu yeniden açılır; o zaman tasarım veritabanı kilidiyle yapılmalıdır.

---

## 0. Kısa özet

- **Hazır [K]:**
  - Sunucu tarafı Supabase istemcisi (`lib/supabase-server.ts`, service role, SDK'sız).
  - Migration `0001` (siparişler + `create_order`), `0002` (kampanyalar), `0003` (şube stoku).
  - Hazırlanan migration'lar: `0004` (ortam işareti), `0005` (5 kampanya posteri), `0006` (demo sipariş işareti).
  - Şube stoku ve kampanyalar için Supabase depoları.
  - Ortak erişim katmanında okuma + yazma ortam kontrolü (`lib/supabase-server.ts`), merkezi yazma koruması (`lib/persistence.ts`) ve `/api/health`.
- **Canlıda [G]:** Supabase ortam değişkenleri yok. Siparişler ve kampanya düzenlemeleri sunucu belleğinde tutuluyor ve kayboluyor.
- **Aşama 0 ile:** Vercel'de hiçbir yazma belleğe düşmüyor; DB yoksa, ulaşılamıyorsa veya yanlış projeye bağlıysa 503 dönüyor. Ayrıca:
  - test/canlı ayrımı **okumaları ve RPC'leri de kapsıyor**: işareti olmayan veya yanlış projeye bağlı bir dağıtım hiçbir uygulama tablosuna istek göndermiyor (§7.4),
  - demo siparişler "ödendi" kaydedilmiyor ve açık `is_demo` işaretiyle ayrılıyor (`0006`; D8),
  - production'da sipariş alımı sunucuda kapalı (§6.1),
  - sahte "dolu" değerler ve saatlik sınır kalkıyor (D11),
  - 10 dk rezervasyon kaldırılıyor (D11 değerlendirmesi).
- **Tamamlanan:** `funda1959-test` + Preview kurulumu (§7.6, adım 12–13), Aşama 1 doğrulaması (§8), Aşama 2'nin yerel + gerçek test Supabase doğrulaması (§7.6 "Aşama 2 kurulum kontrolü", adım 1–3 ve 5–6'nın local karşılığı).
- **Sıradaki:**
  - Aşama 2 **Preview doğrulaması** (§7.6, adım 4–6 Preview'da),
  - Aşama 3 (teslimat ücreti + minimum sipariş),
  - Production kurulumu (§7.6, adım 14) ayrı onayla; sipariş alımı kapalı kalır (§6.1).
- **Kalan bilinen sorunlar [K]:**
  - Teslimat ücreti, adresin bölgesinin koddaki ücretinden (`lib/delivery/zones.ts`) sunucuda hesaplanıyor; ürün sayfasının gösterdiği tutarla aynı. D10'a göre bu demo değerler Aşama 3'te veritabanındaki ücretle (`delivery_zone_fees`) değişecek; "belirlenmedi" durumu henüz yok.
  - Minimum sipariş uygulanmıyor (Aşama 3).
  - Ödeme ekranı toplamı sunucunun hesabıdır (2026-10-10): `POST /api/orders/quote` siparişle aynı kodu (`buildOrderPayload`) çalıştırır, hiçbir şey yazmaz; ekranda ürün toplamı ve teslimat ücreti ayrı, toplam ücret dahil ve siparişin toplamıyla aynı. Sepet ve checkout özeti ücreti hâlâ "Teslimat bölgesine göre hesaplanır" diye gösterir (adres o adımda kesinleşmemiş olabilir).
  - Aşama 2 düzeltmeleri (İstanbul tarihi, sipariş anında doğrulama, eşzamanlı aynı istek, admin listesi, D12 yetkileri) local + gerçek `funda1959-test` üzerinde doğrulandı; Preview'da henüz doğrulanmadı.

---

## 1. Mevcut durum

### 1.1 Veri grupları

Supabase sütunu: **Hazır** = kod ve migration var, ortam kurulumu bekleniyor · **Kısmen** = bir kısmı var · **Eksik** = Supabase karşılığı yok · **Gerekmiyor** = karar gereği kodda kalır.

| Veri grubu | Mevcut kaynak | Okuyan / yazan dosyalar | Supabase | Canlıda kalıcılık sorunu | Gereken değişiklik |
|---|---|---|---|---|---|
| **Ürünler** (18) | Kod sabiti: `lib/data.ts` → `products`, `catalogMeta`, `productDetailMeta`. Varyant fiyatları p1 hariç taban fiyattan çarpanla üretiliyor (`getProductDetail`, `round10`) **[K]** | Katalog/PDP sayfaları, `lib/search.ts` (tarayıcıda), `lib/order-server.ts` (fiyatı yeniden hesaplar), sepet. Yazan yok **[K]** | İçerik: **Gerekmiyor** (D5). Fiyat: Eksik | Yok (statik) | Ürün içeriği kodda kalır. **Fiyat geçersiz kılmaları** `product_prices` tablosunda, Merkez ekranıyla (Aşama 4). |
| **Kategoriler** (11) | `lib/data.ts`, `lib/product-taxonomy.ts` **[K]** | Katalog, menü, admin stok ekranı **[K]** | Gerekmiyor (D5) | Yok | Yok |
| **Ürün görselleri** | `public/products/**` (35 dosya, 6,2 MB), kategori bazlı eşleme `lib/product-images.ts` **[K]** | Katalog, PDP, sepet, arama | Gerekmiyor (D5) | Yok | `public/` içinde kalır; değişiklik deploy ile. |
| **Şubeler** (3) | İki kaynak: `lib/branch/index.ts` (çalışma saatleri, teslimat/gel-al bayrakları; motor bunu kullanır) ve `lib/data.ts` → `branches` (açıklama, harita, saat metni; sayfalar, footer, schema.org) **[K]**. DB: `branches` (0001; slug, ad, adres, telefon) | Motor, admin, sayfalar **[K]** | Kısmen | Yok (okuma) | Kodda kalır (admin'de şube düzenleme talebi yok). İki kaynak tek kaynakta birleştirilmeli **[V]**. `branches` tablosu FK hedefi olarak kalır. |
| **Şube stokları** (aktif/pasif) | `lib/inventory/*`; depo: Supabase / yerel dosya / "kullanılamaz" (`server-init.ts`) **[K, commit edilmedi]** | Motor, `/admin`, `api/availability`, `api/orders`; yazan `api/admin/inventory` **[K]** | **Hazır** (`0003`) | Şu an 500 **[G]**; yeni kod deploy edilince DB yoksa 503 (sahte başarı yok) | Commit + kurulum (Aşama 1). |
| **Teslimat bölgeleri** (4) | `lib/delivery/zones.ts`: mahalle listeleri + demo ücretler (55/60/70/75 TL) + demo minimum (250/300 TL) **[K]** | Tarayıcıda: `lib/delivery/context.tsx`, `AddressPicker`. Sunucuda: motor, checkout **[K]** | Ücret: Eksik | Ücret siparişe girmiyor (`lib/order-server.ts`: `deliveryFee = 0`); bölge minimumu uygulanmıyor **[K]** | Mahalle listeleri kodda kalır (bölgeler netleşince güncellenir). **Ücret** veritabanında (`delivery_zone_fees`), Merkez ekranı. Demo ücret/minimum değerleri **kullanılmaz** (D10; Aşama 3). |
| **Teslimat slotları** | `lib/delivery/slots.ts`: 2 saatlik pencereler → saatlik slotlar; kapasite + **demo "dolu"** (`slotConfirmedCount`, `SLOT_OVERRIDES`) **[K]** | Motor (`evalSlot`), `lib/checkout-utils.ts`, admin "Teslimat Slotları" **[K]** | Gerekmiyor (D11) | Sahte "dolu" görünümü **[K]** | **Aşama 0:** kapasite ve demo "dolu" kaldırılır. Saatlik aralıklar, çalışma saatleri ve hazırlık süreleri korunur. |
| **Rezervasyonlar** (10 dk) | `lib/reservations/index.ts` (bellek) **[K]** | `api/reservations`, `PaymentPage`, motor, admin **[K]** | Gerekmiyor (D11 değerlendirmesi) | Örnek başına bellek; sahte "kapasiteniz ayrıldı" **[K]** | **Aşama 0:** kaldırılır. |
| **Siparişler ve kalemleri** | Doğrulama + fiyat: `lib/order-server.ts`. Kayıt: `lib/orders/engine.ts` → Supabase varsa RPC `create_order` (0001), yoksa `MockOrderRepository` **[K]** | `api/orders`, `PaymentPage` (yalnızca dev demo butonu), `/siparis-basarili`, `/siparis-takip`, `/admin` siparişler/genel bakış (**yalnızca bellekteki depo**) **[K]** | Kısmen | Canlıda bellek: kayboluyor **[G]**. Bellek yolunda demo sipariş **"paid"** **[K]** | **Aşama 0:** demo → `pending` + açık `is_demo` (`0006`); production sipariş alımı sunucuda kapalı. Aşama 2: DB'den liste/durum, RPC düzeltmeleri, sipariş anında yeniden doğrulama. |
| **Kampanyalar** | `lib/campaigns/*`; Supabase deposu hazır; seed `mock.ts` (5 poster) **[K]** | Ana sayfa, admin kampanya ekranı, `api/admin/campaigns` **[K]** | **Hazır** (`0002` + `0005`) | Canlıda bellek | Kurulum. Kampanya **tarihleri ve koşulları kararlaştırılmadı**; kampanyalar bugün yalnızca içerik, indirim mantığı yok **[K]**. |
| **Instagram içerikleri** | `lib/social/*` (bellek); `public/social/reels/*` dosyaları yok **[K]** | Ana sayfa, admin, `api/admin/instagram` **[K]** | Eksik | Bellek | Aşama 7 (içerik kaynağı açık). |
| **Müşteri hesapları ve adresleri** | Giriş/kayıt stub: `lib/auth.ts`; hesap verisi mock: `lib/account-service.ts`. `customers`/`addresses` (0001) yalnızca sipariş anı kaydı **[K]** | `/giris`, `/uye-ol`, `/sifremi-unuttum`, `/hesabim/*` **[K]** | Eksik | Ekranlar önizleme | Supabase Auth ile üyelik (D7, Aşama 5); misafir sipariş korunur. |
| **Funda Puan** | `lib/funda-points/*`: bellekte hareket kaydı, `businessKey` ile tekrar koruması; müşteri anahtarı telefon (`resolveCustomerId`); oran %10 (`config.ts`); **son kullanma tarihi uygulanmıyor**; kazanım yalnızca bellek sipariş yolunda **[K]** | Admin Funda Puan ekranı, `api/admin/funda-points` **[K]** | Eksik | Bellek | D9 kurallarıyla, üyelik üzerinden (Aşama 6). Telefonla eşleme misafir kararına (§9) kadar **kullanılmaz** [V]. |
| **İletişim talepleri** | `app/iletisim/page.tsx`: form `action="#"`, alanlar `name`, `email`, `phone`, `subject`, `message`; backend yok **[K]** | — | Eksik | Form hiçbir yere gitmiyor | Aşama 8. |

### 1.2 Tarayıcıda tutulan veriler **[K]**

| Anahtar / yer | İçerik | Dosya |
|---|---|---|
| `localStorage["funda-cart"]` | Sepet satırları: ürün, varyant, adet, kişiselleştirme, seçilen tarih/saat, şube, **eklendiği andaki birim fiyat** | `lib/cart.ts`, `lib/cart-fulfillment.ts` |
| `localStorage["funda-delivery-context"]` | Teslimat şekli, ilçe/mahalle veya gel-al şubesi | `lib/delivery/context.tsx` |
| `localStorage["funda-celebration-finder"]` | Kutlama sorularının ilerlemesi | `lib/celebration-finder.ts` |
| Modül belleği | Checkout → ödeme aktarımı | `lib/checkout-handoff.ts` |

Bunlar tarayıcıda kalabilir; sunucu hiçbirine güvenmez. Fiyat (`lib/order-server.ts`), şube/bölge ve uygunluk sipariş anında sunucuda yeniden hesaplanır.

### 1.3 Kodda doğrulanan diğer tespitler **[K]**

Aşağıdaki dört madde Aşama 2'de giderildi (2026-10-10, `0007` + kod; local + gerçek test Supabase'inde doğrulandı, §7.6; Preview bekliyor):

- **`create_order` eşzamanlı aynı istekte hata veriyordu.** Aynı `client_request_id` ile gelen ikinci istek benzersizlik ihlaline düşüp 10 denemeden sonra `order_number_generation_failed` alıyordu. → `0007`: istek kimliği başına `pg_advisory_xact_lock`; ikinci istek ilkinin bitmesini bekler ve aynı siparişi döndürür.
- **Supabase sipariş yolunda kaybolanlar:** `deliveryZoneId` ve `salesChannel` RPC'ye gitmiyordu; teslimat siparişine şube yazılmıyordu (`branch_id` yalnızca gel-alda doluyordu); admin listesi bu siparişleri görmüyordu. → `0007`: `delivery_zone_id`, `sales_channel`, teslimatta adresten çıkan şube; admin listesi `list_orders` ile veritabanından. (Puan Aşama 6.)
- **Saat dilimi:** `lib/order-server.ts` → `earliestDate()`, `lib/checkout-utils.ts` → `earliestDeliveryDate()` ve admin "bugün"/saatleri makine saatine göre çalışıyordu. → hepsi Europe/Istanbul.
- **Sipariş anında uygunluk kontrolü yoktu:** geçmiş saat, yetmeyen hazırlık süresi, pasif ürün, şubede olmayan saat aralığı ve hizmet dışı adres kabul ediliyordu. → `lib/order-server.ts` motorla (`getCartAvailability`) yeniden kontrol eder; uygun değilse 409, stok okunamıyorsa 503.
- **Admin girişi:**
  - 4 env hesabı, HMAC imzalı çerez (12 saat, `httpOnly`, `sameSite=lax`, üretimde `secure`).
  - Oran sınırlaması yok (`app/api/admin/auth/login/route.ts` içinde TODO).
  - Server Action yok; bütün yazmalar Route Handler üzerinden.
- **Önbellek:** Cache Components kapalı (`next.config.ts` boş). `supabaseRest` her istekte `no-store`. `/urunler/[slug]` ve `/lezzetlerimiz/[kategori]` build sırasında üretiliyor (SSG); fiyat bu sayfalara build anında giriyor.
- **`LOCATION_REQUIRED` (giderildi, `e897090`):** motor teslimatta adres yokken `BRANCH_REQUIRED` döndürüyor, şube gönderilmişse 0 TL ile "uygun" sayıyordu. Artık teslimat adresten başlar: ilçe/mahalle yoksa `LOCATION_REQUIRED`, bölge yoksa `DELIVERY_ZONE_NOT_FOUND`; şube bölgeden çıkar, istemcinin `branchId`/`deliveryZoneId` değeri bunu değiştirmez. `verify-fulfillment` 27/27.
- **Kullanılmayan dosyalar:** 9 bileşen hiçbir yerden import edilmiyor (`CampaignsCarousel`, `FeaturedProducts`, `InstagramSection`, `CelebrationsSection`, `GiftSelectionSection`, `BranchesSection`, `BrandStoryTeaser`, `CheckoutStepper`, `ReviewStep`). Temizlik ayrı iş.

---

## 2. Veritabanı tasarımı

### 2.1 İlkeler

1. **Mevcut tablolar yeniden tasarlanmaz.** `0001`–`0005` olduğu gibi kalır; yalnızca yeni migration'larla eklenir. Uygulanmış dosya düzenlenmez.
2. **Kodda kalanı veritabanına taşıma (D4, D5).** Ürün içeriği, kategoriler, görseller, şube bilgileri, çalışma saatleri, saatlik aralıklar ve bölge mahalle listeleri kodda kalır. Veritabanı yalnızca **admin'in veya müşterinin değiştirdiği** veriyi tutar:
   - stok durumu, fiyat, teslimat ücreti,
   - siparişler, hesaplar, puanlar,
   - kampanyalar, içerik, iletişim talepleri.
3. **Kimlikler:**
   - Katalog anahtarları koddakiyle aynı (`"p1"`, varyant anahtarı `"8-10"`, `"1kg"`).
   - Şube referansı `branches(slug)` (0003'teki gibi). `orders.branch_id` uuid kalır.
   - Bölge referansı koddaki bölge kimliği (`zone-gop-cankaya`).
4. **Para:** `numeric(10,2)`. **Puan:** tam sayı (1 puan = 1 TL, D9).
5. **Zaman:** `timestamptz` (anlar), `date` (teslimat günü). Bütün "bugün" hesapları Europe/Istanbul.
6. **RLS:** her tabloda açık. anon için yazma politikası yok. Okuma politikası yalnızca üyeler kendi verileri için (§4.4).

### 2.2 Mevcut tablolar ve eklemeler

| Tablo (migration) | Bugün | Ekleme **[V]** |
|---|---|---|
| `branches` (0001) | `id uuid`, `slug unique`, `name`, `address`, `phone`, `is_active`; anon okuma politikası | Yok (şube bilgileri kodda; tablo FK hedefi). |
| `customers` (0001) | Her siparişte yeni satır (misafir) | `auth_user_id uuid null references auth.users(id)` (üye siparişinde dolu, misafirde boş; Aşama 5). |
| `addresses` (0001) | Siparişe ait adres anlık görüntüsü | Yok. Kayıtlı adresler ayrı tabloda (`customer_addresses`). |
| `orders` (0001) | `client_request_id` kısmi unique; `status`, `payment_status` check'leri; `payment_status` varsayılanı `pending` | **`0006` (hazır, Aşama 0):** `is_demo boolean not null default true` + `orders_demo_never_paid` check (`not (is_demo and payment_status = 'paid')`). **`0007` (Aşama 2, hazır):** `sales_channel text not null default 'web' check in ('web','mobile','store')` · `delivery_zone_id text null` · `cancel_reason`, `cancelled_by`, `cancelled_at` + `orders_cancel_recorded` check (iptal edilmiş siparişte üçü de dolu, gerekçe ≥ 3 karakter) · indeksler `(branch_id, delivery_date)`, `(delivery_date)`. **İlgili aşamalara bırakıldı:** `customer_user_id` (Aşama 5, `0010`), `points_redeemed` / `points_earned` (Aşama 6, `0011`), `payment_reference` (Aşama 9). |
| `order_items` (0001) | Satın alma anının ürün adı, slug, varyant, birim/toplam fiyat, `cake_message`, `customization`, `extras`, `note` **zaten saklanıyor** **[K]** | Yok. Fiyat değişiklikleri eski siparişleri etkilemez. |
| `campaigns` (0002 + **0005**) | Admin CRUD; `image_has_text`, `seed_key` | Yok. Kampanya koşulları kararlaşırsa ayrıca değerlendirilir. |
| `branch_product_status` (0003) | PK `(branch_slug, product_id)`, `is_active boolean`, `updated_by`, `updated_at` | Yok. |
| `app_environment` (**0004**) | Tek satır: `test` / `production` | Yok. |

### 2.3 Yeni tablolar **[V]**

**Sipariş durum geçmişi (D12; Aşama 2, `0007` hazır)**

| Tablo | Alanlar | Kurallar |
|---|---|---|
| `order_status_events` | `id bigint identity`, `order_id uuid → orders`, `from_status`, `to_status`, `actor_account` (`merkez` / `sube:<slug>`), `actor_name`, `reason`, `created_at` | Her admin durum değişikliği bir satır. İptalde `reason` zorunlu (check). Yalnızca `update_order_status` yazar; RLS açık, politika yok. |

**Fiyat (D5; Aşama 4)**

| Tablo | Alanlar | Kurallar |
|---|---|---|
| `product_prices` | `product_id text`, `variant_key text not null default ''` (`''` = varyantsız ürünün fiyatı), `price numeric(10,2) not null check (price > 0)`, `updated_by text`, `updated_at timestamptz` | PK `(product_id, variant_key)`. Satır yoksa koddaki fiyat geçerli. Ürün/varyant kimliği API'de koddaki kataloğa göre doğrulanır (bilinmeyen kimlik reddedilir). Yalnızca Merkez yazar. |

**Teslimat ücreti (D10; Aşama 3)**

| Tablo | Alanlar | Kurallar |
|---|---|---|
| `delivery_zone_fees` | `zone_id text PK` (koddaki bölge kimliği), `fee numeric(10,2) null check (fee >= 0)`, `updated_by`, `updated_at` | **Satır yok veya `fee` null = "ücret belirlenmedi"** → o bölgeye adrese teslim siparişi alınmaz (gel-al etkilenmez). `0` yalnızca açıkça girilirse ücretsizdir. Koddaki demo ücretler seed edilmez. Yalnızca Merkez yazar. |

**Minimum sipariş (D10):** tek değer (500 TL). Tablo yerine kodda tek bir sabit (`lib/order-rules.ts`) **[V]**. Değişmesi web ekibi işi, admin ekranı gerekmiyor. Uygulama tabanı §9'da onay bekliyor.

**Müşteri hesabı (D7; Aşama 5)**

| Tablo | Alanlar | Kurallar |
|---|---|---|
| `customer_profiles` | `auth_user_id uuid PK references auth.users`, `full_name`, `phone`, `email`, `marketing_consent bool`, zaman damgaları | RLS: üye yalnızca kendi satırı. |
| `customer_addresses` | `id uuid`, `auth_user_id FK`, `label`, `district`, `neighborhood`, `address_line`, `building`, `floor`, `apartment`, `note`, `is_default bool` **[K: `AccountAddressInput`]** | Kısmi unique `(auth_user_id) where is_default`. RLS: kendi satırları. |

**Funda Puan (D9; Aşama 6)**

Puanın her kazanımı kendi son kullanma tarihiyle bir **parti** olarak tutulur. Bakiye, süresi dolmamış partilerin kalanlarının toplamıdır.

| Tablo | Alanlar | Kurallar |
|---|---|---|
| `funda_point_accounts` | `auth_user_id uuid PK references auth.users`, `created_at` | Üye başına bir hesap. Misafir hesabı yok (D7: karar bekliyor). |
| `funda_point_lots` | `id uuid`, `auth_user_id FK`, `source_order_id uuid null references orders unique` (bir siparişten tek kazanım), `points int check (> 0)`, `remaining int check (0 ≤ remaining ≤ points)`, `earned_at timestamptz`, `expires_at timestamptz` (= `earned_at + interval '1 year'`), `status text check in ('active','expired','reversed')` | İndeks `(auth_user_id, expires_at) where remaining > 0`. Yeni kazanım eski partinin `expires_at` değerini değiştirmez (D9). |
| `funda_point_transactions` | `id uuid`, `auth_user_id`, `type text check in ('EARN','REDEEM','REVERSAL','REFUND','EXPIRE','ADMIN_ADJUSTMENT')`, `points int check (points <> 0)` (işaretli), `order_id uuid null`, `business_key text unique` (ör. `<order_id>:EARN`, `<order_id>:REVERSAL`), `description`, `created_by`, `created_at` | Yalnızca ekleme; güncelleme/silme yok. Tekrar eden istek aynı `business_key`'e çarpar. |
| `funda_point_lot_movements` | `transaction_id FK`, `lot_id FK`, `points int` (partiden düşülen/eklenen) | Harcamanın hangi partiden yapıldığını tutar. İade bu kayda göre yapılır. |

Sunucu fonksiyonları (RPC; `security definer`, yalnızca `service_role`):

| Fonksiyon | Görev |
|---|---|
| `earn_points(order_id)` | Sipariş oluşturulunca çalışır. Koşullar: üye, online kanal, **demo değil** [V], sipariş puan kullanmamış [D9; kapsamı §9].<br>Tutar = `floor((ürün toplamı − indirim) × %10)`; teslimat ücreti hariç **[K: `getEligibleFundaPointAmount`, `calculateEarnedPoints` (floor)]**.<br>Parti açar (`expires_at = now() + 1 yıl`) ve `EARN` hareketi yazar. `business_key` ile tekrarlanmaz. |
| `redeem_points(order_id, points)` | Yalnızca online. Partilerden **en erken son kullanma tarihli önce** düşer [V]. Bakiye yetersizse reddeder. Hareket ve parti düşüşleri tek transaction'da. |
| `reverse_order_points(order_id)` | İptal/iade. (1) Siparişten kazanılan partiyi geri alır. (2) Siparişte harcanan puanı, harcandığı partilere iade eder. Kazanılan puan önceden harcanmışsa ne olacağı açık (§9). |
| `expire_points()` | Süresi dolan partilerin kalanını `EXPIRE` hareketiyle sıfırlar. Doğruluk buna bağlı değil (bakiye zaten `expires_at > now()` ile hesaplanır). Supabase'in kendi `pg_cron` özelliğiyle günlük çalışabilir; ek servis değil (D4). |

**İçerik ve iletişim**

| Tablo | Alanlar | Kurallar |
|---|---|---|
| `instagram_contents` (Aşama 7) | `id uuid`, `title`, `video_path`, `poster_path`, `instagram_url`, `is_published`, `sort_order`, zaman damgaları | Yalnızca Merkez yazar. |
| `contact_requests` (Aşama 8) | `id uuid`, `full_name`, `email`, `phone`, `subject`, `message` **[K form alanları]**, `branch_slug null`, `status check in ('new','in_progress','closed')`, `client_request_id unique`, `created_at`, `handled_by`, `handled_at` | Yazma yalnızca sunucudan (form API). |

### 2.4 Yapılmayacaklar (kararlar gereği)

| Önceki öneri | Neden yapılmıyor |
|---|---|
| `categories`, `products`, `product_variants`, `product_branches`, `product_images`; Storage `products` bucket'ı | D5: ürün ekleme/silme/içerik/görsel düzenleme yok |
| `reservations`, `create_reservation`, kapasite kilidi, `delivery_slot_templates.capacity`, `delivery_slot_overrides` (kapasite) | D11: saatlik sınır yok; rezervasyon gereksiz |
| `admin_users` + admin için Supabase Auth | D6: 4 sabit hesap; kişi bazlı hesap yok |
| `branch_opening_hours`, `delivery_zones` + `delivery_zone_neighborhoods` (tam taşıma) | Admin'de çalışma saati veya bölge düzenleme talebi yok; yalnızca ücret yapılandırılabilir olmalı (D10) [V] |

### 2.5 Sipariş RPC'leri (Aşama 2, `0007` hazır) **[K]**

`0006` (Aşama 0) `create_order`'ı yalnızca demo işareti için yeniden tanımladı: `is_demo = true` ve `payment_status = 'pending'` açıkça yazılır, `is_demo` ≠ `true` olan yük reddedilir.

**`create_order` (v3, `0007`):**

- **Eşzamanlı aynı istek:** istek kimliği başına `pg_advisory_xact_lock`; ikinci istek bekler, sonra ilkinin siparişini döndürür (aynı numara).
- **Şube:** gel-al ve teslimat siparişlerinin ikisinde de `branch_id` dolu. Teslimatta şubeyi sunucu adresin bölgesinden belirler (`lib/order-server.ts`); RPC şubenin aktif olduğunu kontrol eder. Teslimatta `delivery_zone_id` zorunlu.
- **Yeni alanlar:** `sales_channel`, `delivery_zone_id`. (`customer_user_id` Aşama 5, `points_*` Aşama 6.)
- **Ödeme durumu:** her zaman `pending`, `is_demo = true`. `paid` yalnızca ödeme sağlayıcısının doğrulamasıyla (D8, Aşama 9).
- **Tutar kontrolleri:** tutarları sunucu hesaplar; RPC her kalemde `total_price = unit_price × quantity`, `Σ kalem = subtotal` ve `total = subtotal − discount + delivery_fee` olduğunu kontrol eder (kuruş hassasiyeti), aksi halde `amount_mismatch`.
- **Tarih:** geçmiş tarih (İstanbul) reddedilir.

**`list_orders(p_branch_slugs, p_from, p_to, p_limit, p_offset, p_order_number)`:** admin listesi. `p_branch_slugs` null = tüm şubeler (Merkez); şube hesabı için oturumdan gelen `[slug]`. Teslimat tarihi aralığı, en yeni üstte, en fazla 200 satır; `total` ve `status_counts` döner. `0007` öncesinde oluşturulan şubesiz teslimat siparişlerini yalnızca Merkez görür.

**`update_order_status(p_order_number, p_to_status, p_branch_slugs, p_actor_account, p_actor_name, p_reason)`:** D12. Satır kilitli; kapsam dışı → `forbidden_branch`, teslim edilmiş/iptal → `order_closed`, bir adım dışı → `invalid_transition`, gerekçesiz iptal → `cancel_reason_required`. Geçmiş `order_status_events`'e, iptal `orders.cancel_*` alanlarına yazılır.

Üç fonksiyon da yalnızca service role ile çağrılabilir (anon/authenticated'dan açıkça geri alındı).

---

## 3. Bağlantı haritası

**Kural:** teslimat ve uygunluk hesabı **tek yerde** kalır: `lib/availability/engine.ts` **[K]**.

- Veritabanından gelen tek değişken veri şube stoku. Hesaplamadan önce `refreshInventory()` ile yüklenir **[K]**.
- Fiyat ve teslimat ücreti de aynı kalıpla, sunucuda okunup motora ve sipariş doğrulamasına verilir.
- Tarayıcı uygunluk hesaplamaz; `/api/availability`'ye sorar **[K]**.

| Modül | Ekran (tarayıcı) | API (sunucu) | İş mantığı / depo (sunucu) | Supabase |
|---|---|---|---|---|
| Şube stoku | `/admin?section=stock` → `components/admin/BranchStockManager.tsx` | `app/api/admin/inventory/route.ts` | `lib/inventory/{server-init,overrides,supabase-store}.ts` | `branch_product_status` |
| Uygunluk | PDP `ProductFulfillment`, kartlar, hızlı sipariş, sepet, checkout | `app/api/availability/route.ts` | `lib/availability/engine.ts` | `branch_product_status` (stok) |
| Fiyat (D5) | Admin fiyat ekranı (yeni, Merkez); müşteri tarafında katalog, PDP, sepet, arama | `GET/PUT /api/admin/prices` (yeni); katalog sayfaları sunucuda | `lib/pricing.ts` (yeni): koddaki fiyat + `product_prices` geçersiz kılması; `lib/order-server.ts` aynı çözücüyü kullanır | `product_prices` |
| Teslimat ücreti ve minimum (D10) | Admin bölge ücreti ekranı (yeni, Merkez); checkout ve ödeme özeti | `GET/PUT /api/admin/delivery-fees` (yeni) | `lib/delivery/fees.ts` (yeni), `lib/order-rules.ts` (yeni), `lib/order-server.ts` | `delivery_zone_fees` |
| Sipariş | `CheckoutPage` → `PaymentPage` | `app/api/orders/route.ts` | `lib/order-server.ts` (doğrulama, fiyat, **motorla yeniden uygunluk**) → `lib/orders/engine.ts` → RPC `create_order` | `customers`, `addresses`, `orders`, `order_items` |
| Sipariş takibi | `/siparis-basarili`, `/siparis-takip` | — (sunucu sayfası) | `getPublicOrder` → RPC `get_order_public` **[K]** | `orders` |
| Admin siparişler | `/admin?section=orders`, `overview` | Sayfa sunucuda; durum için `PATCH /api/admin/orders` (yeni) | `lib/orders/repository.ts` → `SupabaseOrderRepository` (yeni) | `orders`, `order_items` |
| Kampanyalar | Ana sayfa `CampaignsSection` + `CampaignShowcase`; admin `AdminCampaigns` | `app/api/admin/campaigns/route.ts` **[K]** | `lib/campaigns/supabase-repository.ts` **[K]** | `campaigns` |
| Instagram | Ana sayfa; admin `AdminInstagramContent` | `app/api/admin/instagram/route.ts` **[K]** | `lib/social/*` → Supabase deposu (yeni) | `instagram_contents` |
| Müşteri hesabı (D7) | `/giris`, `/uye-ol`, `/sifremi-unuttum`, `/hesabim/*` | Supabase Auth (çerez oturumu) + `/api/account/*` (yeni) | `lib/auth.ts`, `lib/account-service.ts` gövdeleri **[K: TODO'lar]** | `auth.users`, `customer_profiles`, `customer_addresses`, `orders` |
| Funda Puan (D9) | Hesabım → puan; checkout'ta kullanım; admin Funda Puan | `/api/account/points` (yeni), `app/api/admin/funda-points/route.ts` **[K]** | `lib/funda-points/service.ts` (kurallar) → RPC'ler | `funda_point_*` |
| İletişim | `/iletisim` | `POST /api/contact` (yeni) | `lib/contact/*` (yeni) | `contact_requests` |
| Admin girişi (D6) | `/admin-giris`, `/merkez-giris` | `app/api/admin/auth/*` **[K]** | `lib/admin/{session,access,credentials}.ts` **[K]** | — |

**Önbellek (Next 16, `node_modules/next/dist/docs` önerisi):**

- Fiyat okumaları `fetch(..., { next: { tags: ['prices'] } })` ile etiketlenir.
- Merkez fiyat değiştirince Route Handler'da `revalidateTag('prices', 'max')` çağrılır. `updateTag` yalnızca Server Action'da çalışır; projede Server Action yok **[K]**.
- **Tarayıcıda koddan fiyat okuyan yerler** (`lib/search.ts`, sepet satırları) güncel fiyatı sunucudan almalı. Sepet zaten eklendiği andaki fiyatı tutuyor ve sipariş sunucuda yeniden fiyatlanıyor **[K]**; fark bildirimi §9'da.

---

## 4. Kimlik doğrulama ve yetkiler

### 4.1 Admin (D6): mevcut yapı korunur **[K]**

- **Hesaplar:** 4 env hesabı: `ADMIN_GOP_*`, `ADMIN_PANORA_*`, `ADMIN_INCEK_*`, `MERKEZ_ADMIN_*`. Karşılaştırma `timingSafeEqual` ile.
- **Oturum:** HMAC imzalı çerez (`lib/admin/session.ts`). Bozuk veya başka anahtarla imzalı çerez giriş ekranına yönlendirir.
- **Yetki kapsamı:** `lib/admin/access.ts` → `resolveAdminScope()` rolü ve `authorizedBranchIds` değerini her istekte çerezden çıkarır.
- **Merkeze özel bölümler:** `lib/admin/section-access.ts`.
- **Eklenecek [V]:**
  - Giriş oran sınırlaması: IP + hesap başına; sayaç Supabase tablosunda (ek servis yok, D4).
  - `ADMIN_SESSION_SECRET` rotasyon prosedürü.
  - Değişiklik kaydında "kim" bilgisi hesap adı düzeyinde kalır (kişi bazlı hesap yok).

### 4.2 Müşteri (D7): Supabase Auth ile üyelik

- **Üyelik:**
  - Supabase Auth, çerez tabanlı oturum.
  - `lib/auth.ts` stub gövdeleri buna göre tasarlanmış **[K]**.
  - Gerekecek paket: `@supabase/ssr` (Supabase'in kendi istemcisi; ek servis değil) **[V]**.
  - Hangi giriş yöntemlerinin olacağı §9'da. Bugün stub'larda e-posta/telefon + şifre ve Google/Apple/Facebook butonları var **[K]**.
- **Misafir sipariş** aynen sürer.
- **Bağlama:** üye girişliyken verilen sipariş `customer_user_id` ile hesaba bağlanır. Misafir siparişlerinin sonradan bağlanması **yapılmaz**, karar bekliyor (D7).

### 4.3 Yetki matrisi

✔ = izinli · ✖ = yasak · (kendi) = yalnızca kendi kaydı/şubesi · **?** = karar bekliyor (§9)

| İşlem | Ziyaretçi / misafir | Üye | Şube hesabı (GOP, Panora, İncek TONA) | Merkez yönetim |
|---|---|---|---|---|
| Katalog, kampanya, Instagram görüntüleme | ✔ | ✔ | ✔ | ✔ |
| Uygunluk sorgulama | ✔ | ✔ | ✔ | ✔ |
| Sipariş oluşturma | ✔ (misafir) | ✔ | ✖ | ✖ |
| Sipariş özeti (sipariş no ile, kişisel veri yok) | ✔ | ✔ | ✔ | ✔ |
| Sipariş geçmişi, kayıtlı adresler | ✖ | ✔ (kendi) | ✖ | ✖ |
| Funda Puan bakiyesi / kullanımı | ? (D7) | ✔ (kendi) | ✖ | ✔ (görüntüleme + düzeltme) **[K]** |
| Şube stok durumu (aktif/pasif) | ✖ | ✖ | ✔ (kendi şube) **[K]** | ✔ (tüm şubeler) **[K]** |
| **Ürün fiyatı güncelleme** | ✖ | ✖ | ✖ | ✔ (D5) |
| **Teslimat ücreti ayarı** | ✖ | ✖ | ✖ | ✔ [V] |
| Sipariş listesi | ✖ | ✖ | ✔ (kendi şube) **[K: `repoScope`]** | ✔ |
| Sipariş durumu güncelleme, iptal/iade | ✖ | ✖ | ? (kendi şube) | ✔ |
| Kampanya, Instagram, Şubeler bölümü | ✖ | ✖ | ✖ **[K]** | ✔ **[K]** |
| İletişim taleplerini görme | ✖ | ✖ | ? | ✔ |

### 4.4 RLS ve sunucu kontrolleri

- **Service role RLS'yi atlar.** Sunucu service role ile erişir (`lib/supabase-server.ts` **[K]**). Bu yüzden yetkinin asıl yeri sunucu kodudur.
  - Her Route Handler, oturumu (admin çerezi veya müşteri Supabase oturumu) işlemden önce kontrol eder.
  - Örnek kalıp `app/api/admin/inventory/route.ts`: 401 → geçersiz şube 400 → başka şube 403 → doğrulama 400 → yazma koruması 503 → kayıt.
- **RLS savunma derinliği olarak açık kalır:**
  - anon için yazma politikası yok.
  - Üyeler için yalnızca kendi verisini okuma (`auth.uid() = auth_user_id`): `customer_profiles`, `customer_addresses`, `orders` (`customer_user_id`), `funda_point_*`.
- **Service role anahtarı:**
  - Yalnızca sunucu ortam değişkeni; asla `NEXT_PUBLIC_*` değil.
  - İstemci modülleri import edemez: `lib/supabase-server.ts` tarayıcıda yüklenirse hata fırlatıyor **[K]**.
- **Tarayıcı anon anahtarı:** yalnızca müşteri Auth için kullanılır (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; Aşama 5). Tablo yazmaları yine API üzerinden.

---

## 5. Dosyalar ve Storage

- **`public/` içinde kalanlar (D5):** ürün fotoğrafları, hero görselleri, logo/ikonlar, fontlar. Ürün görsel düzenleme ekranı yapılmaz; görsel değişikliği deploy ile.
- **Kampanya posterleri:** bugün `public/kampanya/1–5.png` **[K]**; admin formunda görsel alanı yol metni **[K]**. Admin'den yeni poster yükleme istenirse:
  - Storage `campaigns` bucket'ı (public okuma; yalnızca Merkez, sunucu üzerinden imzalı yükleme URL'siyle).
  - `next.config.ts` → `images.remotePatterns` ayarı.
  - Bu bir karar konusu (§9).
- **Instagram video/poster:** dosyalar yok **[K]**; kaynak kararına bağlı (§9). Storage kullanılırsa `social` bucket'ı, aynı kurallarla.
- **Kaynak kod ve statik varlıklar veritabanına taşınmaz.**

---

## 6. Kritik iş kuralları

| Kural | Bugün nerede **[K]** | Nasıl korunur |
|---|---|---|
| **Pasif ürün görünür kalır; "En erken yarına teslim"; bugün seçilemez** | `lib/availability/engine.ts` → `branchDayCheck`; metinler `lib/delivery/labels.ts` | DB yalnızca `is_active` tutar; müşteri metni DB'den gelmez. Motor değişmez. |
| **Stok ≠ kapasite (D11)** | Stok: `branch_product_status`. Kapasite: `lib/delivery/slots.ts` | Aşama 0: kapasite kavramı kaldırılır; stok kuralı aynen kalır. |
| **Saatlik sınır yok, sahte "dolu" yok (D11)** | `slotConfirmedCount`, `SLOT_OVERRIDES`, `DELIVERY_SLOT_FULL` | Aşama 0: kaldırılır. Slot yalnızca çalışma saati, hazırlık süresi, aynı gün kuralı ve pasif ürün kuralıyla kapanır. |
| **Bir saatlik aralıklar, çalışma saatleri, hazırlık süreleri** | `toHourlyWindows`, `isBranchOpenAt`, `prepTimeMinutes` (made-to-order en az 24 saat) | Aynen korunur. |
| **Europe/Istanbul** | `lib/time/istanbul.ts` | **Aşama 2 (kod):** sipariş doğrulaması, `earliestDeliveryDate()` ve admin "bugün"/saatleri İstanbul'a göre; `create_order` geçmiş tarihi reddeder. |
| **Sipariş anında yeniden doğrulama** (rezervasyon kalkınca) | `lib/order-server.ts` → `getCartAvailability` | **Aşama 2 (kod):** tarih/saat/hazırlık/pasif/şube aralığı/hizmet bölgesi tekrar kontrol edilir; uygun değilse **409**. Stok okunamıyorsa **503** (eski veya varsayılan stokla sipariş alınmaz). Teslimatta şube ve bölge adresten çıkar; fiyat, indirim ve ücret sunucuda hesaplanır. |
| **Tekrarlanan istekler çift kayıt üretmez** | `orders.client_request_id` unique; puan `businessKey` | Sipariş: **Aşama 2 (`0007`)** istek kimliği kilidiyle eşzamanlı istekte de aynı sipariş döner (gerçek test projesinde doğrulandı, 2026-10-10, §7.6). Puan: `business_key unique` + RPC. İletişim: `client_request_id unique`. |
| **Demo siparişler gerçeklerden açıkça ayrılır (D8)** | Bellek yolu `paid` yazıyordu; ayrım yalnızca ödeme durumuna kalıyordu | **Aşama 0 (uygulandı):**<br>• `orders.is_demo` (`0006`, varsayılan `true`) + "demo asla `paid` olamaz" kısıtı; `create_order` yalnızca demo sipariş yazar.<br>• Sunucu her siparişte `is_demo: true` gönderir (`lib/orders/engine.ts`; tarayıcı belirleyemez); bellek yolunda `isDemo`.<br>• Admin sipariş listelerinde "Demo" etiketi.<br>• Production'da sipariş alımı sunucuda kapalı (§6.1).<br>`payment_status = pending` tek başına ayrım değildir. `paid` yalnızca ödeme sağlayıcısı doğrulamasıyla. |
| **Test/canlı veri ayrımı, okuma + yazma (D3)** | `lib/supabase-server.ts` → `supabaseRest()` | **Aşama 0 (uygulandı):** her okuma, yazma ve RPC öncesinde ortam işareti kontrolü. İşaret yoksa veya yanlışsa hiçbir uygulama tablosuna istek gitmez (§7.4). |
| **Minimum sipariş 500 TL (D10)** | Uygulanmıyor | Aşama 3: checkout + sunucu doğrulaması. Taban önerisi: teslimat öncesi ürün toplamı (§9). |
| **Teslimat ücreti yapılandırılabilir; belirlenmemiş ≠ ücretsiz (D10)** | Sipariş toplamında 0; PDP koddaki demo ücreti gösteriyor | Aşama 3: `delivery_zone_fees`. Belirlenmemiş bölgede adrese teslim alınmaz. PDP/checkout yalnızca belirlenmiş ücreti gösterir. |
| **Funda Puan (D9)** | Bellek; son kullanma yok. **Demo sipariş hiçbir depoda puan kazandırmaz (D13):** `awardPointsForOrder` demo siparişi `DEMO_ORDER` ile reddeder; sipariş motoru puan çağırmaz | Aşama 6: partiler (1 yıl), kazanım sipariş anında, teslimat ücreti hariç, puanlı siparişte kazanım yok, iptal/iadede geri alma + iade, yalnızca online, 1 puan = 1 TL. |
| **Tarayıcıda kalabilecekler** | §1.2 | Sepet, adres tercihi, quiz ve aktarım tarayıcıda; sunucu hiçbirine güvenmez. |

### 6.1 Gerçek sipariş kabulü kapısı (D2, D8)

Kurulumun bitmesi siparişleri açmaz. Bugünkü durum **[K]**:

- Üretimde "Ödemeyi Tamamla" sipariş oluşturmuyor; yalnızca önizleme mesajı gösteriyor.
- "Demo Akışı Tamamla" yalnızca **local ve Vercel Preview**'da görünür (Aşama 2): `app/hizli-siparis-odeme/page.tsx` her istekte sunucuda `isOrderIntakeOpen()` ile karar verir; Production'da buton yoktur.
- **Production'da `POST /api/orders` sunucuda kapalı** (Aşama 0): rota, gövdeyi okumadan 503 döner ("Online sipariş alımı henüz açılmadı."); `lib/orders/engine.ts` → `placeOrder` aynı kontrolü ayrıca yapar (`OrderIntakeClosedError`). Karar yalnızca dağıtımın `VERCEL_ENV` değerinden gelir; istekteki hiçbir alan engeli aşamaz. Açılması kod değişikliği + deploy + ayrı onay gerektirir; ortam değişkeniyle açılmaz.

Gerçek sipariş kabulü ancak şu koşulların **hepsi** sağlanınca ve **ayrıca onaylanınca** açılır:

1. Aşama 2 (siparişler) ve Aşama 3 (ücret + minimum) tamamlanmış ve `funda1959-test` üzerinde §8.1 testlerinden geçmiş.
2. Ödeme sağlayıcısı seçilmiş ve bağlanmış (Aşama 9); `paid` yalnızca sağlayıcı doğrulamasıyla yazılıyor.
3. Teslimat ücretleri bölgeler için girilmiş (veya ilgili bölgelerde yalnızca gel-al açık).
4. Production'da `/api/health` → `ready`; yedekleme açık.

---

## 7. Veri taşıma ve ortam kurulumu

### 7.1 Migration sırası

Hepsi yalnızca **ekleme** yapar; uygulanmış dosyalar değişmez. İki proje aynı dosyaları aynı sırayla alır; yeni migration önce test projesinde çalıştırılır.

| # | Dosya | Durum | İçerik |
|---|---|---|---|
| — | `0001_init_orders.sql` | Mevcut | Şubeler, müşteriler, adresler, siparişler, kalemler, `create_order`, `get_order_public` |
| — | `0002_campaigns.sql` | Mevcut | Kampanyalar + eski 4 demo |
| — | `0003_branch_product_status.sql` | Hazır (commit edilmedi) | Şube stok durumu |
| — | `0004_app_environment.sql` | Hazır | Ortam işareti |
| — | `0005_campaign_posters.sql` | Hazır | `image_has_text`, `seed_key`, 5 poster, eski 4'ün pasifleşmesi |
| — | `0006_orders_demo_flag.sql` | Hazır (Aşama 0) | `orders.is_demo` (varsayılan `true`) + `orders_demo_never_paid` kısıtı + indeks; `create_order` yalnızca demo sipariş yazar; `get_order_public` `is_demo` döndürür. Tekrar çalıştırılabilir. |
| 1 | `0007_orders_hardening.sql` | **Aşama 2 — `funda1959-test`'e uygulandı (2026-10-10)**; production'a uygulanmadı | `orders`: `sales_channel`, `delivery_zone_id`, iptal kaydı (§2.2); `order_status_events` (§2.3); `create_order` v3, `list_orders`, `update_order_status` (§2.5). Tekrar çalıştırılabilir. |
| 2 | `0008_delivery_zone_fees.sql` | Plan (Aşama 3) | `delivery_zone_fees` |
| 3 | `0009_product_prices.sql` | Plan (Aşama 4) | `product_prices` |
| 4 | `0010_customer_accounts.sql` | Plan (Aşama 5) | `customer_profiles`, `customer_addresses`, `customers.auth_user_id`, `orders.customer_user_id` |
| 5 | `0011_funda_points.sql` | Plan (Aşama 6) | `funda_point_*`, puan RPC'leri |
| 6 | `0012_instagram.sql` | Plan (Aşama 7) | `instagram_contents` |
| 7 | `0013_contact_requests.sql` | Plan (Aşama 8) | `contact_requests` |

### 7.2 Seed planı

| Veri | Davranış |
|---|---|
| 18 ürün, 11 kategori, görseller | **Seed yok**; kodda kalır (D5). |
| Fiyatlar | **Seed yok**; `product_prices` boş başlar = koddaki fiyatlar geçerli. Merkez değiştirdikçe satır oluşur. |
| 3 şube | `0001` seed'i **[K]** (FK hedefi). |
| Teslimat ücretleri | **Seed yok**; koddaki demo ücretler aktarılmaz. Merkez girene kadar "belirlenmedi" (D10). |
| 5 kampanya posteri | `0005` **[K]**: `seed_key` ile bir kez. Tarihler yer tutucu (2025-01-01 → 2026-12-31); tarih ve koşullar kararlaştırılmadı. |
| Eski 4 kampanya | `0005` **[K]**: yalnızca dokunulmamışsa pasifleşir, silinmez. |
| Şube stok durumları | Seed yok; kayıt olmayan ürün koddaki varsayılanı kullanır. |
| Funda Puan demo (6 uydurma müşteri), Instagram mock | **Hiçbir projeye taşınmaz** (uydurma veri). |

### 7.3 Ortam değişkenleri (yalnızca isimler)

| Değişken | Local (`.env.local`) | Vercel **Preview** | Vercel **Production** | Not |
|---|---|---|---|---|
| `SUPABASE_URL` | test projesi | test projesi | production projesi | **[K]** |
| `SUPABASE_SERVICE_ROLE_KEY` | test projesi | test projesi | production projesi | Yalnızca sunucu **[K]** |
| `ADMIN_SESSION_SECRET` | ✔ | ✔ | ✔ | Preview ile Production'da farklı değer önerilir **[V]** |
| `ADMIN_GOP_USERNAME`, `ADMIN_GOP_PASSWORD` | ✔ | ✔ | ✔ | D6 **[K]** |
| `ADMIN_PANORA_USERNAME`, `ADMIN_PANORA_PASSWORD` | ✔ | ✔ | ✔ | D6 **[K]** |
| `ADMIN_INCEK_USERNAME`, `ADMIN_INCEK_PASSWORD` | ✔ | ✔ | ✔ | D6 **[K]** (İncek TONA) |
| `MERKEZ_ADMIN_USERNAME`, `MERKEZ_ADMIN_PASSWORD` | ✔ | ✔ | ✔ | D6 **[K]** |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | boş | boş | boş | **Aşama 5'e kadar boş.** Müşteri üyeliği gelince ilgili projenin değerleri girilir (anon anahtar tarayıcıya gider; tasarım gereği). |
| `INVENTORY_OVERRIDES_FILE` | isteğe bağlı | — | — | Yalnızca local test **[K]** |
| `VERCEL`, `VERCEL_ENV` | — | otomatik | otomatik | **Elle tanımlanmaz** **[K]** |

### 7.4 Test/canlı ayrımı ve sahte başarı koruması (Aşama 0'da uygulandı) **[K]**

**Okuma, yazma ve RPC — ortam işareti.** `lib/supabase-server.ts` → `supabaseRest()`, Supabase'e giden **her** isteği göndermeden önce bağlı projenin işaretini (`app_environment`) kontrol eder.

- Beklenen işaret: Vercel Production → `production`; Preview ve local → `test`.
- İşaret yoksa, okunamıyorsa veya yanlışsa istek gönderilmez; `DataEnvironmentError` fırlar.
- İşaret ham istekle okunur (`supabaseRest` üzerinden değil), bu yüzden kontrol kendini çağırmaz. Yalnızca `ok`/`mismatch` sonuçları örnek başına 1 dk önbellekte tutulur; eşzamanlı çağrılar tek kontrol isteğini paylaşır.
- Ham istek fonksiyonu dışarı açık değil. Tek istisna `/api/health`'in şema yoklaması: yalnızca işaret doğrulandıktan sonra, `limit=0` ile (satır döndürmez).

Okuma tarafında bu hatayla:

| Ekran | Sonuç |
|---|---|
| Müşteri stok etiketleri | Koddaki varsayılanla çalışır (yanlış projenin stoku okunmaz) |
| Admin stok | 503 + uyarı |
| Ana sayfa kampanyaları | Bölüm gizlenir |
| Admin kampanya | Uyarı |
| Sipariş onayı / takibi | "Sipariş bilgisi bulunamadı" |

**Yazma — sahte başarı yok.** `lib/persistence.ts` → `assertPersistentWrite(domain)`. Her yazma işleminden önce çağrılır:

| Durum | Sonuç |
|---|---|
| Supabase tanımlı + modülün tablosu var + bağlı projenin işareti dağıtımla eşleşiyor | Yazma veritabanına gider |
| İşaret eşleşmiyor (ör. Preview → production projesi) | **503**; log: `ENV_MISMATCH` |
| İşaret satırı veya `app_environment` tablosu yok | **503**; log: `ENV_MARKER_MISSING` |
| Proje cevap vermiyor | **503**; log: `UNREACHABLE` |
| Vercel'de Supabase tanımlı değil | **503**; log: `NOT_CONFIGURED` |
| Vercel'de modülün tablosu henüz yok (Instagram, Funda Puan) | **503**; log: `NOT_DATABASE_BACKED` |
| Local makine, Supabase yok | Yerel bellek/dosya deposu (yalnızca geliştirme) |

- **Bağlı yazma yolları:**
  - `api/admin/inventory`
  - `lib/orders/engine.ts` → `api/orders`
  - `api/admin/campaigns`
  - `api/admin/instagram`
  - `api/admin/funda-points`
  - (Rezervasyon Aşama 0'da kaldırıldı.)
- **Mesajlar:** kullanıcıya modüle göre sade mesaj gösterilir. Teknik neden yalnızca sunucu loguna yazılır (`[persistence] write refused`; gizli değer yok).
- **Okuma tarafı:** ana sayfada kampanyalar okunamazsa bölüm gizlenir; admin ekranlarında uyarı gösterilir.
- **`GET /api/health`:**
  - Herkese: `ok`, `runtime`, `expectedData`, `database`. Hazır değilse HTTP 503.
  - Merkez oturumuyla ek olarak: migration kontrolleri (`0001`–`0006`). Yalnızca işaret eşleşince çalışır; aksi halde `"migrations": "not_checked"`. Şema yoklaması `limit=0`: müşteri veya sipariş satırı okunmaz.
  - Anahtar veya URL döndürmez.
- **Doğrulama betikleri:** `scripts/verify-*.ts` veri yazar. `scripts/test-environment-guard.ts` bunları yalnızca bellekte (Supabase anahtarı yok) veya işareti `test` olan projede çalıştırır; `VERCEL_ENV=production`, `production` işareti veya eksik işaret istek gönderilmeden durdurur.
- **Örnek veri notu:** `lib/inventory/source.ts` → `INVENTORY_SOURCE = "sample"` **[K]**. Canlı veriye geçişte `"live"` yapılır.

### 7.5 Yedekleme, doğrulama, geri dönüş **[V]**

- **Yedek:** her migration öncesi Supabase yedeği veya `pg_dump`. PITR plana bağlı; web ekibinin kararı (D1).
- **Prova:** migration'lar önce `funda1959-test` projesinde çalıştırılır. Doğrulama:
  - `/api/health` migration kontrolleri,
  - satır sayıları,
  - anon anahtarla yazma denemesinin reddi (RLS).
- **Geri dönüş:**
  - Migration'lar yalnızca ekleme yapar; yıkıcı değişiklik yok.
  - Uygulama tarafında önceki deploy'a dönülür; veri tarafında yedekten geri yüklenir.

### 7.6 Kurulum listesi (web ekibi; D1)

Gizli değerler yalnızca Supabase ve Vercel panellerinde ve geliştiricinin kendi `.env.local` dosyasında durur; sohbete, repoya veya dokümana yazılmaz.

**Supabase**

1. Web ekibinin hesabında iki proje oluştur: `funda1959-test` ve `funda1959-production`. Bölge ve plan web ekibinin kararı; iki projede aynı bölge önerilir.
2. Her iki projede SQL Editor'da migration'ları sırayla çalıştır: `0001` → `0002` → `0003` → `0004` → `0005` → `0006` → `0007` (`0007` Aşama 2 kurulum kontrolüyle; aşağıda).
3. Her projeye kendi işaretini **bir kez** ekle:
   - `funda1959-test`: `insert into public.app_environment (name) values ('test');`
   - `funda1959-production`: `insert into public.app_environment (name) values ('production');`
4. Her projede kontrol et:
   - `branches` 3 satır.
   - `campaigns` 5 aktif poster + 4 pasif eski kayıt.
   - `app_environment` 1 satır, doğru değer.
   - `orders` tablosunda `is_demo` sütunu (varsayılan `true`) ve `orders_demo_never_paid` kısıtı var.
   - Bütün tablolarda RLS açık.
5. Production projesinde yedeklemeyi aç.
6. Her projenin **Project URL** ve **service_role** anahtarını Project Settings → API'den al; yalnızca Vercel paneline ve local `.env.local`'e girilir.

**Vercel** (Project → Settings → Environment Variables)

7. **Production** kapsamı: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` → `funda1959-production`.
8. **Preview** (ve kullanılıyorsa **Development**) kapsamı: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` → `funda1959-test`.
9. Production ve Preview'da şunların tanımlı olduğunu kontrol et:
   - `ADMIN_SESSION_SECRET`
   - `ADMIN_GOP_USERNAME`, `ADMIN_GOP_PASSWORD`
   - `ADMIN_PANORA_USERNAME`, `ADMIN_PANORA_PASSWORD`
   - `ADMIN_INCEK_USERNAME`, `ADMIN_INCEK_PASSWORD`
   - `MERKEZ_ADMIN_USERNAME`, `MERKEZ_ADMIN_PASSWORD`
10. `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` Aşama 5'e kadar boş kalır. `VERCEL` ve `VERCEL_ENV` elle tanımlanmaz.

**Local**

11. Geliştiricinin `.env.local` dosyasında yalnızca `funda1959-test` değerleri bulunur.

**Deploy ve doğrulama** (ayrı onayla)

12. Commit edip **Preview**'a deploy et. `GET /api/health` → `"database": "ready"`, `"expectedData": "test"`. Merkez oturumuyla bütün migration kontrolleri (`0001`–`0006`) `ok`.
13. Preview'da bir ürünü pasif, sonra aktif yap ve sayfayı yenile; durum korunmalı. Kayıt test projesinde görünür, production projesinde **görünmez**.
14. **Production** deploy → `/api/health` → `"ready"`, `"expectedData": "production"`. Sipariş kabulü **açılmaz** (§6.1).

**Durum (2026-10-10):**

- **Tamam:** `funda1959-test` (adım 1–3, yalnızca test projesi), Preview ortam değişkenleri (adım 8–9), local `.env.local` (adım 11), adım 12–13.
  - `supabase-test` dalı (`e897090`) Preview'da; Preview'da Aşama 1 doğrulaması geçti (§8).
  - Test projesinde şema `0001`–`0006` ve `test` işareti doğrulandı (local `/api/health`, Merkez oturumu). Adım 4'teki satır sayıları ve RLS kontrolü bu kayıtta doğrulanmadı.
  - `0007` test projesine uygulandı; local `/api/health` (Merkez) `0001`–`0007` bütün kontroller `ok` (2026-10-10).
- **Bekliyor:** Aşama 2 Preview doğrulaması (aşağıda, adım 4–6). `funda1959-production` (adım 1–5'in production kısmı), Production ortam değişkenleri (adım 7), adım 14. `main` dalı değişmedi.
- **Not:** Preview, Vercel Authentication ile korunuyor; otomatik kontrol (curl) için Vercel oturumu gerekir.
- **Not:** Test projesi zaman zaman geçici 5xx döndürdü (bir okumada 522; health şema yoklamasında bir kez `error`, tekrarında `ok`). Müşteri tarafındaki stok okuması böyle bir anda son bilinen değerle devam eder; admin okuması 503 verir; sipariş alımı 503 verir (Aşama 2).

**Aşama 2 kurulum kontrolü (yalnızca `funda1959-test` + Preview)**

Durum (2026-10-10): adım 1–3 **tamam**; adım 4–6 local uygulama + gerçek `funda1959-test` ile **tamam**, **Preview'da bekliyor**; adım 7 Production kurulunca.

1. SQL Editor'da `0007_orders_hardening.sql` çalıştır (test projesi). Production'a uygulanmaz.
2. Merkez oturumuyla `/api/health` → `0001`–`0007` bütün kontroller `ok` (`0007 orders(...)` ve `0007 order_status_events(id)` dahil).
3. **Eşzamanlı aynı sipariş (gerçek test Supabase'i):** aynı `client_request_id` ile iki `create_order` çağrısı **aynı anda** gönderilir (ör. iki ayrı SQL Editor sekmesi veya iki eşzamanlı `POST /api/orders`).
   - Beklenen: iki yanıt da aynı `order_number`; `orders` tablosunda o `client_request_id` için **tek** satır; `customers`'ta fazladan satır yok; hata yok.
   - Sıralı tekrar (aynı istek ikinci kez) de aynı numarayı döndürür.
4. Preview'da "Demo Akışı Tamamla" ile bir gel-al ve bir teslimat siparişi:
   - teslimat siparişinin şubesi adresin şubesi (ör. Gölbaşı/İncek → İncek), ücret bölgenin ücreti;
   - ödeme ekranında "Ürün Toplamı", "Teslimat Ücreti" ve "Toplam" ayrı; "Toplam" onay sayfasındaki sipariş toplamıyla aynı;
   - geçmiş saat / şubede olmayan saat → 409 ve sipariş yazılmaz;
   - demo sipariş Funda Puan hesabı açmaz / hareket yazmaz (D13).
5. Admin (Preview): Merkez her iki siparişi görür; GOP yalnızca kendi şubesini; tarih filtresi ve sayfalama çalışır; sayfa yenilenince ve yeni oturumda siparişler durur.
6. Durum (D12): şube kendi siparişini bir adım ilerletir (200); başka şubenin siparişine 403; gerekçesiz iptal 400; gerekçeli iptal 200 ve `order_status_events` + `orders.cancel_*` dolu (hesap, tarih, gerekçe); teslim edilmiş sipariş iptal edilemez (409).
7. Production'da (kurulduğunda) `POST /api/orders` 503 ve demo butonu yok (§6.1).

**Sonuç — local uygulama + gerçek `funda1959-test` (2026-10-10):** 45/45 kontrol + doğrudan RPC eşzamanlılık testi geçti. Başlangıçta test projesinde sipariş yoktu.

- Ön kontrol: işaret `test`; `/api/health` `0001`–`0007` hepsi `ok`; `list_orders` yanıt veriyor. İlk public health bir kez geçici `unreachable` döndü, sonraki 3 deneme 200.
- Demo sipariş: `is_demo = true`, `payment_status = pending`, `sales_channel = web`; ödeme ekranı tutarı = yanıt = veritabanı (gel-al ₺90; teslimat ₺90 + ₺70 = ₺160).
- Teslimat şubesi: tarayıcı GOP / ücret 0 / toplam 1 gönderdi → kayıt `incek`, `zone-incek-golbasi`, ücret 70, toplam 160; onay özeti İncek.
- 409'lar (Panora 10:00, dünün tarihi, hizmet dışı adres) kayıt yazmadı.
- Eşzamanlılık: uygulama üzerinden aynı istek kimliğiyle 5 eşzamanlı POST → hepsi 201, aynı numara; doğrudan RPC ile 1 ms arayla 2 `create_order` (uçuşta çakıştı, ~480 ms) → ikisi aynı numara; her iki testte veritabanında 1 sipariş + 1 müşteri; sıralı tekrar aynı numara.
- Admin: Merkez 4'ünü, GOP yalnızca kendi 3'ünü (`?branch=incek` etkisiz), İncek yalnızca kendisininkini görür; tarih filtresi, "4 sipariş · sayfa 1 / 1", "Demo" etiketi.
- D12: GOP → İncek siparişi ilerletme/iptal 403, İncek → GOP 403 (kayıtlar `new`, olay yok); İncek kendi siparişini `confirmed`, Merkez `preparing` yaptı (olaylar `sube:incek`, `merkez`); adım atlama 409; gerekçesiz iptal 400, gerekçeli iptal 200 (`cancel_reason`, `cancelled_by = GOP`, `cancelled_at`, olay); iptal edilen kapalı (409); teslim edilen sipariş iptal edilemez (409).
- D13: Funda Puan ekranında sentetik müşteri hesabı yok. `branch_product_status` (5 satır) değişmedi.

**Test kayıtları (`funda1959-test`'te korunuyor; hepsi demo, sentetik, teslimat 2026-10-13, e-posta `asama2-202610101701-…@example.com`):**

| | Sipariş | Tür / şube | Tutar | Durum | Olaylar |
|---|---|---|---|---|---|
| A | `FND-20261010-A660` | gel-al / GOP | ₺90 | iptal | new→cancelled (`sube:gop`, gerekçeli) |
| B | `FND-20261010-5453` | teslimat / İncek | ₺160 (ücret ₺70) | hazırlanıyor | new→confirmed (`sube:incek`), confirmed→preparing (`merkez`) |
| C | `FND-20261010-E596` | gel-al / GOP | ₺90 | yeni | — (uygulama üzerinden eşzamanlılık) |
| D | `FND-20261010-5A39` | gel-al / GOP | ₺90 | teslim edildi | 4 adım (`sube:gop`) |
| E | `FND-20261010-1EC1` | gel-al / GOP | ₺90 | yeni | — (doğrudan RPC eşzamanlılık) |

Toplam: 5 sipariş, 5 müşteri, 1 adres, 5 kalem, 7 durum olayı.

---

## 8. Uygulama sırası ve testler

Aşamalar bağımlılık sırasındadır ve **tek tek** uygulanır; her biri ayrı test edilip deploy edilir.

| Aşama | Kapsam ve dosyalar | Ön koşul | Durum | Kabul kriterleri |
|---|---|---|---|---|
| **0. Altyapı ve sahte davranışların kaldırılması** | **Yapıldı:** `lib/persistence.ts`, `app/api/health/route.ts`, `lib/supabase-server.ts` (`SupabaseRestError`), yazma yollarında 503 koruması, kampanya okuma güvenliği, `0004`, `0005`, `supabase/README.md`, `.env.example`.<br>**Bu turda eklendi:**<br>(a) demo sipariş `pending` (`lib/orders/engine.ts`, `lib/orders/repository.ts`);<br>(b) kapasite ve sahte "dolu" kaldırıldı (`lib/delivery/slots.ts`, `lib/availability/engine.ts`, admin "Teslimat Slotları");<br>(c) rezervasyon kaldırıldı (`lib/reservations`, `app/api/reservations`, `PaymentPage`, `lib/checkout-handoff.ts`, `CheckoutPage`, `api/orders`, admin "Rezervasyonlar" ve genel bakış); eski admin bağlantıları genel bakışa yönlenir (`lib/admin/section-access.ts`); `scripts/verify-*.ts` güncellendi.<br>**Kurulum öncesi tamamlananlar (2026-10-10):**<br>(d) ortam işareti kontrolü ortak katmanda: her okuma, yazma ve RPC (`lib/supabase-server.ts`; `lib/persistence.ts` aynı kontrolü kullanır);<br>(e) `0006_orders_demo_flag.sql`; sunucu her siparişte `is_demo: true` (`lib/orders/engine.ts`, `lib/orders/repository.ts`, `lib/order.ts`); admin "Demo" etiketi (`app/admin/page.tsx`);<br>(f) production'da `POST /api/orders` 503 (`app/api/orders/route.ts`, `lib/orders/engine.ts`);<br>(g) `/api/health`: `0006` kontrolü, şema yoklaması yalnızca işaret eşleşince ve `limit=0`;<br>(h) doğrulama betikleri yalnızca bellekte veya `test` işaretli projede yazar (`scripts/test-environment-guard.ts`). | D1, D3 | Kod tamam (`e897090`); test + Preview kurulumu tamam; **production kurulumu bekliyor** (§7.6) | Vercel'de DB yok / ulaşılamıyor / yanlış proje → her yazma 503; sahte başarı yok. İşaret yok veya yanlış → hiçbir uygulama tablosuna istek gitmez (okuma dahil). Demo sipariş `pending` + `is_demo = true`; tarayıcı değiştiremez. Production'da sipariş alımı 503. Hiçbir slot "dolu" görünmüyor. Kapanma yalnızca saat, hazırlık ve pasif kuralından. Ödeme ekranında bekletme/sayaç yok. |
| **1. Şube stokları** | Stok düzeltmesi (`lib/inventory/*`, `api/admin/inventory`, `BranchStockManager`, `0003`); `supabase-test` dalında `e897090` | 0 | **Tamamlandı (2026-10-10)**<br>• Preview + `funda1959-test`: web ekibi doğruladı.<br>• Local + `funda1959-test`: kayıt ve şube bağımsızlığı elle doğrulandı; HTTP yetki testi 23/23 (oturumsuz 401; GOP kendi şubesi 200; GOP → Panora/İncek okuma ve yazma 403; Merkez üç şube 200; 403 denemelerinden sonra `branch_product_status` değişmedi).<br>• Not: aktife alınan ürün bugün seçilemiyorsa önce zaman kuralına bakılır. Örnek: İncek'te `p5`, 4 sa hazırlık, son aralık 19:00–20:00 → bugün için son sipariş 16:00. `/api/availability` yanıtında `PREPARATION_TIME` = zaman kuralı, `NEXT_DAY_ONLY` = stok pasif okunuyor. | Aktif/pasif yenileme ve yeni oturumda korunur. GOP değişikliği diğer şubeleri etkilemez. Şube 403 / Merkez 200. Müşteride "En erken yarına teslim". |
| **2. Siparişler** | `0007_orders_hardening.sql`; `lib/order-server.ts` (motorla yeniden uygunluk, İstanbul tarihi, adresten şube/bölge, sunucuda fiyat/indirim/ücret); `app/api/orders` (stok okunamazsa 503, 400/409); `lib/orders/repository.ts` (asenkron depo, kapsam/filtre/sayfa, D12 kuralları), `lib/orders/supabase-repository.ts`, `lib/orders/server-init.ts`; `PATCH /api/admin/orders`; `app/admin/page.tsx` (DB'den genel bakış + liste, tarih filtresi, sayfalama, İstanbul saati, iptal kaydı), `components/admin/OrderStatusActions.tsx`; demo butonu local + Preview (`app/hizli-siparis-odeme/page.tsx`, `PaymentPage`); ödeme ekranı tutarları sunucudan (`POST /api/orders/quote`, `PaymentSummary`: ürün toplamı + teslimat ücreti ayrı, toplam = sipariş toplamı); demo siparişe puan yok (D13: `funda-points/service.ts`, `orders/engine.ts`); `lib/checkout-utils.ts`; `lib/order-status.ts`; `/api/health` `0007`; `scripts/verify-orders.ts` | 0, 1, D12 | **Local + gerçek `funda1959-test` doğrulaması tamam (2026-10-10)**: `0007` test projesine uygulandı, 45/45 + doğrudan RPC eşzamanlılık testi (§7.6 "Sonuç"). **Preview doğrulaması bekliyor.** | Sipariş yenileme ve yeni oturumda korunur. Aynı istek 2 kez (sıralı ve eşzamanlı) → tek sipariş, aynı numara. Demo sipariş `pending` + etiketli. Geçersiz tarih/saat/pasif ürün/bölge → 409; stok okunamazsa 503. Teslimat şubesi adresten. Şube yalnızca kendi siparişlerini görür ve değiştirir; Merkez hepsini. İptal gerekçeli ve kayıtlı; teslim edilmiş sipariş iptal edilmez. |
| **3. Teslimat ücreti + minimum sipariş** | `0008`; Merkez bölge ücreti ekranı + `api/admin/delivery-fees`; `lib/delivery/fees.ts`, `lib/order-rules.ts` (500 TL); checkout, ödeme özeti, PDP ücret gösterimi; `order-server` toplamları | 2; taban kararı (§9) | Bekliyor | Ücreti belirlenmemiş bölgeye adrese teslim alınmaz, ücretsiz kabul edilmez; gel-al çalışır. Girilen ücret toplamda görünür. 500 TL altı sipariş (onaylanan tabanla) checkout ve sunucuda reddedilir. |
| **4. Fiyat yönetimi** | `0009`; Merkez fiyat ekranı + `api/admin/prices`; `lib/pricing.ts`; katalog/PDP/arama/sepet sunucu fiyatı; `order-server` aynı çözücü; `revalidateTag('prices','max')` | 0; varyant fiyat kararı (§9) | Bekliyor | Merkez fiyatı değiştirir; şube hesabı 403. Yeni fiyat katalogda, PDP'de ve siparişte görünür. Eski siparişlerin kalemleri değişmez. Bilinmeyen ürün/varyant reddedilir. |
| **5. Müşteri üyeliği** | `0010`; Supabase Auth (`@supabase/ssr` [V]); `lib/auth.ts`, `lib/account-service.ts`, `/giris`, `/uye-ol`, `/sifremi-unuttum`, `/hesabim/*`; checkout'ta üye bilgisi; `NEXT_PUBLIC_SUPABASE_*` | 2; giriş yöntemi kararı (§9) | Bekliyor | Üye olur, girer, profil/adres yönetir, kendi siparişlerini görür, başkasınınkini göremez (RLS + sunucu). Misafir sipariş çalışmaya devam eder. |
| **6. Funda Puan** | `0011`; puan RPC'leri; `lib/funda-points/*` (DB, partiler); Hesabım puan ekranı; admin ekranı DB'den; checkout'ta puan kullanımı | 5; §9 puan soruları | Bekliyor | 5.000 TL → 500 puan, sipariş sonrası hemen görünür. Teslimat ücreti puana girmez. Puanlı siparişte kazanım yok (onaylanan kapsamla). Her parti 1 yıl, yeni alışveriş uzatmaz. İptal/iadede geri alma + iade. Tekrarlanan istekte tek hareket. Yalnızca online kullanım. |
| **7. Instagram** | `0012`; `lib/social/*` DB deposu; (Storage kararına göre yükleme) | 0; içerik kaynağı kararı | Bekliyor | Admin değişikliği yenileme sonrası korunur. |
| **8. İletişim talepleri** | `0013`; `app/iletisim/page.tsx` → `POST /api/contact`; admin listesi | 0; iletim/KVKK kararı | Bekliyor | Talep kaydedilir; tekrar gönderim çift kayıt üretmez. |
| **9. Ödeme entegrasyonu** | Sağlayıcı seçilince ayrı plan; `paid` yalnızca sağlayıcı doğrulamasıyla; puan kullanımı ödemeyle birleşir | 2, 3; sağlayıcı kararı | **Atlandı (D8)** | Sonrasında §6.1 kapısı ayrıca onaylanır. |

### 8.1 Test senaryoları

| Senaryo | Beklenen | Aşama |
|---|---|---|
| Yenileme ve yeni oturum sonrası kayıt | Değer korunur | 1–8 |
| Şubeler arası izolasyon (stok + yetki) | GOP değişikliği diğer şubeleri etkilemez; şube hesabı başka şubeye 403 | 1, 2 |
| Saatlik sınır olmaması | Aynı slotu çok sayıda müşteri seçebilir; slot hiçbir zaman "dolu" görünmez | 0 |
| Kapanma kuralları | Geçmiş saat, hazırlık süresine yetmeyen saat, kapalı gün ve pasif ürünün bugünü seçilemez; 72 saat hazırlıklı ürün doğru güne kayar | 0, 2 |
| Tekrarlanan sipariş isteği | Aynı `clientRequestId` ile sıralı ve eşzamanlı istekler → tek sipariş, aynı numara, tek puan hareketi | 2, 6 |
| Demo sipariş | `payment_status = pending`, `is_demo = true`; hiçbir depoda puan kazandırmaz (D13; `verify-funda-points`, `verify-orders`) | 0, 2, 6 |
| Veritabanı kesintisi | Yazmalar 5xx + anlaşılır mesaj + log; bellekte sahte başarı yok | 0–8 |
| Yanlış proje bağlantısı | Preview → production projesi (veya işaretsiz proje): işaret kontrolü dışında projeye hiçbir okuma/yazma/RPC isteği gitmez; yazmalar 503, `/api/health` → `env_mismatch` / `marker_missing` | 0 |
| Production sipariş kapısı | Production'da `POST /api/orders` → 503, gövdedeki alanlardan bağımsız; `create_order` çağrılmaz | 0 |
| Admin değişikliğinin müşteriye yansıması | Stok → ≤ 2 sn uygunluk etiketi; fiyat → yeniden doğrulama sonrası katalog ve sipariş; ücret → checkout | 1, 3, 4 |
| Minimum ve ücret | 499 TL ürün toplamı reddedilir (taban onayıyla); ücreti belirlenmemiş bölge reddedilir; 0 TL açıkça girilmişse kabul | 3 |
| Puan süresi ve iade | 1 yıl dolan parti bakiyeden düşer; yeni kazanım eski partiyi uzatmaz; iptalde kazanılan geri alınır, harcanan iade edilir | 6 |
| Saat dilimi | Sunucu UTC iken Istanbul 00:30'da "bugün" Istanbul tarihidir | 2 |
| RLS | anon anahtarla yazma reddedilir; üye başkasının verisini okuyamaz | her migration, 5 |

Önceki sürümdeki "iki müşteri aynı son kapasite" ve "rezervasyon süresinin dolması" testleri **kaldırıldı** (D11: kapasite ve rezervasyon yok).

---

## 9. Açık kararlar

D1–D13 netleşti. Aşağıdakiler **hâlâ açık** ve onaylanmış sayılmaz. Koddan çıkarılabilen konular (şube listesi, çalışma saatleri, bölge mahalleleri, saatlik aralıklar, hazırlık süreleri, %10 oranı) sorulmuyor.

| # | Konu | Neden önemli |
|---|---|---|
| **A1** | **Varyant fiyatları:** Merkez her varyantın (ör. 4–6 / 8–10 kişilik, 500 g / 1 kg) fiyatını ayrı mı girecek, yoksa taban fiyatı girip mevcut çarpanlar mı uygulanacak? Bugün p1 hariç varyantlar çarpanla hesaplanıyor **[K]**. | Fiyat ekranının ve `product_prices` satırlarının yapısı (Aşama 4). |
| **A2** | **Fiyat değiştiğinde sepet:** sepette eklenme anındaki fiyat duruyor, sipariş sunucuda yeni fiyatla hesaplanıyor **[K]**. Müşteriye checkout'ta fark bildirilsin mi? | Aşama 4 kullanıcı deneyimi. |
| **A3** | **Minimum sipariş tabanı:** öneri, teslimat ücretinden önceki ürün toplamı. İndirim ve puan düşülmeden önce mi sonra mı? Gel-al siparişlerine de uygulanacak mı? | Aşama 3 doğrulaması. |
| **A4** | **Teslimat ücretleri ve bölgeler:** bölge başına ücretler; bölge mahalle listeleri kesinleşecek mi? | Aşama 3; ücret girilene kadar adrese teslim kapalı. |
| **A5** | **Misafir siparişleri:** sonradan üyeliğe bağlanacak mı? Misafir puan kazanacak mı (telefonla mı)? (D7'de açık) | Aşama 5–6. Karar gelene kadar misafire puan verilmez. |
| **A6** | **Puan kullanılan sipariş:** hiç puan kazanmaz mı (kararın lafzı), yoksa yalnızca puanla ödenen kısım mı? Bugünkü kod puanla ödenen tutarı kazanımdan düşüyor (kısmi) **[K]**. | Kazanım formülü. |
| **A7** | **İade edilen harcanmış puanın süresi:** orijinal kazanım tarihi mi korunur, yoksa iade tarihinden itibaren 1 yıl mı? Süresi zaten dolmuşsa? | Parti iadesi. |
| **A8** | **İptal anında kazanılan puan zaten harcanmışsa:** bakiye eksiye düşebilir mi; düşülemeyen kısım ne olur? Kısmi iadede puan oransal mı geri alınır? | `reverse_order_points` kuralı. |
| **A9** | **Puanla ödenebilecek kalemler:** teslimat ücreti puanla ödenebilir mi? Bir siparişte kullanılabilecek üst sınır var mı? Puan tutarın tamamını karşılarsa ödeme sağlayıcısı olmadan sipariş tamamlanabilir mi? | Aşama 6 ve 9. |
| ~~A10~~ | **Kararlaştırıldı → D13 (2026-10-10).** Demo siparişler bellek dahil hiçbir depoda puan kazandırmaz; gerçek puan kazanımı Aşama 6'ya kadar etkin değil. | — |
| **A11** | **Üyelik giriş yöntemleri:** e-posta + şifre, telefon, Google/Apple/Facebook hangileri? (stub'larda hepsi var **[K]**) | Aşama 5 kapsamı ve Supabase Auth ayarları. |
| ~~A12~~ | **Kararlaştırıldı → D12 (2026-10-10).** Şube kendi şubesinde ilerletir ve iptal eder; Merkez tüm şubelerde; iptalde gerekçe zorunlu ve kayıtlı; teslim edilmiş sipariş iptali ve iade bu aşamada yok. | — |
| **A13** | **Kampanya tarihleri ve koşulları:** "3 Al 2 Öde", "İlk online siparişe %15" gibi kurallar sepette uygulanacak mı, yoksa kampanyalar bilgilendirme mi kalacak? Bugün indirim mantığı yok **[K]**. Admin'den poster yükleme gerekli mi? | İndirim alanı, puan tabanı (indirim düşülür), Storage. |
| **A14** | **Tatil / özel gün kapanışları** gerekiyor mu (kapasite olmadan gün kapatma)? | Motor kuralı; gerekirse küçük bir ayar tablosu. |
| **A15** | **Ödeme sağlayıcısı** (seçilince). | Aşama 9 ve §6.1. |
| **A16** | **Instagram içerik kaynağı** (dosyalar, gerçek bağlantılar; Storage veya `public/`). | Aşama 7. |
| **A17** | **İletişim talepleri** kime iletilecek (e-posta?), KVKK metni, spam koruması? | Aşama 8. |
| **A18** | **Canlı alan adı:** schema.org `https://funda1959.com` yazıyor **[K]**; site `funda1959.vercel.app`. | SEO. |
| **A19** | **Müşteri verilerinin saklama süresi** (KVKK). | Temizlik politikası. |
| — | Supabase bölge ve planı | **İşletmeye sorulmaz**; web ekibinin teknik kararı (D1). |
