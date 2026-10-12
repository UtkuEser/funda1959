import { Field, TextField } from "./fields";
import type { ContactErrors, ContactInfo } from "./CheckoutPage";

export function ContactStep({
  value,
  errors,
  onChange,
  isMember = false,
}: {
  value: ContactInfo;
  errors: ContactErrors;
  onChange: (patch: Partial<ContactInfo>) => void;
  /** signed in: the fields came from the profile and the order goes to the account */
  isMember?: boolean;
}) {
  return (
    <section>
      <h2 className="font-serif text-[22px] md:text-[24px] font-semibold text-burgundy">
        İletişim Bilgileri
      </h2>
      <p className="mt-1.5 font-sans text-[13.5px] leading-relaxed text-warm-brown">
        Siparişinizle ilgili bilgilendirmeler için bu bilgileri kullanacağız.
      </p>

      <div className="mt-6 space-y-5">
        <Field label="Ad Soyad" htmlFor="fullName" error={errors.fullName}>
          <TextField
            id="fullName"
            value={value.fullName}
            onChange={(v) => onChange({ fullName: v })}
            placeholder="Ad Soyad"
            autoComplete="name"
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Telefon" htmlFor="phone" error={errors.phone}>
            <TextField
              id="phone"
              value={value.phone}
              onChange={(v) => onChange({ phone: v })}
              placeholder="05XX XXX XX XX"
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>

          <Field label="E-posta" htmlFor="email" error={errors.email}>
            <TextField
              id="email"
              value={value.email}
              onChange={(v) => onChange({ email: v })}
              placeholder="ornek@email.com"
              inputMode="email"
              type="email"
              autoComplete="email"
            />
          </Field>
        </div>
      </div>

      <p className="mt-5 font-sans text-[12.5px] text-taupe">
        {isMember
          ? "Bilgileriniz profilinizden dolduruldu; bu sipariş için değiştirebilirsiniz. Sipariş hesabınıza eklenecek."
          : "Üye olmadan sipariş verebilirsiniz."}
      </p>
    </section>
  );
}
