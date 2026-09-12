/**
 * Branch domain.
 *
 * A branch is an operational node: it may serve pickup, delivery, or both, and
 * it has weekly opening hours. Nothing in the codebase should branch on a
 * hard-coded id (`if (branch === "gop")`) — behaviour comes from the model, so
 * adding a fourth branch needs only seed data.
 */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday (JS getDay)

export type OpeningHours = {
  /** per weekday: `{ open, close }` in "HH:MM", or null when closed */
  [day in Weekday]: { open: string; close: string } | null;
};

export type Branch = {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  active: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  openingHours: OpeningHours;
};

/* -------------------------------------------------------------------------- */
/* Seed (replace with BranchRepository -> Supabase later)                      */
/* -------------------------------------------------------------------------- */

const everyDay = (open: string, close: string): OpeningHours => ({
  0: { open, close },
  1: { open, close },
  2: { open, close },
  3: { open, close },
  4: { open, close },
  5: { open, close },
  6: { open, close },
});

const BRANCH_SEED: Branch[] = [
  {
    id: "gop",
    name: "Funda 1959 GOP",
    slug: "gop",
    address: "Kızkulesi Sokak No:12/A, Gaziosmanpaşa, Ankara",
    phone: "+90 312 447 00 00",
    active: true,
    deliveryEnabled: true,
    pickupEnabled: true,
    openingHours: {
      0: { open: "08:00", close: "23:00" },
      1: { open: "08:00", close: "22:00" },
      2: { open: "08:00", close: "22:00" },
      3: { open: "08:00", close: "22:00" },
      4: { open: "08:00", close: "22:00" },
      5: { open: "08:00", close: "22:00" },
      6: { open: "08:00", close: "23:00" },
    },
  },
  {
    id: "panora",
    name: "Funda 1959 Panora",
    slug: "panora",
    address: "Panora AVM, Kızılay, Ankara",
    phone: "+90 312 448 00 00",
    active: true,
    deliveryEnabled: true,
    pickupEnabled: true,
    openingHours: everyDay("10:00", "22:00"),
  },
  {
    id: "incek",
    name: "Funda 1959 İncek",
    slug: "incek",
    address: "TONA Residence, İncek, Ankara",
    phone: "+90 312 449 00 00",
    active: true,
    deliveryEnabled: true,
    pickupEnabled: true,
    openingHours: everyDay("09:00", "22:00"),
  },
];

/* -------------------------------------------------------------------------- */
/* Repository                                                                  */
/* -------------------------------------------------------------------------- */

export interface BranchRepository {
  list(scope?: { authorizedBranchIds?: string[] }): Branch[];
  get(id: string): Branch | null;
  getBySlug(slug: string): Branch | null;
}

class InMemoryBranchRepository implements BranchRepository {
  constructor(private readonly branches: Branch[]) {}

  list(scope?: { authorizedBranchIds?: string[] }): Branch[] {
    if (!scope?.authorizedBranchIds) return this.branches.slice();
    const allow = new Set(scope.authorizedBranchIds);
    return this.branches.filter((b) => allow.has(b.id));
  }

  get(id: string): Branch | null {
    return this.branches.find((b) => b.id === id) ?? null;
  }

  getBySlug(slug: string): Branch | null {
    return this.branches.find((b) => b.slug === slug) ?? null;
  }
}

let repo: BranchRepository = new InMemoryBranchRepository(BRANCH_SEED);

/** Swap the backing store (e.g. a Supabase-backed repo) without touching callers. */
export function setBranchRepository(next: BranchRepository): void {
  repo = next;
}

export function getBranchRepository(): BranchRepository {
  return repo;
}

/* -------------------------------------------------------------------------- */
/* Convenience                                                                 */
/* -------------------------------------------------------------------------- */

export function listBranches(scope?: { authorizedBranchIds?: string[] }): Branch[] {
  return repo.list(scope);
}

export function getBranch(id: string | null | undefined): Branch | null {
  return id ? repo.get(id) : null;
}

export function getBranchBySlug(slug: string | null | undefined): Branch | null {
  return slug ? repo.getBySlug(slug) : null;
}

/** Pickup-eligible, active branches — for the "Mağazadan Teslim" picker. */
export function pickupBranches(scope?: { authorizedBranchIds?: string[] }): Branch[] {
  return repo.list(scope).filter((b) => b.active && b.pickupEnabled);
}

const HHMM = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** Is the branch open at `time` ("HH:MM") on `weekday`? */
export function isBranchOpenAt(branch: Branch, weekday: Weekday, time: string): boolean {
  const hours = branch.openingHours[weekday];
  if (!hours) return false;
  const t = HHMM(time);
  return t >= HHMM(hours.open) && t <= HHMM(hours.close);
}

/** Does the branch have any open window on `weekday`? */
export function isBranchOpenOn(branch: Branch, weekday: Weekday): boolean {
  return branch.openingHours[weekday] != null;
}
