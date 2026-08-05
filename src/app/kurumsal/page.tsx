import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { RequestForm } from "@/components/shared/RequestForm";
import {
  corporateIntro,
  corporateNotes,
  corporateServices,
  corporateSteps,
} from "@/content/corporate";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Kurumsal & Toplu Sipariş",
  description:
    "Funda 1959 kurumsal ikram, bayram kutuları, açılış pastaları ve toplu sipariş çözümleri. Ankara içi teslimat seçenekleriyle.",
};

export default function CorporatePage() {
  return (
    <>
      <PageHero
        eyebrow={corporateIntro.eyebrow}
        title={corporateIntro.title}
        description={corporateIntro.description}
      />

      {/* Hizmetler */}
      <Section tone="cream">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <Figure
        asset={corporateIntro.image}
                ratio="aspect-[4/5]"
                sizes="(max-width: 1024px) 90vw, 40vw"
                framed
              />
            </Reveal>

            <div className="lg:col-span-7">
              <SectionHeading
                align="left"
                eyebrow="Neler Yapıyoruz"
                title="Adet büyüdükçe planlama başlar."
                description="Toplu siparişlerde üretim takvimi, paketleme ve teslimat tek bir plan olarak kurulur."
              />

              <div className="mt-10 grid gap-px border border-stone/30 bg-stone/30 sm:grid-cols-2">
                {corporateServices.map((service, index) => (
                  <Reveal key={service.title} delay={index * 70} className="bg-cream">
                    <div className="h-full px-6 py-7">
                      <h3 className="font-serif text-xl text-ink">{service.title}</h3>
                      <p className="mt-3 font-sans text-sm leading-relaxed text-ink-soft">
                        {service.description}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Süreç */}
      <Section tone="cream-2" spacing="tight">
        <Container>
          <SectionHeading
            eyebrow="Süreç"
            title="Dört adımda toplu sipariş."
          />

          <div className="mt-14 grid gap-px border border-stone/30 bg-stone/30 sm:grid-cols-2 lg:grid-cols-4">
            {corporateSteps.map((step, index) => (
              <Reveal key={step.step} delay={index * 80} className="bg-cream-2">
                <div className="h-full px-7 py-9">
                  <p className="font-serif text-3xl text-bordo/70">{step.step}</p>
                  <h3 className="mt-5 font-serif text-xl text-ink">{step.title}</h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-ink-soft">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <ul className="mx-auto mt-12 max-w-2xl space-y-3">
            {corporateNotes.map((note) => (
              <li
                key={note.slice(0, 20)}
                className="border-l-2 border-gold/60 pl-4 font-sans text-sm leading-relaxed text-ink-soft"
              >
                {note}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Talep formu */}
      <Section tone="paper">
        <Container size="narrow">
          <SectionHeading
            eyebrow="Teklif Alın"
            title="Talebinizi iletin."
            description="Formu doldurduğunuzda bilgileriniz hazır bir e-posta taslağına dönüşür; göndermeniz yeterli."
          />

          <div className="mt-12">
            <RequestForm
              subject="Kurumsal / Toplu Sipariş Talebi"
              submitLabel="Teklif Talebi Gönder"
              topics={[
                "Toplantı & etkinlik ikramı",
                "Bayram / yılbaşı kutusu",
                "Açılış & kutlama pastası",
                "Düzenli ikram anlaşması",
                "Diğer",
              ]}
              note={`Dilerseniz doğrudan arayabilirsiniz: ${site.phone}`}
            />
          </div>
        </Container>
      </Section>
    </>
  );
}
