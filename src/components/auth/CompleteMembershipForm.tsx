"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeMembership, type MembershipTermsView } from "@/lib/auth";
import { formatPhone, isValidFullName, isValidPhone } from "@/lib/checkout-utils";
import { AuthCheckbox, AuthField, AuthInput, AuthNotice, SubmitButton } from "./fields";

type Errors = Partial<Record<"fullName" | "phone" | "acceptTerms", string>>;

/**
 * /uyelik-tamamla — name and phone for a signed-in account without a profile
 * (e.g. its profile couldn't be stored at sign-up, or a social sign-in that
 * gives no phone). The e-mail is the sign-in address and is only shown.
 */
export function CompleteMembershipForm({
  email,
  initialName,
  terms,
  next,
}: {
  email: string | null;
  initialName: string;
  terms: MembershipTermsView | null;
  next: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!isValidFullName(fullName)) e.fullName = "Ad ve soyadınızı girin.";
    if (!isValidPhone(phone)) e.phone = "Geçerli bir telefon numarası girin.";
    if (terms && !acceptTerms) e.acceptTerms = "Devam etmek için üyelik metinlerini onaylayın.";
    return e;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;
    const found = validate();
    setErrors(found);
    const first = (["fullName", "phone", "acceptTerms"] as const).find((k) => found[k]);
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const result = await completeMembership({ fullName: fullName.trim(), phone, next, ...(terms ? { acceptTerms } : {}) });
    if (result.ok) {
      router.replace(result.redirect ?? next);
      router.refresh();
      return;
    }
    setSubmitting(false);
    setFormError(result.error);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {!terms && (
        <AuthNotice>
          Test ortamı: üyelik metinleri henüz yayımlanmadı. Bu adımda onay alınmaz ve hiçbir onay kaydedilmez.
        </AuthNotice>
      )}
      {email && (
        <p className="font-sans text-[13.5px] text-warm-brown">
          Hesap e-postası: <span className="font-semibold text-espresso">{email}</span>
        </p>
      )}

      <AuthField label="Ad Soyad" htmlFor="fullName" error={errors.fullName}>
        <AuthInput id="fullName" value={fullName} onChange={setFullName} error={errors.fullName} autoComplete="name" />
      </AuthField>
      <AuthField label="Telefon" htmlFor="phone" error={errors.phone}>
        <AuthInput
          id="phone"
          value={phone}
          onChange={setPhone}
          onBlur={() => setPhone((p) => (p.trim() ? formatPhone(p) : p))}
          error={errors.phone}
          placeholder="05XX XXX XX XX"
          inputMode="tel"
          autoComplete="tel"
        />
      </AuthField>

      {terms && (
        <AuthCheckbox id="acceptTerms" checked={acceptTerms} onChange={setAcceptTerms} error={errors.acceptTerms}>
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

      <SubmitButton loading={submitting} loadingLabel="Kaydediliyor…">
        Üyeliği Tamamla
      </SubmitButton>
    </form>
  );
}
