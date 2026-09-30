import "@/lib/campaigns/server-init";
import { getHomepageCampaignPool, type Campaign } from "@/lib/campaigns";
import { publicImageSize, resolvePublicAsset } from "@/lib/public-asset";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { CampaignShowcase, type CampaignWithImage } from "@/components/home/CampaignShowcase";

/**
 * Image resolution — server-only (fs check via `resolvePublicAsset`, pixel
 * size via `publicImageSize`), so it lives here rather than in the client
 * carousel. Priority:
 *   1. the admin-set `campaign.image`, if that file actually exists
 *   2. a project-wide default campaign visual, if one has been added
 *   3. a deterministic (never random) pick from real product photography,
 *      keyed off a keyword in the title/description
 */
const CAMPAIGN_DEFAULT_IMAGE = "/home/campaigns/default.webp";

type ResolvedImage = { src: string; position: string };

/**
 * Fallback photography with a focal point each: the cards show every image in
 * the same 4:3 frame, and these square studio shots keep their tops (lattice,
 * strawberry) only when the crop leans upward.
 */
const CAMPAIGN_FALLBACK_DEFAULT: ResolvedImage = { src: "/products/adet-pastalar/adetpasta10.jpg", position: "50% 32%" };
const CAMPAIGN_FALLBACK_RULES: { keywords: string[]; image: ResolvedImage }[] = [
  { keywords: ["çikolata", "cikolata"], image: { src: "/products/cikolatalar/cikolatalar1-detay.jpg", position: "50% 55%" } },
  { keywords: ["kahve", "kuru pasta", "kurabiye"], image: { src: "/products/kuru-pastalar/kurupasta4.jpg", position: "50% 50%" } },
  {
    keywords: ["kutlama", "doğum günü", "dogum gunu", "özel gün", "ozel gun", "pasta"],
    image: { src: "/products/adet-pastalar/adetpasta4.jpg", position: "50% 38%" },
  },
];

function fallbackImageFor(campaign: Pick<Campaign, "title" | "description">): ResolvedImage {
  const haystack = `${campaign.title} ${campaign.description}`.toLocaleLowerCase("tr");
  const rule = CAMPAIGN_FALLBACK_RULES.find((r) => r.keywords.some((k) => haystack.includes(k)));
  return rule?.image ?? CAMPAIGN_FALLBACK_DEFAULT;
}

function resolveCampaignImage(campaign: Campaign): ResolvedImage {
  const own = resolvePublicAsset(campaign.image) ?? resolvePublicAsset(CAMPAIGN_DEFAULT_IMAGE);
  return own ? { src: own, position: "50% 50%" } : fallbackImageFor(campaign);
}

export async function CampaignsSection() {
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const active = await getHomepageCampaignPool(new Date(nowMs));
  const pool: CampaignWithImage[] = active.map((c) => {
    const image = resolveCampaignImage(c);
    // real pixel size -> the carousel frames the visual at its own aspect ratio
    const size = publicImageSize(image.src);
    return { ...c, resolvedImage: image.src, imagePosition: image.position, imageSize: size };
  });
  if (pool.length === 0) return null;

  // no Supabase store -> the in-memory seed (campaigns/mock.ts) is serving
  return <CampaignShowcase pool={pool} nowMs={nowMs} isSample={!isSupabaseConfigured()} />;
}
