"use client";

/**
 * Client half of the homepage campaigns: it needs the visitor's branch (known
 * only in the browser). `CampaignsSection` (server) fetches the active pool,
 * resolves images and measures them; this narrows it by branch and shows the
 * campaigns as a horizontal carousel of identical cards — 3 across on
 * desktop, 2 on tablets, 1 on phones. No campaigns for the branch -> no section.
 *
 * Carousel behaviour: advances one card every 5 s with a smooth scroll and
 * wraps at the end; stops while hovered, while keyboard focus is inside,
 * while the visitor is interacting (touch / wheel / keys), while the tab is
 * hidden, and when paused with the button. With prefers-reduced-motion it
 * never auto-advances. Phones swipe natively (scroll-snap).
 */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { campaignBranchLabel, campaignDurationLabel, selectHomepageCampaigns, type Campaign } from "@/lib/campaigns";
import { useDelivery } from "@/lib/delivery/context";
import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SampleDataNote } from "@/components/delivery/SampleDataNote";

export type CampaignWithImage = Campaign & {
  resolvedImage: string;
  imagePosition: string;
  /** intrinsic pixel size of `resolvedImage`, when it could be read */
  imageSize: { width: number; height: number } | null;
};

const AUTOPLAY_MS = 5000;
/** how long after the last touch / wheel / key the carousel stays still */
const INTERACTION_PAUSE_MS = 3000;

const CARD_CLASS =
  "group flex h-full flex-col overflow-hidden rounded-2xl border border-sand-light bg-white/50";

/* -------------------------------------------------------------------------- */

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/**
 * One frame for every card: the tallest aspect ratio among the visuals, so
 * none is ever cropped (the campaign posters share one ratio, so they fill it
 * exactly; anything else is letterboxed, never stretched).
 */
function frameRatio(campaigns: CampaignWithImage[]): string {
  const tallest = campaigns
    .map((c) => c.imageSize)
    .filter((s): s is { width: number; height: number } => Boolean(s && s.width > 0 && s.height > 0))
    .sort((a, b) => b.height / b.width - a.height / a.width)[0];
  return tallest ? `${tallest.width} / ${tallest.height}` : "4 / 5";
}

/* -------------------------------------------------------------------------- */

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={dir === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

const CONTROL =
  "grid h-11 w-11 place-items-center rounded-full border border-sand bg-cream-light text-burgundy transition-colors hover:border-burgundy/40 hover:bg-burgundy/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40";

/**
 * Same anatomy for every card: the visual in the shared frame, then a footer
 * pinned to the bottom. A poster (the visual already carries the campaign's
 * words) gets only the link — the title isn't repeated; its words become the
 * image's alt text. Other visuals keep meta, title and description.
 */
function CampaignCard({ campaign, now, ratio }: { campaign: CampaignWithImage; now: Date; ratio: string }) {
  const branch = campaignBranchLabel(campaign);
  const hasLink = campaign.ctaHref.trim().length > 0;
  const external = /^https?:\/\//.test(campaign.ctaHref);
  const poster = Boolean(campaign.imageHasText);

  const cta = hasLink && (
    <span className="inline-flex items-center gap-1.5 border-b border-burgundy/25 pb-0.5 font-sans text-[14px] font-semibold text-burgundy transition-colors group-hover:border-burgundy">
      {campaign.ctaLabel}
      <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
        →
      </span>
    </span>
  );

  const body = (
    <>
      <div className="relative w-full shrink-0 bg-cream" style={{ aspectRatio: ratio }}>
        <Image
          src={campaign.resolvedImage}
          alt={poster ? `${campaign.title}. ${campaign.description}` : ""}
          fill
          draggable={false}
          sizes="(min-width: 1024px) 420px, (min-width: 768px) 50vw, 100vw"
          className="object-contain"
        />
      </div>
      {poster ? (
        <div className="mt-auto flex items-center justify-between gap-3 px-5 py-4">
          {cta}
          {branch && <span className="font-sans text-[12px] text-taupe">{branch}</span>}
        </div>
      ) : (
        <div className="flex flex-1 flex-col p-5 md:p-6">
          <p className="font-sans text-[12px] text-taupe">
            {campaignDurationLabel(campaign, now)}
            {branch && <> · {branch}</>}
          </p>
          <h3 className="mt-2 font-serif text-[21px] font-semibold leading-snug text-burgundy md:text-[22px]">
            {campaign.title}
          </h3>
          <p className="mt-1.5 font-sans text-[14.5px] leading-relaxed text-warm-brown">{campaign.description}</p>
          {cta && <span className="mt-auto self-start pt-5">{cta}</span>}
        </div>
      )}
    </>
  );

  if (!hasLink) return <article className={CARD_CLASS}>{body}</article>;
  const linkClass = `${CARD_CLASS} transition-colors hover:border-burgundy/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40`;
  return external ? (
    <a href={campaign.ctaHref} target="_blank" rel="noopener noreferrer" className={linkClass} draggable={false}>
      {body}
    </a>
  ) : (
    <Link href={campaign.ctaHref} className={linkClass} draggable={false}>
      {body}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */

export function CampaignShowcase({
  pool,
  nowMs,
  isSample,
}: {
  pool: CampaignWithImage[];
  nowMs: number;
  /** content comes from the design-phase seed, not a real campaign store */
  isSample: boolean;
}) {
  const { context, isResolved } = useDelivery();
  const branchId = isResolved ? context.branchId : null;
  const campaigns = useMemo(() => selectHomepageCampaigns(pool, branchId), [pool, branchId]);
  const now = useMemo(() => new Date(nowMs), [nowMs]);
  const ratio = useMemo(() => frameRatio(campaigns), [campaigns]);

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [layout, setLayout] = useState<{ visible: number; max: number } | null>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const reducedMotion = useReducedMotion();
  const interactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollFrame = useRef(0);

  /** distance between two card starts, and how many cards fit */
  const measure = useCallback(() => {
    const track = trackRef.current;
    const items = track ? (Array.from(track.children) as HTMLElement[]) : [];
    if (!track || items.length === 0) return null;
    const step = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : track.clientWidth;
    const gap = step - items[0].offsetWidth;
    const visible = Math.max(1, Math.min(items.length, Math.round((track.clientWidth + gap) / step)));
    return { step, visible, max: items.length - visible };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const m = measure();
      if (!m) return;
      setLayout({ visible: m.visible, max: m.max });
      setIndex((i) => Math.min(i, m.max));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(track);
    return () => ro.disconnect();
  }, [measure, campaigns.length]);

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(
    () => () => {
      if (interactTimer.current) clearTimeout(interactTimer.current);
      cancelAnimationFrame(scrollFrame.current);
    },
    [],
  );

  const onScroll = () => {
    cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = requestAnimationFrame(() => {
      const track = trackRef.current;
      const m = measure();
      if (!track || !m) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      setIndex(atEnd ? m.max : Math.max(0, Math.min(m.max, Math.round(track.scrollLeft / m.step))));
    });
  };

  /** scroll to position i (wrapping past either end) */
  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      const m = measure();
      if (!track || !m) return;
      const positions = m.max + 1;
      const target = ((i % positions) + positions) % positions;
      track.scrollTo({ left: target * m.step, behavior: reducedMotion ? "auto" : "smooth" });
    },
    [measure, reducedMotion],
  );

  const markInteraction = () => {
    setInteracting(true);
    if (interactTimer.current) clearTimeout(interactTimer.current);
    interactTimer.current = setTimeout(() => setInteracting(false), INTERACTION_PAUSE_MS);
  };

  const max = layout?.max ?? Math.max(0, campaigns.length - 1);
  const canAutoplay = !reducedMotion && max > 0;
  const running = canAutoplay && !userPaused && !hovered && !focused && !interacting && !pageHidden;

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => goTo(index >= max ? 0 : index + 1), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [running, index, max, goTo]);

  if (campaigns.length === 0) return null;

  const visible = layout?.visible ?? 1;
  const shownTo = Math.min(campaigns.length, index + visible);

  const controls =
    max > 0 ? (
      <div className="flex items-center gap-2">
        {canAutoplay && (
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-label={userPaused ? "Otomatik geçişi başlat" : "Otomatik geçişi durdur"}
            className={CONTROL}
          >
            {userPaused ? (
              <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13a.6.6 0 00.9.5l10.2-6.5a.6.6 0 000-1L8.9 5a.6.6 0 00-.9.5z" />
              </svg>
            ) : (
              <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6.5" y="5" width="3.6" height="14" rx="1" />
                <rect x="13.9" y="5" width="3.6" height="14" rx="1" />
              </svg>
            )}
          </button>
        )}
        <button type="button" onClick={() => goTo(index - 1)} aria-label="Önceki kampanya" aria-controls="campaign-track" className={CONTROL}>
          <Arrow dir="prev" />
        </button>
        <button type="button" onClick={() => goTo(index + 1)} aria-label="Sonraki kampanya" aria-controls="campaign-track" className={CONTROL}>
          <Arrow dir="next" />
        </button>
      </div>
    ) : null;

  return (
    <section aria-roledescription="carousel" aria-label="Kampanyalar" className="bg-cream-light pb-14 pt-4 md:pb-20 md:pt-6">
      <Container>
        <div
          ref={rootRef}
          onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={(e) => (e.target as HTMLElement).matches(":focus-visible") && setFocused(true)}
          onBlur={(e) => {
            if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setFocused(false);
          }}
          onPointerDown={markInteraction}
          onWheel={markInteraction}
          onKeyDown={markInteraction}
        >
          <SectionHeader
            centered={false}
            eyebrow="Kampanyalar"
            title="Bu dönem Funda'da"
            subtitle="Şubelerimizdeki güncel seçkiler ve kutlama önerileri."
            aside={controls}
          />

          <p className="sr-only" aria-live={running ? "off" : "polite"} aria-atomic="true">
            {visible > 1 ? `${index + 1}–${shownTo}` : index + 1}. kampanya gösteriliyor, toplam {campaigns.length}
          </p>

          {/* equal cards; the row stretches, so every card is the same height */}
          <div
            ref={trackRef}
            id="campaign-track"
            onScroll={onScroll}
            className="-mx-1 -my-2 flex snap-x snap-mandatory scroll-px-1 gap-5 overflow-x-auto overscroll-x-contain scroll-smooth px-1 py-2 [scrollbar-width:none] motion-reduce:scroll-auto lg:gap-6 [&::-webkit-scrollbar]:hidden"
          >
            {campaigns.map((c, i) => (
              <div
                key={c.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${campaigns.length}`}
                className="w-full shrink-0 snap-start md:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3rem)/3)]"
              >
                <CampaignCard campaign={c} now={now} ratio={ratio} />
              </div>
            ))}
          </div>

          {/* position dots — one per scroll position */}
          <div className="mt-5 flex h-6 items-center justify-center gap-1">
            {layout &&
              max > 0 &&
              Array.from({ length: max + 1 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${i + 1}. kampanyaya git`}
                  aria-current={i === index ? "true" : undefined}
                  className="group/dot grid h-6 w-6 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40"
                >
                  <span
                    aria-hidden
                    className={`block h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                      i === index ? "w-5 bg-burgundy" : "w-1.5 bg-sand group-hover/dot:bg-burgundy/40"
                    }`}
                  />
                </button>
              ))}
          </div>
        </div>
        <SampleDataNote show={isSample} about="kampanya süreleri ve bağlantıları" className="mt-3" />
      </Container>
    </section>
  );
}
