import type { Metadata } from "next";
import { branches } from "@/lib/data";
import { BranchCard } from "@/components/shared/BranchCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { CTASection } from "@/components/shared/CTASection";
import { FadeIn } from "@/components/shared/FadeIn";

export const metadata: Metadata = {
  title: "Şubelerimiz",
  description:
    "Ankara'da GOP, Panora ve İncek TONA Residence konumlarında hizmet veren Funda 1959 şubeleri. Adres, telefon ve yol tarifi bilgileri.",
  keywords: [
    "Funda 1959 şubeleri",
    "GOP pastane",
    "Panora pastane",
    "İncek pastane",
    "Ankara pastane adresi",
  ],
};

export default function SubelerPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative pt-32 pb-16 md:pt-44 md:pb-20"
        style={{
          background: "linear-gradient(160deg, #EDE5D8 0%, #F5F0E8 60%, #FAF8F3 100%)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <p className="font-sans text-xs tracking-[0.25em] uppercase text-gold mb-4 font-semibold">
              Şubelerimiz
            </p>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-chocolate leading-tight mb-5">
              Size en yakın Funda
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="font-sans text-base md:text-lg text-warm-brown max-w-2xl mx-auto leading-relaxed">
              Ankara&apos;nın üç farklı noktasında hizmetinizdeyiz. Lezzetli bir mola ya da özel gün siparişiniz için bizi ziyaret edin.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Branches */}
      <section className="py-14 md:py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {branches.map((branch, index) => (
              <FadeIn
                key={branch.id}
                delay={([0, 100, 200] as const)[index]}
              >
                <BranchCard branch={branch} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      <section className="py-14 md:py-20 bg-cream-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Konum"
            title="Ankara'nın kalbinde"
            subtitle="Şubelerimizin bulunduğu konumları inceleyin. Yol tarifi almak için şube kartındaki bağlantıya tıklayın."
          />

          {/* Map placeholder */}
          <FadeIn>
            <div
              className="w-full h-80 md:h-96 rounded-2xl overflow-hidden border border-sand-light"
              style={{
                background: "linear-gradient(135deg, #EDE5D8 0%, #E0D0C0 50%, #D4C0A8 100%)",
              }}
            >
              <div className="w-full h-full flex flex-col items-center justify-center text-center px-8">
                <svg
                  className="w-14 h-14 text-warm-brown/30 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <p className="font-serif text-xl font-semibold text-warm-brown/60 mb-2">
                  Harita Görünümü
                </p>
                <p className="font-sans text-sm text-mocha/60 max-w-sm">
                  Yol tarifi almak için ilgili şube kartındaki &ldquo;Yol Tarifi&rdquo; butonunu kullanabilirsiniz.
                </p>
                <div className="flex gap-3 mt-6 flex-wrap justify-center">
                  {branches.map((branch) => (
                    <a
                      key={branch.id}
                      href={branch.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-cream-light/80 border border-sand text-warm-brown font-sans text-xs font-semibold rounded-lg hover:border-chocolate hover:text-chocolate transition-all"
                    >
                      {branch.shortName} →
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Info section */}
      <section className="py-14 md:py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Çalışma Saatleri",
                description: "Şubelerimiz haftanın her günü açıktır. Güncel saatler için şubeyi arayın.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                ),
                title: "Sipariş & Rezervasyon",
                description: "Özel gün siparişleri için en az 24–48 saat öncesinden şubelerimizi arayın.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                ),
                title: "Paket Servis",
                description: "Tüm şubelerimizde siparişlerinizi özenle paketleyerek hazırlıyoruz.",
              },
            ].map((item, index) => (
              <FadeIn
                key={item.title}
                delay={([0, 100, 200] as const)[index]}
              >
                <div className="bg-cream-light border border-sand-light rounded-2xl p-6 hover:border-gold/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-chocolate mb-2">
                    {item.title}
                  </h3>
                  <p className="font-sans text-sm text-mocha leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        eyebrow="Özel Gün"
        title="Bir özel gününüz mü var?"
        subtitle="Doğum günü, nişan veya kutlama siparişleriniz için şimdi iletişime geçin."
        primaryCta={{ label: "Sipariş İçin İletişime Geç", href: "/iletisim" }}
        secondaryCta={{ label: "Özel Gün Pastalarını İncele", href: "/ozel-gun" }}
        variant="dark"
      />
    </>
  );
}
