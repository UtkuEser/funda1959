import type { Metadata } from "next";
import { catalogProducts } from "@/lib/data";
import { CelebrationQuiz } from "@/components/landing/CelebrationQuiz";
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

// Candidate pool for the recommendation quiz — celebration cakes only.
const quizPool = catalogProducts.filter(
  (p) =>
    p.categorySlug === "yas-pastalar" ||
    p.categorySlug === "ozel-gun" ||
    p.isSpecialOccasion ||
    (p.occasions?.length ?? 0) > 0,
);

export default function OzelGunPage() {
  return (
    <>
      {/* CelebrationQuiz is this page's hero and primary discovery mechanism */}
      <CelebrationQuiz products={quizPool} />

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
