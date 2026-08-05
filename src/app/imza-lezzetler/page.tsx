import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { CtaBand } from "@/components/shared/CtaBand";
import { ProductCard } from "@/components/shared/ProductCard";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Figure } from "@/components/ui/Figure";
import { Divider } from "@/components/ui/Ornament";
import { Reveal } from "@/components/ui/Reveal";
import { signatureIntro, signatureProducts } from "@/content/menu";

export const metadata: Metadata = {
  title: "İmza Lezzetler",
  description:
    "Funda 1959’un adıyla anılan imza lezzetleri: tarifi değişmeyen, kahvenin yanına da misafirliğe de yakışan ürünler.",
};

const reasons = [
  {
    title: "Tarifi değişmiyor",
    description:
      "İmza ürünlerin ölçüsü ve yöntemi yıllardır aynı. Mevsime göre malzeme değişir, tarif değişmez.",
  },
  {
    title: "Günlük hazırlanıyor",
    description:
      "Stok yapılmaz. Vitrine çıkan imza ürünler o gün hazırlanır, ertesi güne devredilmez.",
  },
  {
    title: "Kutuya hazır",
    description:
      "İmza ürünlerin tamamı hediye kutusuna dizilebilir; bordo kurdele ve kart isteğe bağlıdır.",
  },
];

export default function SignaturePage() {
  return (
    <>
      <PageHero
        eyebrow={signatureIntro.eyebrow}
        title={signatureIntro.title}
        description={signatureIntro.description}
      />

      {/* Öne çıkan imza anlatımı */}
      <Section tone="cream" spacing="tight">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-6">
              <Figure
        asset={signatureIntro.image}
                ratio="aspect-[3/2]"
                sizes="(max-width: 1024px) 90vw, 50vw"
                framed
              />
            </Reveal>

            <div className="lg:col-span-6">
              <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-gold">
                Neden imza?
              </p>
              <Divider className="mt-5 justify-start" />
              <ul className="mt-8 space-y-7">
                {reasons.map((reason) => (
                  <li key={reason.title}>
                    <h3 className="font-serif text-xl text-ink">{reason.title}</h3>
                    <p className="mt-2 max-w-md font-sans text-sm leading-relaxed text-ink-soft">
                      {reason.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* İmza ürünler */}
      <Section tone="cream-2">
        <Container>
          <SectionHeading
            eyebrow="Seçki"
            title="Funda denince akla gelenler."
            description="Az sayıda, iddialı ürün. Her biri yıllar içinde kendi müdavimini yarattı."
          />

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {signatureProducts.map((product, index) => (
              <Reveal key={product.id} delay={index * 90} className="h-full">
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand
        eyebrow="Bir Kutu Mutluluk"
        title="İmza lezzetleri kutuda götürün."
        description="Hediye kutularımızın içeriğini imza ürünlerle birlikte hazırlıyoruz."
        primary={{ href: "/paket-hediye", label: "Paket & Hediye" }}
        secondary={{ href: "/iletisim", label: "Sipariş Ver" }}
      />
    </>
  );
}
