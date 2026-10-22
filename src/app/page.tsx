import { HeroSection } from "@/components/home/HeroSection";
import { AddressBar } from "@/components/home/AddressBar";
import { resolveHeroSlides } from "@/lib/hero-media";
import { CampaignsSection, loadHomepageCampaigns } from "@/components/home/CampaignsSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CelebrationQuiz } from "@/components/landing/CelebrationQuiz";
import { BestSellers } from "@/components/home/BestSellers";
import { InstagramContentSection } from "@/components/home/InstagramContentSection";
import { allCatalogProducts } from "@/lib/data";
import { celebrationPool } from "@/lib/celebration-finder";
import { PricesProvider } from "@/lib/pricing/prices-context";
import { CatalogProvider } from "@/lib/catalog/catalog-context";
import { getStorefrontData } from "@/lib/catalog/server";

/**
 * Campaigns, prices (and social content) are read per request — from
 * Supabase when configured — so an admin edit shows up without a rebuild.
 */
export const dynamic = "force-dynamic";

/**
 * Fixed order: hero -> branch -> campaigns -> categories -> celebrations (the
 * cake finder, shared with /ozel-gun) -> best sellers -> social videos -> footer.
 */
export default async function HomePage() {
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  // independent reads, fetched together rather than one after the other
  const [{ prices, products, hidden }, campaigns] = await Promise.all([getStorefrontData(), loadHomepageCampaigns(new Date(nowMs))]);
  const cakePool = celebrationPool(allCatalogProducts());
  return (
    <>
      <HeroSection slides={resolveHeroSlides()} />
      <AddressBar />
      {/* header "Fırsatlar" target (no separate campaigns page yet) */}
      <div id="kampanyalar" className="scroll-mt-[68px] md:scroll-mt-[76px] lg:scroll-mt-[125px]">
        <CampaignsSection active={campaigns} nowMs={nowMs} />
      </div>
      <CategoryGrid />
      <CatalogProvider products={products} hidden={hidden}>
        <CelebrationQuiz products={cakePool} variant="section" />
        <PricesProvider prices={prices}>
          <BestSellers />
        </PricesProvider>
      </CatalogProvider>
      <InstagramContentSection />
    </>
  );
}
