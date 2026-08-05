import { Hero } from "@/components/home/Hero";
import { Moments } from "@/components/home/Moments";
import { Signature } from "@/components/home/Signature";
import { GiftBox } from "@/components/home/GiftBox";
import { Branches } from "@/components/home/Branches";
import { Story } from "@/components/home/Story";
import { Rituals } from "@/components/home/Rituals";
import { CtaBand } from "@/components/shared/CtaBand";
import { site } from "@/content/site";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Moments />
      <Signature />
      <GiftBox />
      <Branches />
      <Story />
      <Rituals />
      <CtaBand
        title="Bir sonraki tatlı anı birlikte planlayalım."
        description="Özel günlerden günlük küçük molalara kadar, Funda her tatlı ana eşlik eder."
        primary={{ href: "/iletisim", label: "Sipariş Ver" }}
        secondary={{ href: site.phoneHref, label: "Bizi Arayın", plain: true }}
      />
    </>
  );
}
