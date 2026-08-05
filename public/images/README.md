# Görseller

Site şu an motifli placeholder’larla çalışıyor. Gerçek fotoğraflar geldiğinde
dosyaları bu klasöre koyup **ilgili içerik dosyasındaki `image` alanını doldurmak
yeterli** — başka hiçbir yerde değişiklik gerekmiyor.

## Nereye ne yazılır?

| İçerik dosyası | Alan | Görsel |
| --- | --- | --- |
| `src/content/site.ts` → `heroContent.video` + `heroContent.poster` | hero medya | **Hero videosu** — bkz. aşağıdaki not |
| `src/content/menu.ts` → `collections[].image` | kategori kartları | “Funda’da Neler Var?” kartları (dikey 3:4) |
| `src/content/menu.ts` → `categories[].image` | lezzet kategorileri | Lezzetler sayfası kartları (yatay 4:3) |
| `src/content/menu.ts` → `products[].image` | ürünler | Ürün kartları (dikey 4:5) |
| `src/content/menu.ts` → `signatureIntro.image` | imza alanı | İmza lezzet ana görseli |
| `src/content/branches.ts` → `branches[].image` | şubeler | Şube iç mekan fotoğrafları |
| `src/content/gifting.ts` → `giftIntro.image`, `giftBoxes[].image` | paket & hediye | Kutu ve paketleme kareleri |
| `src/content/story.ts` → `storyTeaser.image` | hikaye | Arşiv / vitrin karesi |
| `src/content/journal.ts` → `journalEntries[].image` | Funda Defteri | Editorial kareler |
| `src/content/corporate.ts` → `corporateIntro.image` | kurumsal | İkram düzeni karesi |

## Hero videosu

Ana sayfadaki hero medya alanı video için tasarlandı. Video hazır olduğunda:

1. Dosyayı `public/media/hero.mp4` olarak koyun (poster karesi:
   `public/images/hero-poster.jpg`).
2. `src/content/site.ts` içindeki `heroContent` alanlarını doldurun:

```ts
video: "/media/hero.mp4",
poster: "/images/hero-poster.jpg",
```

Alan aynı ölçüde ve aynı çerçevede kalır; `VideoStage` otomatik olarak sessiz,
döngüsel ve `playsInline` bir `<video>` render eder. Öneri: 12–20 sn, ses yok,
1080p, ~5 MB altı, yatay kadraj.

## Örnek

```ts
// src/content/branches.ts
{
  id: "gop",
  // ...
  image: "/images/subeler/gop.jpg",
}
```

## Öneriler

- Format: `.jpg` (fotoğraf) veya `.webp`. Uzun kenar 2000–2400px yeterli.
- Her içerik kaydındaki `imageLabel`, o alana hangi karenin geleceğini anlatır;
  placeholder üzerinde de görünür. Çekim brief’i olarak kullanılabilir.
- Görseller `next/image` ile otomatik boyutlandırılır, `object-cover` uygulanır;
  kadrajda ana öğeyi merkeze yakın tutun.
