/**
 * Campaign repository abstraction.
 *
 * Same shape as `orders/repository.ts` / `reservations/index.ts`: an
 * in-memory store kept on `globalThis` (shared by a Route Handler and a
 * Server Component in the same process), behind an interface a
 * Supabase-backed implementation can drop into later via
 * `setCampaignRepository()`.
 */

import type { Campaign, NewCampaignInput } from "./types";
import { CAMPAIGN_SEED } from "./mock";

export interface CampaignRepository {
  /** every campaign, priority ASC then createdAt ASC */
  list(): Campaign[];
  get(id: string): Campaign | null;
  /** active + within window + branch-eligible, sorted priority ASC then startAt DESC */
  listActive(now: Date, branchId?: string | null): Campaign[];
  create(input: NewCampaignInput): Campaign;
  update(id: string, patch: Partial<NewCampaignInput>): Campaign | null;
  remove(id: string): boolean;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `cmp_${crypto.randomUUID()}`;
  }
  return `cmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Branch eligibility for a resolved viewer. When `branchId` is null the
 * caller hasn't resolved a delivery branch yet — every campaign is a
 * candidate then (branch-specific ones just carry a "GOP & Panora'da
 * geçerli" style label so the visitor knows before it applies to them).
 * Once a branch is known, only "all" + that branch's campaigns qualify.
 */
function isEligibleForBranch(campaign: Campaign, branchId?: string | null): boolean {
  if (campaign.branchIds === "all") return true;
  if (!branchId) return true;
  return campaign.branchIds.includes(branchId);
}

const globalStore = globalThis as unknown as { __fundaCampaigns?: Map<string, Campaign> };

class InMemoryCampaignRepository implements CampaignRepository {
  private readonly rows: Map<string, Campaign>;

  constructor() {
    globalStore.__fundaCampaigns ??= new Map(CAMPAIGN_SEED.map((c) => [c.id, c]));
    this.rows = globalStore.__fundaCampaigns;
  }

  list(): Campaign[] {
    return [...this.rows.values()].sort(
      (a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt),
    );
  }

  get(id: string): Campaign | null {
    return this.rows.get(id) ?? null;
  }

  listActive(now: Date, branchId?: string | null): Campaign[] {
    const t = now.getTime();
    return [...this.rows.values()]
      .filter(
        (c) =>
          c.active &&
          new Date(c.startAt).getTime() <= t &&
          t < new Date(c.endAt).getTime() &&
          isEligibleForBranch(c, branchId),
      )
      .sort((a, b) => a.priority - b.priority || b.startAt.localeCompare(a.startAt));
  }

  create(input: NewCampaignInput): Campaign {
    const nowISO = new Date().toISOString();
    const campaign: Campaign = { ...input, id: makeId(), createdAt: nowISO, updatedAt: nowISO };
    this.rows.set(campaign.id, campaign);
    return campaign;
  }

  update(id: string, patch: Partial<NewCampaignInput>): Campaign | null {
    const cur = this.rows.get(id);
    if (!cur) return null;
    const next: Campaign = { ...cur, ...patch, updatedAt: new Date().toISOString() };
    this.rows.set(id, next);
    return next;
  }

  remove(id: string): boolean {
    return this.rows.delete(id);
  }
}

let repo: CampaignRepository = new InMemoryCampaignRepository();

export function setCampaignRepository(next: CampaignRepository): void {
  repo = next;
}
export function getCampaignRepository(): CampaignRepository {
  return repo;
}
