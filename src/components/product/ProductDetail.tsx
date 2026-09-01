"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Container } from "@/components/shared/Container";
import { ProductGridCard } from "@/components/catalog/ProductGridCard";
import { addToCart } from "@/lib/cart";
import { branches, type ProductDetail as ProductDetailType } from "@/lib/data";

/** demo photo (public path) vs. a gradient class fragment */
const isPhoto = (src: string) => src.startsWith("/");

const VARIANT_TITLE: Record<string, string> = {
  serving: "Boyut Seçin",
  weight: "Ağırlık Seçin",
  pack: "Ambalaj Seçin",
  none: "",
};

const tl = (n: number) => `₺${n.toLocaleString("tr-TR")}`;

function badgesFor(p: ProductDetailType): string[] {
  const out: string[] = [];
  if (p.isBestSeller) out.push("Çok Satan");
  if (out.length < 2 && p.sameDayDelivery) out.push("Aynı Gün Teslim");
  if (out.length < 2 && p.customizable) out.push("Kişiye Özel");
  if (out.length < 2 && p.isNew) out.push("Yeni");
  return out.slice(0, 2);
}

export function ProductDetail({ product }: { product: ProductDetailType }) {
  const hasVariants = product.variants.length > 0;
  const showCakeFields = product.variantKind === "serving" || product.customizable;

  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [extras, setExtras] = useState<string[]>([]);
  const [deliveryType, setDeliveryType] = useState<"address" | "pickup">(
    product.availableDeliveryTypes[0] ?? "address",
  );
  const [branch, setBranch] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [minDate, setMinDate] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    // Depends on the viewer's wall clock, so it must run client-side only.
    const d = new Date();
    const addDays =
      product.preparationTimeHours >= 24 ? Math.ceil(product.preparationTimeHours / 24) : 0;
    d.setDate(d.getDate() + addDays);
    const pad = (n: number) => String(n).padStart(2, "0");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }, [product.preparationTimeHours]);

  const selectedVariant = useMemo(
    () => product.variants.find((v) => v.id === variantId) ?? null,
    [product.variants, variantId],
  );
  const unitPrice = selectedVariant?.price ?? product.basePrice;
  const total = unitPrice * qty;

  const needsBranch = deliveryType === "pickup";
  const showTimeSlots =
    Boolean(date) && (deliveryType === "address" || Boolean(needsBranch && branch));

  const cta = (() => {
    if (hasVariants && !variantId)
      return { disabled: true, label: product.variantKind === "serving" ? "Boyut Seçin" : "Seçenek Seçin" };
    if (needsBranch && !branch) return { disabled: true, label: "Mağaza Seçin" };
    if (!date) return { disabled: true, label: "Teslimat Tarihi Seçin" };
    if (showTimeSlots && !time) return { disabled: true, label: "Teslimat Saati Seçin" };
    return { disabled: false, label: added ? "Sepete Eklendi ✓" : "Sepete Ekle" };
  })();

  const toggleExtra = (o: string) =>
    setExtras((cur) => (cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]));

  const handleAdd = () => {
    if (cta.disabled) return;
    addToCart({
      productId: product.id,
      slug: product.slug,
      productName: product.name,
      categoryName: product.categoryName,
      image: product.images[0],
      selectedVariant: variantId,
      variantLabel: selectedVariant?.label ?? null,
      unitPrice,
      quantity: qty,
      quantityEnabled: product.quantityEnabled,
      customization: {
        message: message.trim() || undefined,
        note: note.trim() || undefined,
        extras,
      },
      deliveryType,
      deliveryDate: date || null,
      deliveryTime: showTimeSlots ? time : null,
      branch: needsBranch ? branch : null,
      addedAt: Date.now(),
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  };

  const badges = badgesFor(product);

  const accordion = [
    { title: "Ürün İçeriği", body: product.ingredients },
    { title: "Alerjen Bilgileri", body: product.allergens },
    { title: "Saklama & Tüketim", body: product.storageInfo },
    { title: "Teslimat Bilgileri", body: product.deliveryInfo },
  ];
  const [openAccordion, setOpenAccordion] = useState(0);

  return (
    <Container className="pt-24 pb-16 md:pt-28 md:pb-20">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 font-sans text-[12px] text-taupe">
        <Link href="/lezzetlerimiz" className="hover:text-burgundy">Lezzetlerimiz</Link>
        <span>/</span>
        <Link href={`/lezzetlerimiz/${product.categorySlug}`} className="hover:text-burgundy">
          {product.categoryName}
        </Link>
        <span>/</span>
        <span className="text-warm-brown">{product.name}</span>
      </nav>

      {/* Hero */}
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        {/* Gallery */}
        <div>
          {(() => {
            const current = product.images[activeImage];
            const photo = isPhoto(current);
            return (
              <div
                className={`relative aspect-[4/5] overflow-hidden rounded-lg bg-gradient-to-br ${
                  photo ? "bg-cream-dark" : current
                }`}
              >
                {photo ? (
                  <Image
                    src={current}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 92vw, 640px"
                    className="object-cover"
                  />
                ) : (
                  <>
                    <div
                      className="absolute inset-0"
                      style={{ background: `rgba(110,34,48,${activeImage * 0.045})` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.12]">
                      <span className="font-serif text-8xl text-espresso select-none">
                        {product.name.charAt(0)}
                      </span>
                    </div>
                    <span className="absolute bottom-3 left-4 font-sans text-[12px] text-espresso/50">
                      {product.imageLabels[activeImage]}
                    </span>
                  </>
                )}
              </div>
            );
          })()}

          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
              {product.images.map((img, i) => {
                const photo = isPhoto(img);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`${product.imageLabels[i]} görselini göster`}
                    className={`relative aspect-square overflow-hidden rounded-md bg-gradient-to-br ${
                      photo ? "bg-cream-dark" : img
                    } transition-opacity ${
                      i === activeImage ? "ring-2 ring-burgundy" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {photo ? (
                      <Image src={img} alt="" fill sizes="120px" className="object-cover" />
                    ) : (
                      <span
                        className="absolute inset-0"
                        style={{ background: `rgba(110,34,48,${i * 0.045})` }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Purchase panel */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-burgundy/55">
            {product.categoryName}
          </p>
          <h1 className="mt-2 font-serif text-[28px] md:text-[34px] font-semibold leading-[1.12] text-burgundy">
            {product.name}
          </h1>

          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span
                  key={b}
                  className="rounded-sm bg-burgundy/[0.07] px-2 py-0.5 font-sans text-[11px] font-semibold text-burgundy"
                >
                  {b}
                </span>
              ))}
            </div>
          )}

          <p className="mt-4 font-sans text-[14px] leading-relaxed text-warm-brown">
            {product.shortDescription}
          </p>

          <p className="mt-4 font-sans text-[24px] font-semibold text-burgundy">{tl(unitPrice)}</p>

          <div className="mt-7 space-y-6">
            {/* Variants */}
            {hasVariants && (
              <Field label={VARIANT_TITLE[product.variantKind]}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantId(v.id)}
                      className={`flex items-center justify-between rounded-md border px-3.5 py-3 text-left transition-colors ${
                        variantId === v.id
                          ? "border-burgundy bg-burgundy/[0.05]"
                          : "border-sand hover:border-burgundy/40"
                      }`}
                    >
                      <span className="font-sans text-[13.5px] font-medium text-espresso">{v.label}</span>
                      <span className="font-sans text-[13.5px] font-semibold text-burgundy">{tl(v.price)}</span>
                    </button>
                  ))}
                </div>
              </Field>
            )}

            {/* Cake message */}
            {product.customizable && product.maxCakeMessageLength && (
              <Field label="Pasta Üzerine Yazı">
                <input
                  type="text"
                  value={message}
                  maxLength={product.maxCakeMessageLength}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="İyi ki doğdun Ece"
                  className="w-full rounded-md border border-sand bg-cream-light px-3.5 py-2.5 font-sans text-[14px] text-espresso placeholder:text-taupe/60 focus:border-burgundy focus:outline-none"
                />
                <p className="mt-1 text-right font-sans text-[11px] text-taupe">
                  {message.length} / {product.maxCakeMessageLength}
                </p>
              </Field>
            )}

            {/* Order note */}
            {showCakeFields && (
              <Field label="Sipariş Notu">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Hazırlık veya teslimatla ilgili notunuzu ekleyebilirsiniz."
                  className="w-full resize-none rounded-md border border-sand bg-cream-light px-3.5 py-2.5 font-sans text-[14px] text-espresso placeholder:text-taupe/60 focus:border-burgundy focus:outline-none"
                />
              </Field>
            )}

            {/* Extra options */}
            {product.extraOptions.length > 0 && (
              <Field label="Ek Seçenekler">
                <div className="space-y-1.5">
                  {product.extraOptions.map((o) => (
                    <label
                      key={o}
                      className="flex min-h-[32px] cursor-pointer items-center gap-2.5 font-sans text-[13.5px] text-warm-brown"
                    >
                      <input
                        type="checkbox"
                        checked={extras.includes(o)}
                        onChange={() => toggleExtra(o)}
                        className="h-3.5 w-3.5 accent-burgundy"
                      />
                      {o}
                    </label>
                  ))}
                </div>
              </Field>
            )}

            {/* Delivery type */}
            <Field label="Nasıl teslim almak istersiniz?">
              <div className="grid grid-cols-2 gap-2">
                {product.availableDeliveryTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setDeliveryType(t);
                      setTime(null);
                    }}
                    className={`rounded-md border px-3 py-2.5 font-sans text-[13.5px] font-medium transition-colors ${
                      deliveryType === t
                        ? "border-burgundy bg-burgundy/[0.05] text-burgundy"
                        : "border-sand text-warm-brown hover:border-burgundy/40"
                    }`}
                  >
                    {t === "address" ? "Adrese Teslim" : "Mağazadan Teslim"}
                  </button>
                ))}
              </div>
              {deliveryType === "address" && (
                <p className="mt-2 font-sans text-[12px] text-taupe">
                  Teslimat uygunluğu adres bilgisi sırasında kontrol edilecektir.
                </p>
              )}
            </Field>

            {/* Branch (pickup) */}
            {needsBranch && (
              <Field label="Teslim Alacağınız Mağaza">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBranch(b.id);
                        setTime(null);
                      }}
                      className={`rounded-md border px-3 py-2.5 font-sans text-[13px] font-medium transition-colors ${
                        branch === b.id
                          ? "border-burgundy bg-burgundy/[0.05] text-burgundy"
                          : "border-sand text-warm-brown hover:border-burgundy/40"
                      }`}
                    >
                      {b.shortName}
                    </button>
                  ))}
                </div>
              </Field>
            )}

            {/* Delivery date */}
            <Field label="Teslimat Tarihi">
              <input
                type="date"
                value={date}
                min={minDate || undefined}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTime(null);
                }}
                className="w-full rounded-md border border-sand bg-cream-light px-3.5 py-2.5 font-sans text-[14px] text-espresso focus:border-burgundy focus:outline-none"
              />
              {product.preparationTimeHours >= 24 && (
                <p className="mt-1 font-sans text-[12px] text-taupe">
                  Bu ürün için en erken teslimat {Math.ceil(product.preparationTimeHours / 24)} gün sonrasıdır.
                </p>
              )}
            </Field>

            {/* Time slots */}
            {showTimeSlots && (
              <Field label="Teslimat Saati">
                <div className="flex flex-wrap gap-2">
                  {["10:00 – 12:00", "12:00 – 14:00", "14:00 – 16:00", "16:00 – 18:00", "18:00 – 20:00"].map(
                    (slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={`rounded-md border px-3 py-2 font-sans text-[13px] font-medium transition-colors ${
                          time === slot
                            ? "border-burgundy bg-burgundy/[0.05] text-burgundy"
                            : "border-sand text-warm-brown hover:border-burgundy/40"
                        }`}
                      >
                        {slot}
                      </button>
                    ),
                  )}
                </div>
              </Field>
            )}

            {/* Quantity */}
            {product.quantityEnabled && (
              <Field label="Adet">
                <div className="inline-flex items-center rounded-md border border-sand">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Azalt"
                    className="flex h-10 w-10 items-center justify-center text-burgundy hover:bg-cream"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-sans text-[14px] font-semibold text-espresso">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(20, q + 1))}
                    aria-label="Artır"
                    className="flex h-10 w-10 items-center justify-center text-burgundy hover:bg-cream"
                  >
                    +
                  </button>
                </div>
              </Field>
            )}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={cta.disabled}
            className={`mt-7 h-12 w-full rounded-md font-sans text-[15px] font-semibold transition-colors ${
              cta.disabled
                ? "cursor-not-allowed bg-burgundy/35 text-cream-light"
                : "bg-burgundy text-cream-light hover:bg-chocolate-light"
            }`}
          >
            {cta.label}
          </button>
          {qty > 1 && !cta.disabled && (
            <p className="mt-2 text-center font-sans text-[13px] text-warm-brown">
              Toplam <span className="font-semibold text-burgundy">{tl(total)}</span>
            </p>
          )}

          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[12px] text-taupe">
            <span>Günlük üretim</span>
            <span aria-hidden>·</span>
            <span>Özenli paketleme</span>
            <span aria-hidden>·</span>
            <span>Güvenli teslimat</span>
          </p>
        </div>
      </div>

      {/* Accordion */}
      <div className="mt-14 max-w-3xl border-t border-sand-light">
        {accordion.map((item, i) => {
          const open = openAccordion === i;
          return (
            <div key={item.title} className="border-b border-sand-light">
              <button
                type="button"
                onClick={() => setOpenAccordion(open ? -1 : i)}
                aria-expanded={open}
                className="flex w-full items-center justify-between py-4 text-left font-sans text-[15px] font-semibold text-espresso"
              >
                {item.title}
                <span className={`text-burgundy transition-transform ${open ? "rotate-45" : ""}`}>+</span>
              </button>
              {open && (
                <p className="pb-5 font-sans text-[14px] leading-relaxed text-warm-brown">{item.body}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Related */}
      {product.relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-8 font-serif text-[24px] md:text-[28px] font-medium text-burgundy">
            Benzer Lezzetler
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 md:grid-cols-4 md:gap-x-6">
            {product.relatedProducts.map((p) => (
              <ProductGridCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-sans text-[13px] font-semibold text-espresso">{label}</p>
      {children}
    </div>
  );
}
