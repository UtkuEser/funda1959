import type { Metadata } from "next";
import { catalogProducts } from "@/lib/data";
import { LandingHero } from "@/components/landing/LandingHero";
import { CategoryShowcase } from "@/components/landing/CategoryShowcase";
import { FeaturedProductStrip } from "@/components/landing/FeaturedProductStrip";
import { EditorialSteps } from "@/components/landing/EditorialSteps";
import { EditorialSplit } from "@/components/landing/EditorialSplit";
import { BurgundyCTA } from "@/components/landing/BurgundyCTA";

export const metadata: Metadata = {
  title: "Hediyelikler | Funda 1959",
  description:
    "Özel günlerden küçük teşekkürlere, Funda 1959'un seçilmiş çikolata ve lezzet seçkilerini sevdiklerinizle paylaşın. Kişisel ve kurumsal hediyeler.",
  keywords: [
    "Ankara hediyelik çikolata",
    "Funda 1959 hediye",
    "kurumsal hediye Ankara",
    "hediye kutusu Ankara",
  ],
};

const GIFT_CATEGORIES = [
  {
    index: "01",
    title: "Çikolata Kutuları",
    description: "Özenle seçilmiş pralin ve çikolatalardan hazırlanan Funda kutuları.",
    href: "/lezzetlerimiz/cikolatalar",
    gradient: "from-[#D8C1A8] to-[#B4906F]",
  },
  {
    index: "02",
    title: "Hediye Seçkileri",
    description: "Çay saatine yakışan kurabiye ve tatlı derlemeleri.",
    href: "/lezzetlerimiz/kuru-pastalar",
    gradient: "from-[#EDE3D2] to-[#D6C0A4]",
  },
  {
    index: "03",
    title: "Özel Gün Hediyeleri",
    description: "Doğum günü, yeni bir başlangıç ya da bir teşekkür için.",
    href: "/ozel-gun",
    gradient: "from-[#EAD9C0] to-[#D2B78E]",
  },
  {
    index: "04",
    title: "Kurumsal Hediyeler",
    description: "Ekibiniz ve iş ortaklarınız için planlı seçkiler.",
    href: "#kurumsal",
    gradient: "from-[#E7D6D2] to-[#CBAAA6]",
  },
];

const SCENARIOS = [
  { index: "01", title: "Teşekkür", description: "Bir iyiliğin karşılığında küçük ve içten bir jest." },
  { index: "02", title: "Kutlama", description: "Doğum günü, terfi ya da yeni bir başlangıç." },
  { index: "03", title: "Ziyaret", description: "Misafirliğe giderken yanınızda götürebileceğiniz seçkiler." },
  { index: "04", title: "Özel Gün", description: "Yılın anlamlı günlerinde sevdiklerinizi hatırlamak." },
];

const GIFT_PROCESS = [
  { index: "01", title: "Seçilir", description: "Damak zevkine uygun lezzetler bir araya getirilir." },
  { index: "02", title: "Hazırlanır", description: "Siparişiniz, günü geldiğinde taze olarak hazırlanır." },
  { index: "03", title: "Paketlenir", description: "Funda sunumuyla özenle paketlenir." },
  { index: "04", title: "Paylaşılır", description: "Mağazadan teslim alın ya da adrese gönderin." },
];

const CORPORATE_FEATURES = [
  { title: "Toplu sipariş", description: "Adetli siparişlerinizi önceden birlikte planlayalım." },
  { title: "Özel paketleme", description: "Sunumu kutlamaya göre birlikte belirleyelim." },
  { title: "Planlı teslimat", description: "Teslim gününü sizinle birlikte ayarlayalım." },
];

const giftProducts = catalogProducts.filter((p) => p.isGift).slice(0, 4);

export default function HediyeliklerPage() {
  return (
    <>
      <LandingHero
        eyebrow="Hediyelikler"
        title={
          <>
            Paylaşmaya değer
            <br />
            <em className="italic text-burgundy">lezzetler.</em>
          </>
        }
        description="Özel günlerden küçük teşekkürlere, Funda'nın seçilmiş lezzetlerini sevdiklerinizle paylaşın."
        primary={{ label: "Hediyeleri Keşfet", href: "#hediye-secimi" }}
        secondary={{ label: "Kurumsal Hediyeler", href: "#kurumsal" }}
        visual={{
          style: {
            background: "linear-gradient(150deg, #EFE2CE 0%, #D9C0A2 48%, #B98F72 100%)",
          },
          label: { kicker: "Funda 1959", title: "Hediye Seçkisi" },
        }}
      />

      <CategoryShowcase
        id="hediye-secimi"
        eyebrow="Seçkiler"
        title="Kime, ne için?"
        intro="Her düşüncenin bir karşılığı var. Nereden başlayacağınızı seçin."
        items={GIFT_CATEGORIES}
        columns={2}
        background="cream"
      />

      <FeaturedProductStrip
        eyebrow="Funda'dan Seçilenler"
        title="Hediye vermeye hazır seçkiler"
        subtitle="Kutulu çikolatalar ve paylaşımlık lezzetlerden bir seçki."
        products={giftProducts}
        action={{ label: "Tüm Hediyelikleri Gör", href: "/lezzetlerimiz/cikolatalar" }}
        background="cream-light"
      />

      <EditorialSteps
        eyebrow="Ne Zaman?"
        title={
          <>
            Küçük bir jestten
            <br />
            büyük kutlamalara.
          </>
        }
        steps={SCENARIOS}
        background="cream"
      />

      <EditorialSplit
        id="kurumsal"
        eyebrow="Kurumsal"
        title={
          <>
            Kurumsal hediyeler,
            <br />
            Funda özeniyle.
          </>
        }
        body="Çalışanlarınız, iş ortaklarınız ve özel davetleriniz için seçilmiş Funda lezzetleri. Özel taleplerinizi birlikte planlayalım."
        features={CORPORATE_FEATURES}
        cta={{ label: "Kurumsal Hediye Talebi Oluştur", href: "/iletisim" }}
        visual={{
          style: {
            background: "linear-gradient(150deg, #EEE4D3 0%, #DAC4A6 50%, #C09E86 100%)",
          },
          label: { kicker: "Funda 1959", title: "Kurumsal Seçkiler" },
        }}
        visualSide="left"
        background="cream-light"
      />

      <EditorialSteps
        eyebrow="Funda Dokunuşu"
        title="Hediyenin son dokunuşu."
        steps={GIFT_PROCESS}
        background="cream"
      />

      <EditorialSplit
        eyebrow="1959'dan Bugüne"
        title={
          <>
            1959&apos;dan beri
            <br />
            paylaşmanın bir parçası.
          </>
        }
        body="Funda'nın lezzetleri, yıllardır Ankara'da özel günlerin ve küçük teşekkürlerin eşlikçisi oldu."
        cta={{ label: "Hikâyemiz", href: "/hikayemiz" }}
        visual={{
          style: {
            background: "radial-gradient(120% 90% at 32% 20%, #F4E9DC 0%, #E7CAB9 46%, #CE9D8A 78%, #B47B6B 100%)",
          },
          label: { kicker: "Funda 1959", title: "1959" },
        }}
        visualSide="right"
        background="cream-light"
      />

      <BurgundyCTA
        eyebrow="Hediyelikler"
        title={
          <>
            Bir kutu lezzet,
            <br />
            güzel bir düşünce.
          </>
        }
        description="Sevdikleriniz için özenle hazırlanmış Funda seçkilerini keşfedin."
        primary={{ label: "Hediyelikleri Keşfet", href: "#hediye-secimi" }}
        secondary={{ label: "Mağazalarımızı Gör", href: "/subeler" }}
      />
    </>
  );
}
