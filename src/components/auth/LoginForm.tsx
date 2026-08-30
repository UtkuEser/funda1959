"use client";

import { useState } from "react";
import Link from "next/link";
import { identifierKind, signIn } from "@/lib/auth";
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

type Errors = Partial<Record<"identifier" | "password", string>>;

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    if (identifierKind(identifier) === "unknown")
      e.identifier = "Geçerli bir e-posta veya telefon numarası girin.";
    if (password.length === 0) e.password = "Şifrenizi girin.";
    return e;
  };

  const fieldError = (name: keyof Errors) =>
    touched[name] || errors[name] ? errors[name] : undefined;

  // Error appears only after the field holds a value and loses focus; empty
  // untouched fields stay clean until submit.
  const blur = (name: keyof Errors) => {
    const value = name === "identifier" ? identifier : password;
    if (!value) {
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
    setTouched({ identifier: true, password: true });
    const firstKey = (["identifier", "password"] as const).find((k) => found[k]);
    if (firstKey) {
      document.getElementById(firstKey)?.focus();
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const result = await signIn({ identifier: identifier.trim(), password, remember });
    setSubmitting(false);

    if (result.ok) {
      setDone(true);
    } else {
      setFormError(result.error);
    }
  };

  if (done) {
    return (
      <AuthSuccess
        title="Giriş bilgileriniz doğrulandı."
        text="Hesap sistemi kısa süre içinde etkinleştirilecektir. Şimdilik siparişlerinizi üye olmadan da tamamlayabilirsiniz."
      />
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
      <AuthField label="E-posta veya Telefon" htmlFor="identifier" error={fieldError("identifier")}>
        <AuthInput
          id="identifier"
          name="username"
          value={identifier}
          onChange={setIdentifier}
          onBlur={() => blur("identifier")}
          error={fieldError("identifier")}
          placeholder="ornek@email.com veya 05XX XXX XX XX"
          autoComplete="username"
        />
      </AuthField>

      <AuthField label="Şifre" htmlFor="password" error={fieldError("password")}>
        <PasswordField
          id="password"
          value={password}
          onChange={setPassword}
          onBlur={() => blur("password")}
          error={fieldError("password")}
          autoComplete="current-password"
        />
      </AuthField>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AuthCheckbox id="remember" checked={remember} onChange={setRemember}>
          Beni hatırla
        </AuthCheckbox>
        <Link
          href="/sifremi-unuttum"
          className="font-sans text-[13px] font-semibold text-burgundy hover:text-chocolate-light"
        >
          Şifremi unuttum
        </Link>
      </div>

      {formError && (
        <p role="alert" className="font-sans text-[13px] text-chocolate-light">
          {formError}
        </p>
      )}

      <SubmitButton loading={submitting} loadingLabel="Giriş Yapılıyor…">
        Giriş Yap
      </SubmitButton>
      </form>

      <AuthDivider label="veya" />
      <SocialAuthButtons mode="login" />
    </div>
  );
}
