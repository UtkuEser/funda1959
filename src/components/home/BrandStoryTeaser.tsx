import Link from "next/link";
import { homeStoryMilestones } from "@/lib/data";
import { Container } from "@/components/shared/Container";
import { FadeIn } from "@/components/shared/FadeIn";

export function BrandStoryTeaser() {
  return (
    <section className="bg-cream py-16 md:py-24">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — historical image */}
          <FadeIn direction="scale">
            <div
              className="w-full aspect-[5/4] overflow-hidden rounded-xl relative"
              style={{
                background:
                  "linear-gradient(150deg, #E7DAC6 0%, #D3BE9C 55%, #B9A079 100%)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/25 to-transparent" />
              <p className="absolute left-6 bottom-5 font-sans text-[13px] tracking-wide text-cream-light/90">
                Ankara — ilk mağaza, 1959
              </p>
            </div>
          </FadeIn>

          {/* Right — text */}
          <div>
            <FadeIn>
              <p className="font-sans text-[12px] font-semibold tracking-[0.16em] uppercase text-burgundy/50 mb-3">
                1959&apos;dan bugüne
              </p>
            </FadeIn>
            <FadeIn delay={100}>
              <h2 className="font-serif text-[30px] md:text-[40px] font-semibold text-burgundy leading-[1.1]">
                Nesillerdir aynı özen
              </h2>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="mt-5 font-sans text-[15px] md:text-base text-warm-brown leading-relaxed max-w-lg">
                Küçük bir dükkânda başlayan hikâyemiz, üç kuşağın emeğiyle bugüne
                uzandı. Değişen çok şey oldu; ama tezgâhın arkasındaki özen hep aynı
                kaldı.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="mt-8 flex items-center gap-5 sm:gap-7">
                {homeStoryMilestones.map((m, i) => (
                  <div key={m.year} className="flex items-center gap-5 sm:gap-7">
                    {i > 0 && (
                      <span className="h-px w-6 sm:w-10 bg-gold/60" aria-hidden />
                    )}
                    <div>
                      <p className="font-serif text-[18px] font-medium text-burgundy leading-none">
                        {m.year}
                      </p>
                      <p className="mt-1 font-sans text-[12px] text-taupe">{m.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={400}>
              <Link
                href="/hikayemiz"
                className="mt-9 group inline-flex items-center gap-1.5 font-sans text-[15px] font-semibold text-burgundy border-b border-burgundy/20 pb-0.5 hover:border-burgundy transition-colors"
              >
                Hikâyemizi keşfet
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </FadeIn>
          </div>
        </div>
      </Container>
    </section>
  );
}
