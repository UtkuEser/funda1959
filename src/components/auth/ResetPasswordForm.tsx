"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PASSWORD_HINT, isValidPassword, setNewPassword } from "@/lib/auth";
import { AuthField, PasswordField, SubmitButton } from "./fields";

type Errors = Partial<Record<"newPassword" | "newPasswordRepeat", string>>;

/** /sifre-yenile — the new password after an e-mailed reset link (valid 15 minutes). */
export function ResetPasswordForm() {
  const router = useRouter();
  const [newPassword, setNewPasswordValue] = useState("");
  const [repeat, setRepeat] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!isValidPassword(newPassword)) e.newPassword = PASSWORD_HINT;
    if (repeat !== newPassword || repeat.length === 0) e.newPasswordRepeat = "Şifreler eşleşmiyor.";
    return e;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;
    const found = validate();
    setErrors(found);
    const first = (["newPassword", "newPasswordRepeat"] as const).find((k) => found[k]);
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const result = await setNewPassword({ newPassword });
    if (result.ok) {
      router.replace(result.redirect ?? "/hesabim");
      router.refresh();
      return;
    }
    setSubmitting(false);
    setFormError(result.error);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <AuthField label="Yeni Şifre" htmlFor="newPassword" error={errors.newPassword} hint={errors.newPassword ? undefined : PASSWORD_HINT}>
        <PasswordField
          id="newPassword"
          value={newPassword}
          onChange={setNewPasswordValue}
          error={errors.newPassword}
          autoComplete="new-password"
        />
      </AuthField>
      <AuthField label="Yeni Şifre Tekrar" htmlFor="newPasswordRepeat" error={errors.newPasswordRepeat}>
        <PasswordField
          id="newPasswordRepeat"
          value={repeat}
          onChange={setRepeat}
          error={errors.newPasswordRepeat}
          autoComplete="new-password"
        />
      </AuthField>

      {formError && (
        <p role="alert" className="font-sans text-[13px] text-chocolate-light">
          {formError}
        </p>
      )}

      <SubmitButton loading={submitting} loadingLabel="Kaydediliyor…">
        Şifremi Kaydet
      </SubmitButton>
    </form>
  );
}
