import { HeroSection } from "@/components/home/HeroSection";
import { AddressBar } from "@/components/home/AddressBar";
import { resolveHeroSlides } from "@/lib/hero-media";
import { CampaignsSection, loadHomepageCampaigns } from "@/components/home/CampaignsSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { CustomCakeRequestSection } from "@/components/home/CustomCakeRequestSection";
import { BestSellers } from "@/components/home/BestSellers";
import { InstagramContentSection } from "@/components/home/InstagramContentSection";
import { isContactFormOpen } from "@/lib/contact/config";
import { PricesProvider } from "@/lib/pricing/prices-context";
import { CatalogProvider } from "@/lib/catalog/catalog-context";
import { getStorefrontData } from "@/lib/catalog/server";

/**
 * Campaigns, prices (and social content) are read per request — from
 * Supabase when configured — so an admin edit shows up without a rebuild.
 */
export const dynamic = "force-dynamic";

/**
 * Fixed order: hero -> branch -> campaigns -> categories -> custom cake request
 * form -> best sellers -> social videos -> footer. (The cake finder stays on
 * /ozel-gun.)
 */
export default async function HomePage() {
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  // independent reads, fetched together rather than one after the other
  const [{ prices, products, hidden }, campaigns] = await Promise.all([getStorefrontData(), loadHomepageCampaigns(new Date(nowMs))]);
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
        {/* same gate as the /iletisim form: open on test data, closed on Production */}
        <CustomCakeRequestSection open={isContactFormOpen()} />
        <PricesProvider prices={prices}>
          <BestSellers />
        </PricesProvider>
      </CatalogProvider>
      <InstagramContentSection />
    </>
  );
}
