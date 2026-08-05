import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Figure } from "@/components/ui/Figure";
import { CornerFlourish } from "@/components/ui/Ornament";
import { Reveal } from "@/components/ui/Reveal";
import { collections } from "@/content/menu";

export function WhatsInside() {
  return (
    <Section tone="cream" id="funda-da-neler-var">
      <Container>
        <SectionHeading
          eyebrow="Funda’da Neler Var?"
          title="Her günün kendi tabağı var."
          description="Kahve molasından misafirliğe, ofis ikramından kutlamaya; Funda’nın ürün dünyası günün hangi anında olduğunuza göre ayrılıyor."
        />

        <div className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {collections.map((collection, index) => (
            <Reveal key={collection.slug} delay={index * 90} className="h-full">
              <Link href={collection.href} className="group flex h-full flex-col">
                <div className="relative">
                  <Figure
        asset={collection.image}
                    ratio="aspect-[3/4]"
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 23vw"
                    framed
                  />
                  <CornerFlourish className="pointer-events-none absolute -left-2 -top-2 h-8 w-8 text-gold opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <CornerFlourish className="pointer-events-none absolute -bottom-2 -right-2 h-8 w-8 rotate-180 text-gold opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>

                <div className="flex flex-1 flex-col pt-7">
                  <p className="font-sans text-[11px] uppercase tracking-[0.26em] text-gold">
                    {collection.lead}
                  </p>
                  <h3 className="mt-3 font-serif text-[1.6rem] leading-snug text-ink transition-colors group-hover:text-bordo">
                    {collection.title}
                  </h3>
                  <p className="mt-4 flex-1 font-sans text-[15px] leading-[1.7] text-ink-soft">
                    {collection.description}
                  </p>
                  <span className="mt-6 inline-flex w-fit border-b border-bordo/30 pb-1 font-sans text-[12px] uppercase tracking-[0.18em] text-bordo transition-colors group-hover:border-bordo">
                    {collection.cta}
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
