import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";

import { Reveal } from "@/components/ui/Reveal";
import { RequestForm } from "@/components/shared/RequestForm";
import { branches } from "@/content/branches";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "İletişim & Sipariş",
  description:
    "Funda 1959 ile iletişime geçin: özel gün pastaları, hediye kutuları ve sipariş talepleri için telefon, WhatsApp ve e-posta.",
};

const channels = [
  { label: "Telefon", value: site.phone, href: site.phoneHref },
  { label: "WhatsApp", value: "Mesaj gönderin", href: site.whatsapp, external: true },
  { label: "E-posta", value: site.email, href: site.emailHref },
  {
    label: "Instagram",
    value: site.instagramHandle,
    href: site.instagram,
    external: true,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Sipariş & İletişim"
        title="Bize yazın, aynı gün dönelim."
        description="Özel gün pastaları, hediye kutuları ve toplu siparişler için en hızlı yol telefon; detaylı talepler için aşağıdaki formu kullanabilirsiniz."
      />

      {/* Kanallar */}
      <Section tone="cream" spacing="tight">
        <Container>
          <div className="grid gap-px border border-stone/30 bg-stone/30 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map((channel, index) => (
              <Reveal key={channel.label} delay={index * 70} className="bg-cream">
                <a
                  href={channel.href}
                  target={channel.external ? "_blank" : undefined}
                  rel={channel.external ? "noopener noreferrer" : undefined}
                  className="group flex h-full flex-col px-7 py-9 transition-colors hover:bg-cream-2"
                >
                  <p className="font-sans text-[13px] uppercase tracking-[0.26em] text-gold">
                    {channel.label}
                  </p>
                  <p className="mt-4 t-card font-serif text-ink transition-colors group-hover:text-bordo">
                    {channel.value}
                  </p>
                </a>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Form + şubeler */}
      <Section tone="cream">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <Heading
                align="left"
                label="Sipariş Formu"
                title="Talebinizi anlatın."
                lead="Form, girdiğiniz bilgilerle hazır bir e-posta taslağı oluşturur; göndermeniz yeterli."
              />

              <div className="mt-10">
                <RequestForm
                  subject="Sipariş / İletişim Talebi"
                  topics={[
                    "Özel gün pastası",
                    "Hediye kutusu",
                    "Toplu sipariş",
                    "Genel bilgi",
                  ]}
                  note="Özel gün pastalarında en az 48 saat önceden sipariş rica ederiz."
                />
              </div>
            </div>

            <div className="lg:col-span-5">
              <p className="font-sans text-[13px] uppercase tracking-[0.3em] text-bordo/85">
                Şubelerimiz
              </p>

              <ul className="mt-8 space-y-8">
                {branches.map((branch) => (
                  <li key={branch.id} className="border-b border-stone/30 pb-8">
                    <h3 className="font-serif text-2xl text-ink">{branch.shortName}</h3>
                    <p className="mt-2 font-sans text-[13px] uppercase tracking-[0.14em] text-bordo/80">
                      {branch.atmosphere}
                    </p>
                    <p className="mt-3 font-sans text-[16px] leading-relaxed text-ink-soft">
                      {branch.address}
                    </p>
                    <p className="mt-1 font-sans text-[16px] text-ink-mute">{branch.hours}</p>
                    <div className="mt-4 flex flex-wrap gap-5">
                      <a
                        href={branch.phoneHref}
                        className="font-sans text-[13px] uppercase tracking-[0.18em] text-bordo transition-colors hover:text-bordo-dark"
                      >
                        {branch.phone}
                      </a>
                      <a
                        href={branch.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-b border-bordo/30 pb-0.5 font-sans text-[13px] uppercase tracking-[0.18em] text-ink-mute transition-colors hover:border-bordo hover:text-bordo"
                      >
                        Yol Tarifi
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
