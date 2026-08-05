# Görseller

Site şu an fotoğrafsız çalışıyor; görsel alanları nötr yüzey olarak duruyor.
Fotoğraf eklemek için **iki adım** yeterli, layout hiç değişmez:

1. Dosyayı bu klasöre koyun (örn. `public/images/hero.jpg`).
2. `src/content/images.ts` içindeki ilgili kaydın `src` alanını doldurun.

```ts
// src/content/images.ts
hero: { ...slot("Funda 1959 şubesinde kahve ve tatlı servisi", "16 / 9"),
        src: "/images/hero.jpg" },
```

Her kayıtta ayarlanabilenler:

| Alan | İşlevi |
| --- | --- |
| `src` | Fotoğraf yolu. Boşsa nötr yüzey çizilir. |
| `alt` | Erişilebilirlik metni (fotoğraf yokken künye olarak da görünür). |
| `position` | `object-position` — kadraj (örn. `"center 40%"`). |
| `ratio` | `aspect-ratio` — alanın oranı (örn. `"4 / 5"`). CLS oluşmaz. |

## Hero videosu

Ana sayfa hero'su video için hazır. Video geldiğinde:

1. `public/media/hero.mp4` olarak koyun.
2. `src/content/site.ts` → `heroContent.video = "/media/hero.mp4"`.
3. Kapak karesi olarak `images.hero.src` kullanılır (poster).

Video otomatik olarak `muted`, `loop`, `autoPlay`, `playsInline` ve `object-cover`
çalışır. Öneri: 12–20 sn, sessiz, 1080p, ~5 MB altı, yatay kadraj.

## Öneriler

- Format `.jpg` veya `.webp`, uzun kenar 2000–2400px yeterli.
- Kadrajda ana öğeyi merkeze yakın tutun; gerekirse `position` ile düzeltin.
- Hero dışındaki tüm görseller lazy-load edilir; hero `priority` yüklenir.
