import Link from "next/link";
import { FadeIn } from "@/components/shared/FadeIn";

const occasions = [
  {
    icon: "🎂",
    label: "Doğum Günü",
    description: "Her yaş için kişiselleştirilmiş tasarımlar",
  },
  {
    icon: "💍",
    label: "Nişan & Söz",
    description: "İki kalbi birleştiren özel pastalar",
  },
  {
    icon: "✨",
    label: "Kutlamalar",
    description: "Mezuniyet, terfi ve başarı anları",
  },
  {
    icon: "🏢",
    label: "Kurumsal",
    description: "Toplantı, lansman ve etkinlikler için",
  },
];

export function SpecialOccasionSection() {
  return (
    <section
      className="relative py-20 md:py-28 overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #3D2015 0%, #2C1A17 50%, #1C1008 100%)",
      }}
    >
      {/* Warm glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 20% 50%, rgba(196, 150, 42, 0.4) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(168, 123, 47, 0.3) 0%, transparent 45%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left text */}
          <div>
            <FadeIn>
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-gold mb-4 font-semibold">
                Özel Gün Siparişleri
              </p>
            </FadeIn>
            <FadeIn delay={100}>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-cream-light leading-tight mb-6">
                Sevdiklerinizle paylaştığınız her an daha özel.
              </h2>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="font-sans text-base md:text-lg text-cream/60 leading-relaxed mb-8">
                Doğum günlerinden kutlamalara, nişanlardan kurumsal etkinliklere kadar her özel gününüz için kişiselleştirilmiş pasta ve lezzet tasarımları hazırlıyoruz.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="grid grid-cols-2 gap-4 mb-10">
                {occasions.map((occasion) => (
                  <div
                    key={occasion.label}
                    className="bg-cream-light/8 border border-cream-light/12 rounded-xl p-4 hover:bg-cream-light/12 transition-colors"
                  >
                    <span className="text-2xl mb-2 block">{occasion.icon}</span>
                    <p className="font-serif text-sm font-semibold text-cream-light mb-1">
                      {occasion.label}
                    </p>
                    <p className="font-sans text-xs text-cream/50 leading-relaxed">
                      {occasion.description}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={400}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/ozel-gun"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold text-espresso rounded-xl font-sans font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300 shadow-lg shadow-gold/20"
                >
                  Özel Gün Pastalarını İncele
                </Link>
                <Link
                  href="/iletisim"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-cream-light/25 text-cream-light rounded-xl font-sans font-semibold text-sm tracking-wide hover:bg-cream-light/10 transition-all duration-300"
                >
                  Sipariş İçin İletişime Geç
                </Link>
              </div>
            </FadeIn>
          </div>

          {/* Right: Decorative */}
          <FadeIn direction="scale" delay={200}>
            <div className="relative hidden lg:block">
              <div
                className="w-full aspect-square rounded-3xl overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #4A2A18 0%, #6B4423 40%, #8B5E3C 70%, #C4962A 100%)",
                  boxShadow: "0 30px 80px rgba(28, 16, 8, 0.5)",
                }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10">
                  <div
                    className="w-20 h-20 rounded-full border-2 border-gold/40 flex items-center justify-center mb-6"
                    style={{
                      background: "rgba(196, 150, 42, 0.1)",
                    }}
                  >
                    <svg
                      className="w-9 h-9 text-gold"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <p className="font-serif text-2xl font-semibold text-cream-light mb-3">
                    Her özel an için
                  </p>
                  <p className="font-sans text-sm text-cream/50 leading-relaxed">
                    Siparişinizi en az 48 saat öncesinden iletmenizi öneririz. Özel tasarımlar için ek süre gerekmektedir.
                  </p>
                  <div className="mt-8 flex items-center gap-2">
                    <div className="w-8 h-px bg-gold/40" />
                    <span className="font-serif text-xs text-gold tracking-widest uppercase">
                      Funda 1959
                    </span>
                    <div className="w-8 h-px bg-gold/40" />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
