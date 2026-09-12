/**
 * Campaign repository abstraction.
 *
 * The interface is async — real persistence (Supabase, over the network)
 * can't be synchronous, so every method returns a Promise even though the
 * in-memory fallback below resolves them instantly. `getCampaignRepository()`
 * defaults to the in-memory mock; `campaigns/server-init.ts` swaps in the
 * Supabase-backed implementation when Supabase is configured (see that file
 * for why the swap happens there and not in this one).
 */

import type { Campaign, NewCampaignInput } from "./types";
import { CAMPAIGN_SEED } from "./mock";

export interface CampaignRepository {
  /** every campaign, priority ASC then createdAt ASC */
  list(): Promise<Campaign[]>;
  get(id: string): Promise<Campaign | null>;
  /** active + within window + branch-eligible, sorted priority ASC then startAt DESC */
  listActive(now: Date, branchId?: string | null): Promise<Campaign[]>;
  create(input: NewCampaignInput): Promise<Campaign>;
  update(id: string, patch: Partial<NewCampaignInput>): Promise<Campaign | null>;
  remove(id: string): Promise<boolean>;
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
 *
 * Exported so `SupabaseCampaignRepository` applies the exact same rule
 * after its DB-side date filter, instead of re-implementing it.
 */
export function isEligibleForBranch(campaign: Campaign, branchId?: string | null): boolean {
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

  async list(): Promise<Campaign[]> {
    return [...this.rows.values()].sort(
      (a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt),
    );
  }

  async get(id: string): Promise<Campaign | null> {
    return this.rows.get(id) ?? null;
  }

  async listActive(now: Date, branchId?: string | null): Promise<Campaign[]> {
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

  async create(input: NewCampaignInput): Promise<Campaign> {
    const nowISO = new Date().toISOString();
    const campaign: Campaign = { ...input, id: makeId(), createdAt: nowISO, updatedAt: nowISO };
    this.rows.set(campaign.id, campaign);
    return campaign;
  }

  async update(id: string, patch: Partial<NewCampaignInput>): Promise<Campaign | null> {
    const cur = this.rows.get(id);
    if (!cur) return null;
    const next: Campaign = { ...cur, ...patch, updatedAt: new Date().toISOString() };
    this.rows.set(id, next);
    return next;
  }

  async remove(id: string): Promise<boolean> {
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
