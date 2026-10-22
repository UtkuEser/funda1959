import { branches } from "@/lib/data";
import { formatCartDate } from "@/lib/cart-utils";
import { reasonMessage } from "@/lib/availability";
import { addressDistricts, addressNeighborhoods } from "@/lib/delivery/zones";
import type { AccountAddress } from "@/lib/account-service";
import { isServiceArea } from "@/lib/customers/validation";
import { useDelivery } from "@/lib/delivery/context";
import { Field, RadioCard, SelectField, TextAreaField, TextField } from "./fields";
import type { AddressFields, CheckoutState, DeliveryErrors, DeliveryPatch, SlotOption } from "./CheckoutPage";

export function DeliveryStep({
  value,
  errors,
  minDate,
  slotOptions,
  slotNotice = null,
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
  /** today in Europe/Istanbul — earlier dates can't be chosen ("" before mount) */
  minDate: string;
  /** the windows for the chosen date; started / unavailable ones can't be chosen */
  slotOptions: SlotOption[];
  /** why no window can be chosen on that date, if so */
  slotNotice?: string | null;
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

        {/* Time */}
        <div className="border-t border-sand-light pt-6">
          <h3 className="font-sans text-[15px] font-semibold text-espresso">Teslimat Zamanı</h3>

          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-start">
            <div className="md:w-[34%] md:shrink-0">
              <Field label="Teslimat Tarihi" htmlFor="date" error={errors.date}>
                <input
                  id="date"
                  type="date"
                  value={value.date}
                  min={minDate || undefined}
                  onChange={(e) => onChange({ date: e.target.value, timeSlot: null })}
                  aria-invalid={errors.date ? true : undefined}
                  aria-describedby={errors.date ? "date-error" : undefined}
                  className={`h-12 w-full rounded-md border bg-cream-light px-3.5 font-sans text-[14px] text-espresso focus:outline-none ${
                    errors.date ? "border-chocolate-light/60" : "border-sand focus:border-burgundy"
                  }`}
                />
                {value.date && !errors.date && (
                  <p className="mt-1 font-sans text-[12px] text-taupe">
                    {formatCartDate(value.date)}
                  </p>
                )}
              </Field>
            </div>

            <div className="md:flex-1">
              <Field label="Saat Aralığı" htmlFor="timeSlot" error={errors.timeSlot}>
                <div
                  id="timeSlot"
                  className="flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-label="Teslimat saati"
                >
                  {slotOptions.map((slot) => {
                    const active = value.timeSlot === slot.label && slot.available;
                    return (
                      <button
                        key={slot.label}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={!slot.available}
                        title={slot.available ? undefined : reasonMessage(slot.reason)}
                        aria-label={slot.available ? undefined : `${slot.label}, seçilemez`}
                        onClick={() => onChange({ timeSlot: slot.label })}
                        className={`rounded-md border px-3 py-2 font-sans text-[13px] font-medium transition-colors ${
                          active
                            ? "border-burgundy bg-burgundy/[0.05] text-burgundy"
                            : slot.available
                              ? "border-sand text-warm-brown hover:border-burgundy/40"
                              : "cursor-not-allowed border-sand-light text-warm-brown/40"
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
                {slotNotice && <p className="mt-2 font-sans text-[12px] text-taupe">{slotNotice}</p>}
              </Field>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
