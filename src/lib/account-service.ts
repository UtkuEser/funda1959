/**
 * Account data boundary — TUR 2 (frontend preview only).
 *
 * Every /hesabim page reads through these functions, never a raw array and
 * never localStorage / sessionStorage / Supabase directly. The bodies return
 * generic mock data with no real personal information and nothing is
 * persisted.
 *
 * TODO: replace with Supabase Auth + account API. Same call shape:
 *   getAccountProfile()      -> select customers where auth uid
 *   getAccountOrders()       -> select orders (+ order_items) where customer_id
 *   getAccountOrder(no)      -> single order + items
 *   getAccountAddresses()    -> select addresses where customer_id
 *   updateProfile(payload)   -> update customers
 *   changePassword(payload)  -> supabase.auth.updateUser({ password })
 *   saveAddress / deleteAddress -> upsert / delete addresses
 */

import type { AuthActionResult } from "./auth";
import type { CheckoutAddress, OrderStatus } from "./order";

export type AccountProfile = {
  fullName: string;
  phone: string;
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

export type AccountAddress = AccountAddressInput & { id: string };

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
  createdAt: string; // ISO yyyy-mm-dd
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
};

export type AccountData = {
  profile: AccountProfile;
  addresses: AccountAddress[];
  orders: AccountOrder[];
};

/* -------------------------------------------------------------------------- */
/* Mock data — generic, no real personal info, not persisted.                 */
/* -------------------------------------------------------------------------- */

const MOCK: AccountData = {
  profile: { fullName: "", phone: "", email: "" },

  addresses: [
    {
      id: "addr-ev",
      label: "Ev",
      district: "Çankaya",
      neighborhood: "Gaziosmanpaşa",
      addressLine: "Filistin Caddesi No: 12",
      building: "Nar Apartmanı",
      floor: "3",
      apartment: "4",
      isDefault: true,
    },
    {
      id: "addr-is",
      label: "İş",
      district: "Yenimahalle",
      neighborhood: "Batıkent",
      addressLine: "1. Cadde No: 45, Kat 2",
    },
  ],

  orders: [
    {
      orderNumber: "FND-20260829-AB12",
      status: "preparing",
      createdAt: "2026-08-29",
      deliveryType: "delivery",
      deliveryDate: "2026-08-30",
      deliveryTimeSlot: "14:00 – 16:00",
      branchName: null,
      address: {
        district: "Çankaya",
        neighborhood: "Gaziosmanpaşa",
        addressLine: "Filistin Caddesi No: 12",
        building: "Nar Apartmanı",
        floor: "3",
        apartment: "4",
      },
      items: [
        {
          productName: "Çikolatalı Çilekli Pasta",
          variantLabel: "8–10 Kişilik",
          quantity: 1,
          lineTotal: 1050,
          cakeMessage: "İyi ki doğdun Ece",
          extras: ["Mum Ekle"],
        },
        { productName: "Fıstıklı Baklava", variantLabel: "1 kg", quantity: 1, lineTotal: 510 },
      ],
      subtotal: 1560,
      deliveryFee: 0,
      discount: 0,
      total: 1560,
      orderNote: "Kapıda arayınız.",
    },
    {
      orderNumber: "FND-20260812-K7Q9",
      status: "delivered",
      createdAt: "2026-08-12",
      deliveryType: "pickup",
      deliveryDate: "2026-08-13",
      deliveryTimeSlot: "16:00 – 18:00",
      branchName: "Panora",
      address: null,
      items: [
        { productName: "Pralinli Çikolata Kutusu", variantLabel: "12'li", quantity: 2, lineTotal: 1300 },
      ],
      subtotal: 1300,
      deliveryFee: 0,
      discount: 0,
      total: 1300,
    },
    {
      orderNumber: "FND-20260720-M3X1",
      status: "cancelled",
      createdAt: "2026-07-20",
      deliveryType: "delivery",
      deliveryDate: "2026-07-22",
      deliveryTimeSlot: "10:00 – 12:00",
      branchName: null,
      address: {
        district: "Yenimahalle",
        neighborhood: "Batıkent",
        addressLine: "1. Cadde No: 45",
      },
      items: [
        { productName: "Doğum Günü Koleksiyonu", variantLabel: "8–10 Kişilik", quantity: 1, lineTotal: 950 },
      ],
      subtotal: 950,
      deliveryFee: 0,
      discount: 0,
      total: 950,
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Read boundary                                                              */
/* -------------------------------------------------------------------------- */

export function getAccount(): AccountData {
  return MOCK;
}

export function getAccountProfile(): AccountProfile {
  return MOCK.profile;
}

export function getAccountAddresses(): AccountAddress[] {
  return MOCK.addresses;
}

export function getAccountOrders(): AccountOrder[] {
  return MOCK.orders;
}

export function getAccountOrder(orderNumber: string): AccountOrder | null {
  return MOCK.orders.find((o) => o.orderNumber === orderNumber) ?? null;
}

/* -------------------------------------------------------------------------- */
/* Write boundary — stubs. No persistence. Swap for real API later.           */
/* -------------------------------------------------------------------------- */

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function updateProfile(payload: AccountProfile): Promise<AuthActionResult> {
  await wait(600);
  if (!payload.fullName.trim()) {
    return { ok: false, error: "Ad ve soyadınızı girin." };
  }
  // TODO: Supabase — update customers. Nothing is persisted in TUR 2.
  return { ok: true, message: "Bilgileriniz kaydedilmeye hazır." };
}

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export async function changePassword(payload: ChangePasswordPayload): Promise<AuthActionResult> {
  await wait(600);
  if (payload.currentPassword.length === 0) {
    return { ok: false, error: "Mevcut şifrenizi girin." };
  }
  // TODO: Supabase — supabase.auth.updateUser({ password }). Never persisted here.
  return { ok: true, message: "Şifreniz güncellenmeye hazır." };
}
