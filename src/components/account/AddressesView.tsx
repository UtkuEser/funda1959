"use client";

import { useState } from "react";
import { addressDistricts, addressNeighborhoods } from "@/lib/delivery/zones";
import {
  MAX_SAVED_ADDRESSES,
  deleteAddress,
  saveAddress,
  type AccountAddress,
  type AccountAddressInput,
} from "@/lib/account-service";
import { checkAddressInput, isServiceArea, type AddressErrors } from "@/lib/customers/validation";
import { useDelivery } from "@/lib/delivery/context";
import { AuthCheckbox, AuthField, AuthInput, SubmitButton } from "@/components/auth/fields";

const selectClass =
  "h-12 w-full rounded-md border bg-cream-light px-3.5 font-sans text-[14px] text-espresso focus:outline-none transition-colors disabled:opacity-60";

const EMPTY: AccountAddressInput = {
  label: "",
  district: "",
  neighborhood: "",
  addressLine: "",
  building: "",
  floor: "",
  apartment: "",
  note: "",
  isDefault: false,
};

/**
 * Add / edit form. District and neighbourhood come from the same lists as
 * checkout (D24), so a saved address can be delivered to today. The default
 * address can't be switched off here — another address is made default.
 */
function AddressForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: AccountAddress | null;
  onCancel: () => void;
  onSaved: (addresses: AccountAddress[]) => void;
}) {
  const { areasReady } = useDelivery();
  const [form, setForm] = useState<AccountAddressInput>(() => {
    if (!initial) return { ...EMPTY };
    // an address whose area is no longer served keeps its text but must be re-chosen to be saved
    // (unknown while the zone map isn't loaded: kept; the server checks on save)
    const inArea = !areasReady || isServiceArea(initial.district, initial.neighborhood);
    return { ...initial, district: inArea ? initial.district : "", neighborhood: inArea ? initial.neighborhood : "" };
  });
  const [errors, setErrors] = useState<AddressErrors>({});
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  // the loaded areas (D50), read again once they have loaded
  const districts = areasReady ? addressDistricts() : [];
  const neighborhoods = areasReady && form.district ? addressNeighborhoods(form.district) : [];

  const set = (patch: Partial<AccountAddressInput>) => {
    setForm((f) => ({ ...f, ...patch }));
    setFailed(null);
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k as keyof AddressErrors];
      return next;
    });
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (saving) return;
    const checked = checkAddressInput(form);
    if (!checked.ok) {
      setErrors(checked.errors);
      const first = (["label", "district", "neighborhood", "addressLine", "building", "floor", "apartment", "note"] as const).find(
        (k) => checked.errors[k],
      );
      if (first) document.getElementById(first)?.focus();
      return;
    }
    setSaving(true);
    setFailed(null);
    const result = await saveAddress({ ...form, isDefault: Boolean(form.isDefault) }, initial?.id);
    setSaving(false);
    if (result.ok) {
      onSaved(result.addresses);
      return;
    }
    setFailed(result.error);
    if (result.fieldErrors) setErrors(result.fieldErrors as AddressErrors);
  };

  const fieldClass = (bad?: string) => (bad ? "border-chocolate-light/60" : "border-sand focus:border-burgundy");

  return (
    <form onSubmit={submit} noValidate className="rounded-lg border border-sand-light p-5 space-y-5">
      <p className="font-sans text-[15px] font-semibold text-espresso">{initial ? "Adresi Düzenle" : "Yeni Adres"}</p>

      <AuthField label="Adres Başlığı" htmlFor="label" error={errors.label}>
        <AuthInput id="label" value={form.label} onChange={(v) => set({ label: v })} error={errors.label} placeholder="Ev, İş, Diğer…" />
      </AuthField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <AuthField label="İlçe" htmlFor="district" error={errors.district}>
          <select
            id="district"
            value={form.district}
            onChange={(e) => set({ district: e.target.value, neighborhood: "" })}
            aria-invalid={errors.district ? true : undefined}
            aria-describedby={errors.district ? "district-error" : undefined}
            className={`${selectClass} ${fieldClass(errors.district)} ${form.district ? "" : "text-taupe/70"}`}
          >
            <option value="">İlçe seçin</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </AuthField>

        <AuthField label="Mahalle" htmlFor="neighborhood" error={errors.neighborhood}>
          <select
            id="neighborhood"
            value={form.neighborhood}
            onChange={(e) => set({ neighborhood: e.target.value })}
            disabled={!form.district}
            aria-invalid={errors.neighborhood ? true : undefined}
            aria-describedby={errors.neighborhood ? "neighborhood-error" : undefined}
            className={`${selectClass} ${fieldClass(errors.neighborhood)} ${form.neighborhood ? "" : "text-taupe/70"}`}
          >
            <option value="">{form.district ? "Mahalle seçin" : "Önce ilçe seçin"}</option>
            {neighborhoods.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </AuthField>
      </div>

      <AuthField label="Açık Adres" htmlFor="addressLine" error={errors.addressLine}>
        <textarea
          id="addressLine"
          value={form.addressLine}
          onChange={(e) => set({ addressLine: e.target.value })}
          rows={3}
          placeholder="Sokak, cadde, bina adı ve numarası"
          aria-invalid={errors.addressLine ? true : undefined}
          aria-describedby={errors.addressLine ? "addressLine-error" : undefined}
          className={`w-full resize-none rounded-md border bg-cream-light px-3.5 py-2.5 font-sans text-[14px] leading-relaxed text-espresso placeholder:text-taupe/55 focus:outline-none transition-colors ${fieldClass(errors.addressLine)}`}
        />
      </AuthField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <AuthField label="Bina / Apartman" htmlFor="building" error={errors.building}>
          <AuthInput id="building" value={form.building ?? ""} onChange={(v) => set({ building: v })} error={errors.building} />
        </AuthField>
        <AuthField label="Kat" htmlFor="floor" error={errors.floor}>
          <AuthInput id="floor" value={form.floor ?? ""} onChange={(v) => set({ floor: v })} error={errors.floor} />
        </AuthField>
        <AuthField label="Daire" htmlFor="apartment" error={errors.apartment}>
          <AuthInput id="apartment" value={form.apartment ?? ""} onChange={(v) => set({ apartment: v })} error={errors.apartment} />
        </AuthField>
      </div>

      <AuthField label="Adres Tarifi" htmlFor="note" error={errors.note}>
        <AuthInput
          id="note"
          value={form.note ?? ""}
          onChange={(v) => set({ note: v })}
          error={errors.note}
          placeholder="Giriş kapısı yanındaki güvenliğe bırakabilirsiniz."
        />
      </AuthField>

      {initial?.isDefault ? (
        <p className="font-sans text-[12.5px] text-taupe">
          Bu adres varsayılan adresiniz. Varsayılanı değiştirmek için başka bir adresi varsayılan yapın.
        </p>
      ) : (
        <AuthCheckbox id="isDefault" checked={Boolean(form.isDefault)} onChange={(c) => set({ isDefault: c })}>
          Bu adresi varsayılan yap
        </AuthCheckbox>
      )}

      {failed && (
        <p role="alert" className="font-sans text-[13px] text-chocolate-light">
          {failed}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={onCancel} className="font-sans text-[14px] font-semibold text-burgundy hover:text-chocolate-light">
          Vazgeç
        </button>
        <div className="sm:w-auto">
          <SubmitButton loading={saving} loadingLabel="Kaydediliyor…">
            {initial ? "Adresi Güncelle" : "Adresi Kaydet"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}

function AddressCard({
  address,
  busy,
  onEdit,
  onDelete,
}: {
  address: AccountAddress;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const extra = [address.building, address.floor && `Kat ${address.floor}`, address.apartment && `Daire ${address.apartment}`].filter(Boolean);
  // said only once the zone map is loaded (D49)
  const { areasReady } = useDelivery();
  const served = !areasReady || isServiceArea(address.district, address.neighborhood);

  return (
    <div className="rounded-lg border border-sand-light p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-sans text-[14px] font-semibold text-espresso">{address.label}</p>
        {address.isDefault && (
          <span className="shrink-0 rounded-sm bg-burgundy/[0.08] px-2 py-0.5 font-sans text-[11px] font-semibold text-burgundy">
            Varsayılan
          </span>
        )}
      </div>
      <p className="mt-1.5 font-sans text-[13.5px] text-warm-brown">
        {address.district} / {address.neighborhood}
      </p>
      <p className="font-sans text-[13.5px] text-taupe">{address.addressLine}</p>
      {extra.length > 0 && <p className="font-sans text-[12.5px] text-taupe">{extra.join(" · ")}</p>}
      {!served && (
        <p className="mt-1 font-sans text-[12.5px] text-chocolate-light">Bu bölgeye şu an teslimat yapılmıyor; siparişte seçilemez.</p>
      )}
      <div className="mt-3 flex items-center gap-3 font-sans text-[13px]">
        <button type="button" onClick={onEdit} disabled={busy} className="font-semibold text-burgundy hover:text-chocolate-light disabled:opacity-50">
          Düzenle
        </button>
        <span className="text-sand" aria-hidden>
          ·
        </span>
        <button type="button" onClick={onDelete} disabled={busy} className="text-taupe hover:text-burgundy disabled:opacity-50">
          Sil
        </button>
      </div>
    </div>
  );
}

/** Saved addresses (D24): at most 10, one default; every change is the database's answer. */
export function AddressesView({ initialAddresses }: { initialAddresses: AccountAddress[] }) {
  const [addresses, setAddresses] = useState<AccountAddress[]>(initialAddresses);
  const [editing, setEditing] = useState<AccountAddress | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const full = addresses.length >= MAX_SAVED_ADDRESSES;

  const remove = async (id: string) => {
    if (busyId || !window.confirm("Bu adresi silmek istediğinize emin misiniz?")) return;
    setBusyId(id);
    setNotice(null);
    const result = await deleteAddress(id);
    setBusyId(null);
    if (result.ok) setAddresses(result.addresses);
    else setNotice(result.error);
  };

  if (editing) {
    return (
      <AddressForm
        initial={editing === "new" ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={(list) => {
          setAddresses(list);
          setEditing(null);
          setNotice("Adres kaydedildi.");
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {notice && (
        <p role="status" className="font-sans text-[13px] text-warm-brown">
          {notice}
        </p>
      )}

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-sand-light p-6 text-center md:p-10">
          <p className="font-serif text-[18px] font-semibold text-burgundy">Henüz kayıtlı adresiniz yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => (
            <AddressCard
              key={a.id}
              address={a}
              busy={busyId !== null}
              onEdit={() => {
                setNotice(null);
                setEditing(a);
              }}
              onDelete={() => remove(a.id)}
            />
          ))}
        </div>
      )}

      {full ? (
        <p className="font-sans text-[13px] text-taupe">
          En fazla {MAX_SAVED_ADDRESSES} adres kaydedebilirsiniz. Yeni adres için önce birini silin.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => {
            setNotice(null);
            setEditing("new");
          }}
          className="inline-flex rounded-md border border-burgundy/30 px-4 py-2.5 font-sans text-[13px] font-semibold text-burgundy transition-colors hover:bg-burgundy hover:text-cream-light"
        >
          Yeni Adres Ekle
        </button>
      )}
    </div>
  );
}
