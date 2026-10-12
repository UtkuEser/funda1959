"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PASSWORD_HINT, isValidPassword, signUp, type MembershipTermsView, type SocialAuthProvider } from "@/lib/auth";
import { formatPhone, isValidEmail, isValidFullName, isValidPhone } from "@/lib/checkout-utils";
import {
  AuthCheckbox,
  AuthDivider,
  AuthField,
  AuthInput,
  AuthNotice,
  AuthSuccess,
  PasswordField,
  SubmitButton,
} from "./fields";
import { SocialAuthButtons } from "./SocialAuthButtons";

type FieldName = "fullName" | "phone" | "email" | "password" | "passwordConfirm" | "acceptTerms";
type Errors = Partial<Record<FieldName, string>>;

export type RegisterStatus = "open" | "closed" | "unavailable";

/**
 * E-mail + password sign-up (D23: signed in right away, no e-mail
 * confirmation). Open only with test data (local + Preview) — real customers
 * wait for the published texts and a separate approval (D26).
 *
 * No consent box while no membership text is published: nothing may look
 * accepted that nobody could read. No marketing consent (D26).
 */
export function RegisterForm({
  status,
  terms,
  providers,
  next,
}: {
  status: RegisterStatus;
  terms: MembershipTermsView | null;
  providers: SocialAuthProvider[];
  next: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!isValidFullName(fullName)) e.fullName = "Ad ve soyadınızı girin.";
    if (!isValidPhone(phone)) e.phone = "Geçerli bir telefon numarası girin.";
    if (!isValidEmail(email)) e.email = "Geçerli bir e-posta adresi girin.";
    if (!isValidPassword(password)) e.password = PASSWORD_HINT;
    if (passwordConfirm !== password || passwordConfirm.length === 0) e.passwordConfirm = "Şifreler eşleşmiyor.";
    if (terms && !acceptTerms) e.acceptTerms = "Devam etmek için üyelik metinlerini onaylayın.";
    return e;
  };

  const err = (name: FieldName) => (touched[name] || errors[name] ? errors[name] : undefined);

  // Show a field error only after the user has actually entered a value and left
  // the field. Empty untouched inputs stay clean until submit.
  const blur = (name: FieldName) => {
    const filled: Record<FieldName, boolean> = {
      fullName: fullName.trim().length > 0,
      phone: phone.trim().length > 0,
      email: email.trim().length > 0,
      password: password.length > 0,
      passwordConfirm: passwordConfirm.length > 0,
      acceptTerms,
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
    if (submitting || status !== "open") return;

    const found = validate();
    setErrors(found);
    const order: FieldName[] = ["fullName", "phone", "email", "password", "passwordConfirm", "acceptTerms"];
    setTouched(Object.fromEntries(order.map((k) => [k, true])));
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
      ...(terms ? { acceptTerms } : {}),
      next,
    });
    if (result.ok && result.redirect) {
      router.replace(result.redirect);
      router.refresh();
      return;
    }
    setSubmitting(false);
    if (result.ok) setDoneMessage(result.message ?? "Hesabınız oluşturuldu.");
    else setFormError(result.error);
  };

  if (status !== "open") {
    return (
      <AuthNotice>
        {status === "closed"
          ? "Üyelik henüz açılmadı. Siparişinizi üye olmadan verebilirsiniz."
          : "Üyelik servisi şu an kullanılamıyor. Siparişinizi üye olmadan verebilirsiniz."}
      </AuthNotice>
    );
  }

  if (doneMessage) {
    return (
      <div className="space-y-4">
        <AuthSuccess title="Hesabınız oluşturuldu." text={doneMessage} />
        <p className="font-sans text-[13.5px] text-warm-brown">
          <Link href="/giris" className="font-semibold text-burgundy hover:text-chocolate-light">
            Giriş sayfasına git →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {providers.length > 0 && (
        <>
          <SocialAuthButtons providers={providers} next={next} />
          <AuthDivider label="veya e-posta ile" />
        </>
      )}

      {!terms && (
        <AuthNotice>
          Test ortamı: üyelik metinleri henüz yayımlanmadı. Bu kayıtta onay alınmaz ve hiçbir onay
          kaydedilmez.
        </AuthNotice>
      )}

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
          <AuthField label="Şifre" htmlFor="password" error={err("password")} hint={err("password") ? undefined : PASSWORD_HINT}>
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

        {terms && (
          <AuthCheckbox id="acceptTerms" checked={acceptTerms} onChange={setAcceptTerms} error={err("acceptTerms")}>
            <a href={terms.privacyNoticeHref} target="_blank" rel="noreferrer" className="font-semibold text-burgundy underline">
              Kişisel verilerin işlenmesine ilişkin aydınlatma metnini
            </a>{" "}
            okudum,{" "}
            <a href={terms.termsHref} target="_blank" rel="noreferrer" className="font-semibold text-burgundy underline">
              üyelik koşullarını
            </a>{" "}
            kabul ediyorum.
          </AuthCheckbox>
        )}

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
