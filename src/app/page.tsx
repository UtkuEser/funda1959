import { HeroSection } from "@/components/home/HeroSection";
import { AddressBar } from "@/components/home/AddressBar";
import { resolveHeroSlides } from "@/lib/hero-media";
import { CampaignsSection } from "@/components/home/CampaignsSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CelebrationQuiz } from "@/components/landing/CelebrationQuiz";
import { BestSellers } from "@/components/home/BestSellers";
import { InstagramContentSection } from "@/components/home/InstagramContentSection";
import { catalogProducts } from "@/lib/data";
import { celebrationPool } from "@/lib/celebration-finder";
import { PricesProvider } from "@/lib/pricing/prices-context";
import { getDisplayPriceMap } from "@/lib/pricing/prices-server";

/**
 * Campaigns, prices (and social content) are read per request — from
 * Supabase when configured — so an admin edit shows up without a rebuild.
 */
export const dynamic = "force-dynamic";

const cakePool = celebrationPool(catalogProducts);

/**
 * Fixed order: hero -> branch -> campaigns -> categories -> celebrations (the
 * cake finder, shared with /ozel-gun) -> best sellers -> social videos -> footer.
 */
export default async function HomePage() {
  const prices = await getDisplayPriceMap();
  return (
    <>
      <HeroSection slides={resolveHeroSlides()} />
      <AddressBar />
      {/* header "Fırsatlar" target (no separate campaigns page yet) */}
      <div id="kampanyalar" className="scroll-mt-[68px] md:scroll-mt-[76px] lg:scroll-mt-[125px]">
        <CampaignsSection />
      </div>
      <CategoryGrid />
      <CelebrationQuiz products={cakePool} variant="section" />
      <PricesProvider prices={prices}>
        <BestSellers />
      </PricesProvider>
      <InstagramContentSection />
    </>
  );
}
