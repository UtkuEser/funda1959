import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { CtaBand } from "@/components/shared/CtaBand";
import { BranchCard } from "@/components/shared/BranchCard";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { branches, branchesIntro } from "@/content/branches";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Şubeler",
  description:
    "Funda 1959 GOP, Panora ve İncek şubeleri: adres, çalışma saatleri, atmosfer ve yol tarifi.",
};

const experience = [
  {
    title: "Vitrin",
    description:
      "Her şubede günlük üretim vitrine dizilir. Dilim alabilir, tartıyla kutulatabilir ya da yerinde yiyebilirsiniz.",
  },
  {
    title: "Masa",
    description:
      "Kahve, çay ve tabak servisi. Acele ettirilmeyen, sohbete izin veren bir salon düzeni.",
  },
  {
    title: "Paket",
    description:
      "Çıkarken kutulanan ürünler, kurdele ve kart. Misafirliğe giderken uğramak için yeterince hızlı.",
  },
];

export default function BranchesPage() {
  return (
    <>
      <PageHero
        eyebrow={branchesIntro.eyebrow}
        title={branchesIntro.title}
        description={branchesIntro.description}
      />

      <Section tone="cream">
        <Container>
          <div className="grid gap-10 lg:grid-cols-3">
            {branches.map((branch, index) => (
              <Reveal key={branch.id} delay={index * 90} className="h-full">
                <BranchCard branch={branch} detailed />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="paper" spacing="tight">
        <Container>
          <SectionHeading
            eyebrow="Şube Deneyimi"
            title="Kapıdan girince ne oluyor?"
            description="Şubeler farklı mahallelerde ama akış her yerde aynı."
          />

          <div className="mt-14 grid gap-px border border-stone/30 bg-stone/30 sm:grid-cols-3">
            {experience.map((item, index) => (
              <Reveal key={item.title} delay={index * 80} className="bg-cream">
                <div className="h-full px-7 py-9">
                  <p className="font-serif text-3xl text-gold">0{index + 1}</p>
                  <h3 className="mt-5 font-serif text-xl text-ink">{item.title}</h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-10 text-center font-sans text-sm text-ink-mute">
            Tüm şubelerimiz {site.hours} arasında açıktır.
          </p>
        </Container>
      </Section>

      <CtaBand
        eyebrow="Funda’da Buluşalım"
        title="Masayı ayıralım mı?"
        description="Kalabalık buluşmalar ve özel gün kutlamaları için önceden haber vermeniz yeterli."
        primary={{ href: "/iletisim", label: "İletişime Geçin" }}
        secondary={{ href: site.phoneHref, label: "Bizi Arayın", plain: true }}
      />
    </>
  );
}
