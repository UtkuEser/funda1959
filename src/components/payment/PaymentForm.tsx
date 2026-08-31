"use client";

import { Field } from "@/components/checkout/fields";

/* -------------------------------------------------------------------------- */
/* Card form model + pure helpers                                             */
/*                                                                            */
/* This is a PREVIEW form only. No validation here asserts a card is really   */
/* valid or chargeable — it only checks basic shape for UX. Card data lives   */
/* exclusively in React state (see PaymentPage) and is never persisted, sent  */
/* to any API, logged, or placed in an order payload.                         */
/* -------------------------------------------------------------------------- */

export type CardFormValue = {
  name: string;
  number: string;
  expiry: string;
  cvv: string;
};

export type CardFormErrors = Partial<Record<keyof CardFormValue, string>>;

export const EMPTY_CARD: CardFormValue = { name: "", number: "", expiry: "", cvv: "" };

/** "0000 0000 0000 0000" */
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})(?=.)/g, "$1 ");
}

/** "AA / YY" */
export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export function validateCard(v: CardFormValue): CardFormErrors {
  const e: CardFormErrors = {};

  if (v.name.trim().length < 3) e.name = "Kart üzerindeki ismi girin.";

  const digits = v.number.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) e.number = "Kart numarasını kontrol edin.";

  const exp = v.expiry.replace(/\D/g, "");
  if (exp.length !== 4) {
    e.expiry = "Son kullanma tarihini AA / YY biçiminde girin.";
  } else {
    const month = Number(exp.slice(0, 2));
    if (month < 1 || month > 12) e.expiry = "Ay 01 ile 12 arasında olmalı.";
  }

  const cvv = v.cvv.replace(/\D/g, "");
  if (cvv.length < 3 || cvv.length > 4) e.cvv = "CVV 3 veya 4 haneli olmalı.";

  return e;
}

/* -------------------------------------------------------------------------- */

const inputClass =
  "h-12 w-full rounded-md border bg-cream-light px-3.5 font-sans text-[14px] text-espresso placeholder:text-taupe/55 transition-colors focus:outline-none";

function border(error?: string) {
  return error ? "border-chocolate-light/60" : "border-sand focus:border-burgundy";
}

export function PaymentForm({
  value,
  errors,
  onChange,
  onBlurField,
}: {
  value: CardFormValue;
  errors: CardFormErrors;
  onChange: (patch: Partial<CardFormValue>) => void;
  onBlurField: (field: keyof CardFormValue) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-[18px] font-semibold text-burgundy">Ödeme Yöntemi</h2>
        <span className="font-sans text-[12px] text-taupe">Kredi / Banka Kartı</span>
      </div>

      <div className="mt-4 space-y-4">
        <Field label="Kart Üzerindeki İsim" htmlFor="cc-name" error={errors.name}>
          <input
            id="cc-name"
            type="text"
            autoComplete="cc-name"
            value={value.name}
            onChange={(e) => onChange({ name: e.target.value })}
            onBlur={() => onBlurField("name")}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "cc-name-error" : undefined}
            className={`${inputClass} ${border(errors.name)}`}
          />
        </Field>

        <Field label="Kart Numarası" htmlFor="cc-number" error={errors.number}>
          <input
            id="cc-number"
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            value={value.number}
            onChange={(e) => onChange({ number: formatCardNumber(e.target.value) })}
            onBlur={() => onBlurField("number")}
            aria-invalid={errors.number ? true : undefined}
            aria-describedby={errors.number ? "cc-number-error" : undefined}
            className={`${inputClass} tracking-[0.04em] ${border(errors.number)}`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Son Kullanma" htmlFor="cc-exp" error={errors.expiry}>
            <input
              id="cc-exp"
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="AA / YY"
              value={value.expiry}
              onChange={(e) => onChange({ expiry: formatExpiry(e.target.value) })}
              onBlur={() => onBlurField("expiry")}
              aria-invalid={errors.expiry ? true : undefined}
              aria-describedby={errors.expiry ? "cc-exp-error" : undefined}
              className={`${inputClass} ${border(errors.expiry)}`}
            />
          </Field>

          <Field label="CVV" htmlFor="cc-csc" error={errors.cvv}>
            <input
              id="cc-csc"
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              maxLength={4}
              value={value.cvv}
              onChange={(e) => onChange({ cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              onBlur={() => onBlurField("cvv")}
              aria-invalid={errors.cvv ? true : undefined}
              aria-describedby={errors.cvv ? "cc-csc-error" : undefined}
              className={`${inputClass} ${border(errors.cvv)}`}
            />
          </Field>
        </div>
      </div>

      <p className="mt-4 font-sans text-[12px] leading-relaxed text-taupe">
        Ödeme bilgileriniz güvenli ödeme altyapısı üzerinden işlenecektir.
      </p>
    </div>
  );
}
