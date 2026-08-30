import type { CartItem } from "@/lib/cart";
import { branchName, formatCartDate, formatTL, itemTotal } from "@/lib/cart-utils";
import { formatPhone } from "@/lib/checkout-utils";
import { Field, TextAreaField } from "./fields";
import type { CheckoutState } from "./CheckoutPage";

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 font-sans text-[13px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
    >
      Düzenle
    </button>
  );
}

function Block({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-sand-light p-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-sans text-[14px] font-semibold text-espresso">{title}</h3>
        <EditButton onClick={onEdit} />
      </div>
      <div className="mt-2 font-sans text-[13.5px] leading-relaxed text-warm-brown">{children}</div>
    </div>
  );
}

export function ReviewStep({
  state,
  items,
  onEditStep,
  onNoteChange,
}: {
  state: CheckoutState;
  items: CartItem[];
  onEditStep: (index: number) => void;
  onNoteChange: (value: string) => void;
}) {
  const { contact, deliveryType, branch, address, date, timeSlot } = state;

  return (
    <section>
      <h2 className="font-serif text-[22px] md:text-[24px] font-semibold text-burgundy">
        Siparişinizi Kontrol Edin
      </h2>

      <div className="mt-6 space-y-4">
        <Block title="İletişim" onEdit={() => onEditStep(0)}>
          <p>{contact.fullName}</p>
          <p>{formatPhone(contact.phone)}</p>
          <p>{contact.email}</p>
        </Block>

        <Block title="Teslimat" onEdit={() => onEditStep(1)}>
          {deliveryType === "pickup" ? (
            <>
              <p className="font-medium text-espresso">Mağazadan Teslim</p>
              <p>{branch ? branchName(branch) : "—"}</p>
            </>
          ) : (
            <>
              <p className="font-medium text-espresso">Adrese Teslim</p>
              <p>
                {address.district}
                {address.neighborhood ? ` · ${address.neighborhood}` : ""}
              </p>
              <p>{address.addressLine}</p>
              {(address.building || address.floor || address.apartment) && (
                <p>
                  {[address.building, address.floor && `Kat ${address.floor}`, address.apartment && `Daire ${address.apartment}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {address.note && <p className="text-taupe">{address.note}</p>}
            </>
          )}
          {date && (
            <p className="mt-1">
              {formatCartDate(date)}
              {timeSlot ? ` · ${timeSlot}` : ""}
            </p>
          )}
        </Block>
      </div>

      {/* Items */}
      <h3 className="mt-8 font-sans text-[14px] font-semibold text-espresso">Ürünler</h3>
      <div className="mt-3 border-t border-sand-light">
        {items.map((item) => {
          const { message, extras } = item.customization;
          return (
            <div key={item.id} className="flex gap-3 border-b border-sand-light py-4">
              <div
                className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-gradient-to-br ${item.image}`}
              >
                <span className="absolute inset-0 flex items-center justify-center font-serif text-lg text-espresso/15">
                  {item.productName.charAt(0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[14px] font-semibold text-espresso">{item.productName}</p>
                {item.variantLabel && (
                  <p className="font-sans text-[12.5px] text-warm-brown">{item.variantLabel}</p>
                )}
                {message && (
                  <p className="font-sans text-[12.5px] text-warm-brown">
                    Pasta yazısı: &ldquo;{message}&rdquo;
                  </p>
                )}
                {extras && extras.length > 0 && (
                  <p className="font-sans text-[12.5px] text-warm-brown">Ek: {extras.join(", ")}</p>
                )}
                <p className="font-sans text-[12.5px] text-taupe">{item.quantity} adet</p>
              </div>
              <span className="shrink-0 font-sans text-[14px] font-semibold text-burgundy">
                {formatTL(itemTotal(item))}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <Field label="Sipariş Notu" htmlFor="orderNote" optional>
          <TextAreaField
            id="orderNote"
            rows={2}
            value={state.orderNote}
            onChange={onNoteChange}
            placeholder="Sipariş geneliyle ilgili not ekleyebilirsiniz."
          />
        </Field>
      </div>
    </section>
  );
}
