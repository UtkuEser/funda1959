"use client";

import { useState } from "react";
import { ANKARA_DISTRICTS } from "@/lib/checkout-utils";
import type { AccountAddress, AccountAddressInput } from "@/lib/account-service";
import { AuthCheckbox, AuthField, AuthInput, SubmitButton } from "@/components/auth/fields";

const selectClass =
  "h-12 w-full rounded-md border bg-cream-light px-3.5 font-sans text-[14px] text-espresso focus:outline-none transition-colors";

type FormErrors = Partial<Record<"label" | "district" | "neighborhood" | "addressLine", string>>;

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

function AddressForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: AccountAddress | null;
  onCancel: () => void;
  onSave: (input: AccountAddressInput) => void;
}) {
  const [form, setForm] = useState<AccountAddressInput>(initial ? { ...initial } : { ...EMPTY });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<AccountAddressInput>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k as keyof FormErrors];
      return next;
    });
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.label.trim()) e.label = "Adres başlığı girin.";
    if (!form.district) e.district = "İlçe seçin.";
    if (!form.neighborhood.trim()) e.neighborhood = "Mahalle girin.";
    if (form.addressLine.trim().length < 10) e.addressLine = "Açık adres girin.";
    return e;
  };

  const err = (name: keyof FormErrors) =>
    touched[name] || errors[name] ? errors[name] : undefined;

  const blur = (name: keyof FormErrors) => {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate()[name] }));
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (saving) return;
    const found = validate();
    setErrors(found);
    setTouched({ label: true, district: true, neighborhood: true, addressLine: true });
    const first = (["label", "district", "neighborhood", "addressLine"] as const).find(
      (k) => found[k],
    );
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    setSaving(true);
    onSave({
      ...form,
      label: form.label.trim(),
      neighborhood: form.neighborhood.trim(),
      addressLine: form.addressLine.trim(),
      building: form.building?.trim() || undefined,
      floor: form.floor?.trim() || undefined,
      apartment: form.apartment?.trim() || undefined,
      note: form.note?.trim() || undefined,
    });
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="rounded-lg border border-sand-light p-5 space-y-5"
    >
      <p className="font-sans text-[15px] font-semibold text-espresso">
        {initial ? "Adresi Düzenle" : "Yeni Adres"}
      </p>

      <AuthField label="Adres Başlığı" htmlFor="label" error={err("label")}>
        <AuthInput
          id="label"
          value={form.label}
          onChange={(v) => set({ label: v })}
          onBlur={() => blur("label")}
          error={err("label")}
          placeholder="Ev, İş, Diğer…"
        />
      </AuthField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <AuthField label="İlçe" htmlFor="district" error={err("district")}>
          <select
            id="district"
            value={form.district}
            onChange={(e) => set({ district: e.target.value })}
            onBlur={() => blur("district")}
            aria-invalid={err("district") ? true : undefined}
            aria-describedby={err("district") ? "district-error" : undefined}
            className={`${selectClass} ${err("district") ? "border-chocolate-light/60" : "border-sand focus:border-burgundy"} ${form.district ? "" : "text-taupe/70"}`}
          >
            <option value="">İlçe seçin</option>
            {ANKARA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </AuthField>

        <AuthField label="Mahalle" htmlFor="neighborhood" error={err("neighborhood")}>
          <AuthInput
            id="neighborhood"
            value={form.neighborhood}
            onChange={(v) => set({ neighborhood: v })}
            onBlur={() => blur("neighborhood")}
            error={err("neighborhood")}
            placeholder="Mahalle"
          />
        </AuthField>
      </div>

      <AuthField label="Açık Adres" htmlFor="addressLine" error={err("addressLine")}>
        <textarea
          id="addressLine"
          value={form.addressLine}
          onChange={(e) => set({ addressLine: e.target.value })}
          onBlur={() => blur("addressLine")}
          rows={3}
          placeholder="Sokak, cadde, bina adı ve numarası"
          aria-invalid={err("addressLine") ? true : undefined}
          aria-describedby={err("addressLine") ? "addressLine-error" : undefined}
          className={`w-full resize-none rounded-md border bg-cream-light px-3.5 py-2.5 font-sans text-[14px] leading-relaxed text-espresso placeholder:text-taupe/55 focus:outline-none transition-colors ${err("addressLine") ? "border-chocolate-light/60" : "border-sand focus:border-burgundy"}`}
        />
      </AuthField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <AuthField label="Bina / Apartman" htmlFor="building">
          <AuthInput id="building" value={form.building ?? ""} onChange={(v) => set({ building: v })} />
        </AuthField>
        <AuthField label="Kat" htmlFor="floor">
          <AuthInput id="floor" value={form.floor ?? ""} onChange={(v) => set({ floor: v })} />
        </AuthField>
        <AuthField label="Daire" htmlFor="apartment">
          <AuthInput
            id="apartment"
            value={form.apartment ?? ""}
            onChange={(v) => set({ apartment: v })}
          />
        </AuthField>
      </div>

      <AuthField label="Adres Tarifi" htmlFor="note">
        <AuthInput
          id="note"
          value={form.note ?? ""}
          onChange={(v) => set({ note: v })}
          placeholder="Giriş kapısı yanındaki güvenliğe bırakabilirsiniz."
        />
      </AuthField>

      <AuthCheckbox
        id="isDefault"
        checked={Boolean(form.isDefault)}
        onChange={(c) => set({ isDefault: c })}
      >
        Bu adresi varsayılan yap
      </AuthCheckbox>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onCancel}
          className="font-sans text-[14px] font-semibold text-burgundy hover:text-chocolate-light"
        >
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
  onEdit,
  onDelete,
}: {
  address: AccountAddress;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const extra = [
    address.building,
    address.floor && `Kat ${address.floor}`,
    address.apartment && `Daire ${address.apartment}`,
  ].filter(Boolean);

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
      {extra.length > 0 && (
        <p className="font-sans text-[12.5px] text-taupe">{extra.join(" · ")}</p>
      )}
      <div className="mt-3 flex items-center gap-3 font-sans text-[13px]">
        <button
          type="button"
          onClick={onEdit}
          className="font-semibold text-burgundy hover:text-chocolate-light"
        >
          Düzenle
        </button>
        <span className="text-sand" aria-hidden>
          ·
        </span>
        <button type="button" onClick={onDelete} className="text-taupe hover:text-burgundy">
          Sil
        </button>
      </div>
    </div>
  );
}

export function AddressesView({ initialAddresses }: { initialAddresses: AccountAddress[] }) {
  const [addresses, setAddresses] = useState<AccountAddress[]>(initialAddresses);
  const [editing, setEditing] = useState<AccountAddress | "new" | null>(null);

  // TODO: swap for account-service saveAddress()/deleteAddress() -> Supabase.
  const save = (input: AccountAddressInput) => {
    setAddresses((prev) => {
      let next = [...prev];
      if (input.isDefault) next = next.map((a) => ({ ...a, isDefault: false }));
      if (editing && editing !== "new") {
        next = next.map((a) => (a.id === editing.id ? { ...a, ...input, id: a.id } : a));
      } else {
        next.push({ ...input, id: `addr-${next.length + 1}-${Math.random().toString(36).slice(2, 7)}` });
      }
      if (!next.some((a) => a.isDefault) && next.length > 0) next[0] = { ...next[0], isDefault: true };
      return next;
    });
    setEditing(null);
  };

  const remove = (id: string) => {
    if (!window.confirm("Bu adresi silmek istediğinize emin misiniz?")) return;
    setAddresses((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (!next.some((a) => a.isDefault) && next.length > 0) next[0] = { ...next[0], isDefault: true };
      return next;
    });
  };

  if (editing) {
    return (
      <AddressForm
        initial={editing === "new" ? null : editing}
        onCancel={() => setEditing(null)}
        onSave={save}
      />
    );
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 ? (
        <div className="rounded-lg border border-sand-light p-6 text-center md:p-10">
          <p className="font-serif text-[18px] font-semibold text-burgundy">
            Henüz kayıtlı adresiniz yok.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => (
            <AddressCard
              key={a.id}
              address={a}
              onEdit={() => setEditing(a)}
              onDelete={() => remove(a.id)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setEditing("new")}
        className="inline-flex rounded-md border border-burgundy/30 px-4 py-2.5 font-sans text-[13px] font-semibold text-burgundy transition-colors hover:bg-burgundy hover:text-cream-light"
      >
        Yeni Adres Ekle
      </button>
    </div>
  );
}
