# Funda 1959 — Supabase'e Geçiş Planı

> **Durum:** Planlama dokümanı + Aşama 0 uygulaması. Ortam/yönetim kararları (D1–D4) ve iş kararları (D5–D11) işlendi. Aşama 0 kodu ve `0006` hazır (2026-10-10). `funda1959-test` kuruldu (`0001`–`0006` + `test` işareti); `supabase-test` dalı (`e897090`) Vercel Preview'da. **Aşama 1 Preview'da doğrulandı (2026-10-10).** **Aşama 2 tamamlandı (2026-10-10): `0007` `funda1959-test`'e uygulandı; local + gerçek test Supabase ve Preview doğrulaması geçti (`2c75944`).** **Aşama 3 tamamlandı (2026-10-10, `63331f7`; Preview doğrulandı).** **Aşama 4: `0009` `funda1959-test`'e uygulandı, gerçek test Supabase kontrolleri geçti; kod `supabase-test` dalına pushlandı (`04d7f43` fiyat yönetimi, `5c73517` ürün başına tek satır + açılır boyut düzenleme). Preview'da yalnızca Macaron fiyat eşleşmesi ve açılır boyut ekranı doğrulandı; diğer Preview kontrolleri yapılmadı (2026-10-12).** **Aşama 5 (müşteri üyeliği): `c6f1292` `supabase-test`'e pushlandı ve Preview'da Ready; `0010` `funda1959-test`'te; kullanıcının local ve Preview testleri ile local otomatik kontroller (38/38) geçti; temel akışlar local ve Preview'da doğrulandı, kalan kontroller ertelendi (2026-10-12). Google ve Funda Puan kapalı; özel SMTP sonraya bırakıldı.** **Aşama 6 (Funda Puan): `0011` ve `0011_funda_points_test.sql` `funda1959-test`'te kullanıcı tarafından çalıştırıldı, ikisi de başarılı (2026-10-13). Local uygulama + gerçek test projesinde health, admin düzeltmesi, müşteri görüntüleme, GOP engeli, kapalı kullanım ve API üzerinden eşzamanlı düşüş doğrulandı (1. tur 28/28, 2. tur 22/22). İki oturumlu rezervasyon eşzamanlılığı gerçek test projesinde SQL Editor'da geçti (B 17,7 sn bekledi, `insufficient_points`; tek rezervasyon, kalan 20, borç 0; temizlik `TEMİZ`). Kod, `0011` ve testler `51c0028` ile `supabase-test`'e pushlandı; Merkez araması düzeltmesi `5e8b814` (puan hesabı olmayan üye de bulunur; local tarayıcı testi 34/34). **Kapalı altyapı hazırlığı tamamlandı (2026-10-14):** Preview'da üye arama ve ilk Merkez düzeltmesi kullanıcı tarafından doğrulandı (+25 müşteri ekranına yansıdı, −25 sonrası bakiye 0, iki hareket). Diğer Preview kontrolleri açık. Kazanım ve kullanım kapalı (D41).** **Aşama 7 (Instagram): Supabase'e bağlanmadı (D42, 2026-10-14); içerik tek dosyadan elle yönetilir ve deploy ile yayınlanır. Kod `e066056` ile `supabase-test`'e pushlandı; liste boş olduğu için ana sayfada bölüm gizli; Preview kontrolü kullanıcıda.** **Aşama 8 (iletişim talepleri, D43): kod, `0012` ve testler `78305ba` ile `supabase-test`'e pushlandı (2026-10-14); `0012` `funda1959-test`'te uygulandı (kullanıcı). **Preview'da form → Merkez listesi, İşlemde + iç not, Kapandı kullanıcı tarafından doğrulandı; gerçek Supabase'de üç sekmeli eşzamanlılık testi GEÇTİ (2026-10-14).** Preview'da health `0012` ok ve GOP menüsünde yokluk kullanıcı tarafından doğrulandı; GOP API 403 local'de doğrulandı. Açık: Preview'da GOP API 403, form hata durumları, 429 mesajı, filtre/sayaç, SQL testi sonucu. Form yalnızca test ortamında açık; Production API reddeder; canlıya açılış A19 + A24'e bağlı. Canlıdaki çalışmayan formu gizleyen düzeltme `origin/main` üzerinden ayrı dalda (`fix/iletisim-formu-gizle`) hazır; commit edilmedi (§8.5).** Production projesi kurulmadı; `main` (`60355bf`) ve Production değişmedi.
> **Çalışma klasörü:** `funda1959-supabase-test` — GitHub `supabase-test` dalının ZIP'i (`.git` yok; önceki yerel klasör silindi). Plan ilk olarak `funda1959-git` — son commit `60355bf` + commit edilmemiş değişiklikler — üzerinde hazırlandı (bkz. §8).
> **Kapsam:** Site ve admin paneli aynı Next.js projesinde kalır; ayrıştırma kapsam dışıdır.
> **Son güncelleme:** 2026-10-22 (D50 teslimat bölgeleri tek tablo: mahalle başına şube, gönderim ve ücret, Excel; 0015 yeniden yazıldı, hazır; D49 mahalle → şube; D48 "Ürün Bilgisi": "Yayında" tiki, Excel'den ürün yükleme, 0014 hazır; önceki: 2026-10-21 D44 teslimat tarihi/saati kuralı; D45–D46 ürün ekleme, §8.6; D47 metinler — hepsi commit yok, 0013, 0014 ve 0015 çalıştırılmadı)

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
| **D5** | **Ürün yönetimi:** admin'den yalnızca **mevcut ürünlerin fiyatları** güncellenir. Ürün ekleme, silme, görsel veya içerik düzenleme ekranı **yapılmaz**. Şube bazında aktif/pasif stok yönetimi ayrıca korunur. Fiyat güncelleme yetkisi **Merkez yönetim** hesabındadır. | Katalog (ürün, kategori, içerik, görsel) **kodda kalır**. Veritabanına yalnızca fiyat geçersiz kılmaları (`product_prices`) taşınır. Ürün/kategori tabloları ve ürün görsel deposu **yapılmaz**. **D45 ile değişti (2026-10-21):** Merkez yeni ürün ekleyebilir (taslak → yayın, görsel yükleme); mevcut ürünler için D5 aynen geçerli (kodda kalır, içerik/görsel düzenleme ve silme yok). |
| **D6** | **Admin hesapları:** toplam 4 hesap: GOP, Panora, İncek TONA, Merkez yönetim. Kişi bazlı çalışan hesabı yok. Şube hesapları yalnızca kendi şubelerinin yetkili işlemlerini yapar; Merkez tüm şubeleri yönetir. | Mevcut env + imzalı çerez yapısı **kalıcı çözümdür** (önceki "Seçenek A"). Admin için Supabase Auth ("Seçenek B") **yapılmaz**. |
| **D7** | **Müşteri hesabı:** üyelik olacak; üye olmadan da sipariş verilebilecek. Misafir siparişlerinin sonradan üyeliğe bağlanması ve misafirlerin puan kazanma davranışı **kararlaştırılmadı**. | Müşteri için Supabase Auth (önceki "Seçenek C") yapılır. Misafir sipariş korunur. Misafir → üye bağlama ve misafir puanı için hiçbir varsayım yapılmaz (§9). |
| **D8** | **Ödeme:** sağlayıcı seçilmedi; entegrasyon bu aşamada **atlanır**. Ödeme alınmayan demo siparişleri **"ödendi" olarak kaydedilmez**. Bu kararlar gerçek sipariş kabulünü **otomatik açmaz**. | Demo siparişler `payment_status = pending`. Sipariş kabulü kapısı kapalı kalır (§6.1). |
| **D9** | **Funda Puan** kuralları:<br>• Online siparişlerde tutarın **%10'u** kadar puan (5.000 TL → 500 puan).<br>• **1 puan = 1 TL.**<br>• Her kazanım **kendi tarihinden itibaren 1 yıl** geçerli; yeni alışveriş eski puanların süresini uzatmaz.<br>• Puan **yalnızca online** alışverişte kullanılır.<br>• Kazanılan puan **sipariş verildikten hemen sonra** hesapta görünür.<br>• **Teslimat ücretinden puan verilmez.**<br>• **Puanla ödenen siparişten tekrar puan kazanılmaz.**<br>• **İptal/iadede** o siparişten kazanılan puan hesaptan **alınır**; o siparişte harcanan puan **iade edilir**. | Hareket kaydı + "puan partisi" (her kazanımın kendi son kullanma tarihi) tasarımı (§2.3). Kazanım sipariş oluşturulduğunda yazılır. Müşteri hesabına (D7) bağlıdır. |
| **D10** | **Minimum sipariş 500 TL.** Teslimat ücreti bölgeler netleşince girilecek ve **yapılandırılabilir** olacak. Ücret belirlenmedi diye **ücretsiz teslimat kabul edilmez**. | Bölge ücreti veritabanında. "Belirlenmedi" ile "0 TL" ayrı durumlar; belirlenmemiş bölgeye adrese teslim siparişi alınmaz. **Öneri [V]:** minimum tutar teslimat ücretinden önceki ürün toplamına uygulansın (karar değil; §9). |
| **D11** | **Teslimat kapasitesi:** şimdilik **saatlik sipariş sınırı yok**. Sahte "dolu" değerleri kaldırılır. Bir saatlik teslimat aralıkları, çalışma saatleri, hazırlık süreleri ve aktif/pasif stok kuralları korunur. Aktif/pasif stok ile teslimat kapasitesi **ayrı** kavramlardır. 10 dakikalık rezervasyonun gerekliliği değerlendirilecek; gereksiz karmaşıklık oluşturulmayacak. | Kapasite hesabı ve demo "dolu" sayıları kaldırılır. Rezervasyon **değerlendirmesi** aşağıda. Rezervasyon tablosu, kapasite RPC'si ve slot kapasite tabloları **yapılmaz**. |
| **D12** (A12, 2026-10-10) | **Sipariş işlemleri:** şube hesabı **yalnızca kendi şubesinin** siparişlerini ilerletebilir ve iptal edebilir; Merkez **tüm şubelerde** aynı yetkilere sahiptir. İptalde **gerekçe zorunlu**; işlemi yapan hesap, tarih ve gerekçe kaydedilir. **Teslim edilmiş siparişin iptali ve ödeme iadesi bu aşamada yok.** Yetkiler sunucuda kontrol edilir. | `PATCH /api/admin/orders` + RPC `update_order_status` (`0007`): durum yalnızca bir adım ilerler (teslimatta "Yolda" atlanmaz); kapsam imzalı oturumdan gelir ve veritabanında yeniden kontrol edilir; her değişiklik `order_status_events` tablosuna, iptal ayrıca `orders.cancel_*` alanlarına yazılır. |
| **D13** (A10, 2026-10-10) | **Demo siparişler Funda Puan kazandırmaz** — bellek dahil hiçbir depoda. Gerçek puan kazanımı bu aşamada etkinleştirilmez. | `lib/funda-points/service.ts` → `awardPointsForOrder` demo siparişi `DEMO_ORDER` ile reddeder; `lib/orders/engine.ts` puan çağırmaz. Kazanım Aşama 6'da veritabanı defteriyle bağlanır. |
| **D14** (A3, 2026-10-10) | **Minimum sipariş:** adrese teslimde **500 TL**; hesap **ürün toplamı − indirim**, **teslimat ücreti dahil değil**. **Gel-al siparişlerinde minimum yok.** Bölgelere ait 250/300 TL örnek minimumlar kaldırılır; 500 TL şimdilik **kodda sabit**. Sepet ve hızlı sipariş akışında eksik tutar gösterilir; adrese teslimde minimum sağlanmadan checkout'a geçilmez, gel-ale geçilebilir. Ödeme hesabı ve sipariş oluşturma aynı kuralı sunucuda yeniden doğrular. **Puan kullanımının minimuma etkisi açık karar (A13); puan işlemleri açılmaz.** | `lib/order-rules.ts` (`MIN_DELIVERY_ORDER_TL = 500`, `deliveryMinimumShortfall`); `lib/order-server.ts` → 409 `BELOW_MINIMUM`; `create_order` (`0008`) aynı kontrolü yapar (500 TL SQL'de de sabit; ikisi birlikte değişir); sepet / hızlı sipariş / checkout uyarı ve engel. |
| **D15** (A4'ün ücret kısmı, 2026-10-10) | **Teslimat ücretleri:** Supabase'de **bölge kimliğine bağlı**; **yalnızca Merkez düzenler**, şubeler kendi bölgelerini **salt okunur** görür. Üç durum ayrı: **belirlenmedi**, **ücretli**, **açıkça ücretsiz**; boş değer veya eksik kayıt **0 TL sayılmaz**. Örnek ücretler veritabanına aktarılmaz. Ücret belirlenmeyen bölgede adrese teslim engellenir; gel-al çalışır. **Kuruş desteklenir**; fiyat ve toplam gösteriminde yuvarlama farkı olmaz. Ücret okunamazsa **"Teslimat bilgisi şu an alınamıyor"**; eski değerle hesap veya sipariş yapılmaz. Son değiştiren hesap ve tarih kaydedilir; **geçmiş tablosu yok**. Mevcut siparişlerin kayıtlı ücret ve toplamları değişmez. **Bölge/mahalle eşlemeleri kesinleşmedi:** mevcut listeler test amaçlı korunur, onaylanmış hizmet kapsamı sayılmaz. | `0008_delivery_zone_fees.sql` (`delivery_zone_fees`: `state` unset/paid/free + `fee`; `create_order` ücreti tablodan doğrular); `lib/delivery/fees.ts` + `fees-server.ts`; motor, ödeme hesabı ve sipariş aynı kaynaktan; `PATCH /api/admin/delivery-fees` (yalnızca Merkez); admin "Bölgeler"; `formatTL` kuruş gösterir. |
| **D16** (A1'in gösterim kısmı, 2026-10-12) | **Boyutlu ürünlerde fiyat gösterimi:** kartlarda doğrudan **en küçük boyutun fiyatı** yazar; "başlayan fiyat" gibi bir ifade kullanılmaz. Ürün sayfasında **seçilen boyutun fiyatı** gösterilir (boyut büyüdükçe fiyat da büyür). Boyut fiyatlarının girişi → D20; p13 → D21. | `lib/data.ts` → `productSizes` (boyutlar ve katalog fiyatları tek yerde), `cardPrice` (kart ve fiyat sıralaması: en küçük boyut); `ProductDetail` başlığı boyut seçilmeden en küçük boyutun, seçilince seçilen boyutun fiyatı (boyut seçimi zorunlu kalır). |
| **D17** (A2, 2026-10-12) | **Fiyat güncelleme:** Merkez fiyatları **gece, elle** günceller. **Otomatik zamanlama yok; ayrı fiyat değişikliği bildirimi yok.** | Zamanlama ve bildirim yapılmaz. Sepet, hızlı sipariş ve checkout satır fiyatlarını sunucudan sessizce günceller; ödeme ekranı siparişin tutarını gösterir. |
| **D18** (A20, 2026-10-12) | **Üstü çizili eski fiyat** yalnızca **bizim açıkça belirlediğimiz** ürünlerde gösterilir; fiyat değişince **otomatik oluşturulmaz**. **Mevcut gösterimler kaldırılmaz** (p13 ₺580 → 12'li paket, D21; p18 ₺290). **Eski fiyat güncel fiyattan yüksek değilse gizlenir** (koruma onaylandı, 2026-10-12). | Eski fiyat katalog içeriğidir (`catalogMeta.oldPrice`, boyutta `SIZE_PRICES`); admin'den yönetilmez. Eski fiyatlı ürünler "Fiyatlar" ekranında diğerleri gibi düzenlenebilir (p18 açıldı). Yükseltilmiş fiyat indirim gibi görünmez (`oldPriceShown`, `showsOldPrice`); gösterim kendiliğinden oluşmaz, katalogdaki değer silinmez. |
| **D19** (A21, 2026-10-12) | **Fiyat okunamazsa:** yeni ekran veya karmaşık yapı eklenmez; **mevcut hata alanları** kullanılır. **Sipariş ve ödeme hesabında güncel fiyat doğrulanamıyorsa işlem ilerlemez.** | Sipariş ve ödeme hesabı 503 "Ürün fiyatları şu an doğrulanamadı…" (ödeme özetindeki hata satırı, sipariş hata alanı; demo butonu pasif). Sepet ve checkout özetinde mevcut toplam alanının altında not. Katalog ve ürün ekranları ek yapı olmadan o sunucunun son başarılı okumasını, yoksa katalog fiyatını gösterir. |
| **D20** (A1, 2026-10-12) | **Boyut fiyatları ayrı ayrı girilir.** Merkez her boyutun fiyatını **bağımsız** günceller; **otomatik çarpan uygulanmaz**. Yeni fiyat belirlenmez: **bugünkü boyut fiyatları başlangıç değeridir.** | `lib/data.ts` → `SIZE_PRICES`: 12 ürünün 41 boyut fiyatı tek tek yazılı (eskiden çarpanla üretilen değerler aynen; çarpan ve `round10` kaldırıldı). `product_prices` satırı `(ürün, boyut)`; "Fiyatlar" ekranında ürün başına tek satır, boyutlu ürünün boyutları açılır bölümde ve her boyutun ayrı düzenleyicisi var (6 tek fiyat + 41 boyut = 47 düzenleyici; `5c73517`). Bir boyutun kaydı yalnızca o boyutu değiştirir. Sipariş ve ödeme hesabı boyutsuz kalemi reddeder ("Ürün için bir boyut seçin."). |
| **D21** (A22, 2026-10-12) | **Trüf Çikolata (p13):** kartta en küçük paket (6'lı) **₺260**, eski fiyat **gösterilmez**. Ürün sayfasında **12'li seçilince ₺520 ve üstü çizili ₺580**. **Eski fiyat yalnızca ait olduğu boyutta gösterilir.** | ₺580 12'li boyuta taşındı (`SIZE_PRICES.p13`). Kart en küçük boyutun eski fiyatını gösterir (p13'te yok). Ürün sayfası başlığının yanında seçilen boyutun eski fiyatı, D18 korumasıyla. Hızlı sipariş ve arama eski fiyat göstermez (önceden de göstermiyordu). |
| **D22** (A11, 2026-10-12) | **Müşteri giriş yöntemleri:** e-posta + şifre ve sosyal giriş. İlk sosyal sağlayıcı **Google**; **Apple** ve **Facebook** kurulumları ayrıca yapılınca açılır. **Instagram müşteri girişi olarak eklenmez** (Instagram Login işletme ve içerik üreticisi hesapları içindir). **Yapılandırılmamış sağlayıcının butonu gösterilmez.** | Butonlar yalnızca bağlı Supabase projesinde açık olan sağlayıcılar için görünür (§8.2). Telefonla giriş bu aşamada yok (SMS servisi gerekir; D4) [V]. Dış kurulum: §7.6 "Aşama 5 kurulum kontrolü". **Google şu an engelli** (D29, A25): kodda kapalı, Supabase panelinde de kapalı kalır. |
| **D23** (2026-10-12) | **E-posta doğrulaması zorunlu değil:** e-posta + şifre kaydından sonra kişi doğrudan giriş yapmış olur. **Şifre sıfırlama e-postayla** çalışır. | Supabase'de "Confirm email" kapalı. Sıfırlama bağlantısı `/auth/confirm` → `/sifre-yenile`. Riskler ve önlem: §8.2. Production'dan önce özel SMTP gerekir. |
| **D24** (2026-10-12) | **Profil, adresler, siparişler, checkout:** profilde ad soyad, telefon (doğrulamasız), e-posta (bu aşamada değiştirilemez) ve şifre değiştirme. Checkout'ta iletişim bilgileri profilden dolar, sipariş için değiştirilebilir; sipariş hesaba bağlanır. "Siparişlerim" **yalnızca üye girişliyken verilen** siparişleri gösterir. **En fazla 10 kayıtlı adres, bir varsayılan**; mahalle checkout'taki bölge listesinden seçilir. Hesap silme bu aşamada yok. | `customer_profiles`, `customer_addresses`, `orders.customer_user_id` (`0010`, §8.2). |
| **D25** (2026-10-12) | **Aşama 5'in dışında kalanlar:** misafir siparişleri **otomatik bağlanmaz** (A5 açık); **admin hesapları değişmez** (D6); **Funda Puan açılmaz** (Aşama 6). Misafir sipariş aynen sürer. | Mevcut siparişlerde `customer_user_id` boş kalır. Admin çerezi ve 4 env hesabı aynı kalır. |
| **D26** (2026-10-12) | **KVKK ve üyelik metinleri** hazır olmadan **onay alınmış gibi kayıt oluşturulmaz**. **Pazarlama izni şimdilik eklenmez.** | Metin yayımlanmadıkça onay kutusu gösterilmez, onay kaydı yazılmaz (`terms_version` boş). Test ortamındaki kayıtlar D27'ye göre. Kayıt formundaki pazarlama kutusu kaldırıldı; tabloda izin sütunu yok. Metinler: A24. |
| **D27** (2026-10-12; D26'nın uygulaması düzeltildi) | **Test ortamında kayıt akışı denenebilir:** web ekibi local ve Preview'da (`funda1959-test`) test hesaplarıyla kayıt olabilir. **Gerçek müşteriye üyeliğin açılması ve hukuki metinlerin tamamlanması ayrı kalır.** Sahte onay kaydı oluşturulmaz. | `isSignupOpen()` yalnızca test verisinde açık; Production'da kayıt istek gönderilmeden 403. Test projesinde "Allow new users to sign up" açık, production projesinde kapalı. Açılış: metinler (A24) + kod değişikliği + ayrı onay. |
| **D28** (2026-10-12) | **Checkout ve sipariş detayı:** varsayılan adres checkout'ta önceden seçili olabilir. Müşteri **kendi siparişinin iptal gerekçesini görebilir.** | Varsayılan adres yalnızca formda adres yokken ve kayıtlı bölge boş ya da aynıyken seçilir; başlıkta seçilen başka bölgenin yerine geçmez. Gerekçe görünür, işlemi yapan hesap görünmez (§8.2). |
| **D29** (2026-10-12) | **Otomatik şifre geçersizleştirme veya toplu oturum kapatma uygulanmaz.** E-posta doğrulaması kapalı kalır (D23). Google ↔ e-posta/şifre hesap eşleşmesi güvenli biçimde çözülemiyorsa Google bağlantısı etkinleştirilmez. | Supabase belgeleri doğrulandı; otomatik bağlama doğrulama kapalıyken güvensiz ve kapatılamıyor → Google engelli (§8.2 "Google engeli", A25). Çıkış yalnızca o tarayıcının oturumunu kapatır (`scope: "local"`). |
| **D30** (A26, 2026-10-12) | **Şifre değişince diğer oturumlar:** Supabase'in, şifre güncellenince aynı hesabın diğer oturumlarını sonlandırma davranışı **korunur.** | Supabase diğer oturumların yenileme belirteçlerini iptal eder; o oturumlar en geç erişim belirtecinin süresi dolunca (varsayılan 1 saat) kapanır. Uygulama kendisi oturum kapatmaz (D29 geçerli). Kabul kriteri buna göre düzeltildi. |
| **D31** (A5'in puan kısmı, 2026-10-12) | **Puanı yalnızca giriş yapmış üyeler kazanır**, yalnızca online siparişlerde (web, mobil). Misafir siparişleri puan kazanmaz ve sonradan otomatik bağlanmaz. | Kazanım koşulu `orders.customer_user_id` dolu, kanal `web`/`mobile`, sipariş demo değil (`fp_earn_for_order`, 0011). |
| **D32** (2026-10-12) | **Kazanım, ödeme onaylandığında** gerçekleşir. 1 puan = 1 TL (D9). | `complete_order_payment` (0011) ödemeyi işaretler, rezervasyonu tamamlar ve puanı yazar. Ödeme sağlayıcısı gelene kadar çağrılmaz (Aşama 9). |
| **D33** (A6, 2026-10-12) | **Kazanım = indirimlerden ve kullanılan puandan sonra kalan ürün tutarının %10'u**; teslimat ücreti hariç. Örnek: 1.000 TL üründe 200 puan kullanılırsa 800 TL üzerinden 80 puan. | `floor((ara toplam − indirim − kullanılan puan) × %10)`; SQL'de kesin ondalık, uygulamada tam sayı kuruş hesabı (aynı sonuç). |
| **D34** (2026-10-12) | **Her kazanım ayrı bir parti**, kazanıldığı andan itibaren **1 yıl** geçerli. Kullanımda **son kullanma tarihi en yakın** puanlar önce tüketilir. | `funda_point_lots.expires_at = earned_at + 1 yıl`; tüketim `fp_take_fefo`. |
| **D35** (A13'ün puan kısmı, 2026-10-12) | **500 TL minimum**, puan düşülmeden önceki indirimli ürün toplamına göre kontrol edilir. | Sunucu (`buildOrderPayload`) ve `create_order` minimumu ara toplam − indirim üzerinden yapar; puan etkilemez. |
| **D36** (A9'un ilk kısmı, 2026-10-12) | **Puan yalnızca ürün tutarında** kullanılır, teslimat ücretinde kullanılamaz; **ürün tutarının tamamına kadar** kullanılabilir. | Tam sayı puan: kuruşlu tutarda kalan kuruş ödenir. Sınır sunucuda ve veritabanında (`orders_points_within_products`). |
| **D37** (A9'un son kısmı, 2026-10-12) | **Tamamı puanla ödenen sipariş** için sunucuda güvenli tamamlama akışı; mevcut Production sipariş engelini aşamaz. | `complete_order_payment(…, 'funda_points')` yalnızca toplam 0 ve aktif rezervasyonla; uygulamada `completePointsOnlyOrder` puan anahtarı ve sipariş kapısı açıkken. |
| **D38** (A7, 2026-10-12) | **İptalde kullanılan puanlar orijinal son kullanma tarihleriyle geri gelir.** Süresi dolmuş puan yeniden harcanabilir hale gelmez. | İade aynı partilere yapılır; süresi dolmuş partiye dönen kısım `expired_points` olarak kaydedilir, bakiyeye eklenmez. |
| **D39** (A8, 2026-10-12) | **İptalde kazanılan puan geri alınır.** Daha önce harcanmışsa bakiye eksiye düşebilir; sonraki kazanımlar bu borcu kapatır. Kullanılabilir bakiye sıfırın altına düşmez. | Geri alma önce o siparişin partisinden, sonra son kullanma sırasıyla diğerlerinden; kalan kısım `funda_point_accounts.debt`. Her yeni kazanım ve iade önce borcu kapatır. |
| **D40** (2026-10-12) | **Admin:** uydurma müşteriler kaldırılır, gerçek veri yoksa boş durum gösterilir. Merkez düzeltmeleri **gerekçe ve işlemi yapan admin** ile kaydedilir; şube hesapları yetki kazanmaz. Ana sayfadaki "Funda Puan %10" posteri **mevcut haliyle kalır**. | `adjust_funda_points` (yalnızca `merkez`), tekrar korumalı istek kimliği; poster ve kampanya içeriğine dokunulmadı. |
| **D41** (2026-10-12) | **Gerçek ödeme entegrasyonu tamamlanana kadar kazanım ve kullanım sunucu tarafında kapalı**; kullanıcıya çalışan bir özellik gibi sunulmaz. Demo siparişler puan kazanamaz ve harcayamaz. | `isFundaPointsActive()` = `false` (kod anahtarı, ortam değişkeni değil). Kapalıyken: puan isteyen sipariş/teklif 409, checkout'ta puan alanı yok, Hesabım "henüz etkin değil" der. Veritabanı demo siparişte puanı ayrıca reddeder. |
| **D42** (A16, 2026-10-14) | **Instagram bölümü Supabase'e bağlanmaz.** İçerik (poster, isteğe bağlı video, gerçek gönderi/reel bağlantısı) proje içinde tek dosyada (`src/lib/social/instagram-content.ts`) elle yönetilir; dosyalar `public/social/reels/` altında; değişiklik deploy ile yayınlanır. Admin'de Instagram düzenleme ekranı yok. `0012` Instagram migration'ı, Storage ve dosya yükleme yapılmaz. | Ana sayfada en fazla 5 kart, mevcut 9:16 tasarım. Video isteğe bağlı: videosuz kart Instagram gönderisine bağlantıdır. Geçerli yayında içerik yoksa bölüm gizlenir; örnek/yer tutucu kayıt yayınlanmaz. Kullanım §8.4. |
| **D43** (A17, 2026-10-14) | **İletişim talepleri (Aşama 8):** yalnızca **Merkez** görür ve yönetir (şube erişemez). Şimdilik yalnızca admin paneline kayıt; **e-posta bildirimi özel SMTP ile sonra.** Zorunlu: ad, konu, mesaj ve en az bir iletişim yolu (telefon veya e-posta). Mevcut 5 konu korunur; özel gün ve kurumsal başvuruların **sipariş değil talep** olduğu formda yazar. Durumlar **Yeni / İşlemde / Kapandı**; yalnızca Merkez'in gördüğü **iç not**. Dış servis yok: **gizli tuzak alanı** + **sunucuda, veritabanına dayalı gönderim sıklığı sınırı** (birden fazla Vercel örneğinde de geçerli). "24 saat" sözü kaldırılır; yerine "Talebinizi inceleyip belirttiğiniz iletişim kanalından dönüş yapacağız." Form **önce yalnızca test ortamında** açık; **Production API'si gönderimi reddeder.** **Aydınlatma metni, saklama süresi ve silme politikası canlıya açılmadan önce ayrıca netleşir (A19, A24) — kod bunlara karar vermez.** | `isContactFormOpen()` (kod anahtarı) = yalnızca `test`; Production'da form gösterilmez, `POST /api/contact` gövdeyi okumadan 503. Başarı mesajı yalnızca veritabanı satırı döndükten sonra. Aynı istek kimliği tek satır. Ayrıntı §8.5. |
| **D44** (2026-10-21) | **Teslimat tarihi ve saati — bütün ürünlerde aynı kural.** Seçili şubenin mevcut **aktif/pasif** stok bilgisi esastır (adetli stok yok): aktif ürün **bugün** sipariş edilebilir; pasif ürün için "En erken yarına teslim" aynen kalır. Hazırlık süresi, üretim günü, ürün/kategori bazlı bekleme, sipariş kesim saati veya ek teslimat tamponu bugünü **engellemez**. Şubenin tanımlı aktif slotları ve çalışma saatleri korunur. Europe/Istanbul: bugün başlangıç saati geçmiş veya şu ana eşit slot soluk ve seçilemez (10.30'da 10.00–11.00 kapalı, 11.00–12.00 açık); geçmiş tarih seçilemez; sayfa açıkken seçili saat geçerse seçim düşer ve yeni saat istenir; gelecek günlerde tanımlı slotlar seçilebilir. | Motor tek kaynak (`lib/availability/engine.ts`): `evalSlot` ürüne bakmaz (şube saati + `slotHasStarted`), `branchDayCheck` yalnızca pasif stok. Kaldırılanlar: `prepTimeMinutes`, `sameDayEnabled` (envanter), `preparationTimeHours`, `sameDayDelivery` (katalog), istemcideki hazırlık süresine dayalı en erken tarih. Teklif ve sipariş aynı motoru sunucunun saati ve taze şube stoğuyla çalıştırır (`SLOT_STARTED`, `NO_SLOTS_LEFT_TODAY`, `NEXT_DAY_ONLY` → 409). Checkout saatleri sunucudan (şube slotu + stok) gelir, başlamış olanlar soluk; ürün sayfasında da aynı. `create_order` yalnızca geçmiş tarihi reddeder → migration gerekmedi. Kod hazır, commit edilmedi (2026-10-21). Ürün metinlerindeki "24 saat önceden" ifadeleri: A31. |
| **D45** (2026-10-21; D5'i kısmen değiştirir) | **Ürün ekleme:** Merkez admin panelindeki **"Ürün Ekle"** ekranından yeni ürün ekleyebilir: ad, mevcut kategorilerden biri, kısa açıklama, bilgisayardan yüklenen görsel (önizleme + değiştirme), fiyat ve mevcut yapıya uygun boyutlar (boyutlu kategoride her boyut ayrı fiyat, D20), şube başına aktif/pasif stok (adet yok). Ürün önce **taslak** kaydedilir; zorunlu alanlar tamamlanınca **yayınlanır**. Yayınlanan ürün kategori, ürün sayfası ve mevcut sipariş akışlarında kullanılır; tarih/saat D44. **Yetki: yalnızca Merkez** — şube hesapları menüyü görmez, doğrudan API isteği reddedilir (403). **Ürün silme yok.** Hazırlık süresi veya bekleme günü alanı yok. Mevcut ürünlerin kimlikleri, içerikleri ve eski sipariş kayıtları korunur; mevcut ürünler kodda kalır, veritabanına taşınmaz veya yeniden oluşturulmaz. | Plan §8.6 (2026-10-21): `catalog_products` (taslak/yayın), Storage `product-images`, katalog birleştirme (kod + yayınlanmış ürünler), sipariş kalemi koruması. Ayrıntılar D46; ilk parça (veritabanı, katalog birleştirme, sunucu yetkileri) hazır, commit yok (2026-10-21). |
| **D46** (A27–A30, 2026-10-21) | **Ürün yönetimi ayrıntıları:** (1) Yayınlanmış yeni ürün **düzenlenebilir** ve **yayından kaldırılabilir** (sonra yeniden yayınlanabilir); **silme yok**. Eski siparişler ürün adı, boyut ve fiyatın kendi kopyasını korur; yayından kaldırılan ürün **yeni siparişe kapanır**. (2) **Alerjen** bilgisi, **pasta yazısı desteği** (ürün bazında) ve **etiketler** (Yeni, Çok Satan, Hediyelik) alanları; **doğrulanmamış içerik veya alerjen bilgisi üretilmez** — girilmeyen bilgi gösterilmez. (3) Görsel: mevcut ürün fotoğraflarının oranı (kare), uzun kenar en fazla **1600 px**, en az **800 × 800**, dosya en fazla **4 MB**, JPEG/PNG/WebP; **önizlemesiz otomatik kırpma yok**; sunucu dosyanın içeriğini ve boyutlarını doğrular. (4) Ürün yönetimi **önce yalnızca test ortamında**; **Production API'si yazmayı reddeder**. | `isProductManagementOpen()` (kod anahtarı) = yalnızca `test`; Production'da her ürün API'si oturum ve gövde okunmadan 503. Yayından sonra adres (slug) sabit; zorunlu alanlar boşaltılamaz (veritabanı kısıtı). İçerik/alerjen/saklama metni boş ürün sayfasında gösterilmez. Görsel kuralları `lib/catalog/rules.ts` + `catalog_product_images` kısıtları. Ayrıntı §8.6. |
| **D47** (A31, 2026-10-21) | **Aynı gün siparişini engelleyen zorunlu 24/48 saat ifadeleri** D44'e uygun güncellenir; gerçekte sunulmayan bir teslimat garantisi eklenmez. | Çikolatalı Çilekli Pasta "Teslimat Bilgileri" ve Şubeler sayfası "Sipariş & Rezervasyon" metni değişti; admin "Teslimat Slotları" açıklamasındaki "hazırlık süresi" kaldırıldı. Kod hazır, commit yok. |
| **D48** (2026-10-22) | **"Fiyatlar" → "Ürün Bilgisi":** fiyat ve boyut düzenleme aynen kalır. (1) **"Yayında" tiki** her üründe (mevcut 18 ürün dahil): ürünün **bütün şubelerdeki genel yayın durumu**. Kaldırılınca ürün katalog, kategori, arama ve ana sayfa listelerinden çıkar, ürün sayfası açılmaz, **yeni teklif ve sipariş reddedilir**; tekrar işaretlenince (panel ürününde yayın koşulları sağlanıyorsa) yeniden görünür. Şube stok ayarları değişmez; ürün kimlikleri ve eski sipariş kayıtları korunur. Kayıt başarısızsa tik eski hâline döner ve hata gösterilir. (2) **"Excel'den Ürün Yükle":** indirilebilir .xlsx şablon (zorunlu sütunlar: Ürün Adı, Kategori, Açıklama ve fiyat — tek fiyatlı kategoride "Fiyat", boyutlu kategoride en az bir boyut), kayıttan önce önizleme (eksik/hatalı satırlar satır numarasıyla), "İçe Aktar" ile kayıt. Ürün adı eşleştirme anahtarıdır: aynı dosya tekrar yüklenince mükerrer ürün oluşmaz, mevcut ürün güncellenir (boş hücre mevcut değeri korur). Excel'de görsel yoktur: mevcut ürünün görseli korunur, yeni ürün görselsiz **taslak** kalır. Mevcut 18 ürün Excel ile değişmez. Yalnızca Merkez, yalnızca test ortamı (D46). | Kod ürünleri: `product_visibility` (**0014**; `set_product_visibility`, `order_items` tetikleyicisi `order_items_visibility_guard`); satır yok = yayında. Panel ürünleri kendi durumuyla (0013: yayınla / yayından kaldır; yayınlama koşulları aynı). Gizli kod ürünü `setPublishedProducts(list, hidden)` ile mağaza listelerinden çıkar; `catalogWithHidden()` yalnızca panelde (fiyat ve stok ekranları). API: `/api/admin/products/visibility`, `/api/admin/products/import?mode=preview|commit` (commit önizlenen dosyanın özetini ister), `/api/admin/products/import/template`. Yeni ürünün istek kimliği addan türetilir (`imp-…`, 0013'teki tekil `client_request_id`). Bir satırın Excel fiyatı o boyutta kayıtlı Merkez fiyatından farklıysa Merkez fiyatı da güncellenir (sitede görünen fiyat dosyadaki olur). Panel ürünü düzenleme: `/admin?section=product-edit&id=…`. Kod hazır (local), commit yok; 0013 ve 0014 çalıştırılmadı. |
| **D49** (2026-10-22; D15'in bölge kısmını değiştirir) | **Teslimat bölgeleri Merkez'de seçilir:** "Teslimat Bölgeleri" ekranında şube (GOP, Panora, İncek TONA) → ilçe → mahalle tikleri; mahalle araması, "Bu ilçedeki tüm mahalleleri seç", seçimleri kaldırma ve geri alma; kayıtlı bölgeler işaretli gelir, ilçe değiştirirken diğer ilçelerdeki seçimler korunur; tek "Kaydet". **Her ilçe–mahalle en fazla bir şubeye** bağlıdır; başka şubedeki mahalle mevcut şubesiyle gösterilir, taşıma kayıttan önce onay ister. Aynı adlı mahalleler farklı ilçelerde ayrı yerlerdir (ilçe eşleşmesi kesin; eski "ilçe esnek" eşleşme kaldırıldı). İlçe/mahalle uydurulmaz: liste mevcut bölge verisidir (Çankaya 17, Gölbaşı 5 mahalle; diğer ilçelerin mahalle listesi yok). Müşteri ilçe+mahalle seçince şube bu eşleşmeden belirlenir; stok, saat ve ücret o şubeye göre; sipariş o şubeye düşer; eşleşmeyen adreste "teslimat yapamıyoruz" açıkça gösterilir; adres/şube değişince sepet yeniden kontrol edilir ve uygunluğu değişen ürünler adlarıyla bildirilir. Teklif ve siparişte şube sunucuda adresten bulunur (tarayıcının şube kimliği kullanılmaz). Bölge değişikliği verilmiş siparişlerin şubesini değiştirmez. Yönetim yalnızca Merkez; şubeler kendi bölgelerini salt okunur görür. | `delivery_area_assignments` (**0015**; birincil anahtar ilçe+mahalle, `set_delivery_area_assignments` tek işlemde ve "panelin gördüğü sahip" kontrolüyle — araya giren değişiklikte hiçbir şey kaydedilmez, 409). İlk dolum = eski kod listesi (müşteri için değişiklik yok); yeniden çalıştırma silinen bölgeyi geri getirmez. Bölge (ücret birimi) = şube + ilçe; eski 4 bölgenin kimliği ve ücreti korunur, yeni şube+ilçe çifti `zone-<şube>-<ilçe>` olarak "Belirlenmedi" ücretle başlar (ücret girilene kadar adrese teslim yok, D15). Okuma kuralı ücretlerle aynı: gösterim birkaç sn önbellek, teklif/sipariş taze; okunamazsa adrese teslim `DELIVERY_INFO_UNAVAILABLE`, eski harita kullanılmaz. Tarayıcı haritayı `GET /api/delivery-areas`'tan alır; yüklenemezse "bilinmiyor" der, "teslimat yok" demez. 0015 yokken eski liste geçerli ve ekran kaydetmez (sunucu 503). Kod hazır (local), commit yok; 0015 çalıştırılmadı. |
| **D50** (2026-10-22; D49'u ve D15'in bölge ücreti kısmını genişletir) | **"Teslimat Bölgeleri" tek tablo:** şube → ilçe → mahalleler satır satır; sütunlar: satır seçimi (toplu işlem), mahalle, gönderim açık/kapalı, Ücretsiz/Ücretli, teslimat ücreti (TL), mevcut bağlı şube. **Her mahallenin kendi ücreti** var; "Ücretsiz" = 0, "Ücretli" pozitif tutar ister, boş değer ücretsiz sayılmaz. Gönderimi kapatmak mahalleyi silmez, o adrese yeni adrese teslim siparişi alınmaz. Her ilçe–mahalle tek şubeye bağlı; taşımadan önce mevcut şube gösterilip onay istenir; aynı adlı mahalleler farklı ilçelerde ayrıdır. Toplu: seçilenlere ücret uygula, ücretsiz yap, gönderimi kapat/aç, bu şubeye taşı; "Tümünü seç" yalnızca görünen (filtrelenmiş) listeyi kapsar. Şube/ilçe değiştirince kaydedilmemiş düzenlemeler korunur; altta sabit "Değişiklikleri Kaydet — X mahalle" ve "Değişiklikleri geri al"; şube, gönderim ve ücret birlikte, **ya hep ya hiç** kaydedilir, hata olursa düzenlemeler ekranda kalır. Üst araçlar: mahalle araması, Bölge Ekle, Excel'den Yükle, Örnek Şablon İndir (mevcut bölgelerle). Excel sütunları İlçe \| Mahalle \| Şube \| Gönderim Açık \| Teslimat Ücreti (TL); 0 ücretsiz, pozitif ücretli, boş/negatif hata; önizlemede yeni / değişecek / aynı kalan / hatalı; mükerrer kayıt yok, dosyada olmayan bölge silinmez; şube değişiklikleri için onay. Elle ekleme ve Excel, tabloya kaydedilmemiş düzenleme olarak eklenir ve aynı "Kaydet" ile kaydedilir. Eski alttaki bölge ücret tablosu kaldırıldı. Müşteri: şube ilçe+mahalleden, stok ve saatler o şubeden, ücret mahallenin kendi kaydından; teklif ve siparişte sunucu güncel eşleşmeyi, gönderim durumunu ve ücreti doğrular. | Tablo `delivery_areas` (0015, D49 tasarımının yerine; 0015 hiçbir yerde uygulanmamıştı): birincil anahtar ilçe+mahalle, katlanmış `area_key` tekil, `zone_id` = 'area-' + md5(area_key) (üretilmiş), `branch_slug`, `delivery_enabled`. Mahalle ücreti `delivery_zone_fees`'te mahallenin `zone_id`'siyle tutulur — `create_order` siparişin ücretini zaten bu satıra göre doğruluyor (belirlenmemiş → red, farklı → red), bu yüzden `create_order` değişmedi. Yeni `orders_delivery_area_guard` tetikleyicisi: 'area-' bölgeli teslimat siparişinde mahalle var, açık, siparişin şubesine bağlı ve siparişin adresi o mahalle olmalı. Kayıt RPC'si `save_delivery_areas`: tek işlem, her satır "panelin gördüğü" durumla karşılaştırılır (çakışma → hiçbir şey kaydedilmez, 409). İlk kurulum: eski 22 mahalle, hepsi açık, **her mahalle eski bölgesinin ücretiyle** (ücret satırı yoksa "Belirlenmedi"; ücret uydurulmaz). Bölge Ekle'de ilçe yalnızca sipariş formunun bildiği 8 ilçeden seçilir. Eski `/api/admin/delivery-fees` ve ücret tablosu bileşenleri kaldırıldı. Kod hazır (local), commit yok; 0015 çalıştırılmadı. |
| **D51** (2026-10-22; D50'nin ekranını sadeleştirir, kurallar aynı) | **"Teslimat Bölgeleri" sade ekran:** başlık altında tek cümle; şube sekmeleri (ilk açılışta GOP, mahalleler doğrudan görünür); "Tüm ilçeler" filtresi, mahalle araması, "Bölge Ekle", "Excel'den Yükle". Tablo: toplu seçim · İlçe · Mahalle · Teslimat Ücreti (satır içinde, ₺; "0 TL = ücretsiz"; boş/negatif/geçersiz kabul edilmez) · Gönderim (tek anahtar). Yalnızca seçili şubenin mahalleleri (kapalılar dahil); şube adı satırlarda tekrar edilmez. Bölge Ekle küçük pencere (ilçe, mahalle, ücret; şube = seçili sekme; başka şubedeki mahallede taşıma onayı). Excel ayrı pencere (şablon, dosya, hatalar, önizleme, taşıma onayı) ve değişiklikleri tabloya aktarır. Toplu çubuk yalnızca seçim varken: ücret uygula, gönderimi aç/kapat. Alt "Vazgeç · Kaydet" çubuğu yalnızca değişiklik varken, değişen mahalle sayısıyla. Kurulum eksikse "Kurulum bekleniyor. Değişiklikler henüz kaydedilemez." + katlanmış teknik ayrıntı; Kaydet kapalı. | Ücret durumu metinden çıkar: boş = belirlenmedi (yalnızca hiç ücreti olmamış kapalı mahallede kabul), 0 = ücretsiz, > 0 = ücretli. Sunucu, veri, yetki, teslimat hesabı ve sipariş yönlendirmesi D50'deki gibi. Kod hazır (local), commit yok. |
| **D52** (2026-10-22) | **Gerçek mahalle havuzu (Ankara / Çankaya, Gölbaşı):** kaynaklar Çankaya Belediyesi, ABB Çankaya (3 sayfa), Gölbaşı Belediyesi, ABB Gölbaşı (2 sayfa); yalnızca ilçe ve mahalle adları alındı (muhtar adı, telefon, adres yok), erişim 22.10.2026. Havuz şube ataması ve ücretten ayrıdır; havuzdaki mahalle atanmamış, kapalı ve ücretsiz değil (ücret tanımsız) başlar — müşteriye teslimat açmaz. Görünen ad ilçe belediyesinin yazımı; ABB'deki farklı yazım ve "Oran" → Or-An, "Ümitköy" → Ümit arama karşılıklarıdır (ayrı mahalle değil). Yalnızca ABB'de görünen "Namık Kemal" doğrulama bekler, şubeye eklenemez. Eski kayıtlar (Aşağı/Yukarı Ayrancı, Dikmen, Yıldız, Gölbaşı/Gölbaşı) silinmez, birleştirilmez; "resmî listede yok" işaretiyle korunur. Bölge Ekle ve Excel aynı havuzu kullanır; yeni bölge yalnızca doğrulanmış havuz kaydı olabilir, eski adıyla kayıtlı bir yer ikinci kez eklenemez. | Veri dosyası `src/lib/delivery/data/ankara-mahalleler.json` (kaynaklar, erişim tarihi, farklar), modül `neighborhood-pool.ts`. Veritabanı değişikliği yok: havuz kodda, atamalar `delivery_areas` (0015, çalıştırılmadı). Sunucu yeni bölgeyi havuza göre doğrular; Excel şablonuna "Mahalle Havuzu" sayfası eklendi. Kaynak farkları: Saraçoğlu yalnız ilçe belediyesinde, Namık Kemal yalnız ABB'de; 11 Çankaya + 1 Gölbaşı yazım farkı (dosyada). Kod hazır (local), commit yok. |
| **D53** (2026-10-22; D51–D52 ekranı) | **"Mahalle Ekle" (eski "Bölge Ekle") çoklu seçim:** başlıkta seçili şube; ilçe seçilince doğrulanmış havuz; aranabilir, tik kutulu liste, "sonuçların tümünü seç" (yalnızca atanmamışlar), seçili sayısı; seçimler ilçe kimliğiyle tutulur, ilçe değişince kaybolmaz. Bu şubedeki mahalle "Zaten ekli"; başka şubedeki şube adıyla gösterilir, taşıma açık onay ister. Havuzu olmayan ilçede "mahalle listesi henüz yüklenmedi" yazar, örnek üretilmez. Elle ekleme "Listede yok, elle ekle" bağlantısının arkasında. Ortak ücret alanı boş başlar (₺, "0 TL = ücretsiz"), boş/negatif/geçersizde ekleme kapalı; "X Mahalleyi Listeye Ekle" tabloya kaydedilmemiş değişiklik ekler, kalıcı kayıt ana "Kaydet". Tablo sütunları sabit genişlikte, dar ekranda kaydırılır. | Sunucu: elle eklenen ad (`manual`) yalnızca havuzda olmayan yer için kabul edilir; havuzdaki bir yerin elle ikinci kaydı reddedilir. Kod hazır (local), commit yok. |
| **D54** (2026-10-22) | **Ücret tanımsız kalır:** yeni ve atanmamış mahallenin ücreti boş/tanımsızdır, hiçbir yerde 0 veya ücretsiz sayılmaz; yalnızca yöneticinin açıkça girdiği 0 ücretsizdir. Gönderim yalnızca geçerli ücret varken açılır (tablodaki anahtar ve toplu "Gönderimi aç" ücretsiz satırı açmaz; sunucu ve veritabanı da reddeder). "Mahalle Ekle"de ortak ücret boş bırakılırsa mahalleler ücret tanımsız ve gönderime kapalı eklenir; taşımada ücret girilmezse mahallenin kendi ücreti ve durumu korunur. Mevcut kayıtların ücretleri değişmedi. **İncek TONA adresi:** "TONA Residence, Alacaatlı Mahallesi, Kanuni Sultan Süleyman Bulvarı D:160/K, Çankaya/Ankara" (kodda; mağaza seçiminde mahalle "Alacaatlı"). Adres teslimat atamalarını etkilemez. | `lib/branch/index.ts`, `lib/data.ts`. Veritabanındaki `branches.address` (0001 ilk dolumu) eski adresle duruyor; uygulama bu sütunu okumuyor. Kod hazır (local), commit yok. |
| **D55** (2026-10-22) | **Mahalle havuzu 8 ilçeye genişledi** (seçimde görünen bütün ilçeler): Çankaya 125 (124 + Namık Kemal bekliyor) ve Gölbaşı 54 aynen; Yenimahalle 57, Keçiören 51, Etimesgut 38, Sincan 58 (57 + Gaziosmanpaşa bekliyor), Mamak 64, Altındağ 26. Kaynak: her ilçede ABB muhtarlık listesi ve ilçe belediyesi listesi; Yenimahalle ve Etimesgut'ta ilçe listesi alınamadığı için (sayfa tarayıcıda oluşuyor / liste yok; kaymakamlık siteleri HTTP 500) yalnızca ABB kullanıldı ve kayıtlarda belirtildi. Otomatik şube ataması veya ücret yok. 0015 test projesinde uygulanmaya hazır; doğrudan veritabanı erişimi olmadığından kullanıcı SQL Editor'da çalıştırır. | Veri dosyası aynı (`ankara-mahalleler.json`; kaynaklar, alınamayan kaynaklar ve farklar içinde). 0015 sonuna `notify pgrst, 'reload schema'` eklendi. Hedef doğrulandı (salt okunur): proje `xvoiqcohmsrcmcszcvki`, `app_environment = test`, 0001/0007/0008 tabloları var, `delivery_areas` yok. |

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
- **Tamamlanan:** `funda1959-test` + Preview kurulumu (§7.6, adım 12–13), Aşama 1 doğrulaması (§8), Aşama 2'nin local + gerçek test Supabase doğrulaması ve Preview doğrulaması (§7.6 "Aşama 2 kurulum kontrolü"), Aşama 3'ün local + gerçek test Supabase doğrulaması ve Preview doğrulaması (`63331f7`; §7.6 "Aşama 3 kurulum kontrolü", 2026-10-10).
- **Sıradaki:**
  - Aşama 4 (fiyat yönetimi): fiyat kararları D16–D21 işlendi; her boyutun fiyatı ayrı düzenlenebilir (47 fiyat), p13 kartı ₺260. `0009` `funda1959-test`'e uygulandı; local ve gerçek test Supabase kontrolleri geçti (2026-10-12, §7.6). Kod pushlandı (`04d7f43`, `5c73517`); Preview'da yalnızca Macaron fiyat eşleşmesi ve açılır boyut ekranı doğrulandı. Kalan Preview kontrolleri bekliyor (§7.6 "Aşama 4 kurulum kontrolü", adım 4),
  - Aşama 5 (müşteri üyeliği): temel akışlar local ve Preview'da doğrulandı, kalan kontroller ertelendi ve açık (§7.6 "Aşama 5 durumu"); D30 kabul edildi.  Google engeli kararı bekliyor (A25),
  - Aşama 6 (Funda Puan): kararlar D31–D41; `0011` ve SQL testi `funda1959-test`'te kullanıcı tarafından çalıştırıldı ve geçti (2026-10-13); local + gerçek test projesi kontrolleri ve iki oturumlu rezervasyon eşzamanlılığı geçti (§7.6 "Aşama 6 kurulum kontrolü"). Kod `51c0028` ile `supabase-test`'e pushlandı; Preview'da bulunan arama hatası (puan hesabı olmayan üye bulunamıyordu) `5e8b814` ile düzeltildi (local tarayıcı testi 34/34). **Kapalı altyapı hazırlığı tamamlandı (2026-10-14);** Preview'da arama ve ilk düzeltme kullanıcı tarafından doğrulandı, kalan Preview kontrolleri açık (§7.6 adım 7). Kazanım/kullanım ödeme entegrasyonuna (Aşama 9) kadar kapalı,
  - Aşama 7 (Instagram): D42 — Supabase'e bağlanmadı; içerik `src/lib/social/instagram-content.ts` dosyasından elle yönetilir, deploy ile yayınlanır (§8.4). Kod `e066056` ile `supabase-test`'e pushlandı; Preview kontrolü kullanıcıda,
  - Aşama 8 (iletişim talepleri): D43; kod `78305ba` ile pushlandı; `0012` `funda1959-test`'te uygulandı. Preview'da form, Merkez listesi ve durum/iç not kullanıcı tarafından doğrulandı; gerçek eşzamanlılık testi GEÇTİ (2026-10-14). Doğrulandı ek: Preview health `0012` ok, GOP menüsünde yok (kullanıcı); GOP API 403 (local). Açık: Preview'da GOP API 403, form doğrulama ve hata durumları, 429 mesajı, filtre/sayaç; `0012` SQL testinin sonucu (bildirilmedi). Canlı form düzeltmesi ayrı dalda hazır (§8.5). Canlıya açılış A19 + A24'e bağlı,
  - Production kurulumu (§7.6, adım 14) ayrı onayla; sipariş alımı kapalı kalır (§6.1).
- **Kalan bilinen sorunlar [K]:**
  - Teslimat ücreti ve minimum (Aşama 3): ücret `delivery_zone_fees`'ten (D15), minimum 500 TL adrese teslimde (D14); `0008` test projesinde (2026-10-10), production'da yok. Bölge/mahalle listeleri ve test projesindeki ücretler test amaçlı, onaylı fiyat değil (A4).
  - Puanın minimuma etkisi açık (A13).
  - Derlenmiş sürümde (Vercel dahil) büyük, sunucuda çizilen bir admin tablosu React geçişini askıda bırakabiliyor: "Fiyatlar" ve "Teslimat Bölgeleri"nde kayıt sonrası tablo yenilenmiyor, menüden "Fiyatlar" açılmıyordu. İki tablo istemci bileşenine çevrildi ve kayıt satırı doğrulanmış veritabanı kaydıyla güncelleniyor (2026-10-12, §7.6 "Aşama 4 … Sonuç"). Siparişler ekranı 25 siparişle sorunsuz; başka ekranda aynı belirti görülürse aynı yöntem uygulanır.
  - Ödeme ekranı toplamı sunucunun hesabıdır (2026-10-10): `POST /api/orders/quote` siparişle aynı kodu (`buildOrderPayload`) çalıştırır, hiçbir şey yazmaz; ekranda ürün toplamı ve teslimat ücreti ayrı, toplam ücret dahil ve siparişin toplamıyla aynı. Sepet, hızlı sipariş ve checkout özeti seçili adresin güncel ücretini sunucudan alır (`POST /api/delivery-fee`) ve aynı satırları gösterir; demo sipariş butonu yalnızca geçerli tutar hesabıyla açılır (Aşama 3 arayüzü, 2026-10-10).
  - Aşama 2 düzeltmeleri (İstanbul tarihi, sipariş anında doğrulama, eşzamanlı aynı istek, admin listesi, D12 yetkileri) local + gerçek `funda1959-test` üzerinde ve Preview'da doğrulandı (2026-10-10, §7.6).

---

## 1. Mevcut durum

### 1.1 Veri grupları

Supabase sütunu: **Hazır** = kod ve migration var, ortam kurulumu bekleniyor · **Kısmen** = bir kısmı var · **Eksik** = Supabase karşılığı yok · **Gerekmiyor** = karar gereği kodda kalır.

| Veri grubu | Mevcut kaynak | Okuyan / yazan dosyalar | Supabase | Canlıda kalıcılık sorunu | Gereken değişiklik |
|---|---|---|---|---|---|
| **Ürünler** (18) | Kod sabiti: `lib/data.ts` → `products`, `catalogMeta`, `productDetailMeta`. Boyut fiyatları `SIZE_PRICES`'ta tek tek yazılı (12 ürün, 41 boyut; D20 öncesi p1 hariç taban fiyattan çarpanla üretiliyordu) **[K]** | Katalog/PDP sayfaları, `lib/search.ts` (tarayıcıda), `lib/order-server.ts` (fiyatı yeniden hesaplar), sepet. Yazan yok **[K]** | İçerik: **Gerekmiyor** (D5). Fiyat: Eksik. **Yeni ürünler (D45):** `catalog_products`, planlandı (§8.6) | Yok (statik) | Ürün içeriği kodda kalır. **Fiyat geçersiz kılmaları** `product_prices` tablosunda, Merkez ekranıyla (Aşama 4). |
| **Kategoriler** (11) | `lib/data.ts`, `lib/product-taxonomy.ts` **[K]** | Katalog, menü, admin stok ekranı **[K]** | Gerekmiyor (D5) | Yok | Yok |
| **Ürün görselleri** | `public/products/**` (35 dosya, 6,2 MB), kategori bazlı eşleme `lib/product-images.ts` **[K]** | Katalog, PDP, sepet, arama | Gerekmiyor (D5) | Yok | `public/` içinde kalır; değişiklik deploy ile. |
| **Şubeler** (3) | İki kaynak: `lib/branch/index.ts` (çalışma saatleri, teslimat/gel-al bayrakları; motor bunu kullanır) ve `lib/data.ts` → `branches` (açıklama, harita, saat metni; sayfalar, footer, schema.org) **[K]**. DB: `branches` (0001; slug, ad, adres, telefon) | Motor, admin, sayfalar **[K]** | Kısmen | Yok (okuma) | Kodda kalır (admin'de şube düzenleme talebi yok). İki kaynak tek kaynakta birleştirilmeli **[V]**. `branches` tablosu FK hedefi olarak kalır. |
| **Şube stokları** (aktif/pasif) | `lib/inventory/*`; depo: Supabase / yerel dosya / "kullanılamaz" (`server-init.ts`) **[K, commit edilmedi]** | Motor, `/admin`, `api/availability`, `api/orders`; yazan `api/admin/inventory` **[K]** | **Hazır** (`0003`) | Şu an 500 **[G]**; yeni kod deploy edilince DB yoksa 503 (sahte başarı yok) | Commit + kurulum (Aşama 1). |
| **Teslimat bölgeleri** (4) | `lib/delivery/zones.ts`: mahalle listeleri + demo ücretler (55/60/70/75 TL) + demo minimum (250/300 TL) **[K]** | Tarayıcıda: `lib/delivery/context.tsx`, `AddressPicker`. Sunucuda: motor, checkout **[K]** | Ücret: Eksik | Ücret siparişe girmiyor (`lib/order-server.ts`: `deliveryFee = 0`); bölge minimumu uygulanmıyor **[K]** | Mahalle listeleri kodda kalır (bölgeler netleşince güncellenir). **Ücret** veritabanında (`delivery_zone_fees`), Merkez ekranı. Demo ücret/minimum değerleri **kullanılmaz** (D10; Aşama 3). |
| **Teslimat slotları** | `lib/delivery/slots.ts`: 2 saatlik pencereler → saatlik slotlar; kapasite + **demo "dolu"** (`slotConfirmedCount`, `SLOT_OVERRIDES`) **[K]** | Motor (`evalSlot`), `lib/checkout-utils.ts`, admin "Teslimat Slotları" **[K]** | Gerekmiyor (D11) | Sahte "dolu" görünümü **[K]** | **Aşama 0:** kapasite ve demo "dolu" kaldırılır. Saatlik aralıklar, çalışma saatleri ve hazırlık süreleri korunur. |
| **Rezervasyonlar** (10 dk) | `lib/reservations/index.ts` (bellek) **[K]** | `api/reservations`, `PaymentPage`, motor, admin **[K]** | Gerekmiyor (D11 değerlendirmesi) | Örnek başına bellek; sahte "kapasiteniz ayrıldı" **[K]** | **Aşama 0:** kaldırılır. |
| **Siparişler ve kalemleri** | Doğrulama + fiyat: `lib/order-server.ts`. Kayıt: `lib/orders/engine.ts` → Supabase varsa RPC `create_order` (0001), yoksa `MockOrderRepository` **[K]** | `api/orders`, `PaymentPage` (yalnızca dev demo butonu), `/siparis-basarili`, `/siparis-takip`, `/admin` siparişler/genel bakış (**yalnızca bellekteki depo**) **[K]** | Kısmen | Canlıda bellek: kayboluyor **[G]**. Bellek yolunda demo sipariş **"paid"** **[K]** | **Aşama 0:** demo → `pending` + açık `is_demo` (`0006`); production sipariş alımı sunucuda kapalı. Aşama 2: DB'den liste/durum, RPC düzeltmeleri, sipariş anında yeniden doğrulama. |
| **Kampanyalar** | `lib/campaigns/*`; Supabase deposu hazır; seed `mock.ts` (5 poster) **[K]** | Ana sayfa, admin kampanya ekranı, `api/admin/campaigns` **[K]** | **Hazır** (`0002` + `0005`) | Canlıda bellek | Kurulum. Kampanya **tarihleri ve koşulları kararlaştırılmadı**; kampanyalar bugün yalnızca içerik, indirim mantığı yok **[K]**. |
| **Instagram içerikleri** | `src/lib/social/instagram-content.ts` (kodda, elle); dosyalar `public/social/reels/` | Ana sayfa | — | Kodda | **D42:** veritabanına taşınmaz; deploy ile güncellenir (§8.4). Admin ekranı ve `api/admin/instagram` kaldırıldı. |
| **Müşteri hesapları ve adresleri** | Giriş/kayıt stub: `lib/auth.ts`; hesap verisi mock: `lib/account-service.ts`. `customers`/`addresses` (0001) yalnızca sipariş anı kaydı **[K]** | `/giris`, `/uye-ol`, `/sifremi-unuttum`, `/hesabim/*` **[K]** | Eksik | Ekranlar önizleme | Supabase Auth ile üyelik (D7, Aşama 5); misafir sipariş korunur. |
| **Funda Puan** | `0011` defteri (partiler, hareketler, rezervasyonlar; **`funda1959-test`'e uygulandı, 2026-10-13; production yok**). Uygulama: `lib/funda-points/{config,rules,types,store,service}.ts`; bellek defteri ve uydurma müşteriler kaldırıldı **[K]** | Admin Funda Puan ekranı, `api/admin/funda-points`, Hesabım `/hesabim/puanlarim`, checkout (kapalı) **[K]** | Hazır (`0011`) | Yok (bellek kalmadı) | Kazanım ve kullanım ödeme entegrasyonuna kadar kapalı (D41); §8.3 |
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

Aşağıdaki dört madde Aşama 2'de giderildi (2026-10-10, `0007` + kod; local + gerçek test Supabase'inde ve Preview'da doğrulandı, §7.6):

- **`create_order` eşzamanlı aynı istekte hata veriyordu.** Aynı `client_request_id` ile gelen ikinci istek benzersizlik ihlaline düşüp 10 denemeden sonra `order_number_generation_failed` alıyordu. → `0007`: istek kimliği başına `pg_advisory_xact_lock`; ikinci istek ilkinin bitmesini bekler ve aynı siparişi döndürür.
- **Supabase sipariş yolunda kaybolanlar:** `deliveryZoneId` ve `salesChannel` RPC'ye gitmiyordu; teslimat siparişine şube yazılmıyordu (`branch_id` yalnızca gel-alda doluyordu); admin listesi bu siparişleri görmüyordu. → `0007`: `delivery_zone_id`, `sales_channel`, teslimatta adresten çıkan şube; admin listesi `list_orders` ile veritabanından. (Puan Aşama 6.)
- **Saat dilimi:** `lib/order-server.ts` → `earliestDate()`, `lib/checkout-utils.ts` → `earliestDeliveryDate()` ve admin "bugün"/saatleri makine saatine göre çalışıyordu. → hepsi Europe/Istanbul.
- **Sipariş anında uygunluk kontrolü yoktu:** geçmiş saat, yetmeyen hazırlık süresi, pasif ürün, şubede olmayan saat aralığı ve hizmet dışı adres kabul ediliyordu. → `lib/order-server.ts` motorla (`getCartAvailability`) yeniden kontrol eder; uygun değilse 409, stok okunamıyorsa 503.
- **Admin girişi:**
  - 4 env hesabı, HMAC imzalı çerez (12 saat, `httpOnly`, `sameSite=lax`, üretimde `secure`).
  - Oran sınırlaması yok (`app/api/admin/auth/login/route.ts` içinde TODO).
  - Server Action yok; bütün yazmalar Route Handler üzerinden.
- **Önbellek:** Cache Components kapalı (`next.config.ts` boş). `supabaseRest` her istekte `no-store`. Aşama 4'ten önce `/urunler/[slug]` ve `/lezzetlerimiz/[kategori]` build sırasında üretiliyordu (fiyat build anında giriyordu); artık fiyat gösteren sayfalar istek anında çiziliyor (§3 "Önbellek").
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
6. **RLS:** her tabloda açık. anon için yazma politikası yok. `0010` de politika eklemez: üye verisi yalnızca sunucudan, oturumdaki kullanıcı kimliğiyle okunur (§4.4, §8.2).

### 2.2 Mevcut tablolar ve eklemeler

| Tablo (migration) | Bugün | Ekleme **[V]** |
|---|---|---|
| `branches` (0001) | `id uuid`, `slug unique`, `name`, `address`, `phone`, `is_active`; anon okuma politikası | Yok (şube bilgileri kodda; tablo FK hedefi). |
| `customers` (0001) | Her siparişte yeni satır (misafir) | Yok. Üyeye bağlantı `orders.customer_user_id` ile kurulur (Aşama 5, §8.2) [V]; `customers` siparişin iletişim bilgisi kaydı olarak kalır. |
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
| `product_prices` (**`0009`, `funda1959-test`'te**) | `product_id text`, `variant_key text not null default ''` (`''` = ürünün tek fiyatı, yoksa boyut kimliği: `4-6`, `500g`, `12` …; biçim kontrolü `^[0-9a-z.-]{0,20}$`), `price numeric(10,2) not null check (0 < price ≤ 100000)` (kuruş), `updated_by text not null`, `updated_at timestamptz` | PK `(product_id, variant_key)`. Her boyut ayrı satır, çarpan yok (D20). Satır yoksa koddaki fiyat geçerli (başlangıç değerleri); seed yok. Ürün ve boyut API'de koddaki kataloğa göre doğrulanır: bilinmeyen ürün, boyutlu üründe boyutsuz / bilinmeyen / başka ürünün boyutu, tek fiyatlı üründe boyut → 400; ürüne ait olmayan satırlar uygulanmaz. Yalnızca Merkez yazar (şube 403). Eski fiyatlı ürünler düzenlenebilir (D18). Son değiştiren + tarih; geçmiş tablosu yok. `create_order` v5: kayıtlı fiyatı olan kalem (tek fiyat veya boyut) o fiyatı taşımalı (`price_mismatch`). |

**Teslimat ücreti (D10; Aşama 3)**

| Tablo | Alanlar | Kurallar |
|---|---|---|
| `delivery_zone_fees` (**`0008`, hazır**) | `zone_id text PK` (koddaki bölge kimliği), `state text` (`unset` / `paid` / `free`), `fee numeric(10,2) null`, `updated_by text`, `updated_at timestamptz` | Check: `unset` ↔ `fee null`, `paid` ↔ `fee > 0` (kuruş), `free` ↔ `fee = 0` (yalnızca açık seçimle). **Satır yok = belirlenmedi**, ücretsiz değil → o bölgeye adrese teslim alınmaz (gel-al etkilenmez). Seed yok. Yalnızca Merkez yazar; son değiştiren + tarih, geçmiş tablosu yok (D15). |

**Minimum sipariş (D10):** tek değer (500 TL). Tablo yerine kodda tek bir sabit (`lib/order-rules.ts`) **[V]**. Değişmesi web ekibi işi, admin ekranı gerekmiyor. Uygulama tabanı §9'da onay bekliyor.

**Müşteri hesabı (D7, D22–D26; Aşama 5, §8.2)**

| Tablo | Alanlar | Kurallar |
|---|---|---|
| `customer_profiles` | `auth_user_id uuid PK references auth.users on delete cascade`, `full_name`, `phone`, `email` (Auth e-postasının kopyası), `terms_version text null`, `terms_accepted_at timestamptz null`, zaman damgaları. **Pazarlama izni sütunu yok (D26).** | Onay alanları birlikte dolu ya da birlikte boş (check). Metinler yayımlanmadan dolmaz (D26). RLS açık, politika yok. |
| `customer_addresses` | `id uuid`, `auth_user_id FK`, `label`, `district`, `neighborhood`, `address_line`, `building`, `floor`, `apartment`, `note`, `is_default bool` **[K: `AccountAddressInput`]** | Kullanıcı başına **en fazla 10** (D24; kaydeden fonksiyon kullanıcı başına kilitle sayar). Kısmi unique `(auth_user_id) where is_default` (tek varsayılan). İlk adres varsayılan; varsayılan silinirse en eski adres varsayılan olur. Yazma yalnızca RPC ile. RLS açık, politika yok. |

**Funda Puan (D9, D31–D41; Aşama 6) — `0011_funda_points.sql`, `funda1959-test`'e uygulandı (2026-10-13), production'a uygulanmadı**

Her kazanım kendi son kullanma tarihiyle bir **parti**. Kullanılabilir bakiye = süresi dolmamış partilerin kalanları. Defter değişmezi: üyenin hareket toplamı = bütün partilerin kalanı − borç.

| Tablo | Alanlar | Kurallar |
|---|---|---|
| `funda_point_accounts` | `auth_user_id` PK, `debt int ≥ 0` | Her puan işlemi bu satırı kilitler: aynı bakiye iki siparişte harcanamaz. |
| `funda_point_lots` | `source` (`earn`/`admin`), `source_order_id` (sipariş başına tek), `points`, `remaining`, `earned_at`, `expires_at` (= `earned_at` + 1 yıl) | Kalan 0…points. |
| `funda_point_transactions` | `type` (`EARN`, `REDEEM`, `REDEEM_RELEASE`, `REFUND`, `REVERSAL`, `EXPIRE`, `ADMIN_ADD`, `ADMIN_SUBTRACT`), işaretli `points`, `expired_points`, `business_key` unique, `available_after`, `debt_after`, `reason`/`actor_*` | Yalnızca ekleme (güncelleme tetikleyiciyle reddedilir). Merkez hareketlerinde gerekçe ve admin zorunlu. |
| `funda_point_lot_movements` | `transaction_id`, `lot_id`, `points` | Hangi hareketin hangi partiden ne aldığı veya ne geri verdiği; iade bunlara göre yapılır. |
| `funda_point_reservations` | `order_id` PK, `points`, `status` (`reserved`/`captured`/`released`/`refunded`), `hold_until` | Ödeme bekleyen siparişin puanı. |
| `orders` (ek) | `points_redeemed`, `points_earned`, `points_status`, `payment_reference`, `paid_at` | Kısıtlar: puan yalnızca üyede, demo siparişte asla, en fazla `floor(ara toplam − indirim)`. |

Fonksiyonlar (hepsi yalnızca `service_role`; iç yardımcılar API'ye kapalı):

| Fonksiyon | Görev |
|---|---|
| `create_order` v7 | v6 + `points_redeemed`: puanlar siparişle aynı işlemde partilerden alınır (rezervasyon, 30 dk). Yetmezse sipariş hiç oluşmaz (`insufficient_points`). Demo siparişte puan reddedilir. Toplam = ara toplam − indirim − puan + teslimat. |
| `complete_order_payment(no, method, ref)` | Ödeme onayı: `paid`, rezervasyon `captured`, puan kazanımı. `funda_points` yöntemi yalnızca toplam 0 ise. Demo siparişi reddeder; tekrar çağrıda aynı sonuç. |
| `fail_order_payment(no)` | Başarısız ödeme: `failed`, rezerve puan aynı partilere geri döner. |
| `release_expired_point_reservations()` | Süresi dolan rezervasyonlar (ödenmemiş) için yukarıdaki. Zamanlanmış iş (pg_cron) Aşama 9'da. |
| `update_order_status` v2 | v1 + iptalde puan: ödenmemişse bırakma, ödenmişse iade + kazanımın geri alınması (gerekirse borç). |
| `expire_funda_points()` | Süresi dolan kalanları `EXPIRE` ile siler (doğruluk buna bağlı değil). |
| `adjust_funda_points(...)` | Merkez düzeltmesi: + yeni 1 yıllık parti (önce borcu kapatır), − son kullanma sırasıyla ve en fazla kullanılabilir bakiye. Yalnızca `merkez`, gerekçe 3–300 karakter, istek kimliğiyle tekrar korumalı. |
| `get_funda_points_summary`, `get_funda_points_admin_detail`, `list_funda_point_accounts` | Okuma: üye kendi bakiyesi/partileri/hareketleri (admin adı ve gerekçesi yok); Merkez listesi ve ayrıntı. |

**İçerik ve iletişim**

| Tablo | Alanlar | Kurallar |
|---|---|---|
| `contact_requests` (**`0012`, Aşama 8; `funda1959-test`'te uygulandı, production'da yok**) | `id uuid`, `full_name` (2–120), `phone` / `email` (en az biri; biçim kontrolü), `subject` (5 konu), `message` (10–3000), `status` (`new` / `in_progress` / `closed`), `internal_note` (≤2000, yalnızca Merkez), `client_request_id unique`, `client_key` (IP'nin HMAC'i; IP saklanmaz), `created_at`, `updated_at`, `handled_by`, `handled_at`, `note_updated_by`, `note_updated_at` | RLS açık, politika yok; anon/authenticated erişemez. Yazma yalnızca sunucudan: `submit_contact_request` (tek satır + sıklık sınırı), `update_contact_request` (yalnızca `merkez`), `list_contact_requests` (okuma). Silme fonksiyonu ve otomatik silme yok (A19). |

### 2.4 Yapılmayacaklar (kararlar gereği)

| Önceki öneri | Neden yapılmıyor |
|---|---|
| `categories`, `products`, `product_variants`, `product_branches`, `product_images`; Storage `products` bucket'ı | D5: ürün ekleme/silme/içerik/görsel düzenleme yok. **D45 (2026-10-21):** yalnızca **yeni** ürünler için `catalog_products` + Storage `product-images` planlandı (§8.6); kategoriler ve mevcut ürünler kodda kalır, tam taşıma yok. |
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
| Fiyat (D5; Aşama 4) | Admin "Fiyatlar" (`ProductPricesTable` + `ProductPriceEditor`, yalnızca Merkez); müşteri: katalog, PDP, arama (sayfa + başlık), hızlı sipariş, hediyelik, özel gün, ana sayfa, sepet, checkout, ödeme | `PATCH /api/admin/prices`; `GET /api/prices` (başlık araması), `POST /api/prices` (sepet satırları); fiyat gösteren sayfalar istek anında sunucuda | `lib/pricing/prices.ts` (kurallar, önbellek), `prices-server.ts` (depo), `prices-context.tsx`, `use-cart-prices.ts`; `lib/order-server.ts` ve motor aynı çözücüyü kullanır | `product_prices` |
| Teslimat ücreti ve minimum (D10) | Admin bölge ücreti ekranı (yeni, Merkez); checkout ve ödeme özeti | `GET/PUT /api/admin/delivery-fees` (yeni) | `lib/delivery/fees.ts` (yeni), `lib/order-rules.ts` (yeni), `lib/order-server.ts` | `delivery_zone_fees` |
| Sipariş | `CheckoutPage` → `PaymentPage` | `app/api/orders/route.ts` | `lib/order-server.ts` (doğrulama, fiyat, **motorla yeniden uygunluk**) → `lib/orders/engine.ts` → RPC `create_order` | `customers`, `addresses`, `orders`, `order_items` |
| Sipariş takibi | `/siparis-basarili`, `/siparis-takip` | — (sunucu sayfası) | `getPublicOrder` → RPC `get_order_public` **[K]** | `orders` |
| Admin siparişler | `/admin?section=orders`, `overview` | Sayfa sunucuda; durum için `PATCH /api/admin/orders` (yeni) | `lib/orders/repository.ts` → `SupabaseOrderRepository` (yeni) | `orders`, `order_items` |
| Kampanyalar | Ana sayfa `CampaignsSection` + `CampaignShowcase`; admin `AdminCampaigns` | `app/api/admin/campaigns/route.ts` **[K]** | `lib/campaigns/supabase-repository.ts` **[K]** | `campaigns` |
| Instagram | Ana sayfa (`InstagramContentSection`, `SocialVideoRail`) | — (admin ekranı ve API yok; D42) | `src/lib/social/instagram-content.ts` | — (veritabanı yok) |
| Müşteri hesabı (D7) | `/giris`, `/uye-ol`, `/sifremi-unuttum`, `/hesabim/*` | Supabase Auth (çerez oturumu) + `/api/account/*` (yeni) | `lib/auth.ts`, `lib/account-service.ts` gövdeleri **[K: TODO'lar]** | `auth.users`, `customer_profiles`, `customer_addresses`, `orders` |
| Funda Puan (D9) | Hesabım → puan; checkout'ta kullanım; admin Funda Puan | `/api/account/points` (yeni), `app/api/admin/funda-points/route.ts` **[K]** | `lib/funda-points/service.ts` (kurallar) → RPC'ler | `funda_point_*` |
| İletişim | `/iletisim` (`ContactForm`); admin "İletişim Talepleri" (`AdminContactRequests`) | `POST /api/contact`; `GET/PATCH /api/admin/contact-requests` | `lib/contact/{types,validate,config,store,service}.ts` | `contact_requests` (`0012`) |
| Admin girişi (D6) | `/admin-giris`, `/merkez-giris` | `app/api/admin/auth/*` **[K]** | `lib/admin/{session,access,credentials}.ts` **[K]** | — |

**Önbellek (Aşama 4; Next 16 belgeleri, `node_modules/next/dist/docs`):**

- Önceki öneri (`revalidateTag('prices', 'max')`) **kullanılmadı**: bayat-iken-yenile çalıştığı için değişiklikten sonraki ilk ziyaretçi eski fiyatı görür; anında geçersiz kılan `updateTag` yalnızca Server Action'da çalışır, projede Server Action yok **[K]**.
- Fiyat gösteren sayfalar istek anında çizilir; okunan fiyatlar aynı sunucu sürecinde gösterim için en fazla 5 sn yeniden kullanılır. Ödeme hesabı, sipariş, sepet yeniden fiyatlama ve admin ekranı her seferinde taze okur.
- Tarayıcıda koddan liste kuran yerler güncel fiyatı sunucudan alır: başlık araması `GET /api/prices`, sepet / hızlı sipariş / checkout satırları `POST /api/prices`. Fark bildirimi yapılmaz (D17).

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
  - Supabase Auth, sunucuda; oturum `httpOnly` çerezde (§8.2) [V].
  - `lib/auth.ts` stub gövdeleri buna göre tasarlanmış **[K]**.
  - Gerekecek paket: `@supabase/ssr` + `@supabase/supabase-js` (Supabase'in kendi istemcisi; ek servis değil) **[V]**.
  - Giriş yöntemleri (D22): e-posta + şifre ve Google; Apple ve Facebook kurulunca. Instagram yok, telefonla giriş yok [V]. Bugün stub'larda e-posta/telefon + şifre ve Google/Apple/Facebook butonları var **[K]**; yapılandırılmamış sağlayıcının butonu kaldırılır.
  - E-posta doğrulaması yok (D23). Kayıt yalnızca test ortamında açık; gerçek müşteriye açılış metinlere ve ayrı onaya bağlı (D26, D27). Google engelli (D29, A25).
- **Misafir sipariş** aynen sürer.
- **Bağlama:** üye girişliyken verilen sipariş `customer_user_id` ile hesaba bağlanır. Misafir siparişlerinin sonradan bağlanması **yapılmaz** (D25; A5 açık).
- Ayrıntılı plan: §8.2.

### 4.3 Yetki matrisi

✔ = izinli · ✖ = yasak · (kendi) = yalnızca kendi kaydı/şubesi · **?** = karar bekliyor (§9)

| İşlem | Ziyaretçi / misafir | Üye | Şube hesabı (GOP, Panora, İncek TONA) | Merkez yönetim |
|---|---|---|---|---|
| Katalog, kampanya, Instagram görüntüleme | ✔ | ✔ | ✔ | ✔ |
| Uygunluk sorgulama | ✔ | ✔ | ✔ | ✔ |
| Sipariş oluşturma | ✔ (misafir) | ✔ | ✖ | ✖ |
| Sipariş özeti (sipariş no ile, kişisel veri yok) | ✔ | ✔ | ✔ | ✔ |
| Sipariş geçmişi, kayıtlı adresler | ✖ | ✔ (kendi) | ✖ | ✖ |
| Funda Puan bakiyesi / kullanımı | ✖ (D31) | ✔ (kendi; kullanım D41'e kadar kapalı) | ✖ | ✔ (görüntüleme + gerekçeli düzeltme) **[K]** |
| Şube stok durumu (aktif/pasif) | ✖ | ✖ | ✔ (kendi şube) **[K]** | ✔ (tüm şubeler) **[K]** |
| **Ürün fiyatı güncelleme** | ✖ | ✖ | ✖ | ✔ (D5) |
| **Yeni ürün ekleme** (taslak, görsel yükleme, yayınlama; Excel'den yükleme) | ✖ | ✖ | ✖ (menü görünmez, API 403) | ✔ (D45–D46, D48; yalnızca test ortamı, Production API 503; ekran hazır, commit yok) |
| **Ürün yayın durumu** ("Yayında", tüm şubeler) | ✖ | ✖ | ✖ (menü görünmez, API 403) | ✔ (D48; yalnızca test ortamı, Production API 503) |
| **Ürün silme** | ✖ | ✖ | ✖ | ✖ (D45) |
| **Teslimat ücreti ayarı** (D50: mahalle başına, "Teslimat Bölgeleri" tablosunda) | ✖ | ✖ | ✖ | ✔ [V] |
| **Teslimat bölgesi ayarı** (mahalle → şube, gönderim açık/kapalı, Excel) | ✖ | ✖ | ✖ (kendi bölgeleri salt okunur; API 403) | ✔ (D49–D50) |
| Sipariş listesi | ✖ | ✖ | ✔ (kendi şube) **[K: `repoScope`]** | ✔ |
| Sipariş durumu güncelleme, iptal/iade | ✖ | ✖ | ? (kendi şube) | ✔ |
| Kampanya, Şubeler bölümü (Instagram admin bölümü yok, D42) | ✖ | ✖ | ✖ **[K]** | ✔ **[K]** |
| İletişim formu gönderme | ✔ (yalnızca test ortamında; Production kapalı, D43) | ✔ (aynı) | — | — |
| İletişim taleplerini görme, durum ve iç not | ✖ | ✖ | ✖ (D43) | ✔ |

### 4.4 RLS ve sunucu kontrolleri

- **Service role RLS'yi atlar.** Sunucu service role ile erişir (`lib/supabase-server.ts` **[K]**). Bu yüzden yetkinin asıl yeri sunucu kodudur.
  - Her Route Handler, oturumu (admin çerezi veya müşteri Supabase oturumu) işlemden önce kontrol eder.
  - Örnek kalıp `app/api/admin/inventory/route.ts`: 401 → geçersiz şube 400 → başka şube 403 → doğrulama 400 → yazma koruması 503 → kayıt.
- **RLS savunma derinliği olarak açık kalır:**
  - anon için yazma politikası yok.
  - Üye tabloları (`0010`) da politikasız: tarayıcı tabloları okumaz, sunucu service role ile ve oturumdaki kullanıcı kimliğiyle okur. Önceki "üye kendi satırını okur" önerisi uygulanmadı (gereksiz erişim yolu açmamak için) [V].
- **Service role anahtarı:**
  - Yalnızca sunucu ortam değişkeni; asla `NEXT_PUBLIC_*` değil.
  - İstemci modülleri import edemez: `lib/supabase-server.ts` tarayıcıda yüklenirse hata fırlatıyor **[K]**.
- **Anon (publishable) anahtar:** Aşama 5'te yalnızca sunucuda, müşteri Auth için kullanılır (`SUPABASE_ANON_KEY` [V]; §8.2). Tarayıcıya Supabase istemcisi ve anahtarı gönderilmez; `NEXT_PUBLIC_SUPABASE_*` boş kalır. Tablo okuma ve yazmaları yine API üzerinden.

---

## 5. Dosyalar ve Storage

- **`public/` içinde kalanlar (D5):** ürün fotoğrafları, hero görselleri, logo/ikonlar, fontlar. Ürün görsel düzenleme ekranı yapılmaz; görsel değişikliği deploy ile.
- **Kampanya posterleri:** bugün `public/kampanya/1–5.png` **[K]**; admin formunda görsel alanı yol metni **[K]**. Admin'den yeni poster yükleme istenirse:
  - Storage `campaigns` bucket'ı (public okuma; yalnızca Merkez, sunucu üzerinden imzalı yükleme URL'siyle).
  - `next.config.ts` → `images.remotePatterns` ayarı.
  - Bu bir karar konusu (§9).
- **Yeni ürün görselleri (D45, planlandı, kurulmadı):** Storage `product-images` bucket'ı — herkese açık okuma, yazma yalnızca sunucudan (Merkez oturumu, service role); tür/boyut bucket'ta ve sunucuda doğrulanır (§8.6). Mevcut ürün fotoğrafları `public/`'te kalır.
- **Instagram video/poster (D42):** `public/social/reels/` altında, deploy ile; Storage ve yükleme yok. Videolar `next.config.ts` → `outputFileTracingExcludes` ile sunucu fonksiyon paketine alınmaz (statik dosya olarak sunulur); posterler pakette kalır (ana sayfa varlığını sunucuda kontrol eder).
- **Kaynak kod ve statik varlıklar veritabanına taşınmaz.**

---

## 6. Kritik iş kuralları

| Kural | Bugün nerede **[K]** | Nasıl korunur |
|---|---|---|
| **Pasif ürün görünür kalır; "En erken yarına teslim"; bugün seçilemez** | `lib/availability/engine.ts` → `branchDayCheck`; metinler `lib/delivery/labels.ts` | DB yalnızca `is_active` tutar; müşteri metni DB'den gelmez. Motor değişmez. |
| **Stok ≠ kapasite (D11)** | Stok: `branch_product_status`. Kapasite: `lib/delivery/slots.ts` | Aşama 0: kapasite kavramı kaldırılır; stok kuralı aynen kalır. |
| **Saatlik sınır yok, sahte "dolu" yok (D11)** | `slotConfirmedCount`, `SLOT_OVERRIDES`, `DELIVERY_SLOT_FULL` | Aşama 0: kaldırılır. Slot yalnızca çalışma saati, hazırlık süresi, aynı gün kuralı ve pasif ürün kuralıyla kapanır. |
| **Bir saatlik aralıklar, çalışma saatleri** (hazırlık süresi D44 ile kaldırıldı) | `toHourlyWindows`, `isBranchOpenAt`, `slotHasStarted` (`lib/delivery/slots.ts`) | Aralıklar ve saatler aynen korunur. Bugün başlangıcı geçmiş/şu ana eşit slot seçilemez; ürün bazlı hazırlık süresi, aynı gün bayrağı, kesim saati veya tampon yok (D44). |
| **Europe/Istanbul** | `lib/time/istanbul.ts` | **Aşama 2 (kod):** sipariş doğrulaması, `earliestDeliveryDate()` ve admin "bugün"/saatleri İstanbul'a göre; `create_order` geçmiş tarihi reddeder. |
| **Sipariş anında yeniden doğrulama** (rezervasyon kalkınca) | `lib/order-server.ts` → `getCartAvailability` | **Aşama 2 (kod):** tarih/saat/hazırlık/pasif/şube aralığı/hizmet bölgesi tekrar kontrol edilir; uygun değilse **409**. Stok okunamıyorsa **503** (eski veya varsayılan stokla sipariş alınmaz). Teslimatta şube ve bölge adresten çıkar; fiyat, indirim ve ücret sunucuda hesaplanır. |
| **Tekrarlanan istekler çift kayıt üretmez** | `orders.client_request_id` unique; puan `businessKey` | Sipariş: **Aşama 2 (`0007`)** istek kimliği kilidiyle eşzamanlı istekte de aynı sipariş döner (gerçek test projesinde doğrulandı, 2026-10-10, §7.6). Puan: `business_key unique` + RPC. İletişim: `client_request_id unique`. |
| **Demo siparişler gerçeklerden açıkça ayrılır (D8)** | Bellek yolu `paid` yazıyordu; ayrım yalnızca ödeme durumuna kalıyordu | **Aşama 0 (uygulandı):**<br>• `orders.is_demo` (`0006`, varsayılan `true`) + "demo asla `paid` olamaz" kısıtı; `create_order` yalnızca demo sipariş yazar.<br>• Sunucu her siparişte `is_demo: true` gönderir (`lib/orders/engine.ts`; tarayıcı belirleyemez); bellek yolunda `isDemo`.<br>• Admin sipariş listelerinde "Demo" etiketi.<br>• Production'da sipariş alımı sunucuda kapalı (§6.1).<br>`payment_status = pending` tek başına ayrım değildir. `paid` yalnızca ödeme sağlayıcısı doğrulamasıyla. |
| **Test/canlı veri ayrımı, okuma + yazma (D3)** | `lib/supabase-server.ts` → `supabaseRest()` | **Aşama 0 (uygulandı):** her okuma, yazma ve RPC öncesinde ortam işareti kontrolü. İşaret yoksa veya yanlışsa hiçbir uygulama tablosuna istek gitmez (§7.4). |
| **Minimum sipariş 500 TL (D10, D14)** | `lib/order-rules.ts` | **Aşama 3 (kod):** adrese teslimde ürün toplamı − indirim ≥ 500 TL, teslimat ücreti hariç, gel-al muaf. Sepet / hızlı sipariş eksik tutarı gösterir ve checkout'a geçişi engeller (gel-ale geçiş açık); checkout ödeme adımını engeller; ödeme hesabı + sipariş 409 `BELOW_MINIMUM`; `create_order` (`0008`) `below_minimum`. Puan etkisi açık (A13). |
| **Teslimat ücreti yapılandırılabilir; belirlenmemiş ≠ ücretsiz (D10, D15)** | `lib/delivery/fees.ts`, `fees-server.ts`, `delivery_zone_fees` | **Aşama 3 (kod):** motor, ödeme hesabı ve sipariş aynı kaynaktan; belirlenmedi → `DELIVERY_FEE_NOT_SET` (409), okunamıyor → `DELIVERY_INFO_UNAVAILABLE` (503, eski değer kullanılmaz); `create_order` ücreti tablodan doğrular. PDP ücreti yalnızca belirlenmişse gösterir; kuruş gösterimi (`formatTL`). Mevcut siparişlerin ücreti değişmez. |
| **Güncel fiyat her yerde aynı; verilmiş sipariş değişmez (D5)** | `lib/pricing/*`, `product_prices` | **Aşama 4 (kod):** katalog, PDP, arama, hızlı sipariş, sepet, checkout, ödeme hesabı ve sipariş aynı fiyattan. Sipariş ve ödeme hesabı taze okur; okunamazsa 503, eski veya katalog değerle sipariş yok. `create_order` v5 kayıtlı fiyatı doğrular (`price_mismatch` → 409). Siparişin kalem fiyatları kayıtlı kalır. Kart en küçük boyutun, ürün sayfası seçilen boyutun fiyatını gösterir (D16). Her boyut ayrı fiyatlanır; bir boyutun değişmesi diğerlerini değiştirmez (D20). Eski fiyat yalnızca belirlenmiş ürün veya boyutta ve güncel fiyattan yüksekken (D18, D21). |
| **Funda Puan (D9, D31–D41)** | `0011` (veritabanı), `lib/funda-points/*` | Kurallar veritabanı fonksiyonlarında tek yerde (§2.3): parti + 1 yıl, son kullanma sırası, siparişle aynı işlemde rezervasyon, ödeme onayında kazanım, iptalde iade ve geri alma (borç), tekrar koruması. Kazanım ve kullanım ödeme entegrasyonuna kadar kapalı (D41); demo sipariş hiçbir koşulda puan almaz/harcamaz. |
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
4. Ürün fiyatları onaylanmış: sitedeki not koddaki fiyatları "örnek veri" diye gösteriyor; boyut fiyatlarının girişi (D20) ve p13 kartı (D21) kararlaştırıldı (2026-10-12).
5. Production'da `/api/health` → `ready`; yedekleme açık.

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
| 2 | `0008_delivery_zone_fees.sql` | **Aşama 3 — `funda1959-test`'e uygulandı (2026-10-10)**; production'a uygulanmadı | `delivery_zone_fees` (3 durum, seed yok) + `create_order` v4 (ücret ve minimum kontrolü). Tekrar çalıştırılabilir. |
| 3 | `0009_product_prices.sql` | **Aşama 4 — `funda1959-test`'e uygulandı (2026-10-12)**; production'a uygulanmadı | `product_prices` (seed yok) + `create_order` v5 (kayıtlı fiyat kontrolü, `price_mismatch`). Tekrar çalıştırılabilir. Uygulanmadan Aşama 4 kodu katalog fiyatlarıyla çalışır, "Fiyatlar" kaydetmez. |
| 4 | `0010_customer_accounts.sql` | **Aşama 5 — `funda1959-test`'te çalıştırıldı (kullanıcı, 2026-10-12)**; production'a uygulanmadı (§8.2) | `customer_profiles` (onay sürümü alanları; pazarlama izni yok), `customer_addresses` (en fazla 10, tek varsayılan), `orders.customer_user_id`, `create_order` v6, üye sipariş ve adres RPC'leri |
| 5 | `0011_funda_points.sql` | **Aşama 6 — `funda1959-test`'e uygulandı (kullanıcı, 2026-10-13); production'a uygulanmadı** (§8.3) | `funda_point_*` tabloları, sipariş puan alanları, `create_order` v7, `update_order_status` v2, ödeme/puan fonksiyonları (§2.3) |
| — | ~~`0012_instagram.sql`~~ | **Yapılmayacak (D42)** | Instagram veritabanına taşınmaz. |
| 6 | `0012_contact_requests.sql` | **Aşama 8 — `funda1959-test`'e uygulandı (kullanıcı, 2026-10-14); production'a uygulanmadı** | `contact_requests` + `submit_contact_request`, `list_contact_requests`, `update_contact_request` (numara Instagram'dan boşaldı). Tekrar çalıştırılabilir. |
| 7 | `0013_catalog_products.sql` | **D45–D46 — hazır, hiçbir projede çalıştırılmadı (2026-10-21)**; test: `supabase/tests/0013_catalog_products_test.sql` | `catalog_products`, `catalog_product_images`, görünüm `catalog_storefront_products` (yalnızca yayınlanmış), Merkez RPC'leri, `order_items` koruması, bucket `product-images`. Tekrar çalıştırılabilir. |
| 8 | `0014_product_visibility.sql` | **D48 — hazır, hiçbir projede çalıştırılmadı (2026-10-22)**; 0013'ten bağımsız (yalnızca 0001'e dayanır) | `product_visibility` (mevcut 18 ürünün "Yayında" durumu; satır yok = yayında), Merkez RPC'si `set_product_visibility`, gizli ürüne sipariş kalemini reddeden `order_items_visibility_guard`. Uygulanmadan "Yayında" tiki kaydedilmez (tik geri döner, hata gösterilir); bütün ürünler sitede görünmeye devam eder. Tekrar çalıştırılabilir. |
| 9 | `0015_delivery_areas.sql` | **D49–D50 — hazır, hiçbir projede çalıştırılmadı (2026-10-22; D50 için yeniden yazıldı)**; 0001, 0007, 0008'e dayanır | `delivery_areas` (ilçe+mahalle → tek şube, gönderim açık/kapalı, `zone_id` = mahallenin ücret satırı), mahalle ücretleri `delivery_zone_fees`'te (`create_order` değişmeden doğrular), Merkez RPC'si `save_delivery_areas` (tek işlem, çakışmada hiçbir şey kaydedilmez), `orders_delivery_area_guard`. İlk kurulumda eski 22 mahalle eski bölge ücretleriyle dolar (müşteri için değişiklik yok); yeniden çalıştırma Merkez'in değişikliklerine dokunmaz. Uygulanmadan eski liste ve bölge ücretleri geçerli, bölge ekranı kaydetmez. |

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
| Funda Puan demo (6 uydurma müşteri), Instagram mock | **Hiçbir projeye taşınmaz** (uydurma veri). Instagram örnek kayıtları koddan da kaldırıldı (D42). |

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
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | boş | boş | boş | **Boş kalır.** Aşama 5'te Auth sunucuda çalışır (§8.2) [V]. |
| `SUPABASE_ANON_KEY` | test projesi | test projesi | production projesi | **Aşama 5 (kodda):** müşteri Auth için, yalnızca sunucuda. Anon/publishable anahtar gizli değildir ama tarayıcıya gönderilmez. Google/Apple/Facebook sırları buraya değil, Supabase paneline girilir. |
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
| Vercel'de modülün tablosu henüz yok | **503**; log: `NOT_DATABASE_BACKED` (bugün böyle modül yok; Instagram yazma yolu D42 ile kaldırıldı) |
| Local makine, Supabase yok | Yerel bellek/dosya deposu (yalnızca geliştirme) |

- **Bağlı yazma yolları:**
  - `api/admin/inventory`
  - `lib/orders/engine.ts` → `api/orders`
  - `api/admin/campaigns`
  - `api/admin/funda-points`
  - `api/contact`, `api/admin/contact-requests` (Aşama 8)
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
10. `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` boş kalır (Aşama 5'te de; Auth sunucuda, §8.2). `VERCEL` ve `VERCEL_ENV` elle tanımlanmaz.

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
- **Bekliyor:** `funda1959-production` (adım 1–5'in production kısmı), Production ortam değişkenleri (adım 7), adım 14. `main` dalı değişmedi.
- **Not:** Preview, Vercel Authentication ile korunuyor; otomatik kontrol (curl) için Vercel oturumu gerekir.
- **Not:** Test projesi zaman zaman geçici 5xx döndürdü (bir okumada 522; health şema yoklamasında bir kez `error`, tekrarında `ok`). Müşteri tarafındaki stok okuması böyle bir anda son bilinen değerle devam eder; admin okuması 503 verir; sipariş alımı 503 verir (Aşama 2).

**Aşama 2 kurulum kontrolü (yalnızca `funda1959-test` + Preview)**

Durum (2026-10-10): adım 1–6 **tamam** (local + gerçek `funda1959-test`, ardından Preview); adım 7 Production kurulunca.

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
| B | `FND-20261010-5453` | teslimat / İncek | ₺160 (ücret ₺70) | **iptal** (Preview, İncek, gerekçeli) | new→confirmed (`sube:incek`), confirmed→preparing (`merkez`), preparing→ready (`sube:incek`, Preview), ready→cancelled (`sube:incek`, Preview, gerekçeli) |
| C | `FND-20261010-E596` | gel-al / GOP | ₺90 | yeni | — (uygulama üzerinden eşzamanlılık) |
| D | `FND-20261010-5A39` | gel-al / GOP | ₺90 | teslim edildi | 4 adım (`sube:gop`) |
| E | `FND-20261010-1EC1` | gel-al / GOP | ₺90 | yeni | — (doğrudan RPC eşzamanlılık) |

| F | `FND-20261010-7AA6` | teslimat / İncek | ₺165 (ürün ₺95 + ücret ₺70) | teslim edildi | Preview'da oluşturuldu; new→confirmed→preparing→ready→out_for_delivery→delivered (hepsi `sube:incek`) |

Local testten sonra: 5 sipariş, 5 müşteri, 1 adres, 5 kalem, 7 durum olayı. Preview'dan sonra test projesinde toplam **6 sipariş** (2 yeni, 2 iptal, 2 teslim edildi).

**Sonuç — Preview (`supabase-test` @ `2c75944` + `funda1959-test`, web ekibi, 2026-10-10):** adım 4–6 geçti. Kayıtlar test veritabanında salt-okunur sorguyla teyit edildi.

- Demo sipariş `FND-20261010-7AA6` (teslimat, İncek; ürün ₺95 + ücret ₺70): ödeme ekranı, onay sayfası ve admin toplamı aynı, **₺165**; `is_demo = true`, `payment_status = pending`.
- Admin: Merkez siparişi görüyor; İncek hesabı yalnızca kendi şubesinin siparişlerini görüyor.
- D12: İncek 7AA6'yı adım adım "Teslim Edildi"ye ilerletti (5 olay, `sube:incek`); her değişiklik müşteri sipariş takibine yansıdı.
- D12: `FND-20261010-5453` İncek tarafından gerekçeyle iptal edildi (`cancelled_by = İncek`, gerekçe ve zaman kayıtlı); admin ve müşteri takibinde "İptal Edildi" görünüyor.
- Not: 5453'ün `preparing → ready` adımı (`sube:incek`, 20:27:48) 7AA6'nın ilk adımıyla aynı saniyede kaydedildi; iki ayrı işlem olduğu varsayılıyor (bildirimde ayrıca geçmiyor).
- Preview'da ayrıca denenmeyenler (local + gerçek test Supabase'inde geçti): 409 durumları, GOP → İncek 403, teslim edilmiş siparişin iptal edilememesi, eşzamanlı aynı istek, D13 puan.


**Aşama 3 kurulum kontrolü (yalnızca `funda1959-test` + Preview) — tamamlandı (2026-10-10)**

1. ✅ SQL Editor'da `0008_delivery_zone_fees.sql` çalıştır (test projesi). Production'a uygulanmaz. Ücret satırı eklenmez.
2. ✅ Merkez oturumuyla local `/api/health` → `0001`–`0008` bütün kontroller `ok`. `0008` uygulanmadan Aşama 3 kodu çalışırsa adrese teslim "Teslimat bilgisi şu an alınamıyor" der (güvenli taraf); bu yüzden migration deploy'dan **önce**.
3. ✅ Aşama 3 commit'i `supabase-test`'e (`63331f7`, 2026-10-10) → Preview build.
4. ✅ (local + gerçek test Supabase'inde; Preview'da ayrıca denenmedi) Preview admin "Bölgeler": Merkez test bölgelerine **test amaçlı** ücret girer (onaylı fiyat değildir) — en az bir `paid` (kuruşlu, ör. 59,90), bir `free`, en az bir bölge `unset` kalır. GOP hesabı yalnızca kendi bölgesini salt okunur görür, düzenleyemez.
5. ✅ (Preview'da teslimat siparişi; diğerleri local + gerçek test Supabase'inde) Preview müşteri akışı: `unset` bölgede adrese teslim engellenir, gel-al çalışır; `free` bölgede ücret "Ücretsiz", toplam = ürün; kuruşlu ücret ödeme ve onayda yuvarlanmadan aynı; sepette ve hızlı siparişte 500 TL altı adrese teslimde eksik tutar + checkout engeli, "Mağazadan teslim al" ile gel-ale geçiş; gel-alda minimum yok; 500 TL'de geçer.
6. ✅ Gerçek test Supabase'inde doğrudan RPC (ayrı onay; sentetik kayıt): 499,99 ürün toplamlı teslimat → `below_minimum`; 520 − 30 indirim → `below_minimum`; ücreti `unset` bölge → `delivery_fee_not_set`; tablodakinden farklı ücret → `delivery_fee_mismatch`; gel-alda ücret ≠ 0 → `amount_mismatch`; aynı istek kimliğiyle tekrar → aynı sipariş (ücret sonradan değişse de).
7. ✅ Ücret değiştikten sonra mevcut siparişlerin (A–F, 7AA6) ücret ve toplamı aynı kalır.

**Sonuç — local uygulama + gerçek `funda1959-test` (2026-10-10):** sunucu ve RPC kontrolleri 57/57, müşteri ekranları (local, başsız Chrome) 24/24, Merkez ücret düzenleyicisi 33/33 geçti. Kayıtlar sentetik, `funda1959-test` dışında hiçbir projeye istek gitmedi; ücret değişiklikleri yalnızca test için geçiciydi ve geri yüklendi.

- Ön kontrol: işaret `test`; Merkez oturumuyla `/api/health` → `0001`–`0008` 10/10 `ok`.
- **Minimum (D14):**
  - Adrese teslim 495 TL: ödeme hesabı ve sipariş 409 `BELOW_MINIMUM` ("₺5 daha ekleyin veya mağazadan teslim alın"), kayıt yazılmadı.
  - Tam 500 TL: 201, veritabanında 500 + 230 = 730.
  - Gel-al 45 TL: 201, ücret 0 (minimum yok). Ücretsiz bölge minimumu kaldırmıyor (495 → 409).
  - Doğrudan RPC: 499,99 → `below_minimum`; 545 − 46 indirim = 499 → `below_minimum`; 545 − 45 = 500 → kabul. Plandaki 520 − 30 yerine katalog fiyatlarıyla kurulabilen tutarlar kullanıldı.
  - Ekranlar: 495 TL'de sepet ve hızlı sipariş "Sepetinize ₺5 daha ekleyin" der, checkout bağlantısı yok. Checkout uyarı gösterir, "Ödeme Adımına Geç" ilerlemez. "Mağazadan teslim al" gel-ale geçirir, uyarı kalkar. 500 TL'de ve gel-alda uyarı yok.
- **Ücret durumları (D15):**
  - Kuruşlu 23,45: uygunluk, ödeme hesabı, sipariş, veritabanı, sipariş takibi ve admin listesi aynı (₺23,45 / ₺523,45, yuvarlama yok); ürün sayfası "Teslimat ücreti: ₺23,45".
  - Ücretsiz: ücret 0, durum `free`, sipariş toplamı 500; ürün sayfası "Teslimat ücretsiz".
  - Belirlenmemiş: uygunluk `DELIVERY_FEE_NOT_SET`, ödeme hesabı ve sipariş 409, kayıt yok; gel-al çalışıyor. Ürün sayfası, sepet ve hızlı sipariş "Bu bölge için teslimat ücreti henüz belirlenmedi …" der.
  - Doğrudan RPC: `unset` bölge ve satırı olmayan bölge (ücret 0 ile) → `delivery_fee_not_set`; tablodakinden farklı ücret → `delivery_fee_mismatch`; gel-alda ücret 5 → `amount_mismatch`. Reddedilen çağrılar sipariş veya müşteri yazmadı.
- **Şube yetkisi:**
  - Oturumsuz 401.
  - GOP kendi bölgesine (ücretli ve ücretsiz) ve İncek bölgesine 403; İncek kendi bölgesine 403; tablo değişmedi.
  - GOP "Bölgeler" ekranında yalnızca kendi bölgesi, düzenleme yok; Merkez'de 4 düzenleyici.
- **Eski siparişler:**
  - İncek & Gölbaşı ücreti 230 → 23,45 olduktan sonra `D2CE` ücret 230 / toplam 730 ve `updated_at` aynı.
  - Aynı istek uygulamadan ve doğrudan RPC'den (eski ücretle) tekrar gönderilince aynı sipariş döndü, ikinci kayıt yok.
  - Önceki 6 sipariş (A–E, 7AA6) tutar, durum ve `updated_at` aynı; `branch_product_status` değişmedi.
- **Ücretlerin geri yüklenmesi:**
  - Testte yalnızca İncek & Gölbaşı ve İncek Güney Hattı geçici değiştirildi; sonunda başlangıç değerlerine döndü. GOP ve Panora'ya dokunulmadı (düzenleyen ve zaman aynı).
  - Test başlangıcındaki değerler: GOP 590, İncek Güney Hattı 4.400, İncek & Gölbaşı 230, Panora 240. Bunlar Merkez oturumundan 23:09–23:11'de girildi (öncesi 59 / 44 / 23 / 24; İncek & Gölbaşı önce 2.300 girilip 230'a düzeltildi). Onaylı fiyat değil (A4); 4.400 TL kasıtlı değilse düzeltilmeli.
- **Bu kontrolde bulunup düzeltilenler:**
  - Merkez ücret düzenleyicisi başarısız kaydı başarılı gibi gösteriyordu: test projesine geçici olarak ulaşılamadığında yazma 503 ile reddedildi, girilen 59 kutuda kaldı, yenileyince 12 geldi.
    - Artık: tek istek ve "Kaydediliyor…" durumu. Hata varsa "Kaydedilmedi … Kayıtlı ücret değişmedi" yazar.
    - "Kaydedildi" yalnızca veritabanının döndürdüğü satır istenen değerle eşleşince görünür. Log satırları nedeni içeriyor.
    - Dosyalar: `DeliveryFeeEditor.tsx`, `api/admin/delivery-fees`, `persistence.ts`, `fees-server.ts`.
  - Belirlenmemiş veya okunamayan ücret:
    - Ürün sayfası "Önümüzdeki günlerde … teslimat saati bulunmuyor" diyordu, sepet hiçbir şey söylemiyordu. İkisi de artık gerekçeyi gösteriyor.
    - Sepet "Uygun olmayan ürünleri çıkar" önermiyor, çünkü sorun bölgede.
    - Dosyalar: `isDeliveryFeeReason`, `ProductFulfillment.tsx`, `cart-fulfillment.ts`.
- **İlk kontrolde açık kalan iki bulgu** (checkout'ta kayıtlı adresle ilk açılışta uyarı yoktu; demo butonu tutar hatasında pasifleşmiyordu) arayüz turunda giderildi (aşağıda).
- **Denenmeyenler:**
  - Adım 3–5: commit, Preview build ve Preview ekranları; commit onayı bekliyor.
  - `DELIVERY_INFO_UNAVAILABLE` gerçek bir kesintide denenmedi; yalnızca mock ile (181/181, `POST /api/delivery-fee` 503 dahil).
  - Uygulama üzerinden indirimli sipariş denenmedi; uygulamada indirim mantığı yok, yalnızca doğrudan RPC ile denendi.
  - Puanın minimuma etkisi açık karar (A13).

**Test kayıtları (`funda1959-test`'te korunuyor; hepsi demo + `pending`, sentetik, teslim 2026-10-13, e-posta `asama3-202610102013-…@example.com`):**

| Sipariş | Kaynak | Tür / bölge | Ürün − indirim + ücret = toplam |
|---|---|---|---|
| `FND-20261010-D2CE` | uygulama | teslimat / İncek & Gölbaşı | 500 − 0 + 230 = **730** (eski ücretle korunan sipariş) |
| `FND-20261010-7FD5` | uygulama | gel-al / İncek | 45 − 0 + 0 = **45** |
| `FND-20261010-4B9F` | uygulama | teslimat / İncek & Gölbaşı | 500 − 0 + 23,45 = **523,45** |
| `FND-20261010-843D` | uygulama | teslimat / İncek Güney Hattı (ücretsiz) | 500 − 0 + 0 = **500** |
| `FND-20261010-2AAA` | doğrudan RPC | teslimat / İncek & Gölbaşı | 545 − 45 + 23,45 = **523,45** |

Test projesinde bu kontrolden sonra 11 sipariş vardı (önceki 6 + bu 5).

**Aşama 3 arayüzü — local uygulama + gerçek `funda1959-test`, tarayıcıda (2026-10-10):** 33/33 geçti (+ önceki ekran kontrolleri 24/24, mock 181/181). Ücretler testte geçici değişti ve başlangıç değerlerine döndü (GOP 590, İncek Güney Hattı 4.400, İncek & Gölbaşı 230, Panora 240; GOP ve Panora'ya dokunulmadı).

- **Değişenler:**
  - `POST /api/delivery-fee` (yeni): adresin bölgesinin ücretini taze okur, teklif ve siparişle aynı çözücüyle (`resolveContextBranch`). Belirlenmemiş ücret ya da hizmet dışı adres için `ok: false` ve gerekçe döner, okunamayan ücret için 503; tutar uydurmaz. Hiçbir şey yazmaz.
  - `useDeliveryFee` + `OrderTotals`: sepet, hızlı sipariş ve checkout özetinde "Ürün Toplamı", "Teslimat Ücreti" (tutar / "Ücretsiz" / "₺0 · Mağazadan teslim" / "Belirlenmedi"), "İndirim" ve "Toplam" ayrı satırlarda; ödeme ekranıyla aynı satırlar. Ücret bilinmiyorsa toplam "—" ve gerekçe görünür.
  - Checkout: kayıtlı adresin bölge, ücret, ürün ve tarih kontrolü sayfa açılınca da çalışıyor; ayrıca adres veya teslimat türü değişince. Ücret yüklenirken, belirlenmemişse ya da okunamıyorsa "Ödeme Adımına Geç" ilerlemiyor.
  - Ödeme ekranı: demo sipariş butonu tutar hesabı yüklenirken ("Tutar hesaplanıyor…") ve hata verdiğinde ("Geçerli bir tutar hesaplanmadan demo sipariş oluşturulamaz.") pasif; yalnızca geçerli hesapla açılıyor.
  - 500 TL minimumu, gel-al muafiyeti ve hazırlık/teslimat kuralları değişmedi.
- **Sonuçlar** (sepet / checkout / ödeme / sipariş toplamları karşılaştırıldı):

| Senaryo | Sepet | Checkout | Ödeme (sunucu) | Sipariş (veritabanı) |
|---|---|---|---|---|
| Değiştirilmemiş ücret (İncek & Gölbaşı 230) | ₺500 + ₺230 = ₺730 | — | — | — |
| Kuruşlu (İncek & Gölbaşı 23,45) | ₺500 + ₺23,45 = ₺523,45 | aynı | aynı | `FND-20261010-84CF` 500 + 23,45 = 523,45; onay sayfası ₺523,45 |
| Ücretsiz (İncek Güney Hattı) | ₺500 + Ücretsiz = ₺500 | aynı | aynı | `FND-20261010-61D5` 500 + 0 = 500; onay sayfası ₺500 |
| Belirlenmemiş (İncek Güney Hattı) | ₺500, "Belirlenmedi", toplam "—", gerekçe | ilk açılışta bölge uyarısı + özet aynı; ödeme adımına geçilmiyor | — | yazılmadı |
| Checkout açıkken ücret "belirlenmemiş" yapıldı | — | ücretsiz göründü | 409 gerekçesi, demo butonu pasif ve açıklamalı | yazılmadı (sipariş sayısı değişmedi) |
| Gel-al 45 TL | ₺45 + ₺0 · Mağazadan teslim = ₺45, minimum yok | aynı, minimum uyarısı yok | — | — |
| Adrese teslim 495 TL (23,45) | ₺495 + ₺23,45 = ₺518,45, "₺5 daha ekleyin", checkout bağlantısı yok | — | — | — |

  - Ödeme ekranında teklif 3 sn bekletildiğinde demo butonu pasif ve "Tutar hesaplanıyor…" görünüyor; geçerli teklif gelince açılıyor (kuruşlu ve ücretsiz senaryoda).
- **Test kayıtları** (demo + `pending`, sentetik, teslim 2026-10-13, e-posta `asama3-ekran-202610102032-…@example.com`): `FND-20261010-84CF` (kuruşlu, 523,45) ve `FND-20261010-61D5` (ücretsiz, 500). Test projesinde artık **13 sipariş** var.
- **Denenmeyenler:** Preview (commit onayı bekliyor); gerçek kesintide `DELIVERY_INFO_UNAVAILABLE` (mock'ta denendi).

**Sonuç — Preview (`supabase-test` @ `63331f7` + `funda1959-test`, web ekibi, 2026-10-10):**

- Demo sipariş `FND-20261010-4866`: checkout ve onay ekranında **₺770**; kullanıcı siparişin admin'de göründüğünü doğruladı.
- Veritabanında salt-okunur teyit: adrese teslim, İncek & Gölbaşı (`zone-incek-golbasi`), şube İncek, 12 × Çikolatalı Macaron ₺45 = ₺540 + teslimat ₺230 = **₺770**; `is_demo = true`, `payment_status = pending`, durum `new`, teslim 2026-10-11 10:00 – 11:00. Ekrandaki toplam = kayıttaki toplam.
- Preview'da ayrıca denenmeyenler (local + gerçek test Supabase'inde geçti): kuruşlu / ücretsiz / belirlenmemiş ücret ekranları, 500 TL altı engel, gel-al muafiyeti, şube hesabının ücret yazamaması, ücret değişince eski siparişin korunması.
- Test projesinde artık **14 sipariş** var.

**Aşama 4 kurulum kontrolü (yalnızca `funda1959-test` + Preview; 1, 2, 3, 5, 6 yapıldı, 4 kısmen — 2026-10-12)**

1. SQL Editor'da `0009_product_prices.sql` çalıştır (test projesi). Satır eklenmez. Uygulanmadan Aşama 4 kodu katalog fiyatlarıyla çalışır ve "Fiyatlar" ekranı kaydetmez. **Yapıldı (web ekibi, 2026-10-12; başarılı).**
2. Merkez oturumuyla `/api/health` → `0001`–`0009` hepsi `ok`. **Yapıldı.**
3. Aşama 4 commit'i `supabase-test`'e (ayrı onay) → Preview build. **Yapıldı:** `04d7f43` (fiyat yönetimi) ve `5c73517` (ürün başına tek satır + açılır boyut düzenleme) pushlandı.
4. Preview "Fiyatlar": tek fiyatlı bir ürüne ve bir boyuta (ör. Trüf 12'li) **test amaçlı** fiyat (onaylı fiyat değildir) → katalog, ürün sayfası, arama, hızlı sipariş, sepet, checkout, ödeme ve sipariş aynı tutar; aynı ürünün diğer boyutları değişmez; sayfa yenileme ve menü geçişi sonrası korunur; GOP hesabında "Fiyatlar" yok. Sonunda ikisi de eski tutarına geri ayarlanır. **Kısmen:** yalnızca aşağıdaki "Sonuç — Preview" bloğundaki iki madde doğrulandı.
5. Doğrudan RPC (ayrı onay; sentetik kayıt): kayıtlı fiyatı olan ürün veya boyut farklı birim fiyatla → `price_mismatch`; aynı istek kimliği → aynı sipariş. **Yapıldı.**
6. Fiyat değiştikten sonra mevcut siparişlerin kalem fiyatları ve toplamları aynı kalır. **Yapıldı.**

**Sonuç — local (mock PostgREST + bellek; gerçek veritabanına yazılmadı, 2026-10-12):**

- `verify-prices`: kilitler, birimli etiket ve kuruş, sipariş fiyatlaması (tarayıcı fiyatı yok sayılır), minimumun güncel fiyatla hesaplanması, verilmiş siparişin korunması, fiyat okunamazsa 503, `0009` yokken katalog fiyatı — hepsi geçti. `verify-orders`, `verify-fulfillment` geçti.
- Mock e2e 235/235 (Aşama 4: 59):
  - yetki: oturumsuz 401, GOP / İncek 403;
  - doğrulama: bilinmeyen ürün, 0, negatif, 3 ondalık, 100.000 üstü, metin → 400; boyutlu ürün → 409 (eski fiyatlı ürün de D18'e kadar 409'du);
  - müşteri ekranları, sepet fiyat API'si, sipariş ve eski siparişin korunması;
  - araya giren fiyat değişikliği → 409 (`price_mismatch`);
  - fiyat okunamazsa sipariş, ödeme hesabı ve sepet 503, gösterim son okuma;
  - `0009` yok; yanlış / işaretsiz proje (veriye istek yok); Production (sipariş kapalı); Supabase'siz Preview (katalog fiyatı, yazma 503); yerel dosya deposu.
- Tarayıcı (derlenmiş sürüm + mock):
  - admin ekranları 26/26: menü geçişleri, kayıt sonrası anında tablo güncellemesi, reddedilen ve bağlantısı kopan kaydın başarı görünmemesi, sayfa yenileme, başka oturumun değişikliği, şube hesabı;
  - müşteri akışı 12/12: ₺49,90 × 12 = ₺598,80 + ₺70 = ₺668,80 kartta, aramada, sepette, checkout'ta, ödeme hesabında, siparişte ve onayda aynı; fiyat ₺52 olunca verilmiş sipariş korunur, sepet ₺624 + ₺70.
- Gerçek test projesi (dev sunucusu, salt okuma): `0009` yok → "Fiyat tablosu henüz kurulmadı" uyarısı, düzenleme kapalı, katalog fiyatları; Teslimat Bölgeleri 4 bölge ve güncel ücretlerle açılıyor.
- **Giderilen sorun:** derlenmiş sürümde (Vercel dahil; dev sunucuda görünmüyordu) "Fiyatlar" ve "Teslimat Bölgeleri"nde kayıt sonrası tablo yenilenmiyor, menüden "Fiyatlar" açılmıyordu. Kayıt doğruydu. React geçişi, büyük sunucu tablosunun parçalı RSC yanıtında askıda kalıyor ve ancak başka bir güncellemeyle tamamlanıyordu.
  - Düzeltme: iki tablo istemci bileşeni (`ProductPricesTable`, `ZoneFeesTable`); sunucu sade veri gönderir (Fiyatlar yanıtı 30,5 → 8,7 KB, Bölgeler 12,7 → 5,4 KB).
  - Kayıt satırı, düzenleyicinin doğruladığı veritabanı kaydıyla anında güncellenir; rota yenilemesi gerekmez. Sunucudaki ve kaydedilen satırdan yenisi gösterilir.
  - Siparişler ekranının yenilemesi 25 siparişle (52 KB) sorunsuz denendi.
- **Kararlar sonrası (D16–D19, 2026-10-12):**
  - `verify-prices` geçti.
  - Mock e2e 239/239: p18 düzenlenebilir; 250'de kart ₺250 ve üstü çizili ₺290 görünür, 300'de eski fiyat gizlenir; kartlarda kurabiye ₺230 (500 g; eskiden "₺420 / kg"), pralin ₺450 (6'lı); "başlayan" ifadesi yok; p13 aynen ₺520 ve ₺580.
  - Tarayıcı: admin 27/27, müşteri 17/17. Ürün sayfasında boyut seçilmeden ₺230, 1 kg ₺420, 1,5 kg ₺610; pasta 4–6 ₺720, 12–15 ₺1.330; boyut seçimi zorunlu kalır.
  - Dev sunucusu (salt okuma): kurabiye kartı ₺230, ürün sayfası başlığı ₺230.
  - Sunucu ve sipariş fiyatları değişmedi: kurabiye 1 kg yine ₺420.
- **Kararlar sonrası (D20–D21, 2026-10-12):** her boyut ayrı düzenlenebilir; `0009` buna göre tamamlandı (açıklamalar, `variant_key` biçim kontrolü; tablo ve `create_order` v5 boyutu zaten içeriyordu); seed yok.
  - Başlangıç değerleri: 41 boyut fiyatı ve 6 tek fiyat, değişiklik öncesi kodla (D16 öncesi ve sonrası iki sürüm) tek tek karşılaştırıldı; hepsi aynı. Tek kart değişikliği p13: ₺520 ~~₺580~~ → ₺260 (D21).
  - `verify-prices` 61/61: 47 fiyat anahtarı; boyut bağımsızlığı (p1 8–10 → 1100 iken 4–6 ve 12–15 aynı; Trüf 12'li → 540 iken 6'lı, 24'lü ve Pralin 12'li aynı); kart en küçük boyut; eski fiyat yalnızca 12'li'de ve korumalı (550 görünür, 580 / 600 gizli); ürüne ait olmayan satırlar uygulanmaz; 47 fiyatın tamamında kart / ürün sayfası / hızlı sipariş = sepet / ödeme hesabı / sipariş; boyutsuz kalem 400; stok kuralları aynı (p3 İncek'te 409 `PRODUCT_DISABLED_AT_BRANCH`, p8 GOP'ta bugün 409 `NEXT_DAY_ONLY`); minimum ve ücret; verilmiş sipariş 50 / 540 / 1650 olarak kalır, aynı istek aynı sipariş; okunamazsa 503; `0009` yokken katalog.
  - `verify-orders` 72/72 (pasif stok testindeki boyutlu ürüne boyut eklendi; boyutsuz kalem artık 400), `verify-fulfillment` 34/34, `verify-funda-points` 27/27, `verify-campaign-persistence` 9/9.
  - Mock e2e 255/255: oturumsuz 401, GOP / İncek 403 (tek fiyat ve boyut); boyutsuz, bilinmeyen, başka ürünün ve metin olmayan boyut → 400, tek fiyatlı ürüne boyut → 400, reddedilenler veritabanına gitmez; kayıt yalnızca istenen boyutun satırını yazar; ürün sayfası, kart, hızlı sipariş, sepet fiyat API'si, uygunluk fiyatı, ödeme hesabı ve sipariş aynı (1100 + 2 × 540 = 2180); fiyatlar 1200 / 560 olunca verilmiş sipariş ve takip sayfası ₺2.180 kalır, yeni hesap 2320; araya giren boyut fiyatı → 409; fiyat okunamazsa son okuma; `0009` yokken boyutlar katalog fiyatında (2090).
  - Tarayıcı admin 39/39: 47 düzenleyici, "Boyut" sütunu, kilit yok; Trüf 12'li 540 kaydı yalnızca o satırı ve o kaydı değiştirir; kurabiye 1 kg 435,50 tek başına; büyük değişiklik onayı; reddedilen kayıt başarı göstermez; sayfa yenileme ve başka oturumun kaydı; GOP boyut fiyatı yazamaz; 47 satırla menü geçişleri sorunsuz.
  - Tarayıcı müşteri 30/30: Trüf kartı ₺260 (eski fiyat yok); ürün sayfası seçimsiz ₺260, 12'li ₺520 ~~₺580~~, 24'lü ₺990, 6'lı ₺260. 12'li 540 olunca kart yine ₺260, ürün sayfası ₺540 ~~₺580~~, hızlı sipariş ₺540 (sepete 540 ile eklenir), sepet ₺520'lik satırı ₺540'a günceller, checkout / ödeme / sipariş ₺540 + ₺70 = ₺610. 560 olunca verilmiş sipariş ve takip sayfası ₺610 kalır, sepet ₺630. Koruma: 560'ta ₺580 görünür, 580 ve 600'de gizlenir.
  - Gerçek test projesi (derlenmiş sürüm, salt okuma; `0009` yok): Trüf kartı ₺260, ürün sayfası ₺260 / ₺520 / ₺990, sepet fiyatı 12'li 520, ödeme hesabı 520, boyutsuz 400; "Fiyatlar" uyarı verir, boyut satırları listelenir, düzenleme kapalı; `0009` missing. Sipariş ve yazma yapılmadı.
  - Ürün sayfası fiyat biçimi sepetle aynı (`formatTL`): kuruşlu fiyat "₺525,50" (önceden "₺525,5").
- Bu aşamada denenmeyenler: gerçek veritabanında `0009` ve `create_order` v5 (yalnızca mock benzetimi; SQL yerelde çalıştırılmadı) → aşağıda yapıldı; Preview.

**Sonuç — gerçek test Supabase'i (`funda1959-test`, `0009` uygulandıktan sonra; derlenmiş sürüm local, 2026-10-12):**

- Başlangıç: ortam işareti `test`; Merkez health `0001`–`0009` hepsi `ok` (11 kontrol); `product_prices` boş; 14 sipariş, 20 kalem; 5 stok kaydı; İncek & Gölbaşı ücreti 230.
- Toplu kontrol 58/58 (tarayıcı + doğrudan veritabanı okuması):
  - yetki: oturumsuz 401; GOP / Panora / İncek 403 (tek fiyat ve boyut); GOP fiyat ekranını açamaz; başka ürünün boyutu ve tek fiyatlı ürüne boyut → 400; reddedilenlerin hiçbiri tabloya yazılmadı;
  - Merkez ekrandan: macaron **49,90** ve Trüf 12'li **540** (ikisi de test amaçlı, onaylı fiyat değil) → "Kaydedildi", satırlar anında güncel; veritabanında yalnızca bu iki satır; 6'lı, 24'lü ve Pralin 12'li katalog fiyatında kaldı;
  - sayfa yenileme ve sunucu yeniden başlatma sonrası aynı değerler (veritabanından okunur);
  - müşteri ekranları: katalog kartı ₺49,90 / adet; Trüf kartı ₺260 (eski fiyat yok); ürün sayfası 6'lı ₺260, 12'li ₺540 ~~₺580~~, 24'lü ₺990; macaron ürün sayfası ₺49,90; hızlı sipariş, başlık araması ve sepet fiyat API'si aynı;
  - katalog fiyatıyla eklenmiş sepet satırları güncellenir; sepet, checkout ve ödeme hesabı **₺1.138,80 + ₺230 = ₺1.368,80**; sentetik demo sipariş **`FND-20261012-924B`** (teslim 2026-10-15 14:00 – 15:00) veritabanında aynı: 12 × 49,90 + 12'li 540, demo, `pending`;
  - fiyatlar 52 / 560 olunca siparişin satırı ve kalemleri değişmedi (aynı `updated_at`), takip sayfası ₺1.368,80; aynı sepetin yeni hesabı ₺1.414;
  - doğrudan `create_order`: kayıtlı fiyattan farklı birim fiyat (tek fiyat, boyut, karışık) → `price_mismatch`, hiçbir şey yazılmadı; aynı istek kimliği eski fiyatlarla → aynı sipariş;
  - fiyatlar geri alındı: bu çalıştırmanın iki satırı silindi, `product_prices` yine boş; uygulama yine katalog fiyatında (p5 45, 12'li 520);
  - önceki 14 sipariş ve 20 kalem, stok durumları ve teslimat ücretleri (değer, değiştiren, zaman) değişmedi.
- Test projesinde artık **15 sipariş** var (yeni sentetik demo sipariş korunuyor).
- Test süresince (birkaç dakika) p5 ve Trüf 12'li için kayıtlı fiyat vardı. Bu sırada Aşama 3 kodundaki Preview bu ürünleri katalog fiyatıyla sipariş etseydi `price_mismatch` alırdı; fiyatlar geri alındığı için Preview etkilenmiyor.
- Kalan: Aşama 4 commit'i ve Preview kontrolü (adım 3–4, ayrı onay). → Commit ve push yapıldı; Preview kontrolü kısmen (aşağıda).

**Sonuç — Preview (`supabase-test` @ `5c73517` + `funda1959-test`, kullanıcı, 2026-10-12):** yalnızca şu iki madde doğrulandı.

- Macaron'un **₺49,90** fiyatı (test amaçlı, onaylı fiyat değil) admin "Fiyatlar" ekranında ve müşteri kartında aynı.
- "Fiyatlar" ekranında ürün başına tek satır ve açılır boyut düzenleme çalışıyor.
- **Tamamlandı sayılmayanlar (Preview'da yapılmadı):** ürün sayfası, arama, hızlı sipariş, sepet, checkout, ödeme hesabı ve sipariş tutarlarının eşleşmesi; boyut fiyatı kaydı ve diğer boyutların değişmemesi; sayfa yenileme ve menü geçişi; GOP hesabında "Fiyatlar"ın olmaması; test fiyatlarının geri alınması.
- `product_prices` boş varsayılmaz: Preview'da Macaron ₺49,90 kayıtlı görüldü; tablonun güncel içeriği bu belgede doğrulanmadı.

**Aşama 5 kurulum kontrolü (önce yalnızca `funda1959-test` + Preview, web ekibi) — local kurulum yapıldı (kullanıcı, 2026-10-12); Preview bekliyor**

Sırlar (anahtarlar, Google/Apple/Facebook client secret) yalnızca Supabase ve Vercel panellerine girilir; sohbete, repoya veya bu belgeye yazılmaz.

*Supabase (`funda1959-test`)*

1. Email sağlayıcısı açık; **"Confirm email" kapalı** (D23).
2. **"Allow new users to sign up" açık — yalnızca test projesinde.** Web ekibi kayıt akışını test hesaplarıyla dener (D27); uygulama Production'da kaydı ayrıca reddeder. Production projesinde bu ayar, üyelik gerçek müşterilere açılana kadar **kapalı** kalır.
3. Şifre: en az 8 karakter, harf + rakam (ekrandaki kuralla aynı).
4. URL ayarları: Site URL = Preview dal adresi [V]. Redirect URLs: `http://localhost:3000/**`, kullanılan diğer local port (ör. `http://localhost:3001/**`) ve **yalnızca bu projenin dal adresi** `https://funda1959-git-supabase-test-eek-media-s-projects.vercel.app/**`. Hesabın tüm projelerini kapsayan joker adres kullanılmaz.
5. "Reset password" e-posta şablonu:
   - Türkçe metin.
   - Bağlantı: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery`. Uygulamanın gönderdiği adres zaten `…/auth/confirm?next=%2Fsifre-yenile` biçimindedir.
   - Adres izinli listede değilse Supabase Site URL'ye düşer ve bağlantı bozulur; bu yüzden 4. adım şarttır.
6. **Google, Apple, Facebook sağlayıcıları kapalı** (§8.2 "Google engeli").
7. Auth hız sınırları gözden geçirilir (§8.2 "Riskler").
8. Anon/publishable anahtar → Vercel Preview `SUPABASE_ANON_KEY`. Local `.env.local` kurulumu ertelendi; yapılana kadar local'de üyelik kullanılamaz.
9. `0010` ayrı onayla SQL Editor'da (yalnızca test projesi) çalıştırılır. Ardından Merkez `/api/health`:
   - `0001`–`0010` hepsi `ok`;
   - `customerAuth`: `signupEnabledInSupabase: true`, `emailConfirmationOff: true`, sağlayıcılar kapalı.
10. Kod commit'i ve Preview (ayrı onay).

Durum (2026-10-12):

| Adım | Durum |
|---|---|
| 1, 2, 5 | Kayıttan sonra doğrudan oturum açıldı, kayıt ve local şifre sıfırlama çalıştı (kullanıcı). Ayarların bu durumda olduğu buradan çıkarılıyor; panel bu belgede ayrıca teyit edilmedi. |
| 3, 6, 7 | Bu belgede teyit edilmedi. 6. adım Preview'da `/api/health` ile kontrol edilir. |
| 4 | Local adres çalışıyor (sıfırlama geçti). Dalın Preview adresi `https://funda1959-git-supabase-test-eek-media-s-projects.vercel.app/**` test projesine kaydedildi (kullanıcı, 2026-10-12). |
| 8 | Local `.env.local` kuruldu (kullanıcı). `SUPABASE_ANON_KEY` Vercel `funda1959` projesinde **yalnızca Preview**'a eklendi (kullanıcı, 2026-10-12); Production'da yok. |
| 9 | `0010` `funda1959-test`'te çalıştırıldı (kullanıcı). Merkez `/api/health` çıktısı bu belgede kayıtlı değil. |
| 10 | Commit + push `origin/supabase-test`'e onaylandı (2026-10-12); `main`, Production ve migration yok. Commit kimliği ve Preview build sonucu: aşağıda "Aşama 5 — Preview hazırlığı". |

**Sonuç — local + gerçek `funda1959-test` (kullanıcı tarafından doğrulandı, 2026-10-12)**

- Kayıt, giriş ve çıkış.
- Profil ve adreslerin kalıcılığı (yenileme ve yeni oturum sonrası).
- Checkout'un üye bilgileriyle otomatik dolması.
- Şifre sıfırlama (e-posta → `/auth/confirm` → `/sifre-yenile` → yeni şifre).
- Başka hesabın siparişine erişimin engellenmesi.

Bu liste dışındaki kontroller yapılmış sayılmaz (aşağıda "Henüz yapılmamış kabul kontrolleri").

**Aşama 5 — Preview hazırlığı (2026-10-12; hazırlık yapıldı, commit, push ve deploy ayrı onayla)**

*Git — bağlantı kuruldu (2026-10-12; commit, push yok)*

- **Bağlantı:** `funda1959-supabase-test` artık bir Git deposu. `origin` = `https://github.com/UtkuEser/funda1959.git`. Yerel `supabase-test` dalı `origin/supabase-test`'i izliyor; HEAD = uzak commit **`5c73517`** ("Fiyatlar ekranı: ürün başına tek satır, açılır boyutlar").
- **Dosyalar korundu:** Yalnızca `git init`, `remote add`, tek dalın `fetch`'i, `update-ref` ve `read-tree` (`-u` olmadan; yalnızca index) kullanıldı; reset ya da checkout yok. Öncesi ve sonrasında 329 dosyanın SHA-256 özetleri aynı.
- **`funda1959-git`:** Bu klasöre dokunulmadı (`main` @ `60355bf`, 42 commit edilmemiş dosya).
- **Uzak dal ile çalışma dosyalarının farkı:**
  - 36 değişen dosya (+1433 / −891) ve 28 yeni dosya; silinen dosya ya da yalnızca izin (mod) farkı yok.
  - Kaynak kod ve migration farkları yalnızca Aşama 5'e ait (§8.2 dosya listesi; değişiklik zamanları da Aşama 5 çalışmasıyla örtüşüyor).
  - Belgeler: `SUPABASE_PLAN.md` (Aşama 4 durum düzeltmesi, D22–D29, §8.2, bu bölüm), `supabase/README.md`, `.env.example`.
- **`package-lock.json` — düzeltildi (2026-10-12):**
  - İlk kurulum (npm 10.9.8) kilit dosyasını yeniden yazmış ve 38 Linux platform paketinin `libc` alanlarını silmişti.
  - Düzeltme: uzak sürüm (`5c73517`) temel alındı; Supabase bağımlılıkları npm 11.21.0 ile yalnızca kilit dosyasına işlendi (`install --package-lock-only`); `node_modules`'a dokunulmadı.
  - Sonuç: uzak sürüme göre yalnızca ekleme var (128 satır, silme yok).
    - Kök bağımlılık listesine `@supabase/ssr` ve `@supabase/supabase-js` eklendi.
    - 10 yeni paket girdisi: `@supabase/*` 7 paket, `@supabase/phoenix`, `cookie` 1.1.1, `iceberg-js` 0.8.1.
    - 38 `libc` alanı korundu; mevcut hiçbir bağımlılığın sürümü değişmedi.
  - Doğrulama:
    - Yeni girdiler kurulu `node_modules` sürümleriyle birebir aynı.
    - `npm ls --all` hatasız.
    - İkinci çalıştırma değişiklik üretmiyor.
    - `tsc` ve `next build` başarılı; tarayıcı paketlerinde sunucu sırrı yok.
- **Commit'e girecekler:** `package.json` + `package-lock.json`, `src/proxy.ts`, §8.2'deki yeni ve değişen dosyalar, `supabase/migrations/0010_customer_accounts.sql`, `scripts/verify-accounts.ts`, belgeler.
- **Girmeyecekler (gerçek depoda `git status --ignored` ile doğrulandı):** `.env.local`, `.next/`, `node_modules/`, `.DS_Store`, `tsconfig.tsbuildinfo`, `next-env.d.ts`.
- **Sır kontrolü (gerçek depo):**
  - `git check-ignore`: `.env.local` ← `.gitignore:34 .env*`.
  - Index'teki tek env dosyası `.env.example`; dalın tüm geçmişinde var olmuş tek `.env*` dosyası da `.env.example`.
  - `.env.local`'deki 8 gizli değerin hiçbiri commit'e girebilecek 324 dosyada geçmiyor; dal geçmişinde de geçmiyor (`git log -S`).
  - `.env.example` yalnızca değişken adlarını içeriyor.

*Vercel — Settings → Environment Variables* (değerler yalnızca panelde; sohbete veya repoya yazılmaz)

| Değişken | Preview | Production | Not |
|---|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `funda1959-test` (Aşama 1–4'ten beri var) | dokunulmaz | |
| `SUPABASE_ANON_KEY` | **yeni:** `funda1959-test`'in anon/publishable anahtarı | **tanımlanmaz** | Production'da yokken üyelik "kullanılamıyor" kalır. Kayıt kapısı (D27) ve sipariş kapısı (§6.1) kodda zaten kapalı. |
| `ADMIN_SESSION_SECRET`, `ADMIN_*`, `MERKEZ_ADMIN_*` | mevcut değerler | mevcut değerler | değişiklik yok |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | boş | boş | tarayıcı Supabase'e bağlanmaz |
| `VERCEL`, `VERCEL_ENV` | elle tanımlanmaz | elle tanımlanmaz | |

Yeni değişken yalnızca sonraki deploy'a girer: push'tan önce eklenmeli (sonradan eklenirse yeniden deploy gerekir).

*Supabase (`funda1959-test`) → Authentication → URL Configuration*

- **Redirect URLs'e eklenecek (yalnızca bu proje ve bu dal):** `https://funda1959-git-supabase-test-eek-media-s-projects.vercel.app/**`.
  - Proje `funda1959`, Vercel hesap kısaltması `eek-media-s-projects`; ikisi de GitHub'daki `5c73517` commit durumunun Vercel bağlantısından alındı.
  - Biçim Vercel'in dal adresi kuralına uyuyor (`<proje>-git-<dal>-<hesap>.vercel.app`). Alt alan 48 karakter, 63 karakter kısaltma sınırının altında.
  - Adres yanıt veriyor: Vercel girişine 302. Var olmayan bir dal 404 `DEPLOYMENT_NOT_FOUND` veriyor.
  - Hesabın tüm projelerini kapsayan `https://*-eek-media-s-projects.vercel.app/**` joker adresi **kullanılmaz.**
  - Sonuç: commit'e özel adresler (`funda1959-<hash>-eek-media-s-projects.vercel.app`) izinli değil. Preview testleri, özellikle şifre sıfırlama, dal adresinden başlatılmalı; aksi halde bağlantı Site URL'ye düşer.
- **Mevcut local adresler kalır:** `http://localhost:3000/**` ve `http://localhost:3001/**`.
- **Uygulamanın gönderdiği adres:** `https://<preview-adresi>/auth/confirm?next=%2Fsifre-yenile`. İzinli listede değilse Supabase Site URL'ye düşer ve sıfırlama bağlantısı bozulur. Şablon `{{ .RedirectTo }}` kullandığı için Site URL'yi değiştirmek gerekmez [V].
- **Vercel Authentication:** Preview bununla korunuyor; e-postadaki bağlantı, Vercel'de oturumu açık bir tarayıcıda açılmalı.
- **Özel SMTP sonraya bırakıldı:** yerleşik e-posta yalnızca proje ekibi üyelerinin adreslerine ve saatte birkaç e-posta gönderir. Preview'da sıfırlama bir ekip üyesi adresiyle denenmeli.
- **Sağlayıcılar:** Google, Apple ve Facebook kapalı kalır (A25).

**Push (2026-10-12)**

- Commit `c6f1292` ("Aşama 5: müşteri üyeliği, profil, kayıtlı adresler ve üye siparişleri"): 64 dosya. Yalnızca `origin/supabase-test`'e push edildi (`5c73517..c6f1292`, ileri sarma, zorlama yok); `main`, Production ve migration yok.
- Vercel Preview build: push'tan sonraki ~11 dakikada GitHub'a durum kaydı gelmedi; aynı saatlerde Vercel'de açık bir olay vardı ("Increased build and deployment failures"). Kullanıcı daha sonra **`c6f1292` Preview dağıtımının Vercel'de Ready olduğunu doğruladı.**

**Sonuç — Preview (`supabase-test` @ `c6f1292` + `funda1959-test`, kullanıcı tarafından doğrulandı, 2026-10-12)**

- Mevcut hesapla giriş.
- Profil, kayıtlı adresler ve üye siparişlerinin görüntülenmesi.
- Şifre sıfırlama: e-postadaki bağlantı Preview adresine döndü; yeni şifreyle yeniden giriş yapıldı.

Bu liste dışındaki Preview kontrolleri yapılmış sayılmaz.

**Sonuç — local derlenmiş sürüm + gerçek `funda1959-test`, otomatik kontroller (2026-10-12): 38/38**

`next build` çıktısı ayrı bir süreçte (3100 portu) `.env.local` ile çalıştırıldı. Betik scratchpad'deydi ve depoya girmedi; token, şifre ve anahtar yazdırmadı. E-posta gönderilmedi, migration çalıştırılmadı.

- **Health (Merkez):** `expectedData: test`, `database: ready`, `0001`–`0010` 14 kontrolün hepsi `ok`. `customerAuth`: kodda kayıt açık, Supabase'de kayıt açık, e-posta doğrulaması kapalı; Google, Apple ve Facebook kapalı.
- **Sosyal giriş:** `/giris`'te buton yok; Google başlatma → `/giris?hata=saglayici`.
- **Kayıt:** iki yeni hesap doğrudan oturum açtı. Çerezler `HttpOnly` ve `SameSite=Lax`, "Beni hatırla" açıkken `Max-Age` var.
- **Onay kaydı yok:** yeni profillerde `terms_version` ve `terms_accepted_at` boş; test projesindeki 4 profilin hiçbirinde onay kaydı yok (salt okunur sorgu).
- **"Beni hatırla" kapalı:** oturum çerezlerinde `Max-Age` ve `Expires` yok; `funda_auth_persist=0`.
- **Adresler:**
  - 10 adres kaydedildi, ilki varsayılan; 11. adres 409.
  - 3. adres varsayılan yapılınca tek varsayılan kaldı.
  - Varsayılan silinince en eski adres varsayılan oldu (veritabanında teyit).
  - Başka hesabın adresi silinemedi (404).
- **Üye siparişi:**
  - Girişliyken verilen demo sipariş: `orders.customer_user_id` oturumdaki hesap oldu; gövdeye konan başka hesabın kimliği yok sayıldı. Sipariş demo ve `pending`.
  - Aynı e-postayla verilen misafir siparişinde `customer_user_id` boş.
  - Siparişlerim üye siparişini gösteriyor, misafir siparişini göstermiyor.
  - Başka hesap bu sipariş detayında "Sipariş Bulunamadı" görüyor.
- **Admin ve iptal:** Merkez girişi ve sipariş ekranı çalışıyor, üye siparişi listede. Gerekçeli iptal sonrası müşteri detayında "İptal gerekçesi" ve gerekçe görünüyor; `cancelled_by` değeri görünmüyor.
- **Değişmeyenler:** misafir checkout Supabase bağlıyken 201 döndü. Funda Puan'da müşteri için hesap ve hareket oluşmadı (404).
- **Şifre:**
  - Normal oturumdan `recovery` modu 403 döndü (gerçek Supabase `amr` kontrolü).
  - Yanlış mevcut şifre 400; doğru şifreyle değişiklik 200.
  - Eski şifre reddedildi, yenisi kabul edildi.
  - Kayıtsız e-postaya sıfırlama isteği `{"ok":true}` döndü (e-posta gönderilmedi).
- **Çıkış:** yalnızca o tarayıcı çıkış yaptı; diğer tarayıcıdaki oturum açık kaldı.
- **Bulgu — şifre değişince diğer oturumlar Supabase tarafından kapatılıyor:**
  - Şifre değiştikten sonra aynı hesabın başka tarayıcıdaki oturumunun yenileme belirteci `400 refresh_token_not_found` döndü.
  - Kontrol denemesi: şifre değişmeden yenileme 200.
  - Bu, Supabase'in kendi davranışı; uygulama kodu oturum kapatmıyor (D29 korunuyor). Diğer oturum, erişim belirtecinin süresi dolana kadar (varsayılan 1 saat) çalışıyor, sonra girişe düşüyor.
  - Şifre sıfırlamada da aynı Auth işlemi (`updateUser`) kullanıldığından aynı sonuç beklenir [V].
- **Production simülasyonu (local, `VERCEL_ENV=production`, test projesine bağlı; gerçek Production değildir):**
  - `/api/health` → `env_mismatch`, veri isteği yok.
  - Kayıt 403 `SIGNUP_CLOSED`; `/uye-ol` "Üyelik henüz açılmadı" diyor.
  - `POST /api/orders` 503 "Online sipariş alımı henüz açılmadı."
  - Demo butonu bu yöntemle doğrulanamadı: buton istemci tarafında, sepet olduğunda çiziliyor.
- **Test kayıtları (`funda1959-test`'te korunuyor; sentetik, e-posta `a5local-202610121640-{a,b}@example.com`):**
  - 2 hesap; A hesabında 9 adres.
  - `FND-20261012-739E`: üye siparişi, gel-al GOP, gerekçeyle iptal (Merkez).
  - `FND-20261012-611C`: misafir siparişi, yeni.
  - A hesabının şifresi test sırasında iki kez değiştirildi.

**Aşama 5 kabul kontrolleri — durum (2026-10-12)**

| # | Kontrol | Durum |
|---|---|---|
| 1 | Merkez `/api/health` (0001–0010, `customerAuth`, sağlayıcılar kapalı) | **Kısmen:** local'de aynı test projesiyle tamam (Supabase tarafı doğrulandı). Preview'da çağrılması **ertelendi** (2026-10-12; geçti sayılmaz). |
| 2 | Local akışların Preview'da tekrarı | **Kısmen (kullanıcı):** mevcut hesapla giriş; profil, adres ve üye siparişi görüntüleme; Preview'a dönen bağlantıyla şifre sıfırlama ve yeniden giriş geçti. **Ertelendi (2026-10-12; geçti sayılmaz):** Preview'da yeni kayıt, çıkış, düzenleme sonrası yenileme, checkout otomatik doldurma, başka hesabın sipariş numarası. |
| 3 | Sipariş hesaba bağlanıyor; misafir siparişi bağlanmıyor | **Tamam** (local, gerçek test projesi). |
| 4 | İptal gerekçesi görünür, işlemi yapan hesap görünmez | **Tamam** (local). |
| 5 | 11. adres reddi; varsayılan silinince en eski adres | **Tamam** (local). |
| 6 | "Beni hatırla" kapalıyken oturum tarayıcıyla biter | **Kısmen:** çerezler oturum çerezi (`Max-Age`/`Expires` yok). Gerçek tarayıcı kapatma **ertelendi**; bazı tarayıcılar "kaldığın yerden devam et" ayarıyla oturum çerezlerini saklar. |
| 7a | Kayıtsız e-postaya aynı yanıt | **Tamam** (local; `{"ok":true}`). |
| 7b | Eski şifre geçersiz olur | **Tamam:** profil şifre değişikliğiyle (local). Sıfırlama sonrası kullanıcı yeni şifreyle girdi; eski şifre ayrıca denenmedi. |
| 7c | Şifre değişince diğer oturumlar | **Kapandı — D30:** Supabase diğer oturumları en geç 1 saat içinde sonlandırır; bu davranış korunur. Kod oturum kapatmaz. Local'de doğrulandı (yenileme belirteci iptal, kontrol denemesi geçerli). |
| 7d | 15 dakikayı geçen sıfırlama bağlantısı reddedilir | **Ertelendi (2026-10-12; geçti sayılmaz):** gerçek e-posta ve 16 dakika bekleme gerekir (yerleşik SMTP yalnızca ekip adresleri). |
| 8 | Onay kaydı yok | **Tamam** (test projesindeki tüm profiller). |
| 9 | Misafir checkout, admin, Funda Puan değişmedi | **Tamam** (local). |
| 10 | Google butonu yok, sağlayıcılar kapalı | **Tamam** (local; Supabase ayarları health'ten). |
| 11 | Production: kayıt 403, sipariş 503, demo butonu yok, anon anahtar yok | **Kısmen:** local Production simülasyonunda kayıt 403 ve sipariş 503. Gerçek Production kurulmadı. Anon anahtarın Production'da olmadığını kullanıcı bildirdi. Demo butonu HTML'den doğrulanamadı. |

**Aşama 5 durumu (2026-10-12): temel akışlar local ve Preview'da doğrulandı; kalan kontroller ertelendi**

Ertelenen kontroller **açık** kalır ve geçti sayılmaz:

1. Preview'da yeni kayıt ve çıkış; profil ve adres düzenleyip yenileme; checkout otomatik doldurma; başka hesabın sipariş numarası (madde 2).
2. Preview'da Merkez oturumuyla `/api/health` (madde 1).
3. 15 dakikayı geçen sıfırlama bağlantısının reddi (madde 7d).
4. "Beni hatırla" kapalıyken gerçek tarayıcı kapatma (madde 6).
5. Gerçek Production kontrolleri (madde 11): Production kurulunca.

Aşama 5 dışında, canlıya geçişle ilgili konular: Google (A25), üyelik metinleri (A24), özel SMTP (ertelendi), production projesi kurulumu (§7.6 adım 14) ve gerçek Production kontrolleri.

*Google — engelli (§8.2, A25)*

Adımlar hazır ama engel kalkana kadar **uygulanmaz.** Engel kalkınca ayrıca kod değişikliği (`SOCIAL_PROVIDERS_ALLOWED.google`) ve ayrı onay gerekir.

- Google Cloud'da (web ekibinin hesabı) proje → OAuth onay ekranı: uygulama adı "Funda 1959", destek e-postası, hedef kitle **External**, durum **Testing** (yalnızca eklenen test kullanıcıları, en fazla 100).
- OAuth client (Web application); yetkili yönlendirme adresi `https://<test-proje-ref>.supabase.co/auth/v1/callback`; kapsamlar `openid`, `email`, `profile`.
- Client ID + Secret → Supabase test projesindeki Google sağlayıcısı.
- Production için ayrı bir OAuth client, production projesinin callback adresiyle [V]. Uygulamayı "In production" durumuna almak için ana sayfa ve gizlilik politikası adresi gerekir (A24, A18).

*Apple (sonra, ayrı onay)*

- Apple Developer Program üyeliği (yıllık ücretli; kurum adına açılacaksa D-U-N-S numarası).
- App ID (Sign in with Apple açık) + Services ID (web için client ID); alan adı ve dönüş adresi `https://<proje-ref>.supabase.co/auth/v1/callback`.
- Sign in with Apple anahtarı (.p8), Key ID ve Team ID. Supabase'e girilen "client secret" bunlardan üretilir ve **en geç 6 ayda bir yenilenmelidir**; takvime bağlanmalı.
- Kullanıcı e-postasını gizleyebilir (`@privaterelay.appleid.com`). Şifre sıfırlama e-postalarının ulaşması için gönderen alan adı Apple'ın e-posta aktarma servisine kaydedilir. Ad yalnızca ilk girişte gelir.
- Aynı otomatik bağlama riski geçerlidir (§8.2 "Google engeli").

*Facebook (sonra, ayrı onay)*

- Meta for Developers hesabı ve uygulama (Facebook Login), izinler `email`, `public_profile`.
- Geçerli OAuth yönlendirme adresi `https://<proje-ref>.supabase.co/auth/v1/callback`; App ID + App Secret → Supabase.
- Uygulamayı canlıya almak için gizlilik politikası adresi, veri silme talimatı adresi, simge ve kategori gerekir; Meta işletme doğrulaması isteyebilir.
- Bazı Facebook hesaplarında e-posta yoktur; bu durumda giriş reddedilir [V].
- Aynı otomatik bağlama riski geçerlidir.

*Production öncesi*

- Özel SMTP ve gönderen alan adı (SPF/DKIM DNS kayıtları; A18) — **sonraya bırakıldı (2026-10-12)**. O zamana kadar Supabase'in yerleşik e-postası yalnızca proje ekibi üyelerinin adreslerine ve saatte birkaç e-posta gönderir.
- KVKK ve üyelik metinleri yayımlanmış olmalı (A24). Üyeliğin gerçek müşterilere açılması ayrı bir kod değişikliği ve onaydır (D27); ancak ondan sonra production projesinde "Allow new users to sign up" açılır.
- Production projesinde 1, 3–9 tekrarlanır; 2. adım kapalı başlar.

**Aşama 6 kurulum kontrolü (Funda Puan; önce yalnızca `funda1959-test`, web ekibi) — 1–6 tamam; 7 kısmen: Preview'da arama ve ilk düzeltme kullanıcı tarafından doğrulandı, diğer Preview kontrolleri açık. Kapalı altyapı hazırlığı tamamlandı (2026-10-14).**

1. ✅ `0011_funda_points.sql` SQL Editor'da test projesinde çalıştırıldı — **kullanıcı tarafından doğrulandı (2026-10-13):** "Success. No rows returned". Production'a uygulanmadı.
2. ✅ Merkez `/api/health` (local uygulama, gerçek `funda1959-test`, 2026-10-13): `database: ready`, `expectedData: test`; `0001`–`0011` 20 tablo kontrolünün hepsi `ok` (0011: 6/6). `customerAuth`: kayıt açık, e-posta onayı kapalı, yalnız e-posta sağlayıcısı açık.
3. ✅ `supabase/tests/0011_funda_points_test.sql` SQL Editor'da çalıştırıldı — **kullanıcı tarafından doğrulandı (2026-10-13):** "Success. No rows returned".
   - Tek işlem içinde çalışır ve sonunda geri alınır; test kullanıcısı, sipariş veya puan kalmaz.
   - Her kontrol başarısızlıkta "FAIL: …" istisnasıyla durduğu için hatasız bitmesi 10 bölümün tamamının geçtiği anlamına gelir. SQL Editor `NOTICE` satırlarını ("ok …", "ALL FUNDA PUAN CHECKS PASSED") göstermeyebilir.
   - Daha önce geçici yerel Postgres 18'de 65/65 geçmişti.
4. ✅ **Eşzamanlılık (iki oturum)** — **tamam (2026-10-13):**
   - ✅ Aynı üye kilidi API üzerinden (2026-10-13, yalnız bu test için oluşturulan üye): 100 puanlı üyeye uygulama üzerinden aynı anda iki −80 düzeltmesi → biri 200, diğeri 409; iki ayrı Supabase istemcisinden aynı anda iki `adjust_funda_points` −50 (bakiye 80) → biri `ok`, diğeri `insufficient_points`. Son bakiye 30, defter toplamı = parti kalanı, reddedilenler deftere yazılmadı. Bu, bütün puan işlemlerinin kullandığı hesap kilidini (`fp_lock_account`) gerçek veritabanında doğrular.
   - ✅ **Rezervasyon** (`fp_reserve_for_order`) iki oturumda — **kullanıcı tarafından gerçek `funda1959-test`'te SQL Editor'da çalıştırıldı (2026-10-13):**
     - Sekme A: 80 puan ayırdı (`ayirdi_80`).
     - Sekme B: kilidi **17,7 sn** bekledi, `insufficient_points` aldı; karar `GEÇTİ`.
     - Doğrulama: tek sipariş, tek rezervasyon, tek kullanım (`REDEEM`) hareketi, kalan 20 puan, borç 0.
     - Temizlik: üye, profil, müşteri ve sipariş sayıları 0; karar `TEMİZ`.
     - Böylece aynı bakiyenin iki eşzamanlı siparişte harcanamadığı gerçek veritabanında, iki ayrı bağlantıyla doğrulandı. (Uygulama yolu `create_order` üzerinden değil: fonksiyon API'ye kapalı ve `create_order` demo olmayan siparişi hâlâ reddediyor; betikler `create_order`'ın aynı adımlarını tek işlemde uygular.)
   - SQL Editor betikleri: `supabase/tests/0011_concurrency/`.
     - Açık işlem çalıştırmalar arasında taşınamadığı için her sekme tek çalıştırmada biter; A sekmesi kilidi `pg_sleep(20)` ile tutar.
     - Her betik önce ortam işaretinin `test` olduğunu kontrol eder; değilse durur.
     - Yalnızca `fpc-eszamanlilik@example.invalid` üyesi, ona ait müşteri satırı ve `FPC-TEST-A` / `FPC-TEST-B` siparişleri kullanılır; mevcut üyelere dokunulmaz.
     - Test sürerken Merkez'in sipariş listesinde `FPC-TEST-A` (bekliyor, demo değil) görünür; temizlikle silinir.
   - Sıra:
     1. `1_kurulum.sql`: test üyesi + 100 puan (Merkez düzeltmesi). Beklenen: `kullanilabilir_puan` 100.
     2. `2_sekme_a.sql` (Sekme A): demo olmayan `FPC-TEST-A` + 80 puan rezervasyonu; kilidi 20 sn tutar. Beklenen: `ayirdi_80`.
     3. `3_sekme_b.sql` (Sekme B, A'nın ilk 20 sn'sinde): aynı üye için 80 puan. Beklenen: `insufficient_points`, `kilit_bekleme_sn` ≥ 1, karar `GEÇTİ`; B'nin siparişi geri alınır. `TEKRARLA` → 5, 1, 2, 3.
     4. `4_dogrulama.sql`: 1 sipariş, 1 rezervasyon, 1 `REDEEM`, kullanılabilir 20, parti kalanı = defter toplamı = 20, borç 0. Beklenen: `GEÇTİ`.
     5. `5_temizlik.sql`: puan hesabı (parti, hareket, rezervasyon zincirleme) → `FPC-TEST-*` siparişleri → test müşterisi → test üyesi. Beklenen: `TEMİZ`.
   - Betikler geçici yerel Postgres'te (PGlite) sırayla denendi: kurulum, ikinci kurulumun reddi, A → B (`insufficient_points`), doğrulama `GEÇTİ`, temizlik `TEMİZ` (iki tur); ters sıra; başka üyenin 50 puanı değişmedi; `production` işaretinde betikler durdu.
   - PGlite tek bağlantılı olduğu için bu deneme eşzamanlılığın kanıtı **değildir**. Kanıt, yukarıdaki gerçek proje sonucudur (Sekme B 17,7 sn bekledi, `GEÇTİ`; doğrulama koşulları sağlandı).
5. ✅ Admin "Funda Puan" (local uygulama + gerçek test projesi, 2026-10-13; yalnız bu test için oluşturulan üye, sonunda silindi):
   - Merkez: gerekçeli +100 → 200 (bakiye 100); aynı `requestId` tekrarı bir kez uygulandı; gerekçesiz 400; bakiyeden fazla düşüş 409; detayda düzeltmeyi yapan ve gerekçe görünür.
   - GOP: puan detayı ve düzeltme API'si 403; `/admin?section=funda-puan` bölümü çizmez, menüde Funda Puan bağlantısı yok; denemeler bakiyeyi değiştirmedi. Oturumsuz API 401.
   - Boş durum metni Merkez'de görünür.
   - Mevcut üyelerin bakiyelerine dokunulmadı; test üyesi ve tüm satırları silindi (profil, hesap, parti, hareket, rezervasyon: 0).
   - **2. tur (2026-10-13, local derlenmiş sürüm + gerçek `funda1959-test`; yeni test üyesi, sonunda silindi): 22/22.**
     - Merkez: gerekçeli +25 → yeni parti, süresi 1 yıl (365/366 gün); hareket gerekçe ve admin adıyla kayıtlı; aynı `requestId` bir kez uygulandı; −5 → 20; −999 → 409; gerekçesiz → 400; liste test üyesini gösterdi.
     - GOP: detay 403, düzeltme 403, bölüm çizilmedi.
     - Başka üyelerin puan hesapları ve partileri değişmedi; yeni defter satırlarının hepsi (3) test üyesine ait.
6. ✅ `/hesabim/puanlarim` (test üyesi oturumu): 200, "Funda Puan henüz etkin değil" notu, bakiye 30; admin adı ve gerekçe görünmez; oturumsuz istek girişe yönlenir (307). Puan isteyen teklif (`/api/orders/quote`) 409 (D41). Kazanım ve kullanım kapalı kaldı.
   - 2. tur: bakiye 20, son kullanma tarihi ve "Merkez düzeltmesi" hareketi görünür; admin adı ve gerekçe görünmez; başka bir üye bu puanları görmez. Puanlı teklif ve sipariş 409 `POINTS_DISABLED` (sipariş yazılmadı); checkout'ta puan alanı yok.
7. Kod commit'i ve Preview — **commit + push yapıldı (2026-10-13, 2026-10-14); Preview'da arama ve ilk düzeltme doğrulandı, diğer Preview kontrolleri açık.**
   - Aşama 6 kodu, `0011`, SQL testleri ve eşzamanlılık betikleri `51c0028` ile `supabase-test` dalına pushlandı (yalnız bu dal; `main` ve Production değişmedi, migration çalıştırılmadı).
   - Commit öncesi local: `tsc` temiz, `eslint` 0 hata, `next build` başarılı; `verify-funda-points` 44/44, `verify-accounts` 86/86, `verify-orders`, `verify-fulfillment`, `verify-prices` geçti.
   - ✅ **Preview, kullanıcı tarafından doğrulandı (2026-10-14, `b3882c4`):** Merkez → Funda Puan'da mevcut üye e-postasıyla arandı ve bulundu; ilk Merkez düzeltmesi +25 müşteri ekranına (Hesabım → Puanlarım) yansıdı; −25 sonrası bakiye 0 ve iki hareket göründü.
   - ⏳ **Preview'da açık (yapılmadı, geçmiş sayılmaz):** `/api/health` `0011` 6/6, GOP 403, `/hesabim/puanlarim` "henüz etkin değil" notu, puanlı teklif 409 `POINTS_DISABLED`, checkout'ta puan alanı olmaması.
   - **Preview bulgusu (2026-10-14, kullanıcı): Merkez Funda Puan araması, hiç puan hareketi olmayan mevcut üyeyi e-postasıyla bulmuyordu; ilk düzeltme başlatılamıyordu.**
     - Neden: `list_funda_point_accounts` listeyi `funda_point_accounts`'tan başlatır (hesabı olmayan üye hiç gelmez); ekrandaki arama da yalnızca tarayıcıya yüklenmiş ilk 200 satırı süzüyordu.
     - Düzeltme (`5e8b814`, migration yok): `GET /api/admin/funda-points?search=` (2–100 karakter, en fazla 50 sonuç). Hesabı olanlar bakiyeleriyle mevcut RPC'den, hesabı olmayanlar `customer_profiles`'tan salt okunur sorguyla 0 puanla gelir. Yalnızca Merkez (servis katmanı şubeyi istek göndermeden reddeder). Arama metninde `%`, `_`, virgül, parantez ve tırnak kaçışlanır. Arama ve detay hiçbir şey yazmaz; puan hesabı ilk düzeltme kaydedilince `adjust_funda_points` içinde oluşur. Düzeltme ve tekrar koruması değişmedi.
     - Ekran: yazarken 300 ms sonra sunucuda arar; hareketi olmayan üyede "Son Hareket" "—"; ilk düzeltmeden sonra üye listede kalır, toplamlar sunucudan yenilenir.
     - **Local derlenmiş sürüm + gerçek `funda1959-test`, Playwright tarayıcı testi (2026-10-14): 34/34.** Yalnız bu test için oluşturulan, puan hesabı olmayan üye:
       - ilk listede yok; e-postasıyla arama → bulundu (0 puan, "—"); arama ve detay sonrası hesap/hareket/parti sayıları değişmedi;
       - mevcut, puan hesabı olmayan bir üye e-postasıyla bulundu (yalnız okuma; o üyeye bir şey yazılmadı);
       - +25 → bakiye 25, parti 25/25, hareket gerekçe ve admin adıyla; −25 → bakiye 0, kullanılabilir parti yok; liste satırı: kullanılabilir 0, toplam kazanılan 25;
       - ilk +25 isteği aynı `requestId` ile yeniden → 200, bakiye 0 kaldı (tekrar koruması);
       - veritabanında tam 2 hareket (`ADMIN_ADD` +25, `ADMIN_SUBTRACT` −25; `merkez`, admin adı, gerekçe, iş anahtarı = istek kimliği), 1 parti (1 yıl, kalan 0), borç 0; başka üyelere satır yazılmadı;
       - oturumsuz arama 401, 1 karakter 400, GOP 403 ve arama kutusu çizilmedi; bu denemeler bir şey yazmadı;
       - temizlik: test üyesi silindi (profil, hesap, hareket, parti: 0).
     - `verify-funda-points` 49/49 (5 yeni arama kontrolü: hesabı olmayan üye bulunur, bakiye defterden, yalnız okuma, kaçış, şube reddi).
     - Test projesinde o sırada 4 kayıtlı üye vardı, hiçbirinin puan hesabı yoktu. Preview'da mevcut üyeyle +25/−25 kontrolü kullanıcı tarafından arayüzden yapıldı ve geçti (2026-10-14, yukarıda).
8. **Aşama 9'a (ödeme) bırakılanlar:**
   - `isFundaPointsActive()` → `true` (kod değişikliği + ayrı onay);
   - `create_order`'ın demo olmayan sipariş kabulü;
   - `complete_order_payment` / `fail_order_payment` çağrılarının ödeme sağlayıcısına bağlanması;
   - `release_expired_point_reservations` (ör. 5 dakikada bir) ve `expire_funda_points` (günlük) için pg_cron zamanlaması.

---

## 8. Uygulama sırası ve testler

Aşamalar bağımlılık sırasındadır ve **tek tek** uygulanır; her biri ayrı test edilip deploy edilir.

| Aşama | Kapsam ve dosyalar | Ön koşul | Durum | Kabul kriterleri |
|---|---|---|---|---|
| **0. Altyapı ve sahte davranışların kaldırılması** | **Yapıldı:** `lib/persistence.ts`, `app/api/health/route.ts`, `lib/supabase-server.ts` (`SupabaseRestError`), yazma yollarında 503 koruması, kampanya okuma güvenliği, `0004`, `0005`, `supabase/README.md`, `.env.example`.<br>**Bu turda eklendi:**<br>(a) demo sipariş `pending` (`lib/orders/engine.ts`, `lib/orders/repository.ts`);<br>(b) kapasite ve sahte "dolu" kaldırıldı (`lib/delivery/slots.ts`, `lib/availability/engine.ts`, admin "Teslimat Slotları");<br>(c) rezervasyon kaldırıldı (`lib/reservations`, `app/api/reservations`, `PaymentPage`, `lib/checkout-handoff.ts`, `CheckoutPage`, `api/orders`, admin "Rezervasyonlar" ve genel bakış); eski admin bağlantıları genel bakışa yönlenir (`lib/admin/section-access.ts`); `scripts/verify-*.ts` güncellendi.<br>**Kurulum öncesi tamamlananlar (2026-10-10):**<br>(d) ortam işareti kontrolü ortak katmanda: her okuma, yazma ve RPC (`lib/supabase-server.ts`; `lib/persistence.ts` aynı kontrolü kullanır);<br>(e) `0006_orders_demo_flag.sql`; sunucu her siparişte `is_demo: true` (`lib/orders/engine.ts`, `lib/orders/repository.ts`, `lib/order.ts`); admin "Demo" etiketi (`app/admin/page.tsx`);<br>(f) production'da `POST /api/orders` 503 (`app/api/orders/route.ts`, `lib/orders/engine.ts`);<br>(g) `/api/health`: `0006` kontrolü, şema yoklaması yalnızca işaret eşleşince ve `limit=0`;<br>(h) doğrulama betikleri yalnızca bellekte veya `test` işaretli projede yazar (`scripts/test-environment-guard.ts`). | D1, D3 | Kod tamam (`e897090`); test + Preview kurulumu tamam; **production kurulumu bekliyor** (§7.6) | Vercel'de DB yok / ulaşılamıyor / yanlış proje → her yazma 503; sahte başarı yok. İşaret yok veya yanlış → hiçbir uygulama tablosuna istek gitmez (okuma dahil). Demo sipariş `pending` + `is_demo = true`; tarayıcı değiştiremez. Production'da sipariş alımı 503. Hiçbir slot "dolu" görünmüyor. Kapanma yalnızca saat, hazırlık ve pasif kuralından. Ödeme ekranında bekletme/sayaç yok. |
| **1. Şube stokları** | Stok düzeltmesi (`lib/inventory/*`, `api/admin/inventory`, `BranchStockManager`, `0003`); `supabase-test` dalında `e897090` | 0 | **Tamamlandı (2026-10-10)**<br>• Preview + `funda1959-test`: web ekibi doğruladı.<br>• Local + `funda1959-test`: kayıt ve şube bağımsızlığı elle doğrulandı; HTTP yetki testi 23/23 (oturumsuz 401; GOP kendi şubesi 200; GOP → Panora/İncek okuma ve yazma 403; Merkez üç şube 200; 403 denemelerinden sonra `branch_product_status` değişmedi).<br>• Not: aktife alınan ürün bugün seçilemiyorsa önce zaman kuralına bakılır. Örnek: İncek'te `p5`, 4 sa hazırlık, son aralık 19:00–20:00 → bugün için son sipariş 16:00. `/api/availability` yanıtında `PREPARATION_TIME` = zaman kuralı, `NEXT_DAY_ONLY` = stok pasif okunuyor. | Aktif/pasif yenileme ve yeni oturumda korunur. GOP değişikliği diğer şubeleri etkilemez. Şube 403 / Merkez 200. Müşteride "En erken yarına teslim". |
| **2. Siparişler** | `0007_orders_hardening.sql`; `lib/order-server.ts` (motorla yeniden uygunluk, İstanbul tarihi, adresten şube/bölge, sunucuda fiyat/indirim/ücret); `app/api/orders` (stok okunamazsa 503, 400/409); `lib/orders/repository.ts` (asenkron depo, kapsam/filtre/sayfa, D12 kuralları), `lib/orders/supabase-repository.ts`, `lib/orders/server-init.ts`; `PATCH /api/admin/orders`; `app/admin/page.tsx` (DB'den genel bakış + liste, tarih filtresi, sayfalama, İstanbul saati, iptal kaydı), `components/admin/OrderStatusActions.tsx`; demo butonu local + Preview (`app/hizli-siparis-odeme/page.tsx`, `PaymentPage`); ödeme ekranı tutarları sunucudan (`POST /api/orders/quote`, `PaymentSummary`: ürün toplamı + teslimat ücreti ayrı, toplam = sipariş toplamı); demo siparişe puan yok (D13: `funda-points/service.ts`, `orders/engine.ts`); `lib/checkout-utils.ts`; `lib/order-status.ts`; `/api/health` `0007`; `scripts/verify-orders.ts` | 0, 1, D12 | **Tamamlandı (2026-10-10)**: `0007` test projesine uygulandı; local + gerçek `funda1959-test` (45/45 + doğrudan RPC eşzamanlılık) ve Preview (`2c75944`; 7AA6 ₺165 tutarlı, şube kapsamı, adım adım teslim, gerekçeli iptal) doğrulandı (§7.6 "Sonuç"). | Sipariş yenileme ve yeni oturumda korunur. Aynı istek 2 kez (sıralı ve eşzamanlı) → tek sipariş, aynı numara. Demo sipariş `pending` + etiketli. Geçersiz tarih/saat/pasif ürün/bölge → 409; stok okunamazsa 503. Teslimat şubesi adresten. Şube yalnızca kendi siparişlerini görür ve değiştirir; Merkez hepsini. İptal gerekçeli ve kayıtlı; teslim edilmiş sipariş iptal edilmez. |
| **3. Teslimat ücreti + minimum sipariş** | `0008_delivery_zone_fees.sql`; `lib/order-rules.ts` (500 TL); `lib/delivery/fees.ts` + `fees-server.ts` (Supabase / local dosya / sunucusuz ortamda kullanılamaz); motor (`DELIVERY_FEE_NOT_SET`, `DELIVERY_INFO_UNAVAILABLE`); `lib/order-server.ts` (ücret + `BELOW_MINIMUM`, 503); `api/orders` (önceki siparişi istek kimliğiyle önce bulur), `api/orders/quote`, `api/availability`; `PATCH /api/admin/delivery-fees` (yalnızca Merkez); admin "Bölgeler" + `DeliveryFeeEditor`; `formatTL` kuruş; sepet / hızlı sipariş / checkout minimum (`DeliveryMinimumNotice`) ve sunucudan ücret (`POST /api/delivery-fee`, `useDeliveryFee`, `OrderTotals`); checkout'ta kayıtlı adresin ilk açılışta kontrolü; ödeme ekranında demo butonu yalnızca geçerli tutar hesabıyla; PDP ve ödeme özeti ücret durumu; `zones.ts`'ten örnek ücret ve minimumlar kaldırıldı; `/api/health` `0008`; `scripts/test-fee-store.ts`, `verify-orders`, `verify-fulfillment` | 2; D14, D15 | **Tamamlandı (2026-10-10)**: `0008` test projesinde; local + gerçek `funda1959-test` (57/57 sunucu + RPC, 24/24 ekran, 33/33 ücret düzenleyici, 33/33 sepet → checkout → ödeme → sipariş) ve Preview (`63331f7`; `FND-20261010-4866` ₺540 + ₺230 = ₺770, admin'de görünüyor) doğrulandı (§7.6 "Aşama 3 kurulum kontrolü") | Ücreti belirlenmemiş bölgeye adrese teslim alınmaz, ücretsiz kabul edilmez; gel-al çalışır. Açıkça ücretsiz bölge 0 TL. Kuruşlu ücret yuvarlanmadan. Ücret okunamazsa "Teslimat bilgisi şu an alınamıyor". 499,99 reddedilir, 500 kabul edilir; indirimle altına düşen reddedilir; gel-al muaf. Şube ücret yazamaz (403). Tekrarlanan istek ikinci sipariş oluşturmaz; ücret sonradan değişse de eski sipariş korunur. |
| **4. Fiyat yönetimi** | `0009_product_prices.sql` (tablo + `create_order` v5); `lib/pricing/{prices,prices-server,prices-context,use-cart-prices}`; `lib/order-server.ts` ve motor aynı çözücü; `api/prices` (GET gösterim, POST sepet), `PATCH /api/admin/prices` (yalnızca Merkez); admin "Fiyatlar" (`ProductPricesTable`, `ProductPriceEditor`); fiyat gösteren sayfalar istek anında + `PricesProvider`; kart, hızlı sipariş, arama ve sıralama güncel fiyat; sepet / hızlı sipariş / checkout satır fiyatları sunucudan; `/api/health` `0009`; `scripts/verify-prices.ts`, `test-price-store.ts`. Teslimat Bölgeleri tablosu da istemci bileşeni (`ZoneFeesTable`) | 0 | **`0009` `funda1959-test`'te; local (mock e2e 255/255, tarayıcı 39/39 + 30/30, `verify-prices` 61/61) ve gerçek test Supabase'i (58/58) doğrulandı (2026-10-12)**; kararlar D16–D21 işlendi; **pushlandı (`04d7f43`, `5c73517`)**; Preview'da yalnızca Macaron fiyat eşleşmesi ve açılır boyut ekranı doğrulandı, diğer Preview kontrolleri bekliyor → §7.6 "Aşama 4 kurulum kontrolü" | Merkez fiyatı değiştirir; şube hesabı 403. Yeni fiyat katalogda, PDP'de, aramada, hızlı siparişte, sepette, checkout'ta, ödeme hesabında ve siparişte aynı. Eski siparişlerin kalemleri değişmez. Bilinmeyen ürün/varyant reddedilir. Fiyat okunamazsa sipariş ve ödeme hesabı 503. Kayıt sonrası admin tablosu hemen güncel; başarısız kayıt başarı göstermez. Kart en küçük boyutun fiyatını ("başlayan" ifadesi olmadan), ürün sayfası seçilen boyutun fiyatını gösterir. Her boyut ayrı düzenlenir, diğer boyutlar değişmez (D20). Eski fiyat yalnızca belirlenmiş ürün veya boyutta: Trüf kartı ₺260, 12'li seçilince ₺520 ~~₺580~~ (D21). |
| **5. Müşteri üyeliği** | Ayrıntı §8.2. `0010`; Supabase Auth sunucuda (`@supabase/ssr` + `@supabase/supabase-js` [V]); e-posta + şifre ve Google (Apple, Facebook kurulunca); `lib/auth.ts`, `lib/account-service.ts`, `/giris`, `/uye-ol`, `/sifremi-unuttum`, yeni `/sifre-yenile` ve `/uyelik-tamamla`, `/hesabim/*`; checkout'ta profil ve kayıtlı adres; `src/proxy.ts`; `SUPABASE_ANON_KEY` | 2; D22–D29; gerçek müşteriye açılış için A24 (metinler) + ayrı onay | **Temel akışlar local ve Preview'da doğrulandı; kalan kontroller ertelendi (2026-10-12)**: `c6f1292` Preview'da Ready; kullanıcının local ve Preview testleri; local otomatik 38/38 (gerçek test projesi). Ertelenen ve açık kalan kontroller §7.6 "Aşama 5 durumu". D30 (diğer oturumlar Supabase davranışı). Google engelli (A25) | Üye olur (metinler yayımlanınca), girer (e-posta veya Google), çıkar, şifresini e-postayla sıfırlar; profil ve en fazla 10 adres yönetir; yalnızca girişliyken verdiği siparişleri görür, başkasınınkini göremez. Misafir sipariş, admin girişleri ve yetkileri değişmez; Funda Puan kapalı. |
| **6. Funda Puan** | Ayrıntı §8.3. `0011`; `lib/funda-points/*` (defter veritabanında); Hesabım `/hesabim/puanlarim`; admin ekranı veritabanından; checkout puan altyapısı (kapalı); `lib/orders/payment.ts` | 5; D31–D41 | **Kapalı altyapı hazırlığı tamamlandı (2026-10-14):** `51c0028` + `5e8b814` `supabase-test`'te; Preview'da üye arama ve ilk Merkez düzeltmesi (+25 müşteri ekranında, −25 → 0, iki hareket) kullanıcı tarafından doğrulandı; diğer Preview kontrolleri açık (§7.6 adım 7). `0011` ve SQL testi `funda1959-test`'te kullanıcı tarafından çalıştırıldı, başarılı (2026-10-13); local + gerçek test projesi kontrolleri ve iki oturumlu rezervasyon testi geçti (§7.6). Kazanım ve kullanım kapalı (D41) | Ödeme onayında 1.000 TL − 200 puan → 80 puan; her parti 1 yıl; son kullanma sırasıyla tüketim; aynı bakiye iki kez harcanamaz; iptalde iade (süresi dolmuş hariç) ve geri alma (borç); tekrar korumalı; demo sipariş puan alamaz/harcayamaz; Merkez düzeltmesi gerekçeli; şube yetkisiz. |
| **7. Instagram** | **D42: veritabanı yok.** Ayrıntı §8.4. `src/lib/social/{instagram-content,instagram,instagram-types}.ts`; ana sayfa `InstagramContentSection`, `SocialVideoRail`; `next.config.ts` (videolar sunucu paketinin dışında); `scripts/verify-instagram-content.ts`; admin Instagram ekranı, `api/admin/instagram`, bellek deposu ve örnek kayıtlar kaldırıldı | D42 | **`e066056` ile `supabase-test`'e pushlandı (2026-10-14).** Local kontroller ve derlenmiş sürümde tarayıcı testi geçti (§8.4); Preview kontrolü yapılmadı (kullanıcıda) | Ana sayfada en fazla 5 kart, 9:16; video isteğe bağlı; videosuz kart Instagram gönderisine bağlanır; geçerli içerik yoksa bölüm gizli; admin menüsünde Instagram yok. |
| **8. İletişim talepleri** | Ayrıntı §8.5. `0012`; `lib/contact/*`; `components/contact/ContactForm.tsx` (`/iletisim`); `POST /api/contact`; admin "İletişim Talepleri" (`AdminContactRequests`, `GET/PATCH /api/admin/contact-requests`); `/api/health` `0012`; `scripts/verify-contact.ts`; `supabase/tests/0012_contact_requests_test.sql` | D43; canlı açılış A19 + A24 | **`78305ba`; `0012` `funda1959-test`'te (2026-10-14).** Local testler geçti; Preview'da form → Merkez listesi, İşlemde + iç not, Kapandı kullanıcı tarafından doğrulandı; gerçek eşzamanlılık testi GEÇTİ (§8.5). Ek: health `0012` ok, GOP menüsünde yok (kullanıcı, Preview); GOP API 403 (local). Açık: Preview'da GOP API 403, form hata durumları, 429 mesajı, filtre/sayaç, SQL testi sonucu; canlı açılış (A19, A24) | Talep kaydedilir; tekrar gönderim çift kayıt üretmez; başarı yalnızca kayıttan sonra; şube erişemez; Production gönderimi reddeder. |
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
| Admin değişikliğinin müşteriye yansıması | Stok → ≤ 2 sn uygunluk etiketi; fiyat → sonraki sayfa isteğinde (gösterim ≤ 5 sn önbellek), ödeme hesabı ve sipariş her zaman taze; ücret → checkout | 1, 3, 4 |
| Fiyat değişikliği | Kayıt sonrası admin tablosu hemen güncellenir (derlenmiş sürümde de); başarısız kayıt başarı göstermez; verilmiş siparişin kalemleri değişmez; okuma ile kayıt arasında değişen fiyat siparişi 409 ile reddeder | 4 |
| Boyutlu ürün fiyatı (D16, D20, D21) | Kart en küçük boyutun fiyatı ("başlayan" yok); ürün sayfası seçilen boyutun fiyatı; sepet ve sipariş seçilen boyutun fiyatı; bir boyutun değişmesi diğerlerini değiştirmez; eski fiyat yalnızca ait olduğu boyutta ve güncel fiyattan yüksekken | 4 |
| Minimum ve ücret | Adrese teslimde 499,99 reddedilir, 500 kabul edilir (ürün − indirim, ücret hariç); gel-al muaf; ücreti belirlenmemiş bölge reddedilir; açıkça 0 TL kabul; kuruşlu ücret yuvarlanmaz; ücret okunamazsa 503 | 3 |
| Puan süresi ve iade | 1 yıl dolan parti bakiyeden düşer; yeni kazanım eski partiyi uzatmaz; iptalde kazanılan geri alınır, harcanan iade edilir | 6 |
| Saat dilimi | Sunucu UTC iken Istanbul 00:30'da "bugün" Istanbul tarihidir | 2 |
| RLS | anon anahtarla yazma reddedilir; üye başkasının verisini okuyamaz | her migration, 5 |

Önceki sürümdeki "iki müşteri aynı son kapasite" ve "rezervasyon süresinin dolması" testleri **kaldırıldı** (D11: kapasite ve rezervasyon yok).

### 8.2 Aşama 5: müşteri üyeliği (D7, D22–D29)

Durum (2026-10-12):

- **Kod hazırlığı yapıldı, commit edilmedi.**
- `0010_customer_accounts.sql` **`funda1959-test`'te çalıştırıldı (kullanıcı)**; production'a uygulanmadı.
- Paketler kuruldu: `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.117.3.
- **Local `.env.local` kuruldu; gerçek `funda1959-test` ile local testler kullanıcı tarafından geçildi** (aşağıda "Doğrulama").
- **Commit `c6f1292` `supabase-test`'e pushlandı, Preview'da Ready.** Temel akışlar local ve Preview'da doğrulandı; kalan kontroller ertelendi (§7.6 "Aşama 5 durumu").
- **Google kod düzeyinde kapalı** (aşağıda "Google engeli"); Funda Puan kapalı; özel SMTP sonraya bırakıldı.

**Kapsam:** e-posta + şifre ile kayıt ve giriş, çıkış, e-postayla şifre sıfırlama, profil, kayıtlı adresler, üyenin kendi siparişleri, checkout'ta üye bilgisi; Google girişi için altyapı (kapalı).
**Kapsam dışı:** Apple ve Facebook (sonra), Instagram ile giriş (eklenmez), misafir siparişlerinin bağlanması (A5), Funda Puan (Aşama 6), admin hesapları (D6), pazarlama izni (D26), hesap silme, e-posta değiştirme, telefonla giriş [V].

**Mimari (kodda)**

- **Auth yalnızca sunucuda.** `@supabase/ssr` sunucu istemcisi ve sunucu değişkeni `SUPABASE_ANON_KEY` (anon/publishable anahtar; tarayıcıya gönderilmez) kullanılır.
  - Tarayıcı yalnızca `/api/account/*` rotalarını çağırır.
  - Tablolara mevcut `supabaseRest` (service role + ortam işareti) ile, her zaman oturumdaki kullanıcı kimliğiyle erişilir.
- **Oturum çerezleri:** `httpOnly`, `SameSite=Lax`, üretimde `secure`. "Beni hatırla" kapalıysa çerezler tarayıcı kapanınca silinir.
- **Ortam işareti:** her Auth isteğinden önce kontrol edilir (§7.4). İşaret yoksa veya yanlışsa 503 döner; Auth'a istek gitmez.
- **`src/proxy.ts`** (Next 16): yalnızca müşteri oturumunu yeniler (`getClaims`); yönlendirme yapmaz, admin rotalarını kapsamaz. Yetki her sayfada ve API'de sunucuda kontrol edilir.
- **Hesap API'leri:** aynı köken kontrolü (başka siteden gelen istek 403) ve `Cache-Control: no-store`.
- **Admin:** girişi, çerezi ve 4 env hesabı değişmedi.

**Akışlar (kodda)**

| Akış | Davranış |
|---|---|
| Kayıt | **Yalnızca test verisiyle açık** (local + Preview, `isSignupOpen`, D27); Production'da istek gönderilmeden 403. E-posta doğrulaması yok (D23): kayıttan sonra oturum açık. Metin yayımlanmadığı için onay kutusu ve onay kaydı yok; formdaki not bunu söyler (D26). Pazarlama kutusu kaldırıldı. Aynı e-posta: "Bu e-postayla bir hesap var…". `0010` yoksa Auth'ta hesap açılmadan 503. |
| Giriş | E-posta + şifre (telefon alanı kaldırıldı). Yanlış şifre ve kayıtsız e-posta aynı mesajı alır. Profili olmayan hesap `/uyelik-tamamla`'ya gider. |
| Çıkış | Yalnızca bu tarayıcının oturumu kapanır (`scope: "local"`). Supabase cevap vermese de çerezler silinir. |
| Şifre sıfırlama | Her e-postaya aynı yanıt. Bağlantı `/auth/confirm`'e (`token_hash` + `type=recovery`), oradan `/sifre-yenile`'ye gider. Oturum bu bağlantıyla son 15 dakikada açıldıysa (`amr` kaydı) yeni şifre mevcut şifre sorulmadan kabul edilir; açılmadıysa reddedilir. Uygulama diğer oturumları kapatmaz (D29); Supabase ise şifre güncellenince diğer oturumların yenileme belirteçlerini iptal eder, o oturumlar en geç 1 saat içinde kapanır (D30). |
| Profil | Ad soyad ve telefon düzenlenir; e-posta salt okunur. Şifre değişikliğinde mevcut şifre, kalıcı olmayan ayrı bir girişle doğrulanır; o geçici oturum hemen kapatılır (yalnızca o). |
| Adresler | En fazla 10 adres, tek varsayılan. İlk adres varsayılan olur; varsayılan silinirse en eski adres varsayılan olur. Varsayılan doğrudan kaldırılamaz; başka bir adres varsayılan yapılır. İlçe ve mahalle checkout'taki bölge listesinden seçilir. Listeden çıkan bölgedeki adres silinmez ama checkout'ta seçilemez. |
| Siparişlerim | Yalnızca girişliyken verilen siparişler (`customer_user_id`). Detayda iptal gerekçesi görünür (D28); işlemi yapan hesap görünmez. Başkasının sipariş numarası "bulunamadı" der. |
| Checkout | Üyenin iletişim bilgileri profilden dolar; bu sipariş için değiştirilebilir. Kayıtlı adres seçilebilir. Varsayılan adres, formda adres yokken ve kayıtlı bölge boşsa ya da aynı bölgeyse önceden seçilir (D28); başlıkta seçilmiş başka bir bölgenin yerine geçmez. Siparişin üye kimliğini yalnızca sunucu oturumdan alır; gövdedeki değer yok sayılır. Oturum var ama doğrulanamıyorsa sipariş 503 alır, üyenin siparişi sessizce misafir siparişine dönmez. Misafir checkout aynen çalışır. |
| Sosyal giriş | Buton yalnızca kodda izinli **ve** Supabase'de açık sağlayıcı için görünür. Bugün hiçbiri izinli olmadığından buton yok. `/auth/callback` sağlayıcıyı, kodu oturuma çevirmeden önce yeniden kontrol eder. Instagram listede yok. |

**Google engeli (D29, A25)**

Supabase belgelerinde (Identity Linking ve General configuration sayfaları, 2026-10-12'de okundu) şunlar yazıyor:

- OAuth ile yapılan giriş, aynı e-postaya sahip mevcut kullanıcıya **otomatik bağlanır**.
- Bu güvenlik önlemi e-posta doğrulamasına dayanır: bağlanırken **doğrulanmamış** kimlikler kaldırılır.
- "Confirm email" kapalıyken e-posta veritabanında **doğrulanmış sayılır**.
- Otomatik bağlamayı kapatan bir ayardan belgelerde söz edilmiyor. Elle bağlama ayrı ve beta bir özellik.

Sonuç:

- **Risk:** D23 (doğrulama kapalı) ile birlikte, başkasının e-postasıyla şifreli hesap açan kişi, gerçek sahip Google ile girdikten sonra da kendi şifresiyle aynı hesaba girebilir. Bu kişi kayıtlı adresleri ve siparişleri görür.
- **Bilinen önlemler istenmedi:** şifreyi geçersiz kılmak veya oturumları toplu kapatmak (D29).
- **Bu yüzden Google bağlantısı etkinleştirilmedi:**
  - Kodda `SOCIAL_PROVIDERS_ALLOWED.google = false`.
  - Google sağlayıcısı Supabase panelinde de **kapalı kalmalı.** Kod yalnızca kendi butonlarımızı ve callback'imizi kapatır; panelde açık bir sağlayıcı Supabase'in kendi adresi üzerinden doğrudan çağrılabilir.

Açmak için seçenekler (karar A25):

1. "Confirm email" açılır. D23 değişir; doğrulanmamış şifreli kimlik Google girişinde kaldırılır.
2. Google yalnızca şifreli hesabı olmayan e-postalara açılır. Bunu sağlayan belgelenmiş bir Supabase ayarı bulunmadı; ayrı tasarım ve test gerekir.
3. Google olmadan devam edilir.

**Veri: `0010_customer_accounts.sql` (yazıldı, uygulanmadı)**

- **Tablolar:**
  - `customer_profiles`: onay sütunları yalnızca yayımlanmış bir metne verilen onayla dolar; pazarlama sütunu yok.
  - `customer_addresses`: 10 sınırı ve tek varsayılan; yazma yalnızca RPC ile, kullanıcı başına kilitle.
  - `orders.customer_user_id`: boş = misafir.
- **RPC'ler (hepsi yalnızca service role):**
  - `save_customer_address`, `delete_customer_address`.
  - `list_customer_orders`, `get_customer_order`; yardımcı `customer_order_json` (iptal gerekçesini içerir, işlemi yapan hesabı içermez).
  - `create_order` v6: v5 + `customer_user_id`; üye profili yoksa `invalid_customer_account`.
- **RLS açık, politika yok** (diğer tablolar gibi). Planlanan "üye kendi satırını okur" politikaları eklenmedi: uygulama tarayıcıdan tablo okumuyor, bu yüzden gereksiz bir erişim yolu açılmadı [V].
- **`/api/health` (Merkez):** `0010` kontrolleri ve Auth ayar özeti (kayıt açık mı, e-posta doğrulaması kapalı mı, hangi sağlayıcılar açık).

**Dosyalar**

- **Yeni:**
  - Kütüphane: `lib/customer-auth/{config,cookies,server,operations,providers,next,proxy}.ts`, `lib/customers/{repository,validation}.ts`, `src/proxy.ts`.
  - Rotalar ve sayfalar: `app/api/account/{register,login,logout,password-reset,password,profile,addresses,oauth/[provider]}`, `app/auth/{confirm,callback}`, `app/sifre-yenile`, `app/uyelik-tamamla`.
  - Bileşenler: `components/auth/{ResetPasswordForm,CompleteMembershipForm}.tsx`, `components/account/{LogoutButton,AccountUnavailable}.tsx`.
  - Test ve migration: `scripts/verify-accounts.ts`, `supabase/migrations/0010_customer_accounts.sql`.
- **Değişen:**
  - Servis katmanı: `lib/auth.ts`, `lib/account-service.ts` (sahte veri kaldırıldı).
  - Hesap ve giriş ekranları: `components/auth/*`, `components/account/*`, `app/hesabim/*`, `app/giris`, `app/uye-ol`, `app/sifremi-unuttum`.
  - `components/layout/Header.tsx`: Hesabım ikonu → `/hesabim`.
  - Checkout: `app/checkout/page.tsx`, `CheckoutPage`, `ContactStep`, `DeliveryStep`.
  - Sipariş: `lib/order-server.ts`, `lib/orders/{engine,repository}.ts`, `app/api/orders`.
  - Diğer: `app/api/health`, `package.json`.
- **Değişmeyen:** admin, Funda Puan, Production sipariş kapısı (§6.1).

**Riskler [V]**

- **E-posta doğrulaması kapalı (D23):** başkasının e-postasıyla hesap açılabilir. Gerçek sahip şifre sıfırlamayla hesabı alabilir, ama arada kaydedilen adres ve siparişler hesabı açan kişiye görünür. Google bu riski ağırlaştırdığı için kapalı.
- **Kayıtta hesap varlığı:** kayıt ekranı "bu e-posta kayıtlı" der, yani hesap varlığı anlaşılabilir. Şifre sıfırlama bunu söylemez.
- **Hız sınırları:** Auth istekleri sunucudan gittiği için Supabase'in IP başına sınırlarını bütün müşteriler ortak tüketir. Sınırlar panelde ayarlanmalı; uygulamada ayrıca bir sınır yok.
- **Kurtarma oturumu:** `amr` kaydına dayanır (`recovery`/`otp`/`magiclink`, 15 dakika). Local şifre sıfırlamanın gerçek projede geçmesi, kontrolün çalıştığını gösteriyor (kullanıcı testinden çıkarım). 15 dakika sınırı ayrıca denenmedi.
- **E-posta teslimi:** yerleşik e-posta yalnızca ekip adreslerine gider; production'dan önce özel SMTP gerekir.

**Doğrulama (2026-10-12)**

- **Gerçek `funda1959-test`, local (kullanıcı tarafından doğrulandı):** kayıt, giriş ve çıkış; profil ve adres kalıcılığı; checkout otomatik doldurma; şifre sıfırlama; başka hesabın siparişine erişimin engellenmesi. Ayrıntı ve kalanlar: §7.6 "Aşama 5 — Preview hazırlığı".

Gerçek Supabase'ten önce yapılan kontroller:

- **`scripts/verify-accounts.ts`: 86/86.** Bellek + sahte (mock) Supabase Auth/PostgREST ile çalışır; başka bir adrese istek giderse betik durur. Kapsam:
  - kapılar: ortam işareti, Production, `0010`;
  - kayıt: onay ve pazarlama alanı yok, çerezler httpOnly; aynı e-posta reddi;
  - giriş: aynı hata mesajı, "Beni hatırla";
  - profil ve adres yazmaları: kullanıcı kimliği oturumdan, gövde yok sayılır; 10 adres sınırı; başkasının adresi ve siparişi erişilemez;
  - şifre: sıfırlamada aynı yanıt ve doğru dönüş adresi; kurtarma oturumu; şifre değiştirme;
  - çıkış: yalnızca `scope=local`; hiçbir istekte `global` veya `others` yok;
  - Google: buton yok, başlatma ve callback reddedilir;
  - sipariş: profilsiz hesabın siparişi misafir siparişi olur; Auth erişilemezse sipariş reddedilir.
- **Mevcut betikler değişmeden geçti:** `verify-orders` 72, `verify-fulfillment` 34, `verify-prices` 61, `verify-funda-points` 27, `verify-campaign-persistence` 9.
- **Derleme:** `tsc` temiz; `eslint` hatasız (3 eski uyarı); `next build` başarılı ve Proxy tanındı.
- **Derlenmiş sürüm, Supabase'siz** (local, `.env.local` yok, 3100 portunda geçici süreç):
  - `/hesabim` → `/giris?next=…`;
  - giriş, kayıt ve sıfırlama: 503 "Üyelik servisi şu an kullanılamıyor";
  - başka kökenden istek 403; oturumsuz profil/adres/şifre isteği 401;
  - Google ve Instagram başlatma ile callback → `/giris?hata=saglayici`;
  - sahte `sb-` çereziyle `/hesabim` yine girişe yönlendirir;
  - misafir teklif 200, sipariş 201 (yalnızca o sürecin belleğinde);
  - admin girişi değişmedi.
- **Yapılmayanlar:** Preview ve kullanıcı bildiriminde geçmeyen kontroller (§7.6 "Henüz yapılmamış kabul kontrolleri").

**Kabul kriterleri (gerçek test projesinde, kurulumdan sonra)** — hangilerinin local'de geçtiği ve hangilerinin beklediği §7.6'da.

- **Kayıt ve oturum:** test projesinde e-postayla kayıt → doğrudan oturum. Yenileme ve yeni sekmede oturum sürer; çıkıştan sonra korunan sayfalar `/giris`'e yönlendirir.
- **Onay ve Production:** `customer_profiles.terms_version` boş kalır (onay kaydı yok). Production'da kayıt 403 döner.
- **Google:** butonu görünmez; Supabase panelinde Google kapalıdır.
- **Şifre sıfırlama:** var olan ve olmayan e-postaya aynı yanıt; bağlantı Preview adresine döner; yeni şifreyle giriş yapılır, eski şifre geçersiz olur; uygulama diğer oturumları kapatmaz; Supabase diğer oturumları en geç 1 saat içinde sonlandırır (D30).
- **Profil ve adresler:** yenilemeden sonra korunur. 11. adres reddedilir; tek varsayılan.
- **Siparişlerim:** girişliyken verilen sipariş listede ve `orders.customer_user_id` dolu. Aynı e-postayla verilmiş misafir siparişi listede yok. Başka üyenin sipariş numarası "bulunamadı"; iptal edilen siparişte gerekçe görünür.
- **Değişmeyenler:** misafir checkout aynen çalışır; admin girişleri ve yetkileri aynı kalır; Funda Puan hareketi yazılmaz.
- **Yanlış proje:** yanlış veya işaretsiz projede Auth ve hesap API'leri 503 döner; Supabase'e veri isteği gitmez.

### 8.3 Aşama 6: Funda Puan (D9, D31–D41)

Durum (2026-10-14):

- **Kapalı altyapı hazırlığı tamamlandı (2026-10-14).** Kazanım ve kullanım kapalı; açılması Aşama 9'a bağlı (§7.6 adım 8).
- Kod `51c0028` ile `supabase-test` dalına pushlandı (2026-10-13). `main` ve Production değişmedi.
- **Preview (kullanıcı tarafından doğrulandı, 2026-10-14):** üye arama ve ilk Merkez düzeltmesi; +25 müşteri ekranına yansıdı, −25 sonrası bakiye 0, iki hareket görünür. Diğer Preview kontrolleri açık (§7.6 adım 7).
- **Merkez araması düzeltmesi `5e8b814` (2026-10-14, migration yok):** puan hesabı olmayan üye de aranıp ilk düzeltme yapılabiliyor; local + gerçek test projesinde tarayıcı testi 34/34 (§7.6 Aşama 6, adım 7 "Preview bulgusu").
- `0011_funda_points.sql` ve `0011_funda_points_test.sql` `funda1959-test`'te **kullanıcı tarafından çalıştırıldı**; ikisi de "Success. No rows returned" (2026-10-13). Production'a uygulanmadı.
- Local uygulama + gerçek test projesi kontrolleri geçti (§7.6 Aşama 6, adım 2, 5, 6). İki oturumlu rezervasyon testi gerçek test projesinde geçti (adım 4: B 17,7 sn bekledi, `insufficient_points`, `GEÇTİ`; temizlik `TEMİZ`).
- **Kazanım ve kullanım kapalı** (D41, `isFundaPointsActive()` = `false`).
- Paket değişikliği yok.

**Tasarım**

- **Kuralların tek yeri veritabanı.** Partiler, 1 yıl, son kullanma sırası, rezervasyon, bırakma/iade, geri alma ve borç, tekrar koruması `0011` fonksiyonlarında (§2.3). Uygulama yalnızca gösterim hesabı (`rules.ts`), kapı (`config.ts`) ve çağrı (`store.ts`, `service.ts`) içerir.
- **Çift harcama yok.** Her puan işlemi üyenin hesap satırını kilitler. Puan, sipariş oluşturulurken aynı işlemde partilerden alınır; yetmezse sipariş oluşmaz.
- **Ödeme bekleyen sipariş:**
  - Puan `reserved` olur (30 dk). Ödeme onayında `captured` olur ve kazanım yazılır.
  - Ödeme başarısız, süre doldu ya da ödemeden önce iptal edildiyse puan aynı partilere döner (`released`).
  - Ödemeden sonra iptalde iade (`refunded`) ve kazanımın geri alınması.
  - Süre dolduktan sonra gelen ödeme onayı reddedilir (`points_reservation_not_active`); ödeme sağlayıcısı akışı bunu iade/iptalle karşılamalı (Aşama 9).
- **Tutarlar sunucuda.**
  - Tarayıcıdan gelen bakiye, kazanım ve kullanıcı kimliği yok sayılır: kimlik oturumdan, bakiye veritabanından.
  - Sipariş toplamı = ara toplam − indirim − puan + teslimat.
  - Minimum puandan önce (D35).
- **Demo siparişler:** `create_order` demo siparişte puanı reddeder; demo sipariş ödenemez ve kazanmaz; tablo kısıtı da engeller. Test verisi ortam işaretiyle ayrı projede kalır.
- **Hesap anahtarı:** telefon numarası yerine üyenin Supabase kimliği (`auth_user_id`).
- **Admin:** uydurma müşteriler kaldırıldı; boş durum; gerekçeli ve admin adıyla düzeltme; şube 403 (uygulama + veritabanı). Arama sunucuda ve tüm kayıtlı üyelerde (puan hesabı olmayanlar dahil, salt okunur); puan hesabı ilk düzeltmede oluşur.

**Dosyalar**

- **Yeni:**
  - `supabase/migrations/0011_funda_points.sql`, `supabase/tests/0011_funda_points_test.sql`
  - `supabase/tests/0011_concurrency/{1_kurulum,2_sekme_a,3_sekme_b,4_dogrulama,5_temizlik}.sql` (SQL Editor, iki sekme)
  - `src/lib/funda-points/{rules,store}.ts`, `src/lib/orders/payment.ts`
  - `src/app/hesabim/puanlarim/page.tsx`, `src/components/account/PointsView.tsx`, `src/components/checkout/FundaPointsRedeem.tsx`
- **Değişen:**
  - `src/lib/funda-points/{config,types,service,index}.ts`
  - Sipariş akışı: `lib/order.ts`, `lib/order-server.ts`, `lib/orders/engine.ts`, `app/api/orders/route.ts`, `app/api/orders/quote/route.ts`
  - Admin: `app/api/admin/funda-points/route.ts`, `app/admin/page.tsx`, `components/admin/AdminFundaPoints.tsx`
  - Checkout ve özetler: `components/checkout/{CheckoutPage,CheckoutSummary}.tsx`, `components/cart/OrderTotals.tsx`, `components/payment/PaymentSummary.tsx`
  - Hesabım: `components/account/AccountNav.tsx`, `lib/account-service.ts`, `lib/customer-auth/next.ts`
  - Diğer: `lib/persistence.ts`, `lib/order-rules.ts`, `app/api/health/route.ts`, `src/proxy.ts` (`/api/orders/quote`), `scripts/verify-{funda-points,orders}.ts`
- **Silinen:** `src/lib/funda-points/{mock,repository}.ts`.
- **Dokunulmayan:** ana sayfa "Funda Puan %10" posteri, Google/Apple/Facebook (kapalı), Production engelleri, admin hesapları, misafir checkout.

**Doğrulama (2026-10-12)**

- **`0011` SQL testi: 65/65** — geçici yerel Postgres 18 (PGlite, WASM), Supabase değil.
  - `auth.users` ve API rolleri taslak olarak kuruldu; `0001`–`0011` iki kez sorunsuz çalıştı.
  - Kapsam:
    - kazanım hesabı (1.000 − 200 puan → 80; 785 → 78; 598,80 → 59; teslimat hariç; mağaza ve misafir kazanmaz);
    - 1 yıl süre; son kullanma sırası; ödemeden önce iptalde bırakma (aynı partiler, aynı tarih);
    - çift harcama reddi; süresi dolmuş partiye iade yok;
    - geri alma → borç (−80), Merkez eklemesi ve sonraki kazanım borcu kapatır;
    - ödemeden sonra iptalde iade + geri alma;
    - tekrar koruması (ödeme, kazanım, düzeltme, geri alma, süre dolumu);
    - başarısız ödeme ve süresi dolan rezervasyon;
    - tamamı puanla ödeme;
    - demo, sınır ve admin korumaları; defterin değiştirilemezliği;
    - okuma ve defter değişmezleri.
- **`verify-funda-points`: 44/44** — kurallar, kapalı anahtar, açık yolda sunucu kontrolleri (üyelik, ürün sınırı, bakiye, tarayıcı değerlerinin yok sayılması, minimumun puandan önce olması), veritabanı çağrılarında kimliğin oturumdan alınması, Merkez imzası, şube reddi, `0011` yok, yanlış proje.
- **Mevcut betikler:** `verify-orders` 74, `verify-accounts` 86/86, `verify-fulfillment` 34, `verify-prices` 61, `verify-campaign-persistence` 9.
- **Derleme:** `tsc` temiz, `eslint` hatasız, `next build` başarılı.
- **Derlenmiş sürüm + gerçek `funda1959-test` (`0011` yok, salt okunur + bir test hesabıyla giriş): 11/11.**
  - health `0001`–`0010` ok, `0011` 6 kontrol "missing";
  - admin "tablolar henüz kurulmadı", uydurma müşteri yok; düzeltme 503 (hiçbir şey yazılmadı);
  - GOP 403; üye `/hesabim/puanlarim` "henüz etkin değil" ve 0 puan; oturumsuz → `/giris`;
  - puanlı teklif 409 `POINTS_DISABLED`, puansız teklif değişmedi; checkout'ta puan alanı yok.
- **Gerçek `funda1959-test` (2026-10-13, `0011` uygulandıktan sonra):** `0011` ve SQL testi kullanıcı tarafından çalıştırıldı, başarılı; local uygulama kontrolleri 1. tur 28/28, 2. tur 22/22 (§7.6). Eşzamanlılık betikleri önce PGlite'ta sırayla denendi (kanıt değil), sonra kullanıcı tarafından gerçek projede iki sekmede çalıştırıldı ve geçti (§7.6 adım 4).
- **Tarayıcı testi (2026-10-14, local + gerçek `funda1959-test`, Playwright):** Merkez araması ve ilk +25/−25 düzeltmesi 34/34 (§7.6 adım 7). Diğer ekranlar (Hesabım puanlarım, checkout) tarayıcıda otomatik denenmedi.
- **Yapılmayanlar:**
  - Preview'da: `/api/health` `0011` 6/6, GOP 403, `/hesabim/puanlarim` "henüz etkin değil" notu, puanlı teklif 409 `POINTS_DISABLED`, checkout'ta puan alanı olmaması (§7.6 adım 7);
  - Hesabım → Puanlarım ve checkout'un otomatik tarayıcı testi;
  - kazanım/kullanımın gerçek ödemeyle uçtan uca denenmesi (Aşama 9).

---

### 8.4 Aşama 7: Instagram (D42)

Durum (2026-10-14): **kod `e066056` ile `supabase-test` dalına pushlandı; Preview kontrolü yapılmadı (kullanıcı: boş içerikte ana sayfada bölüm yok, admin'de Instagram menüsü yok).** Veritabanı, migration, Storage ve yükleme yok. İçerik listesi boş; ana sayfada bölüm gizli.

**İçerik nasıl güncellenir**

1. Dosyaları `public/social/reels/` altına koyun:
   - **poster (zorunlu):** 9:16 görsel; `.webp`, `.jpg`, `.png` veya `.avif`;
   - **video (isteğe bağlı):** kısa, sessiz oynatılacak klip; `.mp4` veya `.webm`. 15 MB üstü için betik uyarı verir.
   - Dosya adlarında yalnızca harf, rakam, `-`, `_` (Türkçe karakter ve boşluk yok), ör. `2026-10-vitrin.webp`.
2. `src/lib/social/instagram-content.ts` içindeki listeye bir kayıt ekleyin (dosyadaki örneği kopyalayın):
   - `title`: kart üzerindeki başlık;
   - `poster`, `video`: `/social/reels/…` yolu (`public` yazılmaz); videosuz içerikte `video` satırı silinir;
   - `instagramUrl`: gerçek gönderi/reel adresi (`https://www.instagram.com/p/…` veya `/reel/…`); profil adresi kabul edilmez;
   - `published`: `true` yayında, `false` dosyada kalır ama görünmez.
   - Sıra: listedeki sıra ana sayfadaki sıradır; yayındaki ilk 5 geçerli kayıt gösterilir.
3. Kontrol: `npx tsx scripts/verify-instagram-content.ts` — eksik dosya, hatalı yol, profil bağlantısı, aynı bağlantının iki kez kullanılması "FAIL" olarak çıkar; 5'ten fazla yayında kayıt uyarı verir.
4. Commit + push → Preview'da kontrol → `main`'e alınınca Production'da yayınlanır.

Kaldırmak için kaydı silin ya da `published: false` yapın; artık kullanılmayan dosyaları da `public/social/reels/`'ten silin.

**Kurallar (kodda)**

- Ana sayfa sunucuda posterin varlığını kontrol eder; posteri eksik, alanı hatalı veya yayında olmayan kayıt gösterilmez ve 5 kartlık yeri doldurmaz. Geçerli kayıt yoksa bölüm hiç çizilmez.
- Videosuz kart: kartın tamamı Instagram gönderisine bağlantı (yeni sekme). Videolu kart: oynat düğmesi (sessiz, aynı anda tek video) + "Instagram" bağlantı etiketi.
- Videolar sunucu fonksiyon paketine alınmaz (`next.config.ts`), statik dosya olarak sunulur; bu yüzden video dosyasının varlığı yalnızca doğrulama betiğiyle kontrol edilir — deploy'dan önce betiği çalıştırmak gerekir.
- Instagram iframe'i ve Instagram API'si kullanılmaz; izlenme/beğeni gibi veri gösterilmez.

**Dosyalar**

- **Yeni:** `src/lib/social/instagram-content.ts` (içerik listesi), `src/lib/social/instagram.ts` (seçim kuralları), `scripts/verify-instagram-content.ts`, `public/social/reels/.gitkeep`.
- **Değişen:** `src/lib/social/{instagram-types,index}.ts`, `src/components/home/{InstagramContentSection,SocialVideoRail}.tsx` (yer tutucu fotoğraflar ve "Video yakında" kaldırıldı, kart Instagram'a bağlanır), `next.config.ts`, `src/app/admin/page.tsx`, `src/components/admin/AdminShell.tsx`, `src/lib/admin/section-access.ts` (Instagram bölümü ve menüsü kaldırıldı; eski `?section=instagram` genel bakışa döner), `src/lib/persistence.ts` (`instagram` yazma alanı kaldırıldı).
- **Silinen:** `src/app/api/admin/instagram/route.ts`, `src/components/admin/AdminInstagramContent.tsx`, `src/lib/social/{instagram-repository,instagram-mock,config}.ts`.
- **Dokunulmayan:** kullanılmayan eski `components/home/InstagramSection.tsx` (§1.3 temizlik işi).
- **Instagram hesabı `funda.1959`** (kullanıcı teyidi, 2026-10-14). Footer, mobil menü, iletişim sayfası ve schema.org bağlantıları zaten `https://instagram.com/funda.1959` / `@funda.1959` kullanıyor; farklı yazım (`funda1959`) yalnızca silinen `lib/social/config.ts`'teydi.

**Doğrulama (2026-10-14, local)**

- `verify-instagram-content` 19/19 (boş liste → gizli; videosuz/videolu; yayında değil; poster eksik; 7 kayıttan ilk 5, dosya sırası; aynı bağlantı bir kez; profil/başka site/http bağlantısı, `/social/` dışı veya `..` içeren yol, yanlış uzantı reddi; admin'de Instagram bölümü yok).
- `tsc` temiz, `eslint` 0 hata, `next build` başarılı; `verify-funda-points` 49/49, `verify-accounts` 86/86, `verify-orders`, `verify-fulfillment`, `verify-prices` geçti.
- Derlenmiş sürüm, tarayıcı (Playwright):
  - boş liste (7/7): ana sayfada bölüm ve örnek başlıklar yok; Merkez menüsünde Instagram yok, diğer menüler duruyor; `?section=instagram` Instagram ekranı açmıyor; `POST /api/admin/instagram` 404.
  - geçici test kayıtlarıyla (11/11; test sonrası kayıtlar ve dosyalar geri alındı): 6 geçerli kayıttan 5 kart, dosya sırasıyla; yayında olmayan, posteri eksik ve profil bağlantılı kayıt yok; kart 9:16 (masaüstü ve telefon); videosuz kart yeni sekmede Instagram bağlantısı; videolu kartta oynat → sessiz video, Instagram etiketi bağlantısı; poster `/social/` dosyasından; video statik olarak 200.
  - Derleme izi: `public/social` altındaki `.mp4` sunucu paketine girmedi, poster girdi.
- **Yapılmayanlar:** Preview kontrolü; gerçek içerikle deneme (henüz içerik yok).

---

### 8.5 Aşama 8: İletişim talepleri (D43)

Durum (2026-10-14): **kod, `0012` ve testler `78305ba` ile `supabase-test` dalına pushlandı; `0012` `funda1959-test`'te uygulandı (kullanıcı). Preview'da temel akış ve gerçek eşzamanlılık testi doğrulandı (aşağıda); bazı kontroller açık.** Form yalnızca test ortamında (local + Preview) açık; Production'da gösterilmez ve API reddeder. Canlıya açılış aydınlatma metni (A24), saklama süresi ve silme politikası (A19) netleşince ayrı değişiklik ve onayla.

**Bulgu (önceki durum):** `/iletisim` formu `action="#"` ile hiçbir yere kaydetmiyordu; gönderim sayfayı yeniden yüklüyor, mesaj kayboluyordu, buna karşın "24 saat içinde dönüş" yazıyordu. Aynı form `main`'de (canlı) de var — aşağıdaki "Canlı form düzeltmesi".

**Tasarım**

- **Form** (`components/contact/ContactForm.tsx`): ad, telefon, e-posta, konu (5 seçenek), mesaj. Zorunlu: ad, konu, mesaj ve telefon/e-postadan en az biri; kurallar tarayıcıda ve sunucuda aynı (`lib/contact/validate.ts`), veritabanında tekrar. Konu altında "Özel gün ve kurumsal başvurular sipariş değildir; talep olarak alınır ve size dönüş yapılır." Durumlar: Gönderiliyor → **"Mesajınız alındı" yalnızca sunucu 201 ve kayıt kimliği döndürünce**; hata/bağlantı kopmasında metin korunur, aynı istek kimliğiyle tekrar gönderilir. "24 saat" sözü yerine "Talebinizi inceleyip belirttiğiniz iletişim kanalından dönüş yapacağız."
- **Gizli tuzak alanı** (`website`): ekranda ve ekran okuyucuda yok, sekmeyle gelinmez; doluysa 400, hiçbir şey yazılmaz (başarı gösterilmez).
- **Sıklık sınırı (veritabanında):** gönderen = IP'nin sunucu sırrıyla HMAC'i (`ADMIN_SESSION_SECRET`; IP saklanmaz). Gönderen başına 10 dakikada 3, günde 10; toplamda saatte 200. Sayım saklanan satırlardan, gönderen kilidi altında — bütün Vercel örnekleri aynı sınırı görür. Aşılınca 429. Sayılar teknik varsayılan, değiştirilebilir.
- **Tek kayıt:** `client_request_id unique` + istek kimliği kilidi; aynı istek (tekrar, çift tıklama, aynı anda iki istek) aynı satırı döndürür.
- **Production kapısı:** `isContactFormOpen()` kod anahtarı, yalnızca `test`. Production'da form yerine "Çevrimiçi form şu an kapalı" + telefon/e-posta; `POST /api/contact` gövdeyi okumadan 503. Ayrıca yanlış/işaretsiz projede 503 (§7.4).
- **Merkez ekranı** "İletişim Talepleri" (yalnızca SUPER_ADMIN; menü + `section-access`; servis şubeyi istek göndermeden reddeder; veritabanı `merkez` dışındaki imzayı reddeder): en yeni üstte, Yeni / İşlemde / Kapandı filtreleri ve sayaçlar, 50'lik sayfa, detayda mesaj, telefon/e-posta bağlantıları, durum düğmeleri (son değiştiren ve zaman), iç not (son düzenleyen ve zaman). Ekranda gösterilen, veritabanının döndürdüğü kayıttır. Liste `client_key` döndürmez.
- **Health:** `0012 contact_requests(...)`.
- **Bilerek yapılmayanlar:** e-posta bildirimi (özel SMTP ile sonra), aydınlatma metni / onay kutusu (A24), saklama süresi ve silme (A19), şube erişimi, CAPTCHA veya başka dış servis.

**Dosyalar**

- **Yeni:** `supabase/migrations/0012_contact_requests.sql`, `supabase/tests/0012_contact_requests_test.sql`, `src/lib/contact/{types,validate,config,store,service,index}.ts`, `src/app/api/contact/route.ts`, `src/app/api/admin/contact-requests/route.ts`, `src/components/contact/ContactForm.tsx`, `src/components/admin/AdminContactRequests.tsx`, `scripts/verify-contact.ts`.
- **Değişen:** `src/app/iletisim/page.tsx` (eski form → `ContactForm`), `src/app/admin/page.tsx`, `src/components/admin/AdminShell.tsx`, `src/lib/admin/section-access.ts`, `src/lib/persistence.ts` (`contact`), `src/app/api/health/route.ts`.

**Doğrulama (2026-10-14, local; `0012` gerçek projede yok)**

- **`0012` SQL testi: 45/45** — PGlite (Postgres WASM, Supabase değil, tek bağlantı); `0012` iki kez sorunsuz çalıştı; test sonunda geri alındı (0 satır). Kapsam: geçerli kayıt, aynı istek kimliği → aynı satır, e-posta küçük harf; zorunlu alan/biçim reddi (iletişim yolu, ad, konu, mesaj 10–3000, e-posta, telefon, istek kimliği, ham IP anahtar olamaz) ve reddedilenlerin yazılmaması; tablo kısıtı; sıklık sınırı (10 dk'da 4., günde 11., saatte 200 üstü; tekrar istek sınıra takılmaz; başka gönderen etkilenmez); Merkez güncellemesi (şube/adsız `forbidden`, geçersiz durum, bulunamadı, durum + işleyen, not kırpma/silme, 2000 sınırı, not korunur); liste (toplam, sayaçlar, filtre, en yeni üstte, 200 sınırı, `client_key` yok); anon/authenticated tablo ve fonksiyon erişimi yok, RLS açık. Bilerek bozulmuş kopya düştü (testin çalıştığı doğrulandı).
- **`verify-contact`: 42/42** (sahte Supabase): form kuralları; 201 yalnızca saklanan satır kimliğiyle, kimliksiz yanıt 502; HMAC anahtar, IP gönderilmez; tuzak/eksik alan/kimlik/JSON → 400 ve istek yok; 429, kural reddi 400, `0012` yok 503; yanlış proje, sır yok → 503 ve RPC yok; **Production → gövde okunmadan 503, hiç istek yok**; şube listesi/güncellemesi istek göndermeden reddedilir; Merkez imzası oturumdan; sayfa metinleri.
- **Uçtan uca (derlenmiş uygulama + PGlite üzerinde sahte PostgREST, gerçek `0012` SQL'i), tarayıcı: 28/28** — boş form istek göndermez; gönderim → 201 ve "Mesajınız alındı" kayıttan sonra, satırda IP yok; aynı istek kimliğiyle iki eşzamanlı tekrar → aynı id, 1 satır; tuzak → 400; 10 dk'da 4. mesaj → 429, başarı yok, metin korunur; 503 / kimliksiz yanıt / bağlantı kopması → başarı yok; Merkez listesi, sayaçlar, detay, İşlemde + iç not (veritabanında, işleyen adıyla), yenileme sonrası korunur, Kapandı; health `0012` ok; GOP menüsü yok, liste/değişiklik 403, bölüm açılmaz, değişiklik olmadı; oturumsuz 401.
- **Production kapısı (derlenmiş, `VERCEL_ENV=production`):** form yok, kapalı notu + 6 telefon + e-posta bağlantısı; `POST /api/contact` 503; veritabanına çağrı yok, satır sayısı değişmedi.
- **Gerçek `funda1959-test` (`0012` yok, hiçbir şey yazılmadı): 3/3** — gönderim 503, başarı yok; admin "tablosu bu projede henüz kurulmadı (migration 0012)"; health `database: ready`, `0011` ok, `0012` missing. Not: ilk denemelerde test projesi paralel isteklerin bir kısmına Cloudflare 522 döndürdü (health'te geçici "error"); tekrar denemede temiz.
- `tsc` temiz, `eslint` 0 hata, `next build` başarılı; `verify-funda-points` 49/49, `verify-accounts` 86/86, `verify-instagram-content` 19/19, `verify-orders`, `verify-fulfillment`, `verify-prices` geçti. Funda Puan kapalı, sosyal girişler kapalı, Production sipariş/üyelik engelleri değişmedi.

**Kalan / sırada (ayrı onay)**

1. ✅ Commit + push (`supabase-test`, `78305ba`).
2. ✅ `0012_contact_requests.sql` `funda1959-test`'te uygulandı (kullanıcı; Preview kaydı ve eşzamanlılık testi bunu gösteriyor). ⏳ `0012_contact_requests_test.sql` sonucu **bildirilmedi — açık** (hatasız bitmeli).
3. Gerçek test projesinde iki/üç sekmeli eşzamanlılık testi (`supabase/tests/0012_concurrency/`): aynı istek kimliği → aynı satır; aynı göndericiden sınırı aşan istek → `rate_limited` (iki ayrı bağlantıyla; PGlite'ta kanıtlanamaz).
   - **1. deneme (kullanıcı, gerçek `funda1959-test`, 2026-10-14) — GEÇERSİZ, geçti sayılmaz:** A kaydetti; B 28,9 sn bekledi, ikinci satır açılmadı (GEÇTİ); C 27 sn bekledi ama `rate_limited` yerine kaydetti; doğrulama `gonderen_satiri=4`, `c_satiri=1`, KALDI.
     - Neden (test projesindeki satır zamanlarıyla doğrulandı, salt okunur): ön kayıtlar 12:38:23, A 12:55:22 (UTC) — arada 16 dk 59 sn. C'nin 10 dakikalık penceresi 12:45:25'ten başladığı için ön kayıtlar dışarıda kaldı; pencerede yalnızca A vardı, sayı 3'e ulaşmadı, kayıt kurallara göre kabul edildi. PGlite'ta aynı zamanlarla yeniden üretildi (aynı sayılar).
     - Bu deneme C için kilidin çalıştığını ne kanıtlar ne çürütür (C, A'yı görse de görmese de sayı 3'ün altındaydı). Kilitten sonraki sorgunun yeni kaydı gördüğü B'de gerçek projede kanıtlandı: 28,9 sn bekledi, sonra A'nın satırını buldu (aynı yöntem: kilit, ardından yeni anlık görüntüyle sorgu — READ COMMITTED).
     - `0012` için SQL değişikliği gerekmiyor. Betikler düzeltildi: ön kayıtlar artık Sekme A'nın kendi işleminde (tek işlemde 3 talep, ardından 30 sn kilit) — kurulum ile sekmeler arasındaki süre pencereyi bozamaz. C, penceresinde gördüğü önceki talep sayısını (`gorulen_onceki`, beklenen 3) gösterir; doğrulama, talepler 10 dakikaya sığmadıysa "GEÇERSİZ" der. PGlite'ta iki tur + yeniden üretim + `production` işaretinde durma denendi.
     - Sırada: `6_temizlik.sql` (1. denemenin 4 satırı), sonra 1 → 2 → (30 sn içinde) 3 ve 4 → 5 → 6.
   - ✅ **2. deneme (kullanıcı, gerçek `funda1959-test`, güncel betiklerle, 2026-10-14) — GEÇTİ:**
     - A: tek işlemde 3 kayıt (2 ön kayıt + A), 30 sn kilit.
     - B (aynı istek kimliği): 29,3 sn bekledi, ikinci kayıt açılmadı — GEÇTİ.
     - C (aynı gönderenden yeni talep): 27,8 sn bekledi, `gorulen_onceki = 3`, `rate_limited` — GEÇTİ.
     - Doğrulama: gönderenin toplam 3 satırı, A tek, C sıfır, ilk–son farkı 0 sn — GEÇTİ. Temizlik: `kalan = 0` — TEMİZ.
     - Böylece iki ayrı bağlantıyla: aynı istek tek satır kalır; sıklık sınırı eşzamanlı isteklerde aşılmaz ve kilitten sonraki sayım, bekletilen işlemin commit ettiği satırları görür.
     - Betikler: `supabase/tests/0012_concurrency/{1_kurulum,2_sekme_a,3_sekme_b,4_sekme_c,5_dogrulama,6_temizlik}.sql` (güncel hâli; commit edilmedi).
4. Preview (`5cd0cfb`):
   - ✅ **Kullanıcı tarafından doğrulandı (2026-10-14):** form "Mesajınız alındı" gösterdi ve talep Merkez listesine geldi; İşlemde durumu ve iç not kaydedildi, yenilemede korundu; Kapandı kaydedildi, yenilemede korundu.
   - ✅ **Kullanıcı tarafından doğrulandı (2026-10-14, ek):** Merkez `/api/health` — `0012 contact_requests` satırı `ok`, ortam `vercel-preview`, bağlı veri `test`; GOP hesabında "İletişim Talepleri" menüsü görünmüyor.
   - ✅ **GOP API erişimi — LOCAL'de doğrulandı, Preview'da değil (2026-10-14):** Preview Vercel giriş korumasının arkasında olduğu için oraya istek gönderilemedi. Preview ile aynı kod (`5cd0cfb`) derlenip gerçek `funda1959-test`'e bağlı çalıştırıldı (local GOP hesabı): **16/16.**
     - Yalnızca bu test için bir talep oluşturuldu, sonunda silindi; mevcut taleplere yalnızca okundu (önce/sonra 1 talep, özet aynı).
     - GOP: liste, durum filtreleri (new, closed + sayfa) ve talep kimliğiyle istek → 403; güncelleme (durum, iç not, durum + not, notu silme) → 403. Hepsinde yanıt yalnızca hata metni; ad, e-posta, kimlik, mesaj veya liste alanı yok.
     - GOP `/admin?section=contact` talep verisi göstermedi. Oturumsuz liste ve güncelleme → 401.
     - Test talebi değişmedi (durum, not, işleyen, zamanlar). Kontrol: Merkez aynı listeyi 200 ile aldı (403'ün rol kontrolünden geldiğini gösterir).
     - Not: ayrı bir "detay" API'si yok; Merkez ekranındaki detay listedeki kayıttan gelir.
   - ⏳ **Açık (yapılmadı, geçmiş sayılmaz):** Preview'da GOP oturumuyla API 403 (kullanıcı tarayıcı konsolundan yapabilir); formda zorunlu alan / telefon-e-posta uyarıları ve hata durumları; aynı göndericiden sınırı aşan gönderimde 429 mesajı (veritabanı tarafı yukarıda kanıtlandı); durum filtreleri ve sayaçlar.
5. Canlıya açılış: A24 aydınlatma metni + A19 saklama/silme → ayrı kod değişikliği (`isContactFormOpen`) ve onay; e-posta bildirimi özel SMTP ile.

**Canlı form düzeltmesi (`main` için, ayrı dal; 2026-10-14)**

- Kullanıcı onayıyla: canlıdaki çalışmayan form geçici olarak gizlenir, telefon ve e-posta bağlantıları gösterilir. Aşama 5–8 kodu `main`'e taşınmaz; `funda1959-git` klasörüne dokunulmadı.
- Güncel `origin/main` (`60355bf`) üzerinden worktree `/Users/Utku/Desktop/funda1959-main-iletisim`, yerel dal `fix/iletisim-formu-gizle`. **Commit, push, merge, deploy yapılmadı.**
- Değişiklik yalnızca `src/app/iletisim/page.tsx`: form ve "24 saat" sözü kaldırıldı; yerine "Çevrimiçi iletişim formu geçici olarak kapalı" notu, 3 şube telefon bağlantısı ve `info@funda1959.com` e-posta bağlantısı. Sağdaki şube kartları, Instagram ve e-posta kutusu aynen.
- Kontrol (worktree'de `npm ci`, kilit dosyası değişmedi): `tsc` temiz, `eslint` 0 hata (3 eski uyarı, değişen dosyada yok), `next build` başarılı (`/iletisim` statik). Tarayıcı, masaüstü + telefon: **20/20** — form ve alan yok; not görünür; "24 saat" yok; notta 3 telefon + e-posta; sayfadaki telefon bağlantıları 3 şubenin numarası (not, sağ sütun, footer); e-posta bağlantıları; Instagram `funda.1959`; telefonda yatay taşma yok; ana sayfa 200.

---

### 8.6 Ürün ekleme (D45) — plan

Durum (2026-10-21): **ilk parça hazır — commit yok, migration çalıştırılmadı.** Kararlar D45–D46.

- **Hazır:**
  - `supabase/migrations/0013_catalog_products.sql`: tablolar, yalnızca yayınlanmış ürünleri veren `catalog_storefront_products` görünümü, Merkez RPC'leri, görsel kaydı ve temizliği, `order_items` koruması (tetikleyici; `create_order` değişmedi), bucket `product-images`.
  - `supabase/tests/0013_catalog_products_test.sql`: tek işlem, sonunda geri alınır.
  - `lib/catalog/*`: kurallar, depo, Storage, önbellek, yönetim servisi, API kapısı.
  - API: `/api/admin/products` (GET/POST/PATCH), `/status`, `/image`, `/images/cleanup`.
  - Katalog birleştirme: `allCatalogProducts()`, sayfalarda `CatalogProvider`; sunucu sipariş, teklif, uygunluk, fiyat ve stok yolları.
- **Sonra eklendi (commit yok):** "Ürün Ekle" ekranı (2026-10-21); D48 (2026-10-22): menü "Ürün Bilgisi", "Yayında" tiki (`ProductPublishToggle`, `lib/catalog/visibility.ts`, 0014), Excel'den yükleme (`lib/catalog/xlsx.ts` bağımlılıksız okuyucu/yazıcı, `lib/catalog/import.ts`, `ProductImport`), panel ürünü düzenleme (`section=product-edit`). D48 için kullanıcı isteğiyle test yazılmadı ve test betiği çalıştırılmadı; yalnızca tip/lint denetimi ve local ekran açılışı yapıldı.
- **Henüz yok:** 0013 ve 0014'ün `funda1959-test`'te çalıştırılması (kullanıcı); D48 testleri.
- **Doğrulama (yerel; gerçek projeye değil):**
  - PGlite'ta 0001–0013 uygulandı; 0013 ikinci kez çalıştırılabiliyor.
  - 0013 SQL testi 63/63; bilerek hatalı bir kontrol testi durduruyor; geri almadan sonra satır kalmıyor. 0011 ve 0012 testleri 0013 varken de geçiyor (65, 45).
  - Uçtan uca 76/76: uygulama, PGlite üzerinde sahte PostgREST + Storage'a bağlı derlenmiş sürüm. Kapsam: yetki (şube 403, oturumsuz 401, başka kaynak 403, Production 503 ve yazma yok), görsel doğrulama ve temizlik, taslağın mağazaya/siparişe sızmaması, yayın → ürün sayfası/kategori/arama/stok/teklif/sipariş, Merkez fiyatı, yayından kaldırma ve yeniden yayın.
  - Mevcut betikler (bellek modu) ve D44 senaryoları geçiyor.

**Mevcut yapı [K] — neden yalnızca admin listesine kayıt yetmez**

- Ürünler kod sabiti: `lib/data.ts` → `products` (18), `catalogMeta`, `SIZE_PRICES`, `productDetailMeta`. Kimlik `p1`–`p18`, adres `slugify(ad)`.
- Kategoriler (11) kodda. Boyut türü kategoriden gelir (`variantKindFor`): pasta/özel gün → kişilik, kuru pasta/şerbetli → gram, çikolata → adet. Bu kategorilerdeki her ürün boyutlu; diğerleri tek fiyatlı. Boyut kimlikleri sabit kümelerden (`4-6`, `500g`, `12` …).
- Görsel ürün başına değil, kategori sırasına göre `public/products/**`'tan atanıyor (`lib/product-images.ts`).
- Fiyat: koddaki başlangıç fiyatı + `product_prices`. Stok: koddaki `availableBranches` + `branch_product_status` (aktif/pasif).
- Katalog 46 dosyada modül sabiti olarak okunuyor; tarayıcı paketinde de var (katalog filtreleri, başlık araması, hızlı sipariş, sepet, kutlama bulucu).
- Motor ve `buildOrderPayload` ürünü bu sabitten buluyor. `create_order` ürünü tanımıyor; yalnızca `product_prices` satırı olan kalemin fiyatını doğruluyor.
- Sonuç: yalnızca bir tabloya kayıt eklenirse ürün sitede, aramada ve sunucu sipariş doğrulamasında **görünmez**. Katalog kaynağının birleştirilmesi gerekir.

**Veritabanı — `0013_catalog_products.sql` (hazırlanmadı)**

- `catalog_products` (RLS açık, politika yok; yalnızca sunucu, service role):
  - `id text pk`: sunucu üretir (`n` + rastgele), `p<sayı>` biçimi yasak → kod kimlikleriyle çakışmaz;
  - `slug text unique`: addan; kod ürünleriyle çakışmayı sunucu reddeder; yayından sonra değişmez;
  - `name`, `category_slug` (kod kategorisi, sunucu doğrular), `short_description`, `image_path` (Storage nesnesi);
  - `sizes jsonb` (taslakta seçilen boyut kimlikleri + fiyatlar; tek fiyatlıda `''`), `branch_stock jsonb` (taslakta şube → aktif/pasif);
  - `status` (`draft` / `published`), `client_request_id unique` (çift gönderim tek satır), `version` (eşzamanlı düzenleme kontrolü);
  - `created_by`, `updated_by`, `published_by` (admin hesap adı) ve zamanları.
- RPC'ler (yalnızca `service_role`):
  - `create_product_draft(request_id, fields, actor)`: aynı istek kimliği aynı satırı döndürür;
  - `update_product_draft(id, fields, expected_version, actor)`: yalnızca taslak;
  - `publish_product(id, expected_version, actor)`: zorunlu alanları, fiyatları (0 < fiyat ≤ 100.000, kuruş olabilir) ve boyut kimliklerini yeniden kontrol eder. **Tek işlemde** `product_prices` satırlarını ve 3 şubenin `branch_product_status` satırlarını yazar, durumu `published` yapar. Tekrar çağrı aynı sonucu döndürür.
- Yayından sonra fiyat "Fiyatlar", stok "Şube Stokları" ekranından yönetilir: tek kaynak, mevcut kurallar (D17–D20, D44).
- Sipariş kalemi koruması (`order_items` tetikleyicisi; `create_order` değişmedi): kalem kimliği `catalog_products`'ta ise ürün **yayınlanmış**, boyutu ürünün boyutlarından biri ve fiyatı güncel olmalı ("Fiyatlar" fiyatı, yoksa ürünün fiyatı); değilse `product_unavailable` / `price_mismatch` → 409. Kod ürünleri için davranış değişmez.
- Silme fonksiyonu yok (D45). Eski siparişler `order_items`'taki ad/fiyat anlık görüntüsüyle zaten bağımsız.

**Storage**

- Bucket `product-images`:
  - herkese açık okuma (ürün fotoğrafı herkese açık içerik);
  - yazma yalnızca sunucudan;
  - bucket ayarında `allowed_mime_types` = JPEG/PNG/WebP ve `file_size_limit`.
- Nesne yolu içerik özetinden: `products/{id}/{sha256}.webp`. Aynı dosyanın tekrar yüklenmesi aynı nesneyi yazar, birikme olmaz.
- Görsel değiştirilince eski nesne, yeni yol veritabanına kaydedildikten **sonra** silinir. Kayıt başarısızsa yeni yüklenen nesne silinir. Kesinti artığı için Merkez'e özel "sahipsiz görsel temizliği" (veritabanında karşılığı olmayan nesneler).
- Vercel istek gövdesi sınırı (4,5 MB) yüzünden görsel önce tarayıcıda küçültülür (ölçü A29).
- Sunucu dosyanın içeriğine bakarak türü (imza baytları), dosya boyutunu ve en/boyu doğrular, sonra Storage'a yükler.
- Başarı yalnızca Storage ve veritabanı kaydı tamamlanınca gösterilir; sahte başarı yok.
- `next.config.ts` → `images.remotePatterns`: bağlı projenin Storage adresi (test ve production ayrı).

**Uygulama**

- **Admin:** yeni bölüm "Ürün Ekle", `SUPER_ADMIN_ONLY_SECTIONS`'a eklenir; menü ve sayfa koruması aynı listeden okur (`lib/admin/section-access.ts`).
- **API** (`/api/admin/products` GET/POST/PATCH, `/image`, `/publish`):
  - Merkez oturumu zorunlu: şube 403, oturumsuz 401;
  - aynı kaynak kontrolü, `assertPersistentWrite`, ortam işareti (D3).
- **Form:** taslak kaydet / yayınla. Çift tıklama aynı istek kimliğiyle tek kayıt üretir.
- **Katalog birleştirme** (`lib/catalog/`): kod ürünleri + yayınlanmış veritabanı ürünleri tek liste. Fiyat/stok/ücretteki kalıp kullanılır:
  - `refreshCatalog()`: gösterimde birkaç saniyelik süreç önbelleği; teklif ve siparişte taze okuma, okunamazsa 503;
  - senkron okuyucu: motor, `buildOrderPayload`, envanter (yeni ürün için şube satırı), fiyat haritası, admin "Fiyatlar" ve "Şube Stokları" bunu kullanır.
- **Tarayıcı:**
  - yeni ürünler sayfa verisiyle bir sağlayıcı üzerinden gelir (`PricesProvider` gibi);
  - başlık araması `GET /api/prices` yanıtına eklenen yayınlanmış ürünlerle çalışır;
  - katalog, kategori, ürün sayfası, arama, hızlı sipariş ve ana sayfa bölümleri bu kaynağa geçirilir;
  - yeni ürün mevcut boyut seçimi ve sepet satırı yapısıyla `/urunler/{slug}` adresinde açılır.
- **Testler:**
  - yetki (şube 403 dahil), çift gönderim, başarısız/yarım yüklemede temizlik, yayın doğrulaması;
  - yayından sonra katalog, ürün sayfası, arama, sepet, teklif ve sipariş (test projesinde demo sipariş);
  - sipariş kalemi korumasının taslak, yayından kaldırılmış ürünü ve yanlış fiyatı reddetmesi; D44 tarih/saat kuralı.
- **Sıra:**
  1. A27–A30 kararları;
  2. `0013` + SQL testi hazırlanır, çalıştırılmaz;
  3. katalog birleştirme: önce mevcut davranış değişmeden, testlerle;
  4. admin ekranı + API + Storage;
  5. kullanıcı `funda1959-test`'te `0013`'ü çalıştırır, bucket oluşturulur;
  6. local + Preview doğrulaması.

## 9. Açık kararlar

D1–D55 netleşti. Aşağıdakiler **hâlâ açık** ve onaylanmış sayılmaz. Koddan çıkarılabilen konular (şube listesi, çalışma saatleri, bölge mahalleleri, saatlik aralıklar, %10 oranı) sorulmuyor.

| # | Konu | Neden önemli |
|---|---|---|
| ~~A27~~ | **Kararlaştırıldı → D46 (2026-10-21).** | — |
| ~~A28~~ | **Kararlaştırıldı → D46 (2026-10-21).** | — |
| ~~A29~~ | **Kararlaştırıldı → D46 (2026-10-21).** | — |
| ~~A30~~ | **Kararlaştırıldı → D46 (2026-10-21).** | — |
| ~~A31~~ | **Kararlaştırıldı → D47 (2026-10-21).** | — |
| ~~A1~~ | **Kararlaştırıldı → D20 (2026-10-12).** Her boyutun fiyatı ayrı girilir ve bağımsız güncellenir; çarpan yok; bugünkü boyut fiyatları başlangıç değeri. | — |
| ~~A2~~ | **Kararlaştırıldı → D17 (2026-10-12).** Fiyatları Merkez gece elle günceller; otomatik zamanlama ve ayrı fiyat değişikliği bildirimi yok. | — |
| ~~A20~~ | **Kararlaştırıldı → D18 (2026-10-12).** Eski fiyat yalnızca açıkça belirlenmiş ürünlerde, otomatik oluşturulmaz; mevcut gösterimler kalır. | — |
| ~~A21~~ | **Kararlaştırıldı → D19 (2026-10-12).** Yeni ekran yok; mevcut hata alanları; sipariş ve ödeme hesabında güncel fiyat doğrulanamıyorsa işlem ilerlemez. | — |
| ~~A22~~ | **Kararlaştırıldı → D21 (2026-10-12).** Trüf kartı 6'lı ₺260, eski fiyat yok; ürün sayfasında 12'li seçilince ₺520 ~~₺580~~; eski fiyat yalnızca ait olduğu boyutta. | — |
| **A23** | **Tek fiyatlı ürünün eski fiyatı ürün sayfasında:** Portakallı Mermer Kek (p18) kartta ₺240 ~~₺290~~ gösteriyor; ürün sayfası eski fiyatı **hiç göstermiyordu** ve değiştirilmedi. Ürün sayfasında da gösterilsin mi? | Karara kadar bugünkü gibi (yalnızca kartta). |
| **A24** | **KVKK aydınlatma metni ve üyelik koşulları:** metinlerin içeriği, kayıtta hangi onayların alınacağı, sürümleme. İşletme ve hukuk danışmanından gelir. | Yayımlanana kadar onay kaydı yok; gerçek müşteriye üyelik açılmaz (D26, D27). Google, Apple ve Facebook uygulamalarını canlıya almak için de gizlilik politikası adresi gerekir. İletişim formu da (D43) aydınlatma metni yayımlanmadan canlıda açılmaz. |
| ~~A26~~ | **Kararlaştırıldı → D30 (2026-10-12).** Şifre değişince Supabase'in diğer oturumları sonlandırma davranışı korunur. | — |
| **A25** | **Google girişi:** e-posta doğrulaması kapalıyken (D23) Supabase aynı e-postalı Google girişini mevcut şifreli hesaba otomatik bağlıyor ve bunu kapatan belgelenmiş ayar yok; şifre geçersizleştirme ve toplu oturum kapatma istenmedi (D29). Seçenekler: (1) "Confirm email" açılsın, (2) Google yalnızca şifreli hesabı olmayan e-postalara — ayrı tasarım ve test, (3) Google'sız devam. | Karara kadar Google kodda ve Supabase panelinde kapalı (§8.2). Apple/Facebook için de aynı soru geçerli. |
| ~~A3~~ | **Kararlaştırıldı → D14 (2026-10-10).** Adrese teslim 500 TL, ürün toplamı − indirim, teslimat ücreti hariç; gel-al muaf. | — |
| **A4** | **Bölgeler ve ücret tutarları:** ücret mekanizması kararlaştırıldı (D15); **bölge/mahalle listeleri ve bölge başına ücret tutarları henüz onaylanmadı.** Mevcut listeler test amaçlı. | Merkez ücret girene kadar o bölgeye adrese teslim kapalı (D15). |
| ~~A5~~ | **Puan kısmı kararlaştırıldı → D31 (2026-10-12):** misafir puan kazanmaz; misafir siparişleri otomatik bağlanmaz (D25). Misafir siparişlerinin sonradan **elle** bağlanması istenirse ayrıca karar. | — |
| ~~A6~~ | **Kararlaştırıldı → D33 (2026-10-12).** Kazanım, kullanılan puan düşüldükten sonraki ürün tutarı üzerinden. | — |
| ~~A7~~ | **Kararlaştırıldı → D38 (2026-10-12).** İade orijinal son kullanma tarihiyle; süresi dolmuş puan geri gelmez. | — |
| ~~A8~~ | **Kararlaştırıldı → D39 (2026-10-12).** Harcanmış kazanım geri alınınca borç; sonraki kazanımlar kapatır; kullanılabilir bakiye sıfırın altına düşmez. Kısmi iade bugün yok (iptal tam). | — |
| ~~A9~~ | **Kararlaştırıldı → D36, D37 (2026-10-12).** Teslimat ücreti puanla ödenmez; ürün tutarının tamamına kadar; tamamı puanla ödenen sipariş sunucuda tamamlanır, sipariş engelini aşamaz. | — |
| ~~A10~~ | **Kararlaştırıldı → D13 (2026-10-10).** Demo siparişler bellek dahil hiçbir depoda puan kazandırmaz; gerçek puan kazanımı Aşama 6'ya kadar etkin değil. | — |
| ~~A13 (puan)~~ | **Kararlaştırıldı → D35 (2026-10-12).** 500 TL minimum puandan önceki indirimli ürün toplamına göre. | — |
| ~~A11~~ | **Kararlaştırıldı → D22 (2026-10-12).** E-posta + şifre ve Google; Apple ve Facebook kurulunca; Instagram yok; yapılandırılmamış sağlayıcının butonu gösterilmez. | — |
| ~~A12~~ | **Kararlaştırıldı → D12 (2026-10-10).** Şube kendi şubesinde ilerletir ve iptal eder; Merkez tüm şubelerde; iptalde gerekçe zorunlu ve kayıtlı; teslim edilmiş sipariş iptali ve iade bu aşamada yok. | — |
| **A13** | **Kampanya tarihleri ve koşulları:** "3 Al 2 Öde", "İlk online siparişe %15" gibi kurallar sepette uygulanacak mı, yoksa kampanyalar bilgilendirme mi kalacak? Bugün indirim mantığı yok **[K]**. Admin'den poster yükleme gerekli mi? | İndirim alanı, puan tabanı (indirim düşülür), Storage. |
| **A14** | **Tatil / özel gün kapanışları** gerekiyor mu (kapasite olmadan gün kapatma)? | Motor kuralı; gerekirse küçük bir ayar tablosu. |
| **A15** | **Ödeme sağlayıcısı** (seçilince). | Aşama 9 ve §6.1. |
| ~~A16~~ | **Kararlaştırıldı → D42 (2026-10-14).** Instagram veritabanına bağlanmaz; içerik tek dosyadan elle, deploy ile. | — |
| ~~A17~~ | **Kararlaştırıldı → D43 (2026-10-14).** Yalnızca Merkez, yalnızca admin paneli (e-posta özel SMTP ile sonra), tuzak alanı + veritabanına dayalı sıklık sınırı. **Aydınlatma metni A24'te, saklama/silme A19'da açık; form canlıya bunlar netleşmeden açılmaz.** | — |
| **A18** | **Canlı alan adı:** schema.org `https://funda1959.com` yazıyor **[K]**; site `funda1959.vercel.app`. | SEO. |
| **A19** | **Müşteri verilerinin saklama süresi ve silme politikası** (KVKK) — iletişim talepleri dahil (`contact_requests`: ad, telefon, e-posta, mesaj, IP'den türetilmiş anahtar). | Temizlik politikası. **İletişim formunun canlıya açılması buna bağlı (D43).** Bugün silme fonksiyonu ve otomatik silme yok. |
| — | Supabase bölge ve planı | **İşletmeye sorulmaz**; web ekibinin teknik kararı (D1). |
