import type { Metadata } from "next";
import { catalogProducts } from "@/lib/data";
import { LandingHero } from "@/components/landing/LandingHero";
import { CategoryShowcase } from "@/components/landing/CategoryShowcase";
import { FeaturedProductStrip } from "@/components/landing/FeaturedProductStrip";
import { EditorialSteps } from "@/components/landing/EditorialSteps";
import { EditorialSplit } from "@/components/landing/EditorialSplit";
import { BurgundyCTA } from "@/components/landing/BurgundyCTA";

export const metadata: Metadata = {
  title: "Özel Gün Pastaları",
  description:
    "Doğum günü, nişan, düğün ve kurumsal kutlamalar için Funda 1959'un özenle hazırladığı özel gün pastaları. Kişi sayısından tasarıma kadar size göre.",
  keywords: [
    "Ankara özel gün pastası",
    "Ankara doğum günü pastası",
    "Ankara nişan pastası",
    "Ankara düğün pastası",
    "özel tasarım pasta Ankara",
  ],
};

const OCCASIONS = [
  {
    index: "01",
    title: "Doğum Günü",
    description: "Her yaşa göre yorumlanan, sade ya da detaylı doğum günü pastaları.",
    href: "/lezzetlerimiz/yas-pastalar",
    gradient: "from-[#EBD3C6] to-[#D9AF9C]",
  },
  {
    index: "02",
    title: "Nişan & Söz",
    description: "İki ailenin buluştuğu güne yakışan, zarif ve ölçülü tasarımlar.",
    href: "/lezzetlerimiz/yas-pastalar",
    gradient: "from-[#EEE4D3] to-[#DCC7AE]",
  },
  {
    index: "03",
    title: "Düğün",
    description: "Masanın baş köşesi için çok katlı, özenle kurgulanmış pastalar.",
    href: "/lezzetlerimiz/yas-pastalar",
    gradient: "from-[#E6D0CF] to-[#C9A7AB]",
  },
  {
    index: "04",
    title: "Yıldönümü",
    description: "Birlikte geçen yılları anlatan, kişiye özel küçük dokunuşlar.",
    href: "/lezzetlerimiz/yas-pastalar",
    gradient: "from-[#EFE6D4] to-[#DCC9AC]",
  },
  {
    index: "05",
    title: "Özel Davetler",
    description: "Ev buluşmaları ve kutlamalar için pratik, paylaşımlık seçenekler.",
    href: "/lezzetlerimiz/yas-pastalar",
    gradient: "from-[#E9DAC3] to-[#D3BE9C]",
  },
  {
    index: "06",
    title: "Kurumsal Kutlamalar",
    description: "Lansman, yıl dönümü ve ekip kutlamaları için planlı siparişler.",
    href: "/iletisim",
    gradient: "from-[#E7D6D2] to-[#CBAAA6]",
  },
];

const PERSONALIZATION = [
  { index: "01", title: "Kişi Sayısı", description: "Davetiniz için doğru ölçüyü birlikte belirleyelim." },
  { index: "02", title: "Lezzet", description: "Çikolatadan meyveliye, sevilen tatlar arasından seçin." },
  { index: "03", title: "Tasarım", description: "Sade bir yorum ya da güne özel bir kurgu." },
  { index: "04", title: "Pasta Üzeri Yazı", description: "Kutlamaya özel kısa bir mesaj ekleyin." },
  { index: "05", title: "Teslimat Tarihi", description: "Gününe göre planlanan taze hazırlık." },
];

const PROCESS = [
  { index: "01", title: "Seçiminizi yapın", description: "Koleksiyondan ya da özel bir tasarımdan başlayın." },
  { index: "02", title: "Detayları paylaşın", description: "Kişi sayısı, tat ve teslim gününü iletin." },
  { index: "03", title: "Ustalarımız hazırlasın", description: "Siparişiniz, günü geldiğinde taze hazırlanır." },
  { index: "04", title: "Kutlamanıza ulaşsın", description: "Mağazadan teslim alın ya da adrese gönderin." },
];

const celebrationProducts = [
  ...catalogProducts.filter((p) => p.isSpecialOccasion),
  ...catalogProducts.filter((p) => !p.isSpecialOccasion && (p.occasions?.length ?? 0) > 0),
].slice(0, 4);

export default function OzelGunPage() {
  return (
    <>
      <LandingHero
        eyebrow="Özel Gün Pastaları"
        title={
          <>
            Her kutlamanın
            <br />
            <em className="italic text-burgundy">kendine ait</em> bir hikâyesi vardır.
          </>
        }
        description="Doğum günlerinden nişanlara, özel davetlerden kurumsal kutlamalara; Funda'nın ustalığıyla hazırlanan pastalar."
        primary={{ label: "Koleksiyonu Keşfet", href: "/lezzetlerimiz/yas-pastalar" }}
        secondary={{ label: "Özel Sipariş Oluştur", href: "/iletisim" }}
        tertiary={
          <>
            Sipariş danışmanlığı için{" "}
            <a
              href="tel:+903124470000"
              className="font-semibold text-burgundy hover:text-chocolate-light"
            >
              0312 447 00 00
            </a>
          </>
        }
        visual={{
          style: {
            background: "linear-gradient(150deg, #F6EEE1 0%, #ECD6C3 46%, #DBAB90 100%)",
          },
          label: { kicker: "Funda 1959", title: "Özel Gün Koleksiyonu" },
        }}
      />

      <CategoryShowcase
        eyebrow="Hangi Gün?"
        title="Her kutlama için bir Funda dokunuşu."
        intro="Kutlamanızın türünü seçin, size en yakın koleksiyondan başlayalım."
        items={OCCASIONS}
        columns={3}
        background="cream"
      />

      <FeaturedProductStrip
        eyebrow="Seçkiler"
        title="Özel günlerin favorileri"
        subtitle="Şubelerimizde ve özel siparişle en çok tercih edilen pastalardan bir seçki."
        products={celebrationProducts}
        action={{ label: "Tüm Özel Gün Pastalarını Gör", href: "/lezzetlerimiz/yas-pastalar" }}
        background="cream-light"
      />

      <EditorialSteps
        eyebrow="Kişiselleştirme"
        title="Sizin için hazırlanır."
        intro="Her kutlamanın ihtiyacı farklıdır. Pastanızı kişi sayısından tasarım detaylarına kadar size göre şekillendirebilirsiniz."
        steps={PERSONALIZATION}
        background="cream"
      />

      <EditorialSteps
        eyebrow="Sipariş Süreci"
        title="Kutlamanıza giden yol"
        steps={PROCESS}
        background="cream-light"
      />

      <EditorialSplit
        eyebrow="1959'dan Bugüne"
        title={
          <>
            1959&apos;dan beri
            <br />
            kutlamaların bir parçası.
          </>
        }
        body="Funda'nın pastacılık geleneği, nesiller boyunca özel günlerin ve sofra etrafında paylaşmanın bir parçası oldu."
        cta={{ label: "Hikâyemizi okuyun", href: "/hikayemiz" }}
        visual={{
          style: {
            background: "radial-gradient(120% 90% at 32% 20%, #F4E9DC 0%, #E7CAB9 46%, #CE9D8A 78%, #B47B6B 100%)",
          },
          label: { kicker: "Funda 1959", title: "1959" },
        }}
        visualSide="right"
        background="cream"
      />

      <BurgundyCTA
        eyebrow="Özel Sipariş"
        title="Kutlamanızı birlikte hazırlayalım."
        description="Hayalinizdeki pasta için detayları bizimle paylaşın."
        primary={{ label: "Özel Sipariş Oluştur", href: "/iletisim" }}
        secondary={{ label: "Mağazalarımızı Gör", href: "/subeler" }}
        note={
          <>
            Dilerseniz bizi arayın:{" "}
            <a href="tel:+903124470000" className="font-semibold text-cream-light/80 hover:text-cream-light">
              0312 447 00 00
            </a>
          </>
        }
      />
    </>
  );
}
