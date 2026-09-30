import { getInstagramContentRepository } from "@/lib/social";
import { resolvePublicAsset } from "@/lib/public-asset";
import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SocialVideoRail, type SocialVideoItem } from "./SocialVideoRail";

const VIDEO_SLOTS = 5;

/**
 * PLACEHOLDER posters (existing Funda photography), used only while an
 * entry's own poster file is missing. Each has a focal point so the 9:16 crop
 * keeps the subject.
 */
const PLACEHOLDER_POSTERS: { src: string; position: string }[] = [
  { src: "/home/hero/2.png", position: "72% 50%" },
  { src: "/home/hero/3.png", position: "50% 45%" },
  { src: "/home/hero/1.png", position: "60% 40%" },
  { src: "/products/yas-pastalar/yaspasta2.jpg", position: "50% 50%" },
  { src: "/products/kekler/kekler3.jpg", position: "50% 50%" },
];

/**
 * Social videos — the admin-managed content list (lib/social). Server side:
 * checks which video/poster files actually exist, so the client never renders
 * a broken player.
 */
export function InstagramContentSection() {
  const items: SocialVideoItem[] = getInstagramContentRepository()
    .listPublished()
    .slice(0, VIDEO_SLOTS)
    .map((item, i) => {
      const poster = resolvePublicAsset(item.posterImage);
      const placeholder = PLACEHOLDER_POSTERS[i % PLACEHOLDER_POSTERS.length];
      return {
        id: item.id,
        title: item.title ?? "Funda 1959",
        poster: poster ?? placeholder.src,
        posterPosition: poster ? "50% 50%" : placeholder.position,
        video: resolvePublicAsset(item.videoUrl),
      };
    });
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
