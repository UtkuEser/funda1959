import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Figure } from "@/components/ui/Figure";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { signatureIntro, signatureProducts } from "@/content/menu";

/** İmza bölümü — büyük görsel + kısa anlatım + en fazla 3 ürün. */
export function Signature() {
  const products = signatureProducts.slice(0, 3);

  return (
    <Section tone="sand">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
          <Reveal className="lg:col-span-6">
            <Figure
              asset={signatureIntro.image}
              sizes="(max-width: 1024px) 100vw, 46vw"
            />
          </Reveal>

          <div className="lg:col-span-6">
            <p className="t-label font-sans text-bordo/80">Funda’nın İmzası</p>

            <h2 className="t-h2 mt-6 max-w-[16ch] font-serif text-ink">
              {signatureIntro.title}
            </h2>

            <p className="t-body measure mt-7 text-ink-soft">
              {signatureIntro.description}
            </p>

            <ul className="mt-10 border-t border-stone/40">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="flex flex-col gap-1 border-b border-stone/40 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                >
                  <span className="font-serif text-[22px] text-ink">{product.name}</span>
                  <span className="font-sans text-[15px] text-ink-mute">{product.short}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Button href="/imza-lezzetler" variant="outline">
                İmza Lezzetler
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
