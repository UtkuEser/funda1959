import { Hero } from "@/components/home/Hero";
import { WhatsInside } from "@/components/home/WhatsInside";
import { SignatureSection } from "@/components/home/SignatureSection";
import { GiftSection } from "@/components/home/GiftSection";
import { BranchesPreview } from "@/components/home/BranchesPreview";
import { StorySection } from "@/components/home/StorySection";
import { JournalSection } from "@/components/home/JournalSection";
import { CtaBand } from "@/components/shared/CtaBand";
import { site } from "@/content/site";

export default function HomePage() {
  return (
    <>
      <Hero />
      <WhatsInside />
      <SignatureSection />
      <GiftSection />
      <BranchesPreview />
      <StorySection />
      <JournalSection />
      <CtaBand
        eyebrow="Funda’da Buluşalım"
        title="Bir sonraki tatlı anı birlikte planlayalım."
        description="Özel günlerden günlük küçük molalara kadar, Funda her tatlı ana eşlik eder."
        primary={{ href: "/iletisim", label: "Sipariş Ver" }}
        secondary={{ href: site.phoneHref, label: "Bizi Arayın", plain: true }}
      />
    </>
  );
}
