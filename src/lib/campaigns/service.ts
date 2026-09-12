/**
 * Campaign business rules: Istanbul-timezone date handling, status/duration
 * labels for the UI, homepage selection (max 4, deterministic order) and
 * admin-form validation. Pure functions — no storage, no React.
 */

import type { Campaign, CampaignStatus, NewCampaignInput } from "./types";
import { getCampaignRepository } from "./repository";
import { getBranch } from "../branch";

const ISTANBUL_TZ = "Europe/Istanbul";
/** Turkey has used a fixed UTC+3 offset (no DST) since 2016. */
const ISTANBUL_OFFSET = "+03:00";

const pad2 = (n: number) => String(n).padStart(2, "0");

function istanbulParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ISTANBUL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/** Current Istanbul wall-clock date/time, independent of the server's own timezone. */
export function nowInIstanbul(now: Date = new Date()): { date: string; time: string } {
  const p = istanbulParts(now);
  return { date: `${p.year}-${pad2(p.month)}-${pad2(p.day)}`, time: `${pad2(p.hour)}:${pad2(p.minute)}` };
}

/** Combine admin-form "YYYY-MM-DD" + "HH:MM" (entered as Istanbul wall time) into an absolute instant. */
export function istanbulDateTimeToISO(date: string, time: string): string {
  return `${date}T${time}:00${ISTANBUL_OFFSET}`;
}

/** Inverse of the above, for pre-filling the edit form's date/time inputs. */
export function istanbulDateInputValue(iso: string): string {
  const p = istanbulParts(new Date(iso));
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}
export function istanbulTimeInputValue(iso: string): string {
  const p = istanbulParts(new Date(iso));
  return `${pad2(p.hour)}:${pad2(p.minute)}`;
}

/* -------------------------------------------------------------------------- */
/* Status                                                                      */
/* -------------------------------------------------------------------------- */

export function getCampaignStatus(c: Campaign, now: Date = new Date()): CampaignStatus {
  if (!c.active) return "DISABLED";
  const t = now.getTime();
  if (t < new Date(c.startAt).getTime()) return "SCHEDULED";
  if (t >= new Date(c.endAt).getTime()) return "EXPIRED";
  return "ACTIVE";
}

export const CAMPAIGN_STATUS_LABEL_TR: Record<CampaignStatus, string> = {
  ACTIVE: "Aktif",
  SCHEDULED: "Planlandı",
  EXPIRED: "Süresi Doldu",
  DISABLED: "Pasif",
};

/* -------------------------------------------------------------------------- */
/* Duration label (homepage "süre etiketi") — not a mandatory format          */
/* -------------------------------------------------------------------------- */

const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
/** Dative ("'e kadar") suffix per month — Turkish vowel harmony, hand-checked (only Eylül/Ekim take "e"). */
const TR_MONTHS_DATIVE_SUFFIX = ["a", "a", "a", "a", "a", "a", "a", "a", "e", "e", "a", "a"];

/**
 * Short, natural-cased duration label — sentence case, never uppercase
 * (the card renders it as-is; don't rely on a CSS `uppercase` transform).
 */
export function campaignDurationLabel(c: Campaign, now: Date = new Date()): string {
  const diffDays = (new Date(c.endAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  if (diffDays <= 1) return "Bugüne özel";
  if (diffDays <= 7) return "Bu hafta";
  const p = istanbulParts(new Date(c.endAt));
  const month = TR_MONTHS[p.month - 1];
  const suffix = TR_MONTHS_DATIVE_SUFFIX[p.month - 1];
  return `${p.day} ${month}'${suffix} kadar`;
}

/* -------------------------------------------------------------------------- */
/* Homepage selection                                                          */
/* -------------------------------------------------------------------------- */

const HOMEPAGE_CAMPAIGN_LIMIT = 4;

/**
 * Every active campaign, regardless of branch — the candidate pool the
 * homepage fetches server-side (so admin edits show up on the next
 * request) and then narrows client-side once the visitor's delivery
 * branch is known (see `selectHomepageCampaigns`). Already sorted
 * priority ASC, then startAt DESC.
 */
export function getHomepageCampaignPool(now: Date = new Date()): Campaign[] {
  return getCampaignRepository().listActive(now, null);
}

/**
 * Narrows the active pool to what a given branch should see, then caps it
 * at 4:
 * - no resolved branch yet -> every candidate qualifies (branch-specific
 *   ones just carry a label — see `campaignBranchLabel`)
 * - resolved branch -> "all" campaigns + this branch's campaigns only
 *
 * `pool` must already be sorted (as `getHomepageCampaignPool` returns it);
 * this only filters and slices, it never re-sorts.
 */
export function selectHomepageCampaigns<T extends Campaign>(pool: T[], branchId: string | null): T[] {
  const eligible = branchId
    ? pool.filter((c) => c.branchIds === "all" || c.branchIds.includes(branchId))
    : pool;
  return eligible.slice(0, HOMEPAGE_CAMPAIGN_LIMIT);
}

/**
 * Short "GOP & Panora'da geçerli" / "Yalnızca GOP" label for a
 * branch-specific campaign — null for an "all branches" campaign, which
 * needs no such label.
 */
export function campaignBranchLabel(campaign: Campaign): string | null {
  if (campaign.branchIds === "all") return null;
  const names = campaign.branchIds.map(
    (id) => getBranch(id)?.name.replace("Funda 1959 ", "") ?? id,
  );
  if (names.length <= 1) return `Yalnızca ${names[0] ?? ""}`;
  return `${names.join(" & ")}'da geçerli`;
}

/* -------------------------------------------------------------------------- */
/* Admin-form validation                                                       */
/* -------------------------------------------------------------------------- */

export function validateCampaignInput(input: NewCampaignInput, validBranchIds: string[]): string[] {
  const errors: string[] = [];

  if (!input.title || !input.title.trim()) errors.push("Başlık boş olamaz.");

  const start = Date.parse(input.startAt);
  const end = Date.parse(input.endAt);
  if (Number.isNaN(start)) errors.push("Başlangıç tarihi/saati geçersiz.");
  if (Number.isNaN(end)) errors.push("Bitiş tarihi/saati geçersiz.");
  if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
    errors.push("Bitiş tarihi başlangıçtan sonra olmalı.");
  }

  if (!Number.isFinite(input.priority)) errors.push("Sıra (priority) sayısal olmalı.");

  if (input.branchIds !== "all") {
    if (!Array.isArray(input.branchIds) || input.branchIds.some((id) => !validBranchIds.includes(id))) {
      errors.push("Şube seçimi geçersiz.");
    }
  }

  return errors;
}
