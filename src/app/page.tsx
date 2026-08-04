import { HeroSection } from "@/components/home/HeroSection";
import { BrandStoryTeaser } from "@/components/home/BrandStoryTeaser";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { SpecialOccasionSection } from "@/components/home/SpecialOccasionSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BranchesSection } from "@/components/home/BranchesSection";
import { InstagramSection } from "@/components/home/InstagramSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <BrandStoryTeaser />
      <CategoryGrid />
      <SpecialOccasionSection />
      <FeaturedProducts />
      <BranchesSection />
      <InstagramSection />
    </>
  );
}
