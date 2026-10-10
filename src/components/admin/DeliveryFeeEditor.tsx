"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTL } from "@/lib/cart-utils";
import { describeFeeState, type DeliveryFeeState, type ZoneFeeRecord } from "@/lib/delivery/fees";

/**
 * Merkez-only editor for one zone's delivery fee (SUPABASE_PLAN.md, D15).
 * Three explicit choices — "Belirlenmedi", "Ücretli" (amount, kuruş allowed),
 * "Ücretsiz" — so an empty field can never turn into free delivery. The
 * server checks the role again (api/admin/delivery-fees).
 *
 * "Kaydedildi" is shown only for the row the database returned; anything
 * else says the stored fee did not change. Until then the field is marked as
 * an unsaved change, so a typed amount never looks like the stored one.
 */

const amountText = (state: DeliveryFeeState, fee: number | null) =>
  state === "paid" && fee !== null ? fee.toFixed(2).replace(".", ",") : "";

const feeText = (state: DeliveryFeeState, fee: number | null) =>
  state === "paid" && fee !== null ? formatTL(fee) : describeFeeState(state);

const sameFee = (a: number | null, b: number | null) =>
  a === null || b === null ? a === b : Math.round(a * 100) === Math.round(b * 100);

const clock = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" }) : "";

const SAVE_TIMEOUT_MS = 30_000;

type Outcome = { kind: "saved" | "failed" | "unknown"; text: string };

export function DeliveryFeeEditor({
  zoneId,
  state,
  fee,
  updatedAt,
}: {
  zoneId: string;
  state: DeliveryFeeState;
  fee: number | null;
  updatedAt: string | null;
}) {
  const router = useRouter();
  const [nextState, setNextState] = useState<DeliveryFeeState>(state);
  const [amount, setAmount] = useState(amountText(state, fee));
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const inFlight = useRef(false);

  // the stored row changed (after a save + refresh, or another editor): show it
  const storedKey = `${state}|${fee}|${updatedAt}`;
  const [shownKey, setShownKey] = useState(storedKey);
  if (shownKey !== storedKey) {
    setShownKey(storedKey);
    setNextState(state);
    setAmount(amountText(state, fee));
  }

  // "59,90" or "59.90" — at most two decimals
  const parsed = /^\d{1,5}([.,]\d{1,2})?$/.test(amount.trim()) ? Number(amount.trim().replace(",", ".")) : Number.NaN;
  const amountOk = nextState !== "paid" || (Number.isFinite(parsed) && parsed > 0);
  const changed = nextState !== state || (nextState === "paid" && !sameFee(parsed, fee));
  const stored = feeText(state, fee);

  async function save() {
    if (inFlight.current) return; // one request at a time
    inFlight.current = true;
    const sentFee = nextState === "paid" ? parsed : nextState === "free" ? 0 : null;
    setSaving(true);
    setOutcome(null);
    try {
      const res = await fetch("/api/admin/delivery-fees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId, state: nextState, fee: nextState === "paid" ? parsed : null }),
        signal: AbortSignal.timeout(SAVE_TIMEOUT_MS),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; fee?: ZoneFeeRecord } | null;
      const row = data?.fee;
      if (!res.ok || !data?.ok || !row) {
        setOutcome({ kind: "failed", text: `Kaydedilmedi. ${data?.error ?? "Ücret kaydedilemedi."} Kayıtlı ücret değişmedi: ${stored}.` });
        return;
      }
      if (row.zoneId !== zoneId || row.state !== nextState || !sameFee(row.fee, sentFee)) {
        setOutcome({ kind: "unknown", text: "Sunucu farklı bir kayıt döndürdü. Sayfayı yenileyip Teslimat Ücreti sütununu kontrol edin." });
        return;
      }
      setOutcome({
        kind: "saved",
        text: `Kaydedildi: ${feeText(row.state, row.fee)}${row.updatedBy ? ` · ${row.updatedBy}` : ""}${row.updatedAt ? ` · ${clock(row.updatedAt)}` : ""}`,
      });
      router.refresh();
    } catch {
      // timeout / connection lost: the request may or may not have reached the database
      setOutcome({
        kind: "unknown",
        text: "Sunucudan yanıt alınamadı; kaydın durumu bilinmiyor. Sayfayı yenileyip Teslimat Ücreti sütununu kontrol edin.",
      });
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  const failed = outcome !== null && outcome.kind !== "saved";

  return (
    <div className="flex min-w-[220px] flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          aria-label="Ücret durumu"
          value={nextState}
          disabled={saving}
          onChange={(e) => {
            setNextState(e.target.value as DeliveryFeeState);
            setOutcome(null);
          }}
          className="h-8 rounded-md border border-neutral-300 bg-white px-1.5 text-[12.5px] text-neutral-900 disabled:opacity-60"
        >
          <option value="unset">Belirlenmedi</option>
          <option value="paid">Ücretli</option>
          <option value="free">Ücretsiz</option>
        </select>
        {nextState === "paid" && (
          <input
            aria-label="Teslimat ücreti (TL)"
            inputMode="decimal"
            placeholder="ör. 59,90"
            value={amount}
            disabled={saving}
            aria-invalid={failed && changed}
            onChange={(e) => {
              setAmount(e.target.value);
              setOutcome(null);
            }}
            className={`h-8 w-24 rounded-md border bg-white px-2 text-right text-[12.5px] tabular-nums text-neutral-900 disabled:opacity-60 ${
              failed && changed ? "border-red-400" : "border-neutral-300"
            }`}
          />
        )}
        <button
          type="button"
          disabled={saving || !amountOk || !changed}
          aria-busy={saving}
          onClick={save}
          className="min-h-[32px] rounded-md bg-neutral-900 px-2.5 text-[12px] font-semibold text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Kaydediliyor…" : failed && changed ? "Tekrar dene" : "Kaydet"}
        </button>
      </div>
      {nextState === "paid" && !amountOk && amount.trim() !== "" && (
        <p className="text-[11.5px] text-neutral-700">0&apos;dan büyük, en fazla iki ondalıklı bir tutar girin.</p>
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
      {!saving && !failed && changed && amountOk && (
        <p className="text-[11.5px] text-neutral-500">Kaydedilmemiş değişiklik · kayıtlı: {stored}</p>
      )}
    </div>
  );
}
