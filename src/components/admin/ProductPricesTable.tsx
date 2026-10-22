"use client";

import { Fragment, useCallback, useState } from "react";
import Link from "next/link";
import { formatTL } from "@/lib/cart-utils";
import { dayTime } from "@/lib/admin/format";
import { priceKey, type ProductPriceRecord } from "@/lib/pricing/prices";
import type { ProductStatus } from "@/lib/catalog/types";
import { ProductPriceEditor, type EditorStatus } from "./ProductPriceEditor";
import { ProductPublishToggle } from "./ProductPublishToggle";
import { Badge, Panel, Th } from "./ui";

/** One price of a product: its single price, or one of its sizes. */
export type ProductPriceEntry = {
  /** the size id, or '' for a product with a single price */
  variantKey: string;
  /** "8–10 Kişilik" … for a size, null for a single price */
  size: string | null;
  /** null: a draft without this price yet */
  catalogPrice: number | null;
  /** struck-through "old price" of this product or size (D18, D21), shown while above the price */
  oldPrice: string | null;
  /** Merkez's stored price in effect */
  stored: ProductPriceRecord | null;
};

export type ProductPriceProduct = {
  productId: string;
  name: string;
  category: string;
  /** " / adet" … written after the amount in the catalog ('' for products with sizes) */
  unit: string;
  /** one entry with variantKey '' for a single price, else one per size (smallest first) */
  prices: ProductPriceEntry[];
  /** "Yayında" (D48): shown on the site */
  published: boolean;
  /** a product added in the panel (D45): its status and its form */
  panel: { status: ProductStatus; editHref: string } | null;
  /** why this product's prices are not edited in this list (else null) */
  priceLock: string | null;
};

const PANEL_STATUS: Record<ProductStatus, string> = { draft: "Taslak", published: "Panelden eklendi", unpublished: "Yayından kaldırıldı" };

const at = (r: ProductPriceRecord | null | undefined) => (r?.updatedAt ? Date.parse(r.updatedAt) : Number.NEGATIVE_INFINITY);
const sizeRowId = (productId: string, variantKey: string) => `fiyat-${productId}-${variantKey}`;
const amount = (n: number | null, unit = "") => (n === null ? "—" : `${formatTL(n)}${unit}`);
const priceRange = (all: (number | null)[]) => {
  const values = all.filter((v): v is number => v !== null);
  if (values.length === 0) return "—";
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return lo === hi ? formatTL(lo) : `${formatTL(lo)} – ${formatTL(hi)}`;
};
const changedBy = (r: ProductPriceRecord) => (r.updatedBy ? `${r.updatedBy} · ${r.updatedAt ? dayTime(r.updatedAt) : ""}` : "—");

/** what a collapsed product says about its sizes, most urgent first */
const HINTS: [EditorStatus, string][] = [
  ["saving", "Kaydediliyor"],
  ["failed", "Kaydedilmedi"],
  ["unknown", "Kayıt durumu bilinmiyor"],
  ["dirty", "Kaydedilmemiş değişiklik"],
];

// a table from xl up; below that every row is a stacked block, so nothing is wider than the screen
const CELL = "border-b border-neutral-100 px-3 py-2.5 text-neutral-800 max-xl:border-0 max-xl:p-0";
const INFO = "max-xl:mr-3 max-xl:inline-block max-xl:align-middle max-xl:text-[12px]";
const ROW = "hover:bg-neutral-50 max-xl:block max-xl:border-b max-xl:border-neutral-100 max-xl:py-3";

/** the badge, and below it who changed the price last (none for a catalog price) */
function StatusCell({ strong, label, changed }: { strong: boolean; label: string; changed: string | null }) {
  return (
    <>
      <span className="whitespace-nowrap">
        <Badge strong={strong}>{label}</Badge>
      </span>
      {changed && <span className="text-[11.5px] text-neutral-500 max-xl:ml-2 xl:mt-1 xl:block">{changed}</span>}
    </>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`h-3.5 w-3.5 shrink-0 text-neutral-500 transition-transform ${open ? "rotate-90" : ""}`}>
      <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Admin "Ürün Bilgisi" list (SUPABASE_PLAN.md, D5, D20, D48). Every product is
 * one row with its "Yayında" tick. A single price is edited in that row; a
 * product with sizes opens (its name or the arrow, by mouse or keyboard) to
 * one row per size, each saved on its own. Size rows stay mounted while
 * closed, so a typed value, a message or a running save survives closing and
 * opening; a closed product says when one of its sizes is unsaved, saving or
 * refused. A save updates its row from the row the database returned
 * (checked by the editor), without a route refresh; of the server's row and
 * the saved one, the newer is shown. A panel product that is not on the site
 * (draft, unpublished) has its prices in its form instead.
 */
export function ProductPricesTable({
  products,
  readable,
  canEdit,
  publishLock,
}: {
  products: ProductPriceProduct[];
  readable: boolean;
  canEdit: boolean;
  /** why "Yayında" can't be changed on this deployment (null: it can) */
  publishLock: string | null;
}) {
  const [saved, setSaved] = useState<Record<string, ProductPriceRecord>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, EditorStatus>>({});
  const [publishErrors, setPublishErrors] = useState<Record<string, string>>({});
  const onSaved = useCallback((row: ProductPriceRecord) => setSaved((s) => ({ ...s, [priceKey(row.productId, row.variantKey)]: row })), []);
  const onStatusChange = useCallback((productId: string, variantKey: string, next: EditorStatus) => {
    const key = priceKey(productId, variantKey);
    setStatus((s) => ((s[key] ?? "idle") === next ? s : { ...s, [key]: next }));
  }, []);
  const onPublishError = useCallback((productId: string, message: string | null) => {
    setPublishErrors((e) => {
      if ((e[productId] ?? null) === message) return e;
      const next = { ...e };
      if (message) next[productId] = message;
      else delete next[productId];
      return next;
    });
  }, []);

  const storedOf = (productId: string, e: ProductPriceEntry) => {
    const key = priceKey(productId, e.variantKey);
    return at(saved[key]) > at(e.stored) ? saved[key] : e.stored;
  };

  const publishCell = (p: ProductPriceProduct) => (
    <td className={`${CELL} max-xl:float-right max-xl:ml-3 xl:w-[72px] xl:text-center`}>
      <ProductPublishToggle
        productId={p.productId}
        name={p.name}
        published={p.published}
        disabledReason={publishLock}
        refreshAfter={p.panel !== null}
        onError={onPublishError}
      />
    </td>
  );

  /** under the name: a panel product's status and form, off the site, the last tick refusal */
  const nameNotes = (p: ProductPriceProduct) => (
    <>
      {(p.panel || !p.published) && (
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-neutral-500">
          {p.panel && <Badge strong={p.panel.status === "draft"}>{PANEL_STATUS[p.panel.status]}</Badge>}
          {!p.published && <span>Sitede görünmüyor</span>}
          {p.panel && (
            <Link href={p.panel.editHref} className="font-semibold text-neutral-700 underline underline-offset-2 hover:text-neutral-900">
              Düzenle
            </Link>
          )}
        </span>
      )}
      {publishErrors[p.productId] && (
        <span role="alert" className="mt-1 block max-w-[420px] text-[12px] font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-2">
          {publishErrors[p.productId]}
        </span>
      )}
    </>
  );

  const lockCell = (p: ProductPriceProduct) =>
    canEdit && (
      <td className={`${CELL} max-xl:mt-2 max-xl:block`}>
        <span className="text-[12px] text-neutral-500">{p.priceLock}</span>
      </td>
    );

  /** catalog, current, last change, status and editor of one price (a size row of a locked product: no lock note again) */
  const priceCells = (p: ProductPriceProduct, e: ProductPriceEntry, sizeRow = false) => {
    const stored = storedOf(p.productId, e);
    const current = stored?.price ?? e.catalogPrice;
    return (
      <>
        <td className={`${CELL} ${INFO} whitespace-nowrap text-right tabular-nums`}>
          <span className="text-neutral-500 xl:hidden">Katalog: </span>
          {amount(e.catalogPrice, p.unit)}
          {e.oldPrice && <span className="ml-1 text-neutral-400 line-through">{e.oldPrice}</span>}
        </td>
        <td className={`${CELL} ${INFO} whitespace-nowrap text-right tabular-nums xl:font-medium`}>
          <span className="font-normal text-neutral-500 xl:hidden">Güncel: </span>
          {readable ? amount(current, p.unit) : "—"}
        </td>
        <td className={`${CELL} ${INFO}`}>
          <StatusCell strong={Boolean(stored)} label={stored ? "Merkez fiyatı" : "Katalog fiyatı"} changed={stored ? changedBy(stored) : null} />
        </td>
        {p.priceLock
          ? sizeRow
            ? canEdit && <td className={`${CELL} max-xl:hidden`} />
            : lockCell(p)
          : canEdit && (
              <td className={`${CELL} max-xl:mt-2 max-xl:block max-xl:empty:hidden`}>
                {current !== null && (
                  <ProductPriceEditor
                    productId={p.productId}
                    variantKey={e.variantKey}
                    price={current}
                    unit={p.unit}
                    updatedAt={stored?.updatedAt ?? null}
                    onSaved={onSaved}
                    onStatusChange={onStatusChange}
                  />
                )}
              </td>
            )}
      </>
    );
  };

  return (
    <Panel>
      <div className="xl:overflow-x-auto">
        <table className="w-full border-collapse text-[13px] max-xl:block">
          <thead className="max-xl:hidden">
            <tr>
              <Th>Yayında</Th>
              <Th>Ürün</Th>
              <Th align="right">Katalog Fiyatı</Th>
              <Th align="right">Güncel Fiyat</Th>
              <Th>Durum</Th>
              {canEdit && <Th>Düzenle</Th>}
            </tr>
          </thead>
          <tbody className="max-xl:block">
            {products.map((p) => {
              const single = p.prices.length === 1 && p.prices[0].variantKey === "";
              if (single || p.prices.length === 0) {
                return (
                  <tr key={p.productId} className={`${ROW} max-xl:px-4`}>
                    {publishCell(p)}
                    <td className={`${CELL} max-xl:mb-1 max-xl:block`}>
                      <div className="xl:pl-5">
                        <span className="font-medium text-neutral-900">{p.name}</span>
                        <span className="block text-[12px] text-neutral-500">{p.category}</span>
                        {nameNotes(p)}
                      </div>
                    </td>
                    {single ? (
                      priceCells(p, p.prices[0])
                    ) : (
                      <>
                        <td className={`${CELL} ${INFO} text-right text-neutral-400`}>—</td>
                        <td className={`${CELL} ${INFO} text-right text-neutral-400`}>—</td>
                        <td className={`${CELL} ${INFO} text-[12px] text-neutral-500`}>Fiyat girilmedi</td>
                        {lockCell(p)}
                      </>
                    )}
                  </tr>
                );
              }

              const isOpen = Boolean(open[p.productId]);
              const rows = p.prices.map((e) => storedOf(p.productId, e));
              const merkez = rows.filter(Boolean).length;
              const latest = rows.reduce<ProductPriceRecord | null>((a, r) => (at(r) > at(a) ? r : a), null);
              const notes = HINTS.map(([s, label]) => ({
                label,
                sizes: p.prices.filter((e) => status[priceKey(p.productId, e.variantKey)] === s).map((e) => e.size),
              })).filter((n) => n.sizes.length > 0);
              return (
                <Fragment key={p.productId}>
                  <tr className={`${ROW} max-xl:px-4`}>
                    {publishCell(p)}
                    <td className={`${CELL} max-xl:mb-1 max-xl:block`}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={p.prices.map((e) => sizeRowId(p.productId, e.variantKey)).join(" ")}
                        onClick={() => setOpen((o) => ({ ...o, [p.productId]: !o[p.productId] }))}
                        className="-mx-1 inline-flex min-h-[28px] items-center gap-1.5 rounded px-1 text-left font-medium text-neutral-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-neutral-900"
                      >
                        <Chevron open={isOpen} />
                        <span>{p.name}</span>
                      </button>
                      <div className="pl-5">
                        <span className="block text-[12px] text-neutral-500">
                          {p.category} · {p.prices.length} boyut
                        </span>
                        {nameNotes(p)}
                      </div>
                    </td>
                    <td className={`${CELL} ${INFO} whitespace-nowrap text-right tabular-nums text-neutral-500`}>
                      <span className="xl:hidden">Katalog: </span>
                      {priceRange(p.prices.map((e) => e.catalogPrice))}
                    </td>
                    <td className={`${CELL} ${INFO} whitespace-nowrap text-right tabular-nums xl:font-medium`}>
                      <span className="font-normal text-neutral-500 xl:hidden">Güncel: </span>
                      {readable ? priceRange(p.prices.map((e, i) => rows[i]?.price ?? e.catalogPrice)) : "—"}
                    </td>
                    <td className={`${CELL} ${INFO}`}>
                      <StatusCell
                        strong={merkez > 0}
                        label={merkez > 0 ? `Merkez fiyatı · ${merkez}/${p.prices.length}` : "Katalog fiyatı"}
                        changed={latest ? changedBy(latest) : null}
                      />
                    </td>
                    {canEdit && (
                      <td className={`${CELL} max-xl:block max-xl:empty:hidden`}>
                        {p.priceLock && <span className="text-[12px] text-neutral-500 max-xl:mt-2 max-xl:block">{p.priceLock}</span>}
                        {!isOpen && notes.length > 0 && (
                          <p role="status" className="text-[11.5px] font-medium text-neutral-800 max-xl:mt-2">
                            {notes.map((n) => `${n.label}: ${n.sizes.join(", ")}`).join(" · ")}
                          </p>
                        )}
                      </td>
                    )}
                  </tr>
                  {p.prices.map((e) => (
                    <tr
                      key={`${p.productId}|${e.variantKey}`}
                      id={sizeRowId(p.productId, e.variantKey)}
                      hidden={!isOpen}
                      className={`${ROW} bg-neutral-50/70 max-xl:pl-9 max-xl:pr-4`}
                    >
                      <td className={`${CELL} max-xl:hidden`} />
                      <td className={`${CELL} max-xl:mb-1 max-xl:block`}>
                        <div className="xl:pl-10">
                          <span className="sr-only">{p.name} </span>
                          <span className="font-medium text-neutral-900">{e.size}</span>
                        </div>
                      </td>
                      {priceCells(p, e, true)}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
