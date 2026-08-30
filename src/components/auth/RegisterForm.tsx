"use client";

import { useState } from "react";
import Link from "next/link";
import { PASSWORD_HINT, isValidPassword, signUp } from "@/lib/auth";
import { formatPhone, isValidEmail, isValidFullName, isValidPhone } from "@/lib/checkout-utils";
import {
  AuthCheckbox,
  AuthDivider,
  AuthField,
  AuthInput,
  AuthSuccess,
  PasswordField,
  SubmitButton,
} from "./fields";
import { SocialAuthButtons } from "./SocialAuthButtons";

type FieldName =
  | "fullName"
  | "phone"
  | "email"
  | "password"
  | "passwordConfirm"
  | "consentKvkk";
type Errors = Partial<Record<FieldName, string>>;

export function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [consentKvkk, setConsentKvkk] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!isValidFullName(fullName)) e.fullName = "Ad ve soyadınızı girin.";
    if (!isValidPhone(phone)) e.phone = "Geçerli bir telefon numarası girin.";
    if (!isValidEmail(email)) e.email = "Geçerli bir e-posta adresi girin.";
    if (!isValidPassword(password)) e.password = PASSWORD_HINT;
    if (passwordConfirm !== password || passwordConfirm.length === 0)
      e.passwordConfirm = "Şifreler eşleşmiyor.";
    if (!consentKvkk) e.consentKvkk = "Devam etmek için bu onayı işaretleyin.";
    return e;
  };

  const err = (name: FieldName) =>
    touched[name] || errors[name] ? errors[name] : undefined;

  // Show a field error only after the user has actually entered a value and left
  // the field. Empty untouched inputs stay clean until submit.
  const blur = (name: FieldName) => {
    const filled: Record<FieldName, boolean> = {
      fullName: fullName.trim().length > 0,
      phone: phone.trim().length > 0,
      email: email.trim().length > 0,
      password: password.length > 0,
      passwordConfirm: passwordConfirm.length > 0,
      consentKvkk,
    };
    if (!filled[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
      return;
    }
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate()[name] }));
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;

    const found = validate();
    setErrors(found);
    setTouched({
      fullName: true,
      phone: true,
      email: true,
      password: true,
      passwordConfirm: true,
      consentKvkk: true,
    });
    const order: FieldName[] = [
      "fullName",
      "phone",
      "email",
      "password",
      "passwordConfirm",
      "consentKvkk",
    ];
    const firstKey = order.find((k) => found[k]);
    if (firstKey) {
      document.getElementById(firstKey)?.focus();
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const result = await signUp({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password,
      consentKvkk,
      consentMarketing,
    });
    setSubmitting(false);

    if (result.ok) setDone(true);
    else setFormError(result.error);
  };

  if (done) {
    return (
      <div className="space-y-4">
        <AuthSuccess
          title="Hesabınız oluşturulmaya hazır."
          text="Hesap sistemi kısa süre içinde etkinleştirilecektir. Şimdilik siparişlerinizi üye olmadan da tamamlayabilirsiniz."
        />
        <p className="font-sans text-[13.5px] text-warm-brown">
          <Link href="/giris" className="font-semibold text-burgundy hover:text-chocolate-light">
            Giriş sayfasına dön →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SocialAuthButtons mode="register" />
      <AuthDivider label="veya e-posta ile" />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
      <AuthField label="Ad Soyad" htmlFor="fullName" error={err("fullName")}>
        <AuthInput
          id="fullName"
          value={fullName}
          onChange={setFullName}
          onBlur={() => blur("fullName")}
          error={err("fullName")}
          placeholder="Ad Soyad"
          autoComplete="name"
        />
      </AuthField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AuthField label="Telefon" htmlFor="phone" error={err("phone")}>
          <AuthInput
            id="phone"
            value={phone}
            onChange={setPhone}
            onBlur={() => {
              setPhone((p) => (p.trim() ? formatPhone(p) : p));
              blur("phone");
            }}
            error={err("phone")}
            placeholder="05XX XXX XX XX"
            inputMode="tel"
            autoComplete="tel"
          />
        </AuthField>

        <AuthField label="E-posta" htmlFor="email" error={err("email")}>
          <AuthInput
            id="email"
            type="email"
            value={email}
            onChange={setEmail}
            onBlur={() => blur("email")}
            error={err("email")}
            placeholder="ornek@email.com"
            inputMode="email"
            autoComplete="email"
          />
        </AuthField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AuthField
          label="Şifre"
          htmlFor="password"
          error={err("password")}
          hint={err("password") ? undefined : PASSWORD_HINT}
        >
          <PasswordField
            id="password"
            value={password}
            onChange={setPassword}
            onBlur={() => blur("password")}
            error={err("password")}
            autoComplete="new-password"
          />
        </AuthField>

        <AuthField label="Şifre Tekrar" htmlFor="passwordConfirm" error={err("passwordConfirm")}>
          <PasswordField
            id="passwordConfirm"
            value={passwordConfirm}
            onChange={setPasswordConfirm}
            onBlur={() => blur("passwordConfirm")}
            error={err("passwordConfirm")}
            autoComplete="new-password"
          />
        </AuthField>
      </div>

      <div className="space-y-2.5 pt-0.5">
        <AuthCheckbox
          id="consentKvkk"
          checked={consentKvkk}
          onChange={setConsentKvkk}
          error={err("consentKvkk")}
        >
          Kişisel verilerimin işlenmesine ilişkin bilgilendirmeyi okudum ve üyelik koşullarını
          kabul ediyorum.
        </AuthCheckbox>
        {/* TODO: KVKK / Üyelik Koşulları hukuki route'ları eklendiğinde metne link ver. */}

        <AuthCheckbox id="consentMarketing" checked={consentMarketing} onChange={setConsentMarketing}>
          Kampanya ve yeniliklerden haberdar olmak istiyorum. (isteğe bağlı)
        </AuthCheckbox>
      </div>

      {formError && (
        <p role="alert" className="font-sans text-[13px] text-chocolate-light">
          {formError}
        </p>
      )}

      <SubmitButton loading={submitting} loadingLabel="Hesap Oluşturuluyor…">
        Üye Ol
      </SubmitButton>
      </form>
    </div>
  );
}
