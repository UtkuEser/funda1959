import { INSTAGRAM_CONTENT, selectInstagramCards } from "@/lib/social";
import { resolvePublicAsset } from "@/lib/public-asset";
import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SocialVideoRail } from "./SocialVideoRail";

/**
 * Social videos — the hand-managed list in lib/social/instagram-content.ts
 * (D42). Server side: an entry is shown only when its poster file exists, so
 * the client never renders a broken image. No real entry -> no section; there
 * are no placeholder posters or sample entries.
 */
export function InstagramContentSection() {
  const items = selectInstagramCards(INSTAGRAM_CONTENT, (path) => resolvePublicAsset(path) !== null);
  if (items.length === 0) return null;

  return (
    <section aria-label="Videolar" className="bg-cream-light py-14 md:py-20">
      <Container>
        <SectionHeader
          centered={false}
          eyebrow="Sosyal Medya"
          title="Funda'dan videolar"
          subtitle="Vitrinden, atölyeden ve kutlamalardan kısa anlar."
        />
        <SocialVideoRail items={items} />
      </Container>
    </section>
  );
}
