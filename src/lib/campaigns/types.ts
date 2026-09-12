/**
 * Campaign domain — homepage "Aktif Kampanyalar" content.
 *
 * A campaign is pure content + a time window; it carries no price/discount
 * logic and never touches stock, slots or orders. `branchIds: "all"` targets
 * every branch; a string[] targets only those branch ids.
 */

export type CampaignBranchTarget = "all" | string[];

export type Campaign = {
  id: string;
  title: string;
  description: string;
  image: string;
  /** ISO instant, e.g. "2026-09-12T00:00:00+03:00" */
  startAt: string;
  /** ISO instant */
  endAt: string;
  ctaLabel: string;
  /** internal ("/lezzetlerimiz/...") or external ("https://..."); empty = no CTA */
  ctaHref: string;
  active: boolean;
  branchIds: CampaignBranchTarget;
  priority: number;
  createdAt: string;
  updatedAt: string;
};

export type CampaignStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED";

export type NewCampaignInput = Omit<Campaign, "id" | "createdAt" | "updatedAt">;
