/**
 * Supabase-backed `CampaignRepository` — the real persistence path.
 *
 * Server-only (imports `supabase-server.ts`, which throws if it ever loads
 * in the browser). Never import this file from `campaigns/index.ts` or any
 * other module a "use client" file reaches — see `server-init.ts`.
 *
 * `listActive` pushes the date window to the DB (cheap, indexed-friendly)
 * but re-uses the exact same `isEligibleForBranch` predicate the in-memory
 * repository uses for branch filtering, so both repositories are guaranteed
 * to agree on "who sees this campaign" — that rule lives in one place.
 */

import type { Campaign, NewCampaignInput } from "./types";
import type { CampaignRepository } from "./repository";
import { isEligibleForBranch } from "./repository";
import { supabaseRest } from "../supabase-server";

const SELECT =
  "id,title,description,image,start_at,end_at,cta_label,cta_href,active,branch_ids,priority,created_at,updated_at";

type CampaignRow = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  start_at: string;
  end_at: string;
  cta_label: string | null;
  cta_href: string | null;
  active: boolean;
  branch_ids: string[];
  priority: number;
  created_at: string;
  updated_at: string;
};

function rowToCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    image: row.image ?? "",
    startAt: row.start_at,
    endAt: row.end_at,
    ctaLabel: row.cta_label ?? "",
    ctaHref: row.cta_href ?? "",
    active: row.active,
    branchIds: row.branch_ids.length === 1 && row.branch_ids[0] === "all" ? "all" : row.branch_ids,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Only includes keys actually present on `input`, so a partial patch stays partial. */
function inputToRow(input: Partial<NewCampaignInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.description !== undefined) row.description = input.description;
  if (input.image !== undefined) row.image = input.image;
  if (input.startAt !== undefined) row.start_at = input.startAt;
  if (input.endAt !== undefined) row.end_at = input.endAt;
  if (input.ctaLabel !== undefined) row.cta_label = input.ctaLabel;
  if (input.ctaHref !== undefined) row.cta_href = input.ctaHref;
  if (input.active !== undefined) row.active = input.active;
  if (input.branchIds !== undefined) {
    row.branch_ids = input.branchIds === "all" ? ["all"] : input.branchIds;
  }
  if (input.priority !== undefined) row.priority = input.priority;
  return row;
}

export class SupabaseCampaignRepository implements CampaignRepository {
  async list(): Promise<Campaign[]> {
    const rows = await supabaseRest<CampaignRow[]>(
      `/campaigns?select=${SELECT}&order=priority.asc,created_at.asc`,
    );
    return rows.map(rowToCampaign);
  }

  async get(id: string): Promise<Campaign | null> {
    const rows = await supabaseRest<CampaignRow[]>(
      `/campaigns?select=${SELECT}&id=eq.${encodeURIComponent(id)}&limit=1`,
    );
    return rows[0] ? rowToCampaign(rows[0]) : null;
  }

  async listActive(now: Date, branchId?: string | null): Promise<Campaign[]> {
    const iso = encodeURIComponent(now.toISOString());
    const rows = await supabaseRest<CampaignRow[]>(
      `/campaigns?select=${SELECT}&active=eq.true&start_at=lte.${iso}&end_at=gt.${iso}&order=priority.asc,start_at.desc`,
    );
    return rows.map(rowToCampaign).filter((c) => isEligibleForBranch(c, branchId ?? null));
  }

  async create(input: NewCampaignInput): Promise<Campaign> {
    const rows = await supabaseRest<CampaignRow[]>(`/campaigns`, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(inputToRow(input)),
    });
    return rowToCampaign(rows[0]);
  }

  async update(id: string, patch: Partial<NewCampaignInput>): Promise<Campaign | null> {
    const rows = await supabaseRest<CampaignRow[]>(`/campaigns?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(inputToRow(patch)),
    });
    return rows[0] ? rowToCampaign(rows[0]) : null;
  }

  async remove(id: string): Promise<boolean> {
    const rows = await supabaseRest<CampaignRow[]>(`/campaigns?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Prefer: "return=representation" },
    });
    return rows.length > 0;
  }
}
