/**
 * Account data boundary — Aşama 5 (SUPABASE_PLAN.md §8.2, D24).
 *
 * Client-safe: the types every /hesabim screen and the server share, plus the
 * browser's writes to `/api/account/*`. Reads happen on the server
 * (`lib/customers`, always filtered by the signed-in member), never here —
 * there is no mock data any more.
 */

import { accountRequest, type AuthActionResult } from "./auth";
import type { CheckoutAddress, OrderStatus } from "./order";

/** D24: a member keeps at most this many addresses; one of them is the default. */
export const MAX_SAVED_ADDRESSES = 10;

export type AccountProfile = {
  fullName: string;
  phone: string;
  /** the sign-in e-mail; not editable in this phase (D24) */
  email: string;
};

export type AccountAddressInput = {
  label: string;
  district: string;
  neighborhood: string;
  addressLine: string;
  building?: string;
  floor?: string;
  apartment?: string;
  note?: string;
  isDefault?: boolean;
};

export type AccountAddress = AccountAddressInput & { id: string; isDefault: boolean };

export type AccountOrderItem = {
  productName: string;
  variantLabel: string | null;
  quantity: number;
  lineTotal: number;
  cakeMessage?: string;
  extras?: string[];
  note?: string;
};

export type AccountOrder = {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string; // ISO yyyy-mm-dd, Istanbul day
  deliveryType: "delivery" | "pickup";
  deliveryDate: string;
  deliveryTimeSlot: string;
  branchName: string | null;
  address: CheckoutAddress | null;
  items: AccountOrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  orderNote?: string;
  /** the member may see why their order was cancelled; not who cancelled it */
  cancelReason: string | null;
  /** every order is a demo until a payment provider exists (D8) */
  isDemo: boolean;
};

export type AccountData = {
  profile: AccountProfile;
  addresses: AccountAddress[];
  orders: AccountOrder[];
};

/** What checkout gets for a signed-in member (D24): contact prefill + saved addresses. */
export type CheckoutMember = { profile: AccountProfile; addresses: AccountAddress[] };

/* -------------------------------------------------------------------------- */
/* Writes — the server checks the session and saves only the member's rows    */
/* -------------------------------------------------------------------------- */

export async function updateProfile(payload: Pick<AccountProfile, "fullName" | "phone">): Promise<
  | { ok: true; profile: AccountProfile; message?: string }
  | { ok: false; error: string; code?: string; fieldErrors?: Record<string, string> }
> {
  return accountRequest<{ profile: AccountProfile; message?: string }>("/api/account/profile", payload, "PATCH");
}

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<AuthActionResult | { ok: false; error: string; code?: string; fieldErrors?: Record<string, string> }> {
  return accountRequest<{ message?: string }>("/api/account/password", { mode: "change", ...payload });
}

export type AddressesResult =
  | { ok: true; addresses: AccountAddress[] }
  | { ok: false; error: string; code?: string; fieldErrors?: Record<string, string> };

/** Creates (no id) or updates one of the member's addresses; answers the full, saved list. */
export async function saveAddress(input: AccountAddressInput, id?: string): Promise<AddressesResult> {
  return accountRequest<{ addresses: AccountAddress[] }>("/api/account/addresses", { id: id ?? null, address: input });
}

export async function deleteAddress(id: string): Promise<AddressesResult> {
  return accountRequest<{ addresses: AccountAddress[] }>(
    `/api/account/addresses?id=${encodeURIComponent(id)}`,
    undefined,
    "DELETE",
  );
}
