"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * "Yayında" of one product (D48) — its general publish state on the site, for
 * every branch (branch stock is separate). The tick moves at once; if the
 * server does not confirm, it goes back and the reason is reported. A panel
 * product's list row is re-read after a change (its price editing depends on it).
 */
export function ProductPublishToggle({
  productId,
  name,
  published,
  disabledReason,
  refreshAfter,
  onError,
}: {
  productId: string;
  name: string;
  published: boolean;
  /** set when the tick can't be changed here (shown as its tooltip) */
  disabledReason: string | null;
  refreshAfter: boolean;
  onError: (productId: string, message: string | null) => void;
}) {
  const router = useRouter();
  const [on, setOn] = useState(published);
  const [seen, setSeen] = useState(published);
  const [busy, setBusy] = useState(false);
  // the server's value changed (a refresh): follow it
  if (published !== seen) {
    setSeen(published);
    setOn(published);
  }

  const change = async (next: boolean) => {
    if (busy) return;
    const before = on;
    setOn(next);
    setBusy(true);
    onError(productId, null);
    try {
      const res = await fetch("/api/admin/products/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, published: next }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; published?: boolean; error?: string; fields?: Record<string, string> } | null;
      if (!res.ok || !data?.ok || typeof data.published !== "boolean") {
        setOn(before);
        const reasons = data?.fields ? Object.values(data.fields).filter(Boolean) : [];
        onError(productId, reasons.length > 0 ? `Yayınlanamadı: ${reasons.join(" ")}` : (data?.error ?? "Kaydedilemedi. Lütfen tekrar deneyin."));
        return;
      }
      setOn(data.published);
      if (refreshAfter) router.refresh();
    } catch {
      setOn(before);
      onError(productId, "Bağlantı kurulamadı; kaydedilmedi. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-neutral-700" title={disabledReason ?? undefined}>
      <input
        type="checkbox"
        checked={on}
        disabled={busy || disabledReason !== null}
        aria-label={`${name} yayında`}
        aria-busy={busy}
        onChange={(e) => void change(e.target.checked)}
        className="h-4 w-4 cursor-pointer accent-neutral-900 disabled:cursor-not-allowed"
      />
      <span className="xl:sr-only">{busy ? "Kaydediliyor…" : "Yayında"}</span>
    </label>
  );
}
