"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth";
import { isValidEmail } from "@/lib/checkout-utils";
import { AuthField, AuthInput, AuthSuccess, SubmitButton } from "./fields";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const emailError = touched && !isValidEmail(email) ? "Geçerli bir e-posta adresi girin." : undefined;

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;

    setTouched(true);
    if (!isValidEmail(email)) {
      setError("Geçerli bir e-posta adresi girin.");
      document.getElementById("email")?.focus();
      return;
    }

    setSubmitting(true);
    setError(undefined);
    const result = await requestPasswordReset({ email: email.trim() });
    setSubmitting(false);

    if (result.ok) setDone(true);
    else setError(result.error);
  };

  if (done) {
    return (
      <div className="space-y-4">
        <AuthSuccess
          title="E-postanızı kontrol edin."
          text="Bu adresle ilişkili bir hesap varsa, şifre sıfırlama bağlantısını kısa süre içinde e-posta ile göndereceğiz."
        />
        <p className="font-sans text-[13.5px]">
          <Link href="/giris" className="font-semibold text-burgundy hover:text-chocolate-light">
            ← Giriş Sayfasına Dön
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <AuthField label="E-posta" htmlFor="email" error={emailError ?? error}>
        <AuthInput
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          onBlur={() => setTouched(true)}
          error={emailError ?? error}
          placeholder="ornek@email.com"
          inputMode="email"
          autoComplete="email"
        />
      </AuthField>

      <SubmitButton loading={submitting} loadingLabel="Gönderiliyor…">
        Sıfırlama Bağlantısı Gönder
      </SubmitButton>

      <p className="font-sans text-[13.5px]">
        <Link href="/giris" className="font-semibold text-burgundy hover:text-chocolate-light">
          ← Giriş Sayfasına Dön
        </Link>
      </p>
    </form>
  );
}
