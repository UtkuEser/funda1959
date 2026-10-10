"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/lib/order";
import {
  CANCEL_REASON_MAX,
  CANCEL_REASON_MIN,
  canCancelOrder,
  nextOrderStatus,
  orderStatusLabel,
} from "@/lib/order-status";

/**
 * Row actions for the admin order list: one step forward, or cancel with a
 * reason. The server decides whether this account may touch the order
 * (api/admin/orders); the buttons only offer what the order's status allows.
 */
export function OrderStatusActions({
  orderNumber,
  status,
  deliveryType,
}: {
  orderNumber: string;
  status: OrderStatus;
  deliveryType: "delivery" | "pickup";
}) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canCancelOrder(status)) return null;
  const next = nextOrderStatus(status, deliveryType);

  async function send(toStatus: OrderStatus, cancelReason?: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, toStatus, reason: cancelReason }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "İşlem yapılamadı. Lütfen tekrar deneyin.");
        return;
      }
      setCancelling(false);
      setReason("");
      router.refresh();
    } catch {
      setError("İşlem yapılamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  const trimmed = reason.trim();
  const reasonOk = trimmed.length >= CANCEL_REASON_MIN && trimmed.length <= CANCEL_REASON_MAX;

  return (
    <div className="flex min-w-[180px] flex-col gap-1.5">
      {!cancelling ? (
        <div className="flex flex-wrap gap-1.5">
          {next && (
            <button
              type="button"
              disabled={busy}
              onClick={() => send(next)}
              className="min-h-[32px] rounded-md bg-neutral-900 px-2.5 text-[12px] font-semibold text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {orderStatusLabel(next)}
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => setCancelling(true)}
            className="min-h-[32px] rounded-md border border-neutral-300 bg-white px-2.5 text-[12px] font-semibold text-neutral-900 hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            İptal et
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-medium text-neutral-600" htmlFor={`cancel-${orderNumber}`}>
            İptal gerekçesi (zorunlu)
          </label>
          <textarea
            id={`cancel-${orderNumber}`}
            value={reason}
            maxLength={CANCEL_REASON_MAX}
            rows={2}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-[12.5px] text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={busy || !reasonOk}
              onClick={() => send("cancelled", trimmed)}
              className="min-h-[32px] rounded-md bg-neutral-900 px-2.5 text-[12px] font-semibold text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siparişi iptal et
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setCancelling(false);
                setReason("");
                setError(null);
              }}
              className="min-h-[32px] rounded-md border border-neutral-300 bg-white px-2.5 text-[12px] font-semibold text-neutral-900 hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-[11.5px] text-neutral-900">
          {error}
        </p>
      )}
    </div>
  );
}
