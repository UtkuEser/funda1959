import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { collections } from "@/content/menu";

const [feature, ...rest] = collections;
const [mid1, mid2, wide] = rest;

/** Kart — görsel ana yüzey, metin kısa. */
function MomentCard({
  item,
  ratio,
  sizes,
  titleClass = "t-card",
}: {
  item: (typeof collections)[number];
  ratio?: string;
  sizes: string;
  titleClass?: string;
}) {
  return (
    <Link href={item.href} className="group block h-full">
      <Figure asset={item.image} ratio={ratio} sizes={sizes} zoom />
      <div className="pt-5">
        <h3 className={`${titleClass} font-serif text-ink transition-colors group-hover:text-bordo`}>
          {item.title}
        </h3>
        <p className="mt-3 max-w-[46ch] font-sans text-[16px] leading-[1.65] text-ink-soft">
          {item.lead}
        </p>
        <span className="mt-4 inline-block font-sans text-[13px] uppercase tracking-[0.16em] text-bordo">
          <span className="border-b border-bordo/40 pb-1 transition-colors group-hover:border-bordo">
            {item.cta}
          </span>
        </span>
      </div>
    </Link>
  );
}

export function Moments() {
  return (
    <Section tone="cream">
      <Container>
        <Heading
          label="Funda’da Neler Var?"
          title="Günün her anına Funda."
          lead="Kahve molasından misafirliğe, ofis ikramından kutlamaya; ürün dünyamız günün hangi anında olduğunuza göre ayrılıyor."
        />

        <div className="mt-16 grid gap-x-10 gap-y-14 lg:mt-20 lg:grid-cols-12">
          {/* Büyük kart */}
          <Reveal className="lg:col-span-7">
            <MomentCard
              item={feature}
              ratio="3 / 4"
              sizes="(max-width: 1024px) 100vw, 58vw"
              titleClass="t-card"
            />
          </Reveal>

          {/* İki orta kart */}
          <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 lg:content-between">
            <Reveal delay={80}>
              <MomentCard item={mid1} ratio="4 / 3" sizes="(max-width: 1024px) 50vw, 34vw" />
            </Reveal>
            <Reveal delay={140}>
              <MomentCard item={mid2} ratio="4 / 3" sizes="(max-width: 1024px) 50vw, 34vw" />
            </Reveal>
          </div>
        </div>

        {/* Yatay destek kartı */}
        <Reveal delay={80} className="mt-14 lg:mt-20">
          <Link href={wide.href} className="group block">
            <div className="grid items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <Figure
                  asset={wide.image}
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  zoom
                />
              </div>
              <div className="lg:col-span-5">
                <p className="t-label font-sans text-bordo/80">{wide.lead}</p>
                <h3 className="t-h2 mt-5 font-serif text-ink transition-colors group-hover:text-bordo">
                  {wide.title}
                </h3>
                <p className="t-body measure mt-6 text-ink-soft">{wide.description}</p>
                <span className="mt-6 inline-block font-sans text-[13px] uppercase tracking-[0.16em] text-bordo">
                  <span className="border-b border-bordo/40 pb-1 transition-colors group-hover:border-bordo">
                    {wide.cta}
                  </span>
                </span>
              </div>
            </div>
          </Link>
        </Reveal>
      </Container>
    </Section>
  );
}
