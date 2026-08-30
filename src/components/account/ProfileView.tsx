"use client";

import { useState } from "react";
import type { AccountProfile } from "@/lib/account-service";
import { changePassword, updateProfile } from "@/lib/account-service";
import { PASSWORD_HINT, isValidPassword } from "@/lib/auth";
import { formatPhone, isValidEmail, isValidFullName, isValidPhone } from "@/lib/checkout-utils";
import {
  AuthField,
  AuthInput,
  AuthSuccess,
  PasswordField,
  SubmitButton,
} from "@/components/auth/fields";

/* -------------------------------------------------------------------------- */
/* Profil bilgileri                                                            */
/* -------------------------------------------------------------------------- */

type ProfileErrors = Partial<Record<"fullName" | "phone" | "email", string>>;

function ProfileForm({ profile }: { profile: AccountProfile }) {
  const [form, setForm] = useState<AccountProfile>({ ...profile });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const set = (patch: Partial<AccountProfile>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDone(null);
    setFailed(null);
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k as keyof ProfileErrors];
      return next;
    });
  };

  const validate = (): ProfileErrors => {
    const e: ProfileErrors = {};
    if (!isValidFullName(form.fullName)) e.fullName = "Ad ve soyadınızı girin.";
    if (!isValidPhone(form.phone)) e.phone = "Geçerli bir telefon numarası girin.";
    if (!isValidEmail(form.email)) e.email = "Geçerli bir e-posta adresi girin.";
    return e;
  };

  const blur = (name: keyof ProfileErrors) => {
    if (name === "phone" && form.phone.trim()) {
      setForm((f) => ({ ...f, phone: formatPhone(f.phone) }));
    }
    setErrors((prev) => ({ ...prev, [name]: validate()[name] }));
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (saving) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = (["fullName", "phone", "email"] as const).find((k) => found[k]);
      if (first) document.getElementById(first)?.focus();
      return;
    }
    setSaving(true);
    setFailed(null);
    // TODO: Supabase — updateProfile persists nothing in TUR 2.
    const result = await updateProfile(form);
    setSaving(false);
    if (result.ok) setDone(result.message ?? "Bilgileriniz kaydedilmeye hazır.");
    else setFailed(result.error);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <AuthField label="Ad Soyad" htmlFor="fullName" error={errors.fullName}>
        <AuthInput
          id="fullName"
          value={form.fullName}
          onChange={(v) => set({ fullName: v })}
          onBlur={() => blur("fullName")}
          error={errors.fullName}
          autoComplete="name"
        />
      </AuthField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <AuthField label="Telefon" htmlFor="phone" error={errors.phone}>
          <AuthInput
            id="phone"
            value={form.phone}
            onChange={(v) => set({ phone: v })}
            onBlur={() => blur("phone")}
            error={errors.phone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="05XX XXX XX XX"
          />
        </AuthField>

        <AuthField label="E-posta" htmlFor="email" error={errors.email}>
          <AuthInput
            id="email"
            value={form.email}
            onChange={(v) => set({ email: v })}
            onBlur={() => blur("email")}
            error={errors.email}
            type="email"
            inputMode="email"
            autoComplete="email"
          />
        </AuthField>
      </div>

      {done && <AuthSuccess title="Hazır" text={done} />}
      {failed && (
        <p role="alert" className="font-sans text-[13px] text-chocolate-light">
          {failed}
        </p>
      )}

      <div className="sm:max-w-[240px]">
        <SubmitButton loading={saving} loadingLabel="Kaydediliyor…">
          Bilgileri Kaydet
        </SubmitButton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Şifre değiştir                                                              */
/* -------------------------------------------------------------------------- */

type PwState = { currentPassword: string; newPassword: string; newPasswordRepeat: string };
type PwErrors = Partial<Record<keyof PwState, string>>;

const EMPTY_PW: PwState = { currentPassword: "", newPassword: "", newPasswordRepeat: "" };

function PasswordChangeForm() {
  const [form, setForm] = useState<PwState>(EMPTY_PW);
  const [errors, setErrors] = useState<PwErrors>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const set = (patch: Partial<PwState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDone(null);
    setFailed(null);
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k as keyof PwErrors];
      return next;
    });
  };

  const validate = (): PwErrors => {
    const e: PwErrors = {};
    if (form.currentPassword.length === 0) e.currentPassword = "Mevcut şifrenizi girin.";
    if (!isValidPassword(form.newPassword)) e.newPassword = PASSWORD_HINT;
    if (form.newPasswordRepeat !== form.newPassword)
      e.newPasswordRepeat = "Şifreler eşleşmiyor.";
    return e;
  };

  const blur = (name: keyof PwState) => {
    setErrors((prev) => ({ ...prev, [name]: validate()[name] }));
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (saving) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = (["currentPassword", "newPassword", "newPasswordRepeat"] as const).find(
        (k) => found[k],
      );
      if (first) document.getElementById(first)?.focus();
      return;
    }
    setSaving(true);
    setFailed(null);
    // TODO: Supabase — supabase.auth.updateUser({ password }). Nothing changes in TUR 2.
    const result = await changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    setSaving(false);
    if (result.ok) {
      setDone(result.message ?? "Şifreniz güncellenmeye hazır.");
      setForm(EMPTY_PW);
    } else {
      setFailed(result.error);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <AuthField label="Mevcut Şifre" htmlFor="currentPassword" error={errors.currentPassword}>
        <PasswordField
          id="currentPassword"
          value={form.currentPassword}
          onChange={(v) => set({ currentPassword: v })}
          onBlur={() => blur("currentPassword")}
          error={errors.currentPassword}
          autoComplete="current-password"
        />
      </AuthField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <AuthField
          label="Yeni Şifre"
          htmlFor="newPassword"
          error={errors.newPassword}
          hint={PASSWORD_HINT}
        >
          <PasswordField
            id="newPassword"
            value={form.newPassword}
            onChange={(v) => set({ newPassword: v })}
            onBlur={() => blur("newPassword")}
            error={errors.newPassword}
            autoComplete="new-password"
          />
        </AuthField>

        <AuthField
          label="Yeni Şifre Tekrar"
          htmlFor="newPasswordRepeat"
          error={errors.newPasswordRepeat}
        >
          <PasswordField
            id="newPasswordRepeat"
            value={form.newPasswordRepeat}
            onChange={(v) => set({ newPasswordRepeat: v })}
            onBlur={() => blur("newPasswordRepeat")}
            error={errors.newPasswordRepeat}
            autoComplete="new-password"
          />
        </AuthField>
      </div>

      {done && <AuthSuccess title="Hazır" text={done} />}
      {failed && (
        <p role="alert" className="font-sans text-[13px] text-chocolate-light">
          {failed}
        </p>
      )}

      <div className="sm:max-w-[240px]">
        <SubmitButton loading={saving} loadingLabel="Gönderiliyor…">
          Şifreyi Değiştir
        </SubmitButton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

export function ProfileView({ profile }: { profile: AccountProfile }) {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-sans text-[15px] font-semibold text-espresso">İletişim Bilgileri</h2>
        <p className="mt-1 font-sans text-[13px] text-taupe">
          Bu bilgiler siparişlerinizde ön tanımlı olarak kullanılır.
        </p>
        <div className="mt-5">
          <ProfileForm profile={profile} />
        </div>
      </section>

      <section className="border-t border-sand-light pt-10">
        <h2 className="font-sans text-[15px] font-semibold text-espresso">Şifre Değiştir</h2>
        <p className="mt-1 font-sans text-[13px] text-taupe">
          Güvenliğiniz için şifrenizi düzenli olarak güncelleyin.
        </p>
        <div className="mt-5">
          <PasswordChangeForm />
        </div>
      </section>
    </div>
  );
}
