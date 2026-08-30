import type { Metadata } from "next";
import { StoryTimeline } from "@/components/shared/StoryTimeline";
import { CTASection } from "@/components/shared/CTASection";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";

export const metadata: Metadata = {
  title: "Hikayemiz",
  description:
    "1959'dan beri Ankara'nın kalbinde. Funda'nın kuruluşundan bugüne uzanan lezzet mirası ve ustalık yolculuğu.",
  openGraph: {
    title: "Hikayemiz | Funda 1959",
    description:
      "1959'dan beri Ankara'nın kalbinde. Funda'nın kuruluşundan bugüne uzanan lezzet mirası.",
  },
};

const values = [
  {
    title: "Kalite",
    description:
      "Her ürünümüzde en taze malzemeleri, en özenli tarifleri ve en yüksek üretim standartlarını uygularız.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    title: "Gelenek",
    description:
      "Yılların birikimini ve aileden gelen tarifleri yaşatarak, Türk pastacılığının köklü değerlerini taşırız.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
  },
  {
    title: "Sıcaklık",
    description:
      "Her ziyaretçimize ev sıcaklığında karşılama, samimi hizmet ve lezzetli bir deneyim sunmak önceliğimizdir.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    title: "Ustalık",
    description:
      "Pastacılık bir zanaattır. Ustalarımız, her ürüne ellerindeki tüm beceriyi ve tutkuyu katarlar.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

export default function HikayemizPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden"
        style={{
          background: "linear-gradient(150deg, #6E2230 0%, #5A1B27 55%, #3F1720 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 70% 30%, rgba(196, 150, 42, 0.4) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <p className="font-sans text-[13px] tracking-[0.14em] uppercase text-gold-light mb-4 font-semibold">
              Hikayemiz
            </p>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-cream-light leading-tight mb-6">
              Bir pastaneden fazlası:{" "}
              <span className="text-gold-light">yıllara yayılan</span>{" "}
              bir lezzet mirası.
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="font-sans text-base md:text-lg text-cream/65 max-w-2xl mx-auto leading-relaxed">
              Funda&apos;nın hikayesi, yıllara yayılan ustalığın ve aileden gelen lezzet anlayışının Ankara&apos;daki sıcak karşılığıdır.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 md:py-24 bg-cream-light">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="font-sans text-lg md:text-xl text-warm-brown leading-relaxed text-center mb-8">
              1959 yılında Ankara&apos;nın kalbinde açılan küçük bir dükkândan bugüne, Funda onlarca yılın birikimini ve üç kuşağın emeğini taşımaktadır.
            </p>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="font-sans text-base text-mocha leading-relaxed text-center">
              Şehrin büyümesine tanıklık ettik. Nesiller değişti, alışkanlıklar dönüştü, ama lezzetin özü hiç değişmedi. Bugün GOP, Panora ve İncek TONA&apos;daki şubelerimizle Ankara&apos;nın farklı noktalarında aynı kaliteyle hizmet vermeye devam ediyoruz.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Değerlerimiz"
            title="Neye inanıyoruz"
            subtitle="Funda'nın her ürününde ve her hizmetinde taşıdığı temel değerler."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <FadeIn
                key={value.title}
                delay={index < 4 ? ([0, 100, 200, 300][index] as 0 | 100 | 200 | 300) : 0}
              >
                <div className="bg-cream-light border border-sand-light rounded-2xl p-6 hover:border-gold/40 hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-4">
                    {value.icon}
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-chocolate mb-2">
                    {value.title}
                  </h3>
                  <p className="font-sans text-sm text-mocha leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-24 bg-cream-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Kronoloji"
            title="Yıllar boyunca Funda"
            subtitle="Küçük bir dükkândan bugünkü köklü marka kimliğine uzanan yolculuğumuz."
          />
          <StoryTimeline />
        </div>
      </section>

      {/* Quote */}
      <section
        className="py-16 md:py-20 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #F5F0E8 0%, #EDE5D8 100%)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <svg
              className="w-12 h-12 text-gold/40 mx-auto mb-6"
              fill="currentColor"
              viewBox="0 0 32 32"
            >
              <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H6c0-2.2 1.8-4 4-4V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-8c0-2.2 1.8-4 4-4V8z" />
            </svg>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="font-serif text-2xl md:text-3xl font-medium text-chocolate italic leading-relaxed mb-6">
              &ldquo;Her dilimde mutluluk. Her kutlamada Funda.&rdquo;
            </p>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="font-sans text-sm text-mocha tracking-widest uppercase">
              Funda 1959 · Ankara
            </p>
          </FadeIn>
        </div>
      </section>

      <CTASection
        eyebrow="Şubelerimiz"
        title="Bizi ziyaret edin"
        subtitle="Ankara'nın üç farklı noktasında hizmetinizdeyiz. En yakın şubeyi bulun, ya da özel gününüz için sipariş verin."
        primaryCta={{ label: "Şubelerimizi Gör", href: "/subeler" }}
        secondaryCta={{ label: "İletişime Geç", href: "/iletisim" }}
        variant="dark"
      />
    </>
  );
}
