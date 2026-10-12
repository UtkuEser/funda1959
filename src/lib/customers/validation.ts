/**
 * Member input rules (D24) — shared by the /hesabim forms and the server,
 * which checks every write again. Client-safe.
 *
 * Saved addresses use the same district / neighbourhood lists as checkout
 * (`lib/delivery/zones.ts`): an address that can't be delivered to today
 * can't be saved. The lists are test data until the business confirms them
 * (A4); an address saved earlier stays even if its area leaves the list.
 */

import { deliverableDistricts, deliverableNeighborhoods } from "../delivery/zones";
import { formatPhone, isValidFullName, isValidPhone } from "../checkout-utils";
import type { AccountAddressInput } from "../account-service";

export type AddressField = "label" | "district" | "neighborhood" | "addressLine" | "building" | "floor" | "apartment" | "note";
export type AddressErrors = Partial<Record<AddressField, string>>;

export type CleanAddress = Required<Pick<AccountAddressInput, "label" | "district" | "neighborhood" | "addressLine">> & {
  building: string | null;
  floor: string | null;
  apartment: string | null;
  note: string | null;
  isDefault: boolean;
};

const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const optional = (v: unknown, max: number, errors: AddressErrors, field: AddressField): string | null => {
  const s = text(v);
  if (s.length > max) errors[field] = `En fazla ${max} karakter.`;
  return s || null;
};

/** Is this district / neighbourhood pair one checkout can deliver to? */
export function isServiceArea(district: string, neighborhood: string): boolean {
  return deliverableDistricts().includes(district) && deliverableNeighborhoods(district).includes(neighborhood);
}

export function checkAddressInput(raw: unknown): { ok: true; value: CleanAddress } | { ok: false; errors: AddressErrors } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: AddressErrors = {};

  const label = text(r.label);
  if (!label) errors.label = "Adres başlığı girin.";
  else if (label.length > 40) errors.label = "En fazla 40 karakter.";

  const district = text(r.district);
  const neighborhood = text(r.neighborhood);
  if (!district) errors.district = "İlçe seçin.";
  else if (!deliverableDistricts().includes(district)) errors.district = "Bu ilçeye şu an teslimat yapılmıyor.";
  if (!neighborhood) errors.neighborhood = "Mahalle seçin.";
  else if (district && !deliverableNeighborhoods(district).includes(neighborhood)) {
    errors.neighborhood = "Bu mahalleye şu an teslimat yapılmıyor.";
  }

  const addressLine = text(r.addressLine);
  if (addressLine.length < 10) errors.addressLine = "Açık adres girin.";
  else if (addressLine.length > 300) errors.addressLine = "En fazla 300 karakter.";

  const value: CleanAddress = {
    label,
    district,
    neighborhood,
    addressLine,
    building: optional(r.building, 60, errors, "building"),
    floor: optional(r.floor, 20, errors, "floor"),
    apartment: optional(r.apartment, 20, errors, "apartment"),
    note: optional(r.note, 200, errors, "note"),
    isDefault: r.isDefault === true,
  };
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value };
}

export type ProfileErrors = Partial<Record<"fullName" | "phone", string>>;

/** Name + phone (the e-mail is the sign-in address and isn't edited here, D24). */
export function checkProfileInput(raw: unknown): { ok: true; value: { fullName: string; phone: string } } | { ok: false; errors: ProfileErrors } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: ProfileErrors = {};
  const fullName = text(r.fullName).replace(/\s+/g, " ");
  const phone = text(r.phone);
  if (!isValidFullName(fullName) || fullName.length > 120) errors.fullName = "Ad ve soyadınızı girin.";
  if (!isValidPhone(phone)) errors.phone = "Geçerli bir telefon numarası girin.";
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value: { fullName, phone: formatPhone(phone) } };
}
