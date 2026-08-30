import { HeroSection } from "@/components/home/HeroSection";
import { CelebrationsSection } from "@/components/home/CelebrationsSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { BrandStoryTeaser } from "@/components/home/BrandStoryTeaser";
import { GiftSelectionSection } from "@/components/home/GiftSelectionSection";
import { BranchesSection } from "@/components/home/BranchesSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CelebrationsSection />
      <FeaturedProducts />
      <CategoryGrid />
      <BrandStoryTeaser />
      <GiftSelectionSection />
      <BranchesSection />
    </>
  );
}
