import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Figure } from "@/components/ui/Figure";
import { Crest, Divider } from "@/components/ui/Ornament";
import { Reveal } from "@/components/ui/Reveal";
import { signatureIntro, signatureProducts } from "@/content/menu";

/**
 * İmza lezzet bloğu — sayfanın en vurucu editorial alanı.
 * Sıcak taş zemin üzerinde büyük görsel + metin dengesi, bordo yalnızca vurguda.
 */
export function SignatureSection() {
  return (
    <section className="relative overflow-hidden bg-cream-3 py-20 md:py-28 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-10 left-1/2 hidden w-px bg-gold/25 lg:block"
      />

      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
          {/* Görsel */}
          <Reveal className="lg:col-span-6">
            <div className="relative">
              <Figure
        asset={signatureIntro.image}
                ratio="aspect-[4/5]"
                sizes="(max-width: 1024px) 92vw, 46vw"
                framed
              />
              {/* İmza mührü */}
              <div className="absolute -bottom-8 -right-4 hidden h-28 w-28 items-center justify-center rounded-full bg-bordo text-cream shadow-lg sm:flex lg:-right-8">
                <div className="text-center">
                  <Crest className="mx-auto h-7 w-7 text-gold-soft" />
                  <p className="mt-1 font-sans text-[9px] uppercase tracking-[0.22em]">
                    İmza
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Metin */}
          <div className="lg:col-span-6">
            <p className="font-sans text-[12px] uppercase tracking-[0.32em] text-bordo/80">
              {signatureIntro.eyebrow}
            </p>

            <h2 className="mt-5 font-serif text-[2.3rem] leading-[1.12] text-ink sm:text-[2.8rem] lg:text-[3.1rem]">
              {signatureIntro.title}
            </h2>

            <Divider className="mt-7 justify-start" />

            <p className="mt-7 max-w-xl font-sans text-[17px] leading-[1.75] text-ink-soft">
              {signatureIntro.description}
            </p>

            {/* İmza ürünler */}
            <ol className="mt-10 border-t border-stone/40">
              {signatureProducts.map((product, index) => (
                <Reveal key={product.id} delay={index * 80}>
                  <li className="flex items-baseline gap-5 border-b border-stone/40 py-5">
                    <span className="font-serif text-lg text-gold">
                      0{index + 1}
                    </span>
                    <span className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                      <span className="font-serif text-[1.35rem] text-ink">
                        {product.name}
                      </span>
                      <span className="font-sans text-[13px] text-ink-mute">
                        {product.short}
                      </span>
                    </span>
                  </li>
                </Reveal>
              ))}
            </ol>

            <div className="mt-10 flex flex-wrap items-center gap-8">
              <Button href="/imza-lezzetler">İmza Lezzetler</Button>
              <Link
                href="/lezzetler"
                className="border-b border-bordo/30 pb-1 font-sans text-[12px] uppercase tracking-[0.18em] text-bordo transition-colors hover:border-bordo"
              >
                Tüm Lezzetler
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
