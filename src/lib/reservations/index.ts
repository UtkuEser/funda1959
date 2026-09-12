/**
 * Reservation engine.
 *
 * When a customer reaches payment we hold their stock / daily-capacity /
 * delivery-slot units for a short window (default 10 min). While a reservation
 * is ACTIVE its units count as `reserved` everywhere the Availability engine
 * looks, so a second customer cannot take the last unit. Unpaid reservations
 * expire and their capacity is released.
 *
 * v1 store is in-memory (per server process). The repository interface is the
 * seam for a Supabase-backed store with a DB-level `expires_at` sweep later.
 */

export type ReservationStatus = "active" | "confirmed" | "expired" | "cancelled";

export type ReservationItem = {
  productId: string;
  variantId: string | null;
  quantity: number;
};

export type Reservation = {
  id: string;
  branchId: string;
  items: ReservationItem[];
  deliveryDate: string; // ISO
  deliverySlotStart: string; // "HH:MM"
  status: ReservationStatus;
  createdAt: number; // epoch ms
  expiresAt: number; // epoch ms
};

export const RESERVATION_TTL_MS = 10 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/* Repository                                                                  */
/* -------------------------------------------------------------------------- */

export interface ReservationRepository {
  create(r: Reservation): Reservation;
  get(id: string): Reservation | null;
  update(id: string, patch: Partial<Reservation>): Reservation | null;
  /** all reservations still holding capacity right now (active & unexpired) */
  activeHolds(now?: number): Reservation[];
}

/** Shared across module registries within one Node process (see orders/repository). */
const globalStore = globalThis as unknown as { __fundaReservations?: Map<string, Reservation> };
globalStore.__fundaReservations ??= new Map<string, Reservation>();

class InMemoryReservationRepository implements ReservationRepository {
  private readonly rows = globalStore.__fundaReservations!;

  private sweep(now: number): void {
    for (const r of this.rows.values()) {
      if (r.status === "active" && r.expiresAt <= now) {
        this.rows.set(r.id, { ...r, status: "expired" });
      }
    }
  }

  create(r: Reservation): Reservation {
    this.rows.set(r.id, r);
    return r;
  }
  get(id: string): Reservation | null {
    this.sweep(Date.now());
    return this.rows.get(id) ?? null;
  }
  update(id: string, patch: Partial<Reservation>): Reservation | null {
    const cur = this.rows.get(id);
    if (!cur) return null;
    const next = { ...cur, ...patch };
    this.rows.set(id, next);
    return next;
  }
  activeHolds(now: number = Date.now()): Reservation[] {
    this.sweep(now);
    return [...this.rows.values()].filter((r) => r.status === "active" && r.expiresAt > now);
  }
}

let repo: ReservationRepository = new InMemoryReservationRepository();
export function setReservationRepository(next: ReservationRepository): void {
  repo = next;
}
export function getReservationRepository(): ReservationRepository {
  return repo;
}

/* -------------------------------------------------------------------------- */
/* Engine                                                                      */
/* -------------------------------------------------------------------------- */

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `rsv_${crypto.randomUUID()}`;
  }
  return `rsv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export type CreateReservationInput = {
  branchId: string;
  items: ReservationItem[];
  deliveryDate: string;
  deliverySlotStart: string;
  ttlMs?: number;
};

export function createReservation(input: CreateReservationInput): Reservation {
  const now = Date.now();
  return repo.create({
    id: makeId(),
    branchId: input.branchId,
    items: input.items,
    deliveryDate: input.deliveryDate,
    deliverySlotStart: input.deliverySlotStart,
    status: "active",
    createdAt: now,
    expiresAt: now + (input.ttlMs ?? RESERVATION_TTL_MS),
  });
}

export function getReservation(id: string): Reservation | null {
  return repo.get(id);
}

export function confirmReservation(id: string): Reservation | null {
  const r = repo.get(id);
  if (!r || r.status !== "active") return r;
  return repo.update(id, { status: "confirmed" });
}

export function cancelReservation(id: string): Reservation | null {
  const r = repo.get(id);
  if (!r || (r.status !== "active" && r.status !== "confirmed")) return r;
  return repo.update(id, { status: "cancelled" });
}

/* -------------------------------------------------------------------------- */
/* Aggregates consumed by the Availability engine                              */
/* -------------------------------------------------------------------------- */

/**
 * Reserved units of a product at a branch. Pass `isoDate` to scope to one day
 * (daily_capacity), or omit it to count across every day (quantity pool).
 */
export function reservedProductUnits(
  branchId: string,
  productId: string,
  isoDate: string | undefined,
  exceptReservationId?: string,
): number {
  return repo
    .activeHolds()
    .filter(
      (r) =>
        r.id !== exceptReservationId &&
        r.branchId === branchId &&
        (isoDate === undefined || r.deliveryDate === isoDate),
    )
    .reduce(
      (sum, r) =>
        sum + r.items.filter((i) => i.productId === productId).reduce((s, i) => s + i.quantity, 0),
      0,
    );
}

/** reserved "order slots" on a branch+date+slot, excluding one id */
export function reservedSlotUnits(
  branchId: string,
  isoDate: string,
  slotStart: string,
  exceptReservationId?: string,
): number {
  return repo
    .activeHolds()
    .filter(
      (r) =>
        r.id !== exceptReservationId &&
        r.branchId === branchId &&
        r.deliveryDate === isoDate &&
        r.deliverySlotStart === slotStart,
    ).length;
}
