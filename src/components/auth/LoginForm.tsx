"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, type SocialAuthProvider } from "@/lib/auth";
import { isValidEmail } from "@/lib/checkout-utils";
import {
  AuthCheckbox,
  AuthDivider,
  AuthField,
  AuthInput,
  AuthNotice,
  PasswordField,
  SubmitButton,
} from "./fields";
import { SocialAuthButtons } from "./SocialAuthButtons";

type Errors = Partial<Record<"email" | "password", string>>;

/**
 * E-mail + password sign-in (D22 — no phone sign-in). `available` is false
 * when membership can't be used on this deployment (no Supabase Auth config,
 * wrong project): the form says so instead of pretending.
 */
export function LoginForm({
  available,
  providers,
  next,
  notice,
}: {
  available: boolean;
  providers: SocialAuthProvider[];
  next: string;
  notice?: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!isValidEmail(email)) e.email = "Geçerli bir e-posta adresi girin.";
    if (password.length === 0) e.password = "Şifrenizi girin.";
    return e;
  };

  const fieldError = (name: keyof Errors) =>
    touched[name] || errors[name] ? errors[name] : undefined;

  // Error appears only after the field holds a value and loses focus; empty
  // untouched fields stay clean until submit.
  const blur = (name: keyof Errors) => {
    const value = name === "email" ? email : password;
    if (!value) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
      return;
    }
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate()[name] }));
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting || !available) return;

    const found = validate();
    setErrors(found);
    setTouched({ email: true, password: true });
    const firstKey = (["email", "password"] as const).find((k) => found[k]);
    if (firstKey) {
      document.getElementById(firstKey)?.focus();
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const result = await signIn({ email: email.trim(), password, remember, next });
    if (result.ok) {
      router.replace(result.redirect ?? next);
      router.refresh();
      return;
    }
    setSubmitting(false);
    setFormError(result.error);
  };

  return (
    <div className="space-y-5">
      {notice && <AuthNotice>{notice}</AuthNotice>}
      {!available && (
        <AuthNotice>
          Üyelik servisi şu an kullanılamıyor. Siparişinizi üye olmadan verebilirsiniz.
        </AuthNotice>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <AuthField label="E-posta" htmlFor="email" error={fieldError("email")}>
          <AuthInput
            id="email"
            name="username"
            type="email"
            value={email}
            onChange={setEmail}
            onBlur={() => blur("email")}
            error={fieldError("email")}
            placeholder="ornek@email.com"
            inputMode="email"
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

        <SubmitButton loading={submitting} loadingLabel="Giriş Yapılıyor…" disabled={!available}>
          Giriş Yap
        </SubmitButton>
      </form>

      {providers.length > 0 && (
        <>
          <AuthDivider label="veya" />
          <SocialAuthButtons providers={providers} next={next} />
        </>
      )}
    </div>
  );
}
