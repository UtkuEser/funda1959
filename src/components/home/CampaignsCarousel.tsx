"use client";

/**
 * Client half of the homepage campaign section — the piece that needs the
 * visitor's live delivery branch (from `DeliveryContext`, session-scoped and
 * only known in the browser). `CampaignsSection` (server) fetches the full
 * active-campaign pool and pre-resolves each image on disk; this component
 * only filters that pool by branch and renders it, so admin edits still
 * reach the page purely through the server fetch, not through this file.
 */

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  campaignBranchLabel,
  campaignDurationLabel,
  selectHomepageCampaigns,
  type Campaign,
} from "@/lib/campaigns";
import { useDelivery } from "@/lib/delivery/context";
import { FadeIn } from "@/components/shared/FadeIn";

export type CampaignWithImage = Campaign & { resolvedImage: string };

const GRID_COLS_BY_COUNT: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

function CampaignCard({
  campaign,
  index,
  now,
}: {
  campaign: CampaignWithImage;
  index: number;
  now: Date;
}) {
  const durationLabel = campaignDurationLabel(campaign, now);
  const branchLabel = campaignBranchLabel(campaign);
  const isExternal = /^https?:\/\//.test(campaign.ctaHref);
  const hasCta = campaign.ctaHref.trim().length > 0;

  return (
    <FadeIn
      delay={([0, 100, 200, 300] as const)[index] ?? 0}
      className="w-[84vw] shrink-0 snap-start sm:w-[46%] lg:w-auto lg:shrink"
    >
      <article className="group h-full overflow-hidden rounded-xl border border-sand-light bg-cream-light transition-colors duration-300 hover:border-burgundy/25">
        <div className="relative aspect-[8/5] overflow-hidden bg-cream-dark">
          <Image
            src={campaign.resolvedImage}
            alt={campaign.title}
            fill
            loading="lazy"
            sizes="(max-width: 1024px) 84vw, 320px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span className="absolute left-3.5 top-3.5 rounded-full bg-cream-light/90 px-2.5 py-1 font-sans text-[11px] font-semibold text-burgundy">
            {durationLabel}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-serif text-[19px] font-medium text-burgundy leading-snug">
            {campaign.title}
          </h3>
          {branchLabel && (
            <p className="mt-1 font-sans text-[11px] font-medium uppercase tracking-[0.05em] text-warm-brown/60">
              {branchLabel}
            </p>
          )}
          <p className="mt-1 font-sans text-[14px] text-warm-brown leading-relaxed">
            {campaign.description}
          </p>
          {hasCta &&
            (isExternal ? (
              <a
                href={campaign.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 font-sans text-[13.5px] font-semibold text-burgundy border-b border-burgundy/20 pb-0.5 transition-colors hover:border-burgundy"
              >
                {campaign.ctaLabel}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
            ) : (
              <Link
                href={campaign.ctaHref}
                className="mt-2.5 inline-flex items-center gap-1.5 font-sans text-[13.5px] font-semibold text-burgundy border-b border-burgundy/20 pb-0.5 transition-colors hover:border-burgundy"
              >
                {campaign.ctaLabel}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            ))}
        </div>
      </article>
    </FadeIn>
  );
}

export function CampaignsCarousel({ pool, nowMs }: { pool: CampaignWithImage[]; nowMs: number }) {
  const { context, isResolved } = useDelivery();
  const branchId = isResolved ? context.branchId : null;

  const campaigns = useMemo(() => selectHomepageCampaigns(pool, branchId), [pool, branchId]);
  const now = useMemo(() => new Date(nowMs), [nowMs]);

  if (campaigns.length === 0) return null;
  const gridColsClass = GRID_COLS_BY_COUNT[campaigns.length] ?? GRID_COLS_BY_COUNT[4];

  return (
    <div
      className={`-mx-5 flex gap-4 overflow-x-auto px-5 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:gap-6 lg:overflow-visible lg:px-0 ${gridColsClass}`}
    >
      {campaigns.map((campaign, index) => (
        <CampaignCard key={campaign.id} campaign={campaign} index={index} now={now} />
      ))}
    </div>
  );
}
