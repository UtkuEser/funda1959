"use client";

import { Fragment, useCallback, useState } from "react";
import { formatTL } from "@/lib/cart-utils";
import { dayTime } from "@/lib/admin/format";
import { priceKey, type ProductPriceRecord } from "@/lib/pricing/prices";
import { ProductPriceEditor, type EditorStatus } from "./ProductPriceEditor";
import { Badge, Panel, Th } from "./ui";

/** One price of a product: its single price, or one of its sizes. */
export type ProductPriceEntry = {
  /** the size id, or '' for a product with a single price */
  variantKey: string;
  /** "8–10 Kişilik" … for a size, null for a single price */
  size: string | null;
  catalogPrice: number;
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
};

const at = (r: ProductPriceRecord | null | undefined) => (r?.updatedAt ? Date.parse(r.updatedAt) : Number.NEGATIVE_INFINITY);
const sizeRowId = (productId: string, variantKey: string) => `fiyat-${productId}-${variantKey}`;
const priceRange = (values: number[]) => {
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
 * Admin "Fiyatlar" table (SUPABASE_PLAN.md, D5, D20). Every product is one
 * row. A single price is edited in that row; a product with sizes opens (its
 * name or the arrow, by mouse or keyboard) to one row per size, each saved on
 * its own. Size rows stay mounted while closed, so a typed value, a message
 * or a running save survives closing and opening; a closed product says when
 * one of its sizes is unsaved, saving or refused. A save updates its row from
 * the row the database returned (checked by the editor), without a route
 * refresh; of the server's row and the saved one, the newer is shown.
 */
export function ProductPricesTable({ products, readable, canEdit }: { products: ProductPriceProduct[]; readable: boolean; canEdit: boolean }) {
  const [saved, setSaved] = useState<Record<string, ProductPriceRecord>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, EditorStatus>>({});
  const onSaved = useCallback((row: ProductPriceRecord) => setSaved((s) => ({ ...s, [priceKey(row.productId, row.variantKey)]: row })), []);
  const onStatusChange = useCallback((productId: string, variantKey: string, next: EditorStatus) => {
    const key = priceKey(productId, variantKey);
    setStatus((s) => ((s[key] ?? "idle") === next ? s : { ...s, [key]: next }));
  }, []);

  const storedOf = (productId: string, e: ProductPriceEntry) => {
    const key = priceKey(productId, e.variantKey);
    return at(saved[key]) > at(e.stored) ? saved[key] : e.stored;
  };

  /** catalog, current, last change, status and editor of one price */
  const priceCells = (p: ProductPriceProduct, e: ProductPriceEntry) => {
    const stored = storedOf(p.productId, e);
    const current = stored?.price ?? e.catalogPrice;
    return (
      <>
        <td className={`${CELL} ${INFO} whitespace-nowrap text-right tabular-nums`}>
          <span className="text-neutral-500 xl:hidden">Katalog: </span>
          {`${formatTL(e.catalogPrice)}${p.unit}`}
          {e.oldPrice && <span className="ml-1 text-neutral-400 line-through">{e.oldPrice}</span>}
        </td>
        <td className={`${CELL} ${INFO} whitespace-nowrap text-right tabular-nums xl:font-medium`}>
          <span className="font-normal text-neutral-500 xl:hidden">Güncel: </span>
          {readable ? `${formatTL(current)}${p.unit}` : "—"}
        </td>
        <td className={`${CELL} ${INFO}`}>
          <StatusCell strong={Boolean(stored)} label={stored ? "Merkez fiyatı" : "Katalog fiyatı"} changed={stored ? changedBy(stored) : null} />
        </td>
        {canEdit && (
          <td className={`${CELL} max-xl:mt-2 max-xl:block`}>
            <ProductPriceEditor
              productId={p.productId}
              variantKey={e.variantKey}
              price={current}
              unit={p.unit}
              updatedAt={stored?.updatedAt ?? null}
              onSaved={onSaved}
              onStatusChange={onStatusChange}
            />
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
              if (single) {
                return (
                  <tr key={p.productId} className={`${ROW} max-xl:px-4`}>
                    <td className={`${CELL} max-xl:mb-1 max-xl:block`}>
                      <div className="xl:pl-5">
                        <span className="font-medium text-neutral-900">{p.name}</span>
                        <span className="block text-[12px] text-neutral-500">{p.category}</span>
                      </div>
                    </td>
                    {priceCells(p, p.prices[0])}
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
                      <span className="block pl-5 text-[12px] text-neutral-500">
                        {p.category} · {p.prices.length} boyut
                      </span>
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
                      <td className={`${CELL} max-xl:mb-1 max-xl:block`}>
                        <div className="xl:pl-10">
                          <span className="sr-only">{p.name} </span>
                          <span className="font-medium text-neutral-900">{e.size}</span>
                        </div>
                      </td>
                      {priceCells(p, e)}
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
