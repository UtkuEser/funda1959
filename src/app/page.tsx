import { HeroSection } from "@/components/home/HeroSection";
import { resolveHeroSlides } from "@/lib/hero-media";
import { CampaignsSection } from "@/components/home/CampaignsSection";
import { CelebrationsSection } from "@/components/home/CelebrationsSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { BrandStoryTeaser } from "@/components/home/BrandStoryTeaser";
import { InstagramContentSection } from "@/components/home/InstagramContentSection";
import { GiftSelectionSection } from "@/components/home/GiftSelectionSection";
import { BranchesSection } from "@/components/home/BranchesSection";

export default function HomePage() {
  return (
    <>
      <HeroSection slides={resolveHeroSlides()} />
      <CampaignsSection />
      <CelebrationsSection />
      <FeaturedProducts />
      <CategoryGrid />
      <BrandStoryTeaser />
      <InstagramContentSection />
      <GiftSelectionSection />
      <BranchesSection />
    </>
  );
}
