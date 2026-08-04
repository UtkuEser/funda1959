import type { Metadata } from "next";
import Link from "next/link";
import { specialOccasionProducts, products } from "@/lib/data";
import { ProductCard } from "@/components/shared/ProductCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { CTASection } from "@/components/shared/CTASection";
import { FadeIn } from "@/components/shared/FadeIn";

export const metadata: Metadata = {
  title: "Özel Gün Pastaları",
  description:
    "Doğum günü, nişan, düğün ve kurumsal etkinlikler için Ankara'nın en sevilen özel gün pastaları. Funda 1959'dan kişiselleştirilmiş sipariş.",
  keywords: [
    "Ankara özel gün pastası",
    "Ankara doğum günü pastası",
    "Ankara nişan pastası",
    "Ankara düğün pastası",
    "özel tasarım pasta Ankara",
  ],
};

const occasions = [
  {
    title: "Doğum Günü",
    description: "Her yaşa özel, kişiselleştirilebilir doğum günü pastaları. Çocuktan yetişkine, sade yorumdan karmaşık tasarıma geniş bir yelpaze.",
    gradient: "from-[#F0D8C8] to-[#E8C0B0]",
    note: "Sipariş için en az 24 saat öncesinden arayın.",
  },
  {
    title: "Nişan & Söz",
    description: "İki özel anı ebediyen hatırlanır kılan, çiçek ve detaylarla süslenmiş nişan pastalarımız. Özel tasarım taleplerinizi memnuniyetle karşılıyoruz.",
    gradient: "from-[#F0E8D5] to-[#E8D4B5]",
    note: "Özel tasarımlar için en az 72 saat öncesinden sipariş alınmaktadır.",
  },
  {
    title: "Düğün",
    description: "Hayatın en özel gününde masanızın baş köşesini süsleyecek, çok katlı ve özenle tasarlanmış düğün pastaları.",
    gradient: "from-[#EDE5D8] to-[#E0D0C0]",
    note: "Düğün siparişleri için en az 2 hafta öncesinden randevu alınız.",
  },
  {
    title: "Mezuniyet",
    description: "Yıllarca emek verilen bir çalışmanın taçlandığı anlarda, mezuniyetin tadını çıkarmak için Funda'dan özel lezzetler.",
    gradient: "from-[#E8D5C5] to-[#D4B896]",
    note: "Yoğun dönemlerde (Haziran–Temmuz) erken sipariş önerilir.",
  },
  {
    title: "Bebek Şekeri",
    description: "Yeni bir hayatın gelişini kutlamak için bebek şekeri tasarımlarımız ve tatlı koleksiyonlarımız hazır.",
    gradient: "from-[#F5EFEA] to-[#EDE0D5]",
    note: "Doğum sonrası 1 hafta içinde sipariş verilebilir.",
  },
  {
    title: "Kurumsal",
    description: "Toplantı ikramlarından lansman etkinliklerine, kurumsal pasta ve tatlı siparişleriniz için ayrıcalıklı hizmet sunuyoruz.",
    gradient: "from-[#EDE5D8] to-[#D4C8B5]",
    note: "Toplu siparişler için önceden bilgi almak üzere arayın.",
  },
];

const orderSteps = [
  {
    step: "01",
    title: "İletişime Geçin",
    description: "Telefon, WhatsApp veya iletişim formumuzu kullanarak sipariş talebinizi iletin.",
  },
  {
    step: "02",
    title: "Tasarımı Belirleyin",
    description: "Ekibimizle birlikte pastanızın boyutunu, tasarımını ve içeriğini kararlaştırın.",
  },
  {
    step: "03",
    title: "Siparişi Onaylayın",
    description: "Fiyat ve teslim tarihi üzerinde anlaşıldıktan sonra siparişiniz kayıt altına alınır.",
  },
  {
    step: "04",
    title: "Teslim Alın",
    description: "Özel gününüzde, belirlenen şubeden pastanızı taze olarak teslim alın.",
  },
];

export default function OzelGunPage() {
  const specialProducts = [...specialOccasionProducts];
  if (specialProducts.length < 4) {
    const extra = products
      .filter((p) => !p.isSpecialOccasion && p.categorySlug === "yas-pastalar")
      .slice(0, 4 - specialProducts.length);
    specialProducts.push(...extra);
  }

  return (
    <>
      {/* Hero */}
      <section
        className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #3D2015 0%, #5C3420 40%, #8B5E3C 80%, #C4962A 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 60%, rgba(196, 150, 42, 0.5) 0%, transparent 55%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <p className="font-sans text-xs tracking-[0.25em] uppercase text-gold mb-4 font-semibold">
              Özel Gün Siparişleri
            </p>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-cream-light leading-tight mb-6">
              Sevdiklerinizle paylaştığınız{" "}
              <span className="italic text-gold">her an</span> daha özel.
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="font-sans text-base md:text-lg text-cream/65 max-w-2xl mx-auto leading-relaxed mb-8">
              Doğum günlerinden kutlamalara, nişanlardan kurumsal etkinliklere kadar her özel gününüz için kişiselleştirilmiş pasta ve lezzet tasarımları hazırlıyoruz.
            </p>
          </FadeIn>
          <FadeIn delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/iletisim"
                className="px-8 py-4 bg-gold text-espresso rounded-xl font-sans font-semibold text-sm tracking-wide hover:bg-gold-light transition-all duration-300 shadow-lg shadow-gold/20"
              >
                Sipariş İçin İletişime Geç
              </Link>
              <a
                href="tel:+903124470000"
                className="px-8 py-4 border border-cream-light/25 text-cream-light rounded-xl font-sans font-semibold text-sm tracking-wide hover:bg-cream-light/10 transition-all duration-300"
              >
                Hemen Ara
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Occasions */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Hangi Gün?"
            title="Her kutlama için bir lezzet"
            subtitle="Hayatınızın özel anlarında, sizin için tasarlanmış pastalar ve lezzetlerle yanınızdayız."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {occasions.map((occasion, index) => (
              <FadeIn
                key={occasion.title}
                delay={index < 3 ? ([0, 100, 200][index] as 0 | 100 | 200) : 0}
              >
                <div className="group bg-cream-light border border-sand-light rounded-2xl overflow-hidden hover:border-gold/40 hover:shadow-lg transition-all duration-300">
                  <div
                    className={`w-full h-28 bg-gradient-to-br ${occasion.gradient} relative`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="font-serif text-4xl font-bold text-espresso/10 select-none">
                        {occasion.title.charAt(0)}
                      </p>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-lg font-semibold text-chocolate mb-2 group-hover:text-warm-brown transition-colors">
                      {occasion.title}
                    </h3>
                    <p className="font-sans text-sm text-mocha leading-relaxed mb-4">
                      {occasion.description}
                    </p>
                    <p className="font-sans text-xs text-gold font-semibold">
                      {occasion.note}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-16 md:py-24 bg-cream-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Özel Gün Seçkileri"
            title="Özel günlerinize özel pastalar"
            subtitle="Şubelerimizde vitrinlerden ve özel siparişle hazırlanan seçkin ürünlerimizden örnekler."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {specialProducts.map((product, index) => (
              <FadeIn
                key={product.id}
                delay={index < 4 ? ([0, 100, 200, 300][index] as 0 | 100 | 200 | 300) : 0}
              >
                <ProductCard product={product} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Order process */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Nasıl Sipariş Veririm?"
            title="Sipariş süreci"
            subtitle="Özel gün pastası siparişi vermek oldukça kolay. Dört adımda hayalinizdeki pastayı sipariş edin."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {orderSteps.map((step, index) => (
              <FadeIn
                key={step.step}
                delay={index < 4 ? ([0, 100, 200, 300][index] as 0 | 100 | 200 | 300) : 0}
              >
                <div className="relative bg-cream-light border border-sand-light rounded-2xl p-6 hover:border-gold/30 transition-all duration-300">
                  <p className="font-serif text-5xl font-bold text-gold/15 mb-3 leading-none">
                    {step.step}
                  </p>
                  <h3 className="font-serif text-lg font-semibold text-chocolate mb-2">
                    {step.title}
                  </h3>
                  <p className="font-sans text-sm text-mocha leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        eyebrow="Hemen Başlayın"
        title="Siparişinizi almaya hazırız"
        subtitle="Özel gününüz için en lezzetli anıyı birlikte yaratalım. Şimdi iletişime geçin."
        primaryCta={{ label: "İletişime Geç", href: "/iletisim" }}
        secondaryCta={{ label: "Şubeleri Gör", href: "/subeler" }}
        variant="dark"
      />
    </>
  );
}
