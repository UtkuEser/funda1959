import Link from "next/link";
import { FadeIn } from "@/components/shared/FadeIn";

export function BrandStoryTeaser() {
  return (
    <section className="py-20 md:py-28 bg-cream-light overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Image placeholder */}
          <FadeIn direction="scale">
            <div className="relative">
              <div
                className="w-full aspect-[4/5] rounded-2xl overflow-hidden"
                style={{
                  background:
                    "linear-gradient(160deg, #EDE5D8 0%, #D4B896 40%, #C0A07A 70%, #A87B4A 100%)",
                }}
              >
                {/* Decorative content inside placeholder */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 px-8">
                  <div
                    className="w-full h-px mb-6"
                    style={{
                      background:
                        "linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent)",
                    }}
                  />
                  <p className="font-serif text-espresso/60 text-sm text-center italic">
                    Funda 1959 — Ankara
                  </p>
                </div>

                {/* Center ornament */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-serif text-7xl font-bold text-espresso/10 leading-none">
                      1959
                    </p>
                    <p className="font-serif text-xs tracking-[0.4em] uppercase text-espresso/30 mt-2">
                      Ankara Pastanesi
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-6 -right-6 bg-gold rounded-2xl px-6 py-4 shadow-xl">
                <p className="font-serif text-espresso text-xs tracking-wider uppercase font-semibold">
                  Kuruluş
                </p>
                <p className="font-serif text-espresso text-3xl font-bold leading-none mt-0.5">
                  1959
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Right: Text */}
          <div>
            <FadeIn>
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-gold mb-4 font-semibold">
                Hikayemiz
              </p>
            </FadeIn>
            <FadeIn delay={100}>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-chocolate leading-tight mb-6">
                Bir pastaneden fazlası: yıllara yayılan bir lezzet mirası.
              </h2>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="font-sans text-base md:text-lg text-warm-brown leading-relaxed mb-6">
                Funda&apos;nın hikayesi, yıllara yayılan ustalığın ve aileden gelen lezzet anlayışının Ankara&apos;daki sıcak karşılığıdır. 1959&apos;da küçük bir dükkânda başlayan bu yolculuk, bugün üç şube ve binlerce özel anın ortak paydası haline geldi.
              </p>
            </FadeIn>
            <FadeIn delay={300}>
              <p className="font-sans text-base text-mocha leading-relaxed mb-8">
                Her pastamız, her tatlımız ve her çikolatamızda o ilk günkü özeni, kaliteyi ve sıcaklığı yaşatıyoruz. Çünkü bize göre iyi bir pastane, sadece ürün satan değil; anı oluşturan bir yerdir.
              </p>
            </FadeIn>

            <FadeIn delay={400}>
              <div className="flex flex-wrap gap-6 mb-8">
                {[
                  { value: "65+", label: "Yıllık Deneyim" },
                  { value: "3", label: "Şube" },
                  { value: "100+", label: "Lezzet Çeşidi" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-serif text-3xl font-bold text-chocolate">{stat.value}</p>
                    <p className="font-sans text-xs text-mocha uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={500}>
              <Link
                href="/hikayemiz"
                className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-chocolate border-b-2 border-gold pb-0.5 hover:text-gold transition-colors group"
              >
                Hikayemizi Okuyun
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
