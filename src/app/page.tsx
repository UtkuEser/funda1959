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

/**
 * Campaigns now read from Supabase (see `lib/campaigns`), so this route must
 * not be statically prerendered at build time — an admin edit would never
 * show up. `CampaignsSection`'s Supabase reads already use `no-store`, which
 * would force this anyway; this is the explicit version of the same thing,
 * matching the pattern already used by `/admin`.
 */
export const dynamic = "force-dynamic";

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
