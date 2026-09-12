import { getHomepageCampaignPool, type Campaign } from "@/lib/campaigns";
import { resolvePublicAsset } from "@/lib/public-asset";
import { Container } from "@/components/shared/Container";
import { FadeIn } from "@/components/shared/FadeIn";
import { CampaignsCarousel, type CampaignWithImage } from "@/components/home/CampaignsCarousel";

/**
 * Image resolution — server-only (fs check via `resolvePublicAsset`), so it
 * lives here rather than in the client carousel. Priority:
 *   1. the admin-set `campaign.image`, if that file actually exists
 *   2. a project-wide default campaign visual, if one has been added
 *   3. a deterministic (never random) pick from real product photography,
 *      keyed off a keyword in the title/description
 */
const CAMPAIGN_DEFAULT_IMAGE = "/home/campaigns/default.webp";
const CAMPAIGN_FALLBACK_DEFAULT = "/products/yas-pastalar/yaspasta1.jpg";
const CAMPAIGN_FALLBACK_RULES: { keywords: string[]; image: string }[] = [
  { keywords: ["çikolata", "cikolata"], image: "/products/cikolatalar/cikolatalar1-detay.jpg" },
  { keywords: ["kahve", "kuru pasta", "kurabiye"], image: "/products/kuru-pastalar/kurupasta4.jpg" },
  {
    keywords: ["kutlama", "doğum günü", "dogum gunu", "özel gün", "ozel gun", "pasta"],
    image: "/products/adet-pastalar/adetpasta1.jpg",
  },
];

function fallbackImageFor(campaign: Pick<Campaign, "title" | "description">): string {
  const haystack = `${campaign.title} ${campaign.description}`.toLocaleLowerCase("tr");
  const rule = CAMPAIGN_FALLBACK_RULES.find((r) => r.keywords.some((k) => haystack.includes(k)));
  return rule?.image ?? CAMPAIGN_FALLBACK_DEFAULT;
}

function resolveCampaignImage(campaign: Campaign): string {
  return (
    resolvePublicAsset(campaign.image) ??
    resolvePublicAsset(CAMPAIGN_DEFAULT_IMAGE) ??
    fallbackImageFor(campaign)
  );
}

export function CampaignsSection() {
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const pool: CampaignWithImage[] = getHomepageCampaignPool(new Date(nowMs)).map((c) => ({
    ...c,
    resolvedImage: resolveCampaignImage(c),
  }));
  if (pool.length === 0) return null;

  return (
    <section className="bg-cream-light pb-10 md:pb-16">
      <Container>
        <FadeIn>
          <p className="mb-2 font-sans text-[12px] font-semibold tracking-[0.16em] uppercase text-burgundy/50">
            Sınırlı Süreli
          </p>
        </FadeIn>
        <FadeIn delay={100}>
          <h2 className="mb-6 font-serif text-[26px] font-medium leading-[1.12] text-burgundy md:mb-8 md:text-[32px]">
            Aktif Kampanyalar
          </h2>
        </FadeIn>

        <CampaignsCarousel pool={pool} nowMs={nowMs} />
      </Container>
    </section>
  );
}
