# Çalışma Düzeni

Son güncelleme: 28 Ekim 2026

## Geliştirme (tek klasör)

- Klasör: `/Users/Utku/Desktop/funda1959-supabase-test`
- Dal: `supabase-test` (GitHub: `origin/supabase-test`)
- Local adres: http://localhost:3000 — yalnızca bu klasörden çalışan tek sunucu (`npm run dev`)
- Veri: Supabase test projesi `funda1959-test` (`app_environment = test`)
- VS Code'da açılacak klasör: bu klasör

## Preview

- https://funda1959-git-supabase-test-eek-media-s-projects.vercel.app (Vercel girişi gerekir)
- `supabase-test` dalına yapılan her push'tan sonra güncellenir.

## Production

- https://funda1959.vercel.app — `main` dalı (`60355bf`), Supabase'e bağlı değil.
- Bu düzenleme sırasında Production'da hiçbir şey değiştirilmedi.

## Eski kopya: `funda1959-main-iletisim`

- Klasör: `/Users/Utku/Desktop/funda1959-main-iletisim`, dal `fix/iletisim-formu-gizle` (`main` / `60355bf` üzerinde). Aynı deponun Git worktree'si; silinmedi, bağlantısı korunuyor.
- Yeni geliştirme burada yapılmaz. Eski sürümü ve bekleyen canlı iletişim düzeltmesini barındırır:
  - `src/app/iletisim/page.tsx` (commit edilmemiş): canlı sitedeki kayıt tutmayan iletişim formunu kaldırıp yalnızca telefon ve e-postayı bırakır. Yalnızca Production'a (`main`) gidecekse buradan kullanılır.
  - `public/logo/funda_logo.png` (izlenmiyor): aynı dosya bu klasöre kopyalandı (`public/logo/`).
