import Link from "next/link";
import { branches } from "@/lib/data";
import { dateSlotText } from "@/lib/delivery/labels";
import { addressDistricts, addressNeighborhoods } from "@/lib/delivery/zones";
import type { AccountAddress } from "@/lib/account-service";
import { isServiceArea } from "@/lib/customers/validation";
import { useDelivery } from "@/lib/delivery/context";
import { Field, RadioCard, SelectField, TextAreaField, TextField } from "./fields";
import type { AddressFields, CheckoutState, DeliveryErrors, DeliveryPatch, ShippingTime } from "./CheckoutPage";

/**
 * "Gönderim Zamanı": the time the whole order goes out — the latest date and
 * window chosen for the cart's products. Shown, not chosen, here; a time
 * that doesn't work is changed in the cart.
 */
function ShippingTimeBox({ value }: { value: ShippingTime }) {
  const blocked = value.status === "blocked";
  return (
    <div
      id="shipTime"
      tabIndex={-1}
      className={`flex gap-3 rounded-lg border px-4 py-4 focus:outline-none ${
        blocked ? "border-chocolate-light/30 bg-chocolate-light/[0.05]" : "border-sand bg-cream-light"
      }`}
    >
      <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" className="mt-px h-5 w-5 shrink-0 text-burgundy">
        <circle cx="10" cy="10" r="8.25" strokeWidth={1.5} />
        <path d="M10 5.75v5.5" strokeWidth={1.75} strokeLinecap="round" />
        <circle cx="10" cy="14.1" r="1" fill="currentColor" stroke="none" />
      </svg>
      <div className="min-w-0">
        <h3 className="font-sans text-[15px] font-semibold text-espresso">Gönderim Zamanı</h3>
        {value.date && value.slotLabel && (
          <p className="mt-1 font-sans text-[16px] font-semibold text-burgundy">{dateSlotText(value.date, value.slotLabel)}</p>
        )}
        <div aria-live="polite">
          {blocked ? (
            <>
              <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-chocolate-light">{value.problem}</p>
              {value.editInCart && (
                <Link
                  href="/sepet"
                  className="mt-2 inline-block font-sans text-[13px] font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-2 hover:decoration-burgundy"
                >
                  Sepette teslimat zamanlarını düzenle
                </Link>
              )}
            </>
          ) : (
            value.date && (
              <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-warm-brown">
                {value.mixed
                  ? "Sepetinizde farklı teslimat zamanları bulunan ürünler var. Tüm ürünleriniz en geç seçilen zamana göre birlikte gönderilecektir."
                  : "Tüm ürünleriniz birlikte gönderilecektir."}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function DeliveryStep({
  value,
  errors,
  shipping,
  onChange,
  onAddressChange,
  onDistrictChange,
  onNeighborhoodChange,
  regionNotice,
  savedAddresses = [],
  savedAddressId = null,
  onSavedAddressChange,
}: {
  value: CheckoutState;
  errors: DeliveryErrors;
  /** the cart's shipping time and whether the order can go out then */
  shipping: ShippingTime;
  onChange: (patch: DeliveryPatch) => void;
  onAddressChange: (patch: Partial<AddressFields>) => void;
  /** district / neighbourhood live in the shared delivery context (header, home page) */
  onDistrictChange: (district: string) => void;
  onNeighborhoodChange: (neighborhood: string) => void;
  /** what a region change did to the branch / the chosen date and time */
  regionNotice: string | null;
  /** a signed-in member's saved addresses (D24); empty for guests */
  savedAddresses?: AccountAddress[];
  savedAddressId?: string | null;
  onSavedAddressChange?: (id: string) => void;
}) {
  const isPickup = value.deliveryType === "pickup";
  const district = value.address.district;
  // a saved address is marked "teslimat yok" only once the zone map is loaded (D49)
  const { areasReady } = useDelivery();
  // same lists as the site-wide address picker: the loaded areas (D50), read again once they have loaded
  const districts = areasReady ? addressDistricts() : [];
  const neighborhoods = areasReady && district ? addressNeighborhoods(district) : [];

  return (
    <section>
      <h2 className="font-serif text-[22px] md:text-[24px] font-semibold text-burgundy">
        Teslimat Tercihi
      </h2>
      <p className="mt-1.5 font-sans text-[13.5px] leading-relaxed text-warm-brown">
        Bu siparişteki tüm ürünler seçtiğiniz teslimat planına göre hazırlanacaktır.
      </p>

      <div className="mt-6 space-y-6">
        {/* Type */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <RadioCard
            name="deliveryType"
            value="delivery"
            checked={value.deliveryType === "delivery"}
            onChange={() => onChange({ deliveryType: "delivery" })}
          >
            <p className="font-sans text-[14px] font-semibold text-espresso">Adrese Teslim</p>
            <p className="mt-0.5 font-sans text-[12.5px] text-taupe">Belirttiğiniz adrese getirilir</p>
          </RadioCard>
          <RadioCard
            name="deliveryType"
            value="pickup"
            checked={isPickup}
            onChange={() => onChange({ deliveryType: "pickup" })}
          >
            <p className="font-sans text-[14px] font-semibold text-espresso">Mağazadan Teslim</p>
            <p className="mt-0.5 font-sans text-[12.5px] text-taupe">Seçtiğiniz mağazadan alırsınız</p>
          </RadioCard>
        </div>

        {/* Address */}
        {!isPickup && (
          <div className="space-y-5">
            <h3 className="font-sans text-[15px] font-semibold text-espresso">Teslimat Adresi</h3>

            {savedAddresses.length > 0 && onSavedAddressChange && (
              <Field label="Kayıtlı Adreslerim" htmlFor="savedAddress" optional>
                <select
                  id="savedAddress"
                  value={savedAddressId ?? ""}
                  onChange={(e) => onSavedAddressChange(e.target.value)}
                  className="h-12 w-full rounded-md border border-sand bg-cream-light px-3.5 font-sans text-[14px] text-espresso focus:border-burgundy focus:outline-none"
                >
                  <option value="">Kayıtlı adres seçin veya aşağıya yazın</option>
                  {savedAddresses.map((a) => {
                    const served = !areasReady || isServiceArea(a.district, a.neighborhood);
                    return (
                      <option key={a.id} value={a.id} disabled={!served}>
                        {a.label} — {a.district} / {a.neighborhood}
                        {a.isDefault ? " (varsayılan)" : ""}
                        {served ? "" : " · teslimat yok"}
                      </option>
                    );
                  })}
                </select>
              </Field>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="İlçe" htmlFor="district" error={errors.district}>
                <SelectField
                  id="district"
                  value={district}
                  onChange={onDistrictChange}
                  placeholder="İlçe seçin"
                  options={districts}
                />
              </Field>
              <Field label="Mahalle" htmlFor="neighborhood" error={errors.neighborhood}>
                <SelectField
                  id="neighborhood"
                  value={value.address.neighborhood}
                  onChange={onNeighborhoodChange}
                  placeholder={district ? "Mahalle seçin" : "Önce ilçe seçin"}
                  options={neighborhoods}
                  disabled={!district}
                />
              </Field>
            </div>
            {regionNotice && (
              <p role="status" className="-mt-2 font-sans text-[12.5px] leading-relaxed text-warm-brown">
                {regionNotice}
              </p>
            )}

            <Field label="Açık Adres" htmlFor="addressLine" error={errors.addressLine}>
              <TextAreaField
                id="addressLine"
                value={value.address.addressLine}
                onChange={(v) => onAddressChange({ addressLine: v })}
                placeholder="Sokak, cadde, bina adı ve numarası"
              />
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Field label="Bina / Apartman" htmlFor="building" optional>
                <TextField
                  id="building"
                  value={value.address.building}
                  onChange={(v) => onAddressChange({ building: v })}
                />
              </Field>
              <Field label="Kat" htmlFor="floor" optional>
                <TextField
                  id="floor"
                  value={value.address.floor}
                  onChange={(v) => onAddressChange({ floor: v })}
                />
              </Field>
              <Field label="Daire" htmlFor="apartment" optional>
                <TextField
                  id="apartment"
                  value={value.address.apartment}
                  onChange={(v) => onAddressChange({ apartment: v })}
                />
              </Field>
            </div>
            <Field label="Adres Tarifi" htmlFor="addressNote" optional>
              <TextAreaField
                id="addressNote"
                rows={2}
                value={value.address.note}
                onChange={(v) => onAddressChange({ note: v })}
                placeholder="Giriş kapısı yanındaki güvenliğe bırakabilirsiniz."
              />
            </Field>
          </div>
        )}

        {/* Branch */}
        {isPickup && (
          <Field label="Teslim Alacağınız Mağaza" htmlFor="branch" error={errors.branch}>
            <div id="branch" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {branches.map((b) => (
                <RadioCard
                  key={b.id}
                  name="branch"
                  value={b.id}
                  checked={value.branch === b.id}
                  onChange={(v) => onChange({ branch: v })}
                >
                  <p className="font-sans text-[14px] font-semibold text-espresso">{b.shortName}</p>
                  <p className="mt-0.5 font-sans text-[12px] text-taupe">{b.neighborhood}</p>
                </RadioCard>
              ))}
            </div>
          </Field>
        )}

        {/* Shipping time — from the cart, not chosen here */}
        <div className="border-t border-sand-light pt-6">
          <ShippingTimeBox value={shipping} />
        </div>
      </div>
    </section>
  );
}
