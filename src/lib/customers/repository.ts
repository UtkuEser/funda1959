/**
 * Member data — profile, saved addresses, own orders (D24; migration 0010).
 * Server-only.
 *
 * Every method takes the member's user id from the verified session (never
 * from the browser) and only ever touches that member's rows.
 * `SupabaseCustomerRepository` goes through `supabaseRest` (service role +
 * environment marker); `MemoryCustomerRepository` serves a developer machine
 * without Supabase and the verify scripts — both apply the same rules: at
 * most 10 addresses, exactly one default while any exist, the default moves
 * to the oldest address when it is deleted.
 */

import type { AccountAddress, AccountOrder, AccountProfile } from "../account-service";
import { MAX_SAVED_ADDRESSES } from "../account-service";
import type { OrderStatus } from "../order";
import { getBranch } from "../branch";
import { istanbulDateISO } from "../time/istanbul";
import { isSupabaseConfigured, SupabaseRestError, supabaseRest } from "../supabase-server";
import { memoryOrders, type StoredOrder } from "../orders/repository";
import type { CleanAddress } from "./validation";

if (typeof window !== "undefined") {
  throw new Error("customers/repository.ts must never be imported on the client");
}

/** Migration 0010 isn't applied to the connected project — membership can't be used yet. */
export class MembershipNotReadyError extends Error {
  constructor(detail: string) {
    super(`membership tables missing (0010) — ${detail}`);
    this.name = "MembershipNotReadyError";
  }
}

/** A consent to the published membership texts: which version, when (D26). */
export type ProfileConsent = { version: string; acceptedAt: string };

export type SaveAddressResult =
  | { ok: true; address: AccountAddress }
  | { ok: false; error: "LIMIT" | "NOT_FOUND" | "INVALID" };

export interface CustomerRepository {
  readonly kind: "memory" | "supabase";
  getProfile(userId: string): Promise<AccountProfile | null>;
  /**
   * First profile of an account; returns the existing one if it already has
   * one. `consent` only once texts are published (D26) — null stores none.
   */
  createProfile(userId: string, profile: AccountProfile, consent?: ProfileConsent | null): Promise<AccountProfile>;
  updateProfile(userId: string, patch: Pick<AccountProfile, "fullName" | "phone">): Promise<AccountProfile | null>;
  listAddresses(userId: string): Promise<AccountAddress[]>;
  saveAddress(userId: string, address: CleanAddress, addressId: string | null): Promise<SaveAddressResult>;
  deleteAddress(userId: string, addressId: string): Promise<boolean>;
  listOrders(userId: string, limit?: number): Promise<AccountOrder[]>;
  getOrder(userId: string, orderNumber: string): Promise<AccountOrder | null>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/* -------------------------------------------------------------------------- */
/* Supabase                                                                    */
/* -------------------------------------------------------------------------- */

type ProfileRow = { full_name: string; phone: string; email: string };
type AddressRow = {
  id: string;
  label: string;
  district: string;
  neighborhood: string;
  address_line: string;
  building: string | null;
  floor: string | null;
  apartment: string | null;
  note: string | null;
  is_default: boolean;
};
type OrderRow = {
  order_number: string;
  status: OrderStatus;
  is_demo: boolean;
  delivery_type: "delivery" | "pickup";
  branch_slug: string | null;
  delivery_date: string;
  delivery_time_slot: string;
  subtotal: number | string;
  delivery_fee: number | string;
  discount: number | string;
  total: number | string;
  order_note: string | null;
  cancel_reason: string | null;
  created_at: string;
  address: Omit<AddressRow, "id" | "label" | "is_default"> | null;
  items: {
    product_name: string;
    variant_label: string | null;
    quantity: number;
    total_price: number | string;
    cake_message: string | null;
    extras: string[] | null;
    note: string | null;
  }[];
};

const opt = (v: string | null | undefined) => v ?? undefined;

const toProfile = (r: ProfileRow): AccountProfile => ({ fullName: r.full_name, phone: r.phone, email: r.email });

const toAddress = (r: AddressRow): AccountAddress => ({
  id: r.id,
  label: r.label,
  district: r.district,
  neighborhood: r.neighborhood,
  addressLine: r.address_line,
  building: opt(r.building),
  floor: opt(r.floor),
  apartment: opt(r.apartment),
  note: opt(r.note),
  isDefault: r.is_default,
});

function toOrder(r: OrderRow): AccountOrder {
  return {
    orderNumber: r.order_number,
    status: r.status,
    createdAt: istanbulDateISO(new Date(r.created_at)),
    deliveryType: r.delivery_type,
    deliveryDate: r.delivery_date,
    deliveryTimeSlot: r.delivery_time_slot,
    branchName: getBranch(r.branch_slug)?.name ?? null,
    address: r.address
      ? {
          district: r.address.district,
          neighborhood: r.address.neighborhood,
          addressLine: r.address.address_line,
          building: opt(r.address.building),
          floor: opt(r.address.floor),
          apartment: opt(r.address.apartment),
          note: opt(r.address.note),
        }
      : null,
    items: r.items.map((i) => ({
      productName: i.product_name,
      variantLabel: i.variant_label,
      quantity: i.quantity,
      lineTotal: Number(i.total_price),
      cakeMessage: opt(i.cake_message),
      extras: i.extras ?? undefined,
      note: opt(i.note),
    })),
    subtotal: Number(r.subtotal),
    deliveryFee: Number(r.delivery_fee),
    discount: Number(r.discount),
    total: Number(r.total),
    orderNote: opt(r.order_note),
    cancelReason: r.status === "cancelled" ? r.cancel_reason : null,
    isDemo: r.is_demo !== false,
  };
}

/** missing table / column / function -> 0010 not applied */
function notReady(err: unknown): boolean {
  return (
    err instanceof SupabaseRestError &&
    (err.status === 404 || err.code === "PGRST205" || err.code === "PGRST202" || err.code === "42P01" || err.code === "42703")
  );
}

async function guard<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (notReady(err)) throw new MembershipNotReadyError((err as Error).message.slice(0, 200));
    throw err;
  }
}

const eq = (v: string) => `eq.${encodeURIComponent(v)}`;

export class SupabaseCustomerRepository implements CustomerRepository {
  readonly kind = "supabase" as const;

  /** schema-only probe (limit=0): is 0010 applied? Used before creating an account. */
  async ready(): Promise<boolean> {
    try {
      await supabaseRest("/customer_profiles?select=auth_user_id&limit=0");
      await supabaseRest("/orders?select=customer_user_id&limit=0");
      return true;
    } catch (err) {
      if (notReady(err) || (err instanceof SupabaseRestError && err.status === 400)) return false;
      throw err;
    }
  }

  getProfile(userId: string) {
    return guard(async () => {
      const rows = await supabaseRest<ProfileRow[]>(
        `/customer_profiles?select=full_name,phone,email&auth_user_id=${eq(userId)}&limit=1`,
      );
      return rows[0] ? toProfile(rows[0]) : null;
    });
  }

  createProfile(userId: string, profile: AccountProfile, consent: ProfileConsent | null = null) {
    return guard(async () => {
      // consent columns only with a real consent to published texts (D26)
      const row: Record<string, unknown> = { auth_user_id: userId, full_name: profile.fullName, phone: profile.phone, email: profile.email };
      if (consent) {
        row.terms_version = consent.version;
        row.terms_accepted_at = consent.acceptedAt;
      }
      const rows = await supabaseRest<ProfileRow[]>("/customer_profiles?on_conflict=auth_user_id", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
        body: JSON.stringify(row),
      });
      if (rows[0]) return toProfile(rows[0]);
      return (await this.getProfile(userId)) ?? profile;
    });
  }

  updateProfile(userId: string, patch: Pick<AccountProfile, "fullName" | "phone">) {
    return guard(async () => {
      const rows = await supabaseRest<ProfileRow[]>(`/customer_profiles?auth_user_id=${eq(userId)}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ full_name: patch.fullName, phone: patch.phone }),
      });
      return rows[0] ? toProfile(rows[0]) : null;
    });
  }

  listAddresses(userId: string) {
    return guard(async () => {
      const rows = await supabaseRest<AddressRow[]>(
        `/customer_addresses?select=id,label,district,neighborhood,address_line,building,floor,apartment,note,is_default` +
          `&auth_user_id=${eq(userId)}&order=created_at.asc,id.asc`,
      );
      return rows.map(toAddress);
    });
  }

  async saveAddress(userId: string, a: CleanAddress, addressId: string | null): Promise<SaveAddressResult> {
    if (addressId !== null && !isUuid(addressId)) return { ok: false, error: "NOT_FOUND" };
    try {
      const row = await guard(() =>
        supabaseRest<AddressRow>("/rpc/save_customer_address", {
          method: "POST",
          body: JSON.stringify({
            p_user_id: userId,
            p_address_id: addressId,
            p_address: {
              label: a.label,
              district: a.district,
              neighborhood: a.neighborhood,
              address_line: a.addressLine,
              building: a.building,
              floor: a.floor,
              apartment: a.apartment,
              note: a.note,
              is_default: a.isDefault,
            },
          }),
        }),
      );
      return { ok: true, address: toAddress(row) };
    } catch (err) {
      if (err instanceof SupabaseRestError) {
        if (err.dbMessage === "address_limit") return { ok: false, error: "LIMIT" };
        if (err.dbMessage === "address_not_found") return { ok: false, error: "NOT_FOUND" };
        if (err.dbMessage === "invalid_address") return { ok: false, error: "INVALID" };
      }
      throw err;
    }
  }

  async deleteAddress(userId: string, addressId: string) {
    if (!isUuid(addressId)) return false;
    return guard(async () =>
      Boolean(
        await supabaseRest<boolean>("/rpc/delete_customer_address", {
          method: "POST",
          body: JSON.stringify({ p_user_id: userId, p_address_id: addressId }),
        }),
      ),
    );
  }

  listOrders(userId: string, limit = 50) {
    return guard(async () => {
      const res = await supabaseRest<{ total: number; rows: OrderRow[] } | null>("/rpc/list_customer_orders", {
        method: "POST",
        body: JSON.stringify({ p_user_id: userId, p_limit: limit, p_offset: 0 }),
      });
      return (res?.rows ?? []).map(toOrder);
    });
  }

  getOrder(userId: string, orderNumber: string) {
    return guard(async () => {
      const row = await supabaseRest<OrderRow | null>("/rpc/get_customer_order", {
        method: "POST",
        body: JSON.stringify({ p_user_id: userId, p_order_number: orderNumber }),
      });
      return row ? toOrder(row) : null;
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Memory (developer machine without Supabase, verify scripts)                 */
/* -------------------------------------------------------------------------- */

type MemoryAddress = AccountAddress & { userId: string; createdAt: number };

const store = globalThis as unknown as {
  __fundaCustomerProfiles?: Map<string, AccountProfile>;
  __fundaCustomerAddresses?: MemoryAddress[];
};
store.__fundaCustomerProfiles ??= new Map();
store.__fundaCustomerAddresses ??= [];

function storedToAccountOrder(o: StoredOrder): AccountOrder {
  return {
    orderNumber: o.orderNumber,
    status: o.orderStatus,
    createdAt: istanbulDateISO(new Date(o.createdAt)),
    deliveryType: o.fulfillmentType,
    deliveryDate: o.deliveryDate,
    deliveryTimeSlot: o.deliverySlot,
    branchName: getBranch(o.branchId)?.name ?? null,
    address: o.address,
    items: o.items.map((i) => ({
      productName: i.productName,
      variantLabel: i.variantLabel,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
      cakeMessage: i.cakeMessage ?? undefined,
      extras: i.extras ?? undefined,
      note: i.note ?? undefined,
    })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    discount: o.discount,
    total: o.total,
    cancelReason: o.orderStatus === "cancelled" ? o.cancellation?.reason ?? null : null,
    isDemo: o.isDemo,
  };
}

let seq = 0;

const publicAddress = (m: MemoryAddress): AccountAddress => ({
  id: m.id,
  label: m.label,
  district: m.district,
  neighborhood: m.neighborhood,
  addressLine: m.addressLine,
  building: m.building,
  floor: m.floor,
  apartment: m.apartment,
  note: m.note,
  isDefault: m.isDefault,
});

export class MemoryCustomerRepository implements CustomerRepository {
  readonly kind = "memory" as const;
  private readonly profiles = store.__fundaCustomerProfiles!;
  private get addresses() {
    return store.__fundaCustomerAddresses!;
  }

  async getProfile(userId: string) {
    return this.profiles.get(userId) ?? null;
  }

  /** consents recorded per user — for the verify scripts (none while no text is published) */
  readonly consents = new Map<string, ProfileConsent>();

  async createProfile(userId: string, profile: AccountProfile, consent: ProfileConsent | null = null) {
    const existing = this.profiles.get(userId);
    if (existing) return existing;
    this.profiles.set(userId, { ...profile });
    if (consent) this.consents.set(userId, consent);
    return { ...profile };
  }

  async updateProfile(userId: string, patch: Pick<AccountProfile, "fullName" | "phone">) {
    const cur = this.profiles.get(userId);
    if (!cur) return null;
    const next = { ...cur, ...patch };
    this.profiles.set(userId, next);
    return next;
  }

  private own(userId: string) {
    return this.addresses.filter((a) => a.userId === userId).sort((a, b) => a.createdAt - b.createdAt);
  }

  async listAddresses(userId: string) {
    return this.own(userId).map(publicAddress);
  }

  async saveAddress(userId: string, a: CleanAddress, addressId: string | null): Promise<SaveAddressResult> {
    const mine = this.own(userId);
    const fields = {
      label: a.label,
      district: a.district,
      neighborhood: a.neighborhood,
      addressLine: a.addressLine,
      building: a.building ?? undefined,
      floor: a.floor ?? undefined,
      apartment: a.apartment ?? undefined,
      note: a.note ?? undefined,
    };
    let saved: MemoryAddress;
    if (addressId === null) {
      if (mine.length >= MAX_SAVED_ADDRESSES) return { ok: false, error: "LIMIT" };
      const isDefault = a.isDefault || mine.length === 0;
      if (isDefault) mine.forEach((m) => (m.isDefault = false));
      seq += 1;
      saved = { ...fields, id: crypto.randomUUID(), isDefault, userId, createdAt: seq };
      this.addresses.push(saved);
    } else {
      const cur = mine.find((m) => m.id === addressId);
      if (!cur) return { ok: false, error: "NOT_FOUND" };
      const isDefault = cur.isDefault || a.isDefault;
      if (isDefault && !cur.isDefault) mine.forEach((m) => (m.isDefault = false));
      Object.assign(cur, fields, { isDefault });
      saved = cur;
    }
    return { ok: true, address: publicAddress(saved) };
  }

  async deleteAddress(userId: string, addressId: string) {
    const idx = this.addresses.findIndex((a) => a.userId === userId && a.id === addressId);
    if (idx < 0) return false;
    const [removed] = this.addresses.splice(idx, 1);
    if (removed.isDefault) {
      const oldest = this.own(userId)[0];
      if (oldest) oldest.isDefault = true;
    }
    return true;
  }

  async listOrders(userId: string, limit = 50) {
    const page = await memoryOrders.list({ limit: 10_000, offset: 0 });
    return page.rows
      .filter((o) => o.customerUserId === userId)
      .slice(0, limit)
      .map(storedToAccountOrder);
  }

  async getOrder(userId: string, orderNumber: string) {
    const o = await memoryOrders.get(orderNumber);
    return o && o.customerUserId === userId ? storedToAccountOrder(o) : null;
  }
}

export const memoryCustomers = new MemoryCustomerRepository();
const supabaseCustomers = new SupabaseCustomerRepository();

/** The database when Supabase is configured; otherwise this process's memory (developer machine only). */
export function getCustomerRepository(): CustomerRepository {
  return isSupabaseConfigured() ? supabaseCustomers : memoryCustomers;
}

/** Is the connected project ready for members (0010)? Memory is always ready. */
export async function membershipReady(): Promise<boolean> {
  return isSupabaseConfigured() ? supabaseCustomers.ready() : true;
}
