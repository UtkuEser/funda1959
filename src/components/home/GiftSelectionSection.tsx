import Link from "next/link";
import { giftCollections } from "@/lib/data";
import { Container } from "@/components/shared/Container";
import { FadeIn } from "@/components/shared/FadeIn";

export function GiftSelectionSection() {
  return (
    <section id="hediyelik" className="scroll-mt-24 bg-cream-light py-16 md:py-24">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
          {/* Left — one strong editorial image */}
          <FadeIn direction="scale">
            <div
              className="w-full aspect-[4/3] lg:aspect-[5/4] overflow-hidden rounded-xl relative"
              style={{
                background:
                  "linear-gradient(145deg, #E9D9C4 0%, #D8BE9E 50%, #C09E86 100%)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/20 to-transparent" />
              <p className="absolute left-6 bottom-5 font-serif text-[16px] text-cream-light/90">
                Funda&apos;dan, sevdiklerinize
              </p>
            </div>
          </FadeIn>

          {/* Right — heading + horizontal selections */}
          <div>
            <FadeIn>
              <h2 className="font-serif text-[26px] md:text-[32px] lg:text-[36px] font-medium text-burgundy leading-[1.12]">
                Sevdiklerinize Funda&apos;dan
              </h2>
            </FadeIn>
            <FadeIn delay={100}>
              <p className="mt-2 font-sans text-[13px] font-semibold tracking-[0.06em] text-burgundy/55">
                Hediyelik Seçimler
              </p>
            </FadeIn>
            <FadeIn delay={150}>
              <p className="mt-3 font-sans text-[15px] text-warm-brown leading-relaxed max-w-md">
                Bir teşekkür, bir kutlama ya da sadece &ldquo;aklımdasın&rdquo; demek için.
              </p>
            </FadeIn>

            <div className="mt-7 border-t border-sand-light">
              {giftCollections.map((item, index) => (
                <FadeIn key={item.title} delay={([100, 200, 300] as const)[index]}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-5 border-b border-sand-light py-5"
                  >
                    <div
                      className={`h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br ${item.gradient}`}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-[18px] font-medium text-burgundy">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 font-sans text-[13px] text-warm-brown leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-burgundy/70 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={300}>
              <Link
                href="/hediyelikler"
                className="mt-6 group inline-flex items-center gap-1.5 font-sans text-[14px] font-semibold text-burgundy border-b border-burgundy/20 pb-0.5 hover:border-burgundy transition-colors"
              >
                Tüm Hediyelikleri Keşfet
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </FadeIn>
          </div>
        </div>
      </Container>
    </section>
  );
}
