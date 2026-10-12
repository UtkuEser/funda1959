"use client";

import { useEffect, useRef, useState } from "react";
import { formatTL } from "@/lib/cart-utils";
import { MAX_PRODUCT_PRICE, type ProductPriceRecord } from "@/lib/pricing/prices";

/**
 * Merkez-only editor for one price (SUPABASE_PLAN.md, D5, D20): a product's
 * single price, or one of its sizes — the other sizes do not change. The
 * server checks the role again (api/admin/prices).
 *
 * "Kaydedildi" is shown only for the row the database returned; anything
 * else says the stored price did not change. A change of more than half the
 * current price asks for a second click, so a typo like 450 for 45 is not
 * saved by accident. The verified row goes to the table (`onSaved`), which
 * shows it at once — no route refresh is needed for the screen to be current.
 * Its state (`onStatusChange`) lets a collapsed product show that one of its
 * sizes is unsaved, saving or refused.
 */

const amountText = (price: number) => price.toFixed(2).replace(".", ",");
const samePrice = (a: number, b: number) => Math.round(a * 100) === Math.round(b * 100);
const clock = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" }) : "";

const SAVE_TIMEOUT_MS = 30_000;
const BIG_CHANGE = 0.5;

type Outcome = { kind: "saved" | "failed" | "unknown"; text: string };

/** idle: shows the stored price; dirty: another value typed, not sent; then the request's state */
export type EditorStatus = "idle" | "dirty" | "saving" | "failed" | "unknown";

export function ProductPriceEditor({
  productId,
  variantKey,
  price,
  unit,
  updatedAt,
  onSaved,
  onStatusChange,
}: {
  productId: string;
  /** the size id, or '' for a product with a single price */
  variantKey: string;
  /** the price in effect now (stored, else catalog) */
  price: number;
  /** " / adet" … — shown after the amount */
  unit: string;
  updatedAt: string | null;
  /** the row the database stored, after it was checked against the request */
  onSaved?: (row: ProductPriceRecord) => void;
  onStatusChange?: (productId: string, variantKey: string, status: EditorStatus) => void;
}) {
  const [amount, setAmount] = useState(amountText(price));
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const inFlight = useRef(false);

  // the stored row changed (after a save + refresh, or another editor): show it
  const storedKey = `${price}|${updatedAt}`;
  const [shownKey, setShownKey] = useState(storedKey);
  if (shownKey !== storedKey) {
    setShownKey(storedKey);
    setAmount(amountText(price));
    setConfirming(false);
  }

  const parsed = /^\d{1,6}([.,]\d{1,2})?$/.test(amount.trim()) ? Number(amount.trim().replace(",", ".")) : Number.NaN;
  const amountOk = Number.isFinite(parsed) && parsed > 0 && parsed <= MAX_PRODUCT_PRICE;
  const changed = amountOk && !samePrice(parsed, price);
  const change = amountOk ? (parsed - price) / price : 0;
  const stored = `${formatTL(price)}${unit}`;
  const failed = outcome !== null && outcome.kind !== "saved";
  const status: EditorStatus = saving
    ? "saving"
    : failed
      ? (outcome.kind === "unknown" ? "unknown" : "failed")
      : confirming || !(amountOk && samePrice(parsed, price))
        ? "dirty"
        : "idle";
  useEffect(() => {
    onStatusChange?.(productId, variantKey, status);
  }, [onStatusChange, productId, variantKey, status]);

  async function save() {
    if (inFlight.current) return; // one request at a time
    if (Math.abs(change) > BIG_CHANGE && !confirming) {
      setConfirming(true);
      return;
    }
    inFlight.current = true;
    setSaving(true);
    setConfirming(false);
    setOutcome(null);
    try {
      const res = await fetch("/api/admin/prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantKey, price: parsed }),
        signal: AbortSignal.timeout(SAVE_TIMEOUT_MS),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; price?: ProductPriceRecord } | null;
      const row = data?.price;
      if (!res.ok || !data?.ok || !row) {
        setOutcome({ kind: "failed", text: `Kaydedilmedi. ${data?.error ?? "Fiyat kaydedilemedi."} Kayıtlı fiyat değişmedi: ${stored}.` });
        return;
      }
      if (row.productId !== productId || row.variantKey !== variantKey || !samePrice(row.price, parsed)) {
        setOutcome({ kind: "unknown", text: "Sunucu farklı bir kayıt döndürdü. Sayfayı yenileyip Güncel Fiyat sütununu kontrol edin." });
        return;
      }
      setOutcome({
        kind: "saved",
        text: `Kaydedildi: ${formatTL(row.price)}${unit}${row.updatedBy ? ` · ${row.updatedBy}` : ""}${row.updatedAt ? ` · ${clock(row.updatedAt)}` : ""}`,
      });
      onSaved?.(row);
    } catch {
      // timeout / connection lost: the request may or may not have reached the database
      setOutcome({
        kind: "unknown",
        text: "Sunucudan yanıt alınamadı; kaydın durumu bilinmiyor. Sayfayı yenileyip Güncel Fiyat sütununu kontrol edin.",
      });
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5 break-words xl:min-w-[200px]">
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          aria-label="Yeni fiyat (TL)"
          inputMode="decimal"
          value={amount}
          disabled={saving}
          aria-invalid={failed && changed}
          onChange={(e) => {
            setAmount(e.target.value);
            setConfirming(false);
            setOutcome(null);
          }}
          className={`h-8 w-24 rounded-md border bg-white px-2 text-right text-[12.5px] tabular-nums text-neutral-900 disabled:opacity-60 ${
            failed && changed ? "border-red-400" : "border-neutral-300"
          }`}
        />
        <button
          type="button"
          disabled={saving || !changed}
          aria-busy={saving}
          onClick={save}
          className="min-h-[32px] rounded-md bg-neutral-900 px-2.5 text-[12px] font-semibold text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Kaydediliyor…" : confirming ? "Onayla" : failed && changed ? "Tekrar dene" : "Kaydet"}
        </button>
      </div>
      {!amountOk && amount.trim() !== "" && (
        <p className="text-[11.5px] text-neutral-700">
          0&apos;dan büyük, en fazla {MAX_PRODUCT_PRICE.toLocaleString("tr-TR")} TL ve en fazla iki ondalıklı bir tutar girin.
        </p>
      )}
      {confirming && (
        <p role="status" className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11.5px] font-medium text-amber-900">
          Fiyat {stored} → {formatTL(parsed)}
          {unit} ({change > 0 ? "+" : ""}
          {Math.round(change * 100)}%). Doğruysa &quot;Onayla&quot;ya basın.
        </p>
      )}
      {saving && (
        <p role="status" className="text-[11.5px] text-neutral-600">
          Kaydediliyor… Veritabanı onayı bekleniyor.
        </p>
      )}
      {outcome?.kind === "saved" && (
        <p role="status" className="text-[11.5px] font-medium text-emerald-700">
          {outcome.text}
        </p>
      )}
      {outcome && failed && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11.5px] font-medium text-red-800">
          {outcome.text}
        </p>
      )}
      {!saving && !failed && !confirming && changed && (
        <p className="text-[11.5px] text-neutral-500">Kaydedilmemiş değişiklik · kayıtlı: {stored}</p>
      )}
    </div>
  );
}
