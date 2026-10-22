"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AREA_DISTRICTS, AREA_LIMITS, areaKey, areaNameProblem, cleanAreaName, isValidAreaFee, type AreaFeeState, type AreaRecord } from "@/lib/delivery/areas";
import { findPoolEntry, POOL_ACCESSED_AT, poolDistricts, poolEntryKeys, poolEntryMatches, poolFor, type PoolEntry } from "@/lib/delivery/neighborhood-pool";
import { normalize } from "@/lib/search";

/**
 * "Teslimat Bölgeleri" (D49, D50) — per branch tab, the neighbourhoods it
 * serves with their fee (0 TL = free) and an open / closed switch. Every
 * change — inline, in bulk, "Mahalle Ekle" or the Excel window — is an unsaved
 * edit kept across tab / district switches; "Kaydet" sends them all at once
 * and the server saves all or nothing. On an error the edits stay.
 * "Kaydedildi" only after the server answered with the saved areas.
 */

type Edit = {
  district: string;
  neighborhood: string;
  branchId: string;
  enabled: boolean;
  /** the fee as typed: "" = none, "0" = free */
  feeText: string;
  isNew: boolean;
  /** a new area typed by hand ("Listede yok, elle ekle"), not from the neighbourhood list */
  manual?: boolean;
};

type ImportRow = {
  row: number;
  input: { district: string; neighborhood: string; branch: string; enabled: string; fee: string };
  key: string | null;
  district: string | null;
  neighborhood: string | null;
  branchId: string | null;
  enabled: boolean | null;
  feeState: "paid" | "free" | null;
  fee: number | null;
  errors: string[];
};
type ImportPreview = { fileName: string; sheet: string | null; fileErrors: string[]; warnings: string[]; rows: ImportRow[] };
type Verdict = { row: ImportRow; kind: "new" | "changed" | "same" | "error"; notes: string[]; move: string | null };

const BUTTON =
  "inline-flex h-8 items-center rounded-md border border-neutral-300 bg-white px-3 text-[12.5px] font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400";
const PRIMARY =
  "inline-flex h-8 items-center rounded-md bg-neutral-900 px-3 text-[12.5px] font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300";
const INPUT =
  "h-8 rounded border border-neutral-300 bg-white px-2 text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-400";
const TH = "border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-neutral-500";
const TD = "border-b border-neutral-100 px-3 py-2 align-middle text-[13px] text-neutral-800";

const feeToText = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));
const feeTextOf = (r: AreaRecord) => (r.feeState === "unset" ? "" : feeToText(r.fee ?? 0));
const tl = (n: number) => `${n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺`;

/** "240", "240,5", "1.250,00" -> number; "" -> null; anything else (negative included) -> "invalid" */
function parseFee(text: string): number | null | "invalid" {
  let t = text.replace(/\s/g, "").replace(/(tl|₺)$/i, "");
  if (!t) return null;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else t = t.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return "invalid";
  const n = Number(t);
  return n === 0 || isValidAreaFee(n) ? n : "invalid";
}

const stateOf = (n: number | null): AreaFeeState => (n === null ? "unset" : n === 0 ? "free" : "paid");

/** why a changed row can't be saved (null: fine) */
function rowProblem(e: Edit, saved: AreaRecord | undefined): string | null {
  const n = parseFee(e.feeText);
  if (n === "invalid") return `Geçerli bir tutar girin (0–${AREA_LIMITS.maxFee.toLocaleString("tr-TR")} ₺).`;
  // empty is never free: an open area needs a fee; a closed one may stay without one only if it never had one
  if (n === null && (e.enabled || (saved && saved.feeState !== "unset"))) return e.enabled ? "Gönderim için ücret girin (0 = ücretsiz)." : "Ücret girin (0 = ücretsiz).";
  return null;
}

const toEdit = (r: AreaRecord): Edit => ({
  district: r.district,
  neighborhood: r.neighborhood,
  branchId: r.branchId,
  enabled: r.enabled,
  feeText: feeTextOf(r),
  isNew: false,
});

function sameAs(e: Edit, r: AreaRecord): boolean {
  if (e.branchId !== r.branchId || e.enabled !== r.enabled) return false;
  const n = parseFee(e.feeText);
  if (n === "invalid") return false;
  return n === null ? r.feeState === "unset" : r.feeState !== "unset" && n === r.fee;
}

export function DeliveryAreaTable({
  initial,
  branches,
  canSave,
  setupDetail,
  readOnly,
  fixedBranchId = null,
}: {
  initial: AreaRecord[];
  branches: { id: string; name: string }[];
  /** false: setup missing — edits work, "Kaydet" is off */
  canSave: boolean;
  /** technical reason for the setup notice (shown folded) */
  setupDetail: string | null;
  /** branch accounts: their own areas, nothing to change */
  readOnly: boolean;
  fixedBranchId?: string | null;
}) {
  const [base, setBase] = useState<Map<string, AreaRecord>>(() => new Map(initial.map((r) => [r.key, r])));
  const [edits, setEdits] = useState<Map<string, Edit>>(new Map());
  const [branchId, setBranchId] = useState(fixedBranchId ?? branches[0]?.id ?? "");
  const [district, setDistrict] = useState("");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bulkFee, setBulkFee] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"add" | "excel" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const branchName = (id: string | null | undefined) => branches.find((b) => b.id === id)?.name ?? id ?? "—";
  const current = (key: string): Edit | null => edits.get(key) ?? (base.has(key) ? toEdit(base.get(key)!) : null);
  const allKeys = useMemo(() => [...new Set([...base.keys(), ...edits.keys()])], [base, edits]);

  /** applies changes to the draft; an edit that is back to the saved area is dropped */
  const patch = (changes: [string, Partial<Edit> | Edit][]) => {
    setDone(null);
    setError(null);
    setEdits((prev) => {
      const next = new Map(prev);
      for (const [key, p] of changes) {
        const was = next.get(key) ?? (base.has(key) ? toEdit(base.get(key)!) : null);
        if (!was && !("district" in p)) continue;
        const e = { ...(was ?? (p as Edit)), ...p } as Edit;
        const saved = base.get(key);
        if (saved && !e.isNew && sameAs(e, saved)) next.delete(key);
        else next.set(key, e);
      }
      return next;
    });
  };

  const changed = [...edits.entries()];
  const problems = changed.filter(([k, e]) => rowProblem(e, base.get(k)));

  /* ------------------------------------------------------------ the list */

  const q = normalize(query);
  const branchKeys = allKeys.filter((k) => current(k)?.branchId === branchId);
  const districtOptions = [...new Set(branchKeys.map((k) => current(k)!.district))].sort((a, b) => a.localeCompare(b, "tr"));
  const rows = branchKeys
    .map((key) => ({ key, e: current(key)! }))
    .filter(({ e }) => {
      if (district && e.district !== district) return false;
      if (!q || normalize(e.neighborhood).includes(q)) return true;
      const entry = findPoolEntry(e.district, e.neighborhood); // "Or-An" finds the "Oran" record
      return Boolean(entry && poolEntryMatches(entry, q));
    })
    .sort((a, b) => a.e.district.localeCompare(b.e.district, "tr") || a.e.neighborhood.localeCompare(b.e.neighborhood, "tr"));
  const visibleKeys = rows.map((r) => r.key);
  const allPicked = visibleKeys.length > 0 && visibleKeys.every((k) => picked.has(k));

  const switchTab = (id: string) => {
    setBranchId(id);
    setDistrict("");
    setPicked(new Set());
    setBulkError(null);
  };

  const applyBulkFee = () => {
    const n = parseFee(bulkFee);
    if (n === null || n === "invalid") {
      setBulkError(`Geçerli bir tutar girin (0–${AREA_LIMITS.maxFee.toLocaleString("tr-TR")} ₺).`);
      return;
    }
    setBulkError(null);
    patch([...picked].map((k) => [k, { feeText: feeToText(n) }]));
  };

  /* ------------------------------------------------------------ save */

  const save = async () => {
    if (readOnly || !canSave || saving || changed.length === 0 || problems.length > 0) return;
    setSaving(true);
    setError(null);
    setDone(null);
    const items = changed.map(([key, e]) => {
      const was = base.get(key);
      const n = parseFee(e.feeText) as number | null;
      return {
        district: e.district,
        neighborhood: e.neighborhood,
        branchId: e.branchId,
        enabled: e.enabled,
        feeState: stateOf(n),
        fee: n,
        manual: Boolean(e.isNew && e.manual),
        expected: was && !e.isNew ? { branchId: was.branchId, enabled: was.enabled, feeState: was.feeState, fee: was.fee } : null,
      };
    });
    try {
      const res = await fetch("/api/admin/delivery-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; areas?: AreaRecord[] | null } | null;
      if (res.ok && data?.ok && Array.isArray(data.areas)) {
        setBase(new Map(data.areas.map((r) => [r.key, r])));
        setEdits(new Map());
        setPicked(new Set());
        setDone(`Kaydedildi — ${items.length} mahalle.`);
        return;
      }
      // a conflict sends the current areas: the edits stay, compared with them
      if (Array.isArray(data?.areas)) {
        const fresh = new Map(data!.areas!.map((r) => [r.key, r]));
        setBase(fresh);
        setEdits((prev) => {
          const next = new Map<string, Edit>();
          for (const [k, e] of prev) {
            const saved = fresh.get(k);
            if (saved && e.isNew) next.set(k, { ...e, isNew: false });
            else if (!saved || !sameAs(e, saved)) next.set(k, e);
          }
          return next;
        });
        setError("Bu sırada başka bir değişiklik yapıldı. Güncel durum yüklendi; kontrol edip tekrar kaydedin.");
        return;
      }
      setError(res.status === 503 ? "Kaydedilemedi: kayıt servisi kullanılamıyor." : (data?.error ?? "Kaydedilemedi. Lütfen tekrar deneyin."));
    } catch {
      setError("Bağlantı kurulamadı; kaydedilmemiş olabilir. Tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setEdits(new Map());
    setPicked(new Set());
    setError(null);
    setBulkError(null);
  };

  /* ------------------------------------------------------------ view */

  return (
    <div className="max-w-[780px] space-y-4 pb-2">
      {!canSave && !readOnly && (
        <div role="alert" className="rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-[12.5px] text-neutral-800">
          <p className="font-semibold text-neutral-900">Kurulum bekleniyor. Değişiklikler henüz kaydedilemez.</p>
          {setupDetail && (
            <details className="mt-1">
              <summary className="cursor-pointer text-[12px] text-neutral-500">Teknik ayrıntılar</summary>
              <p className="mt-1 text-[12px] text-neutral-600">{setupDetail}</p>
            </details>
          )}
        </div>
      )}

      {/* branch tabs */}
      <div role="tablist" aria-label="Şube" className="flex gap-1 border-b border-neutral-200">
        {branches
          .filter((b) => !fixedBranchId || b.id === fixedBranchId)
          .map((b) => {
            const active = b.id === branchId;
            return (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchTab(b.id)}
                className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-semibold ${
                  active ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {b.name}
              </button>
            );
          })}
      </div>

      {/* tools */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="İlçe"
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            setPicked(new Set());
          }}
          className={`${INPUT} w-[170px]`}
        >
          <option value="">Tüm ilçeler</option>
          {districtOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <input
          type="search"
          aria-label="Mahalle ara"
          placeholder="Mahalle ara"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPicked(new Set());
          }}
          className={`${INPUT} w-[200px]`}
        />
        {!readOnly && (
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => setDialog("add")} className={BUTTON}>
              Mahalle Ekle
            </button>
            <button type="button" onClick={() => setDialog("excel")} className={BUTTON}>
              Excel’den Yükle
            </button>
          </div>
        )}
      </div>

      {done && (
        <p role="status" className="text-[12.5px] font-medium text-neutral-900">
          {done}
        </p>
      )}

      {/* bulk bar: only while rows are selected */}
      {!readOnly && picked.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2">
          <span className="text-[12.5px] font-semibold text-neutral-900">{picked.size} seçili</span>
          <span className="flex items-center gap-1">
            <input
              aria-label="Seçilenlerin teslimat ücreti"
              inputMode="decimal"
              placeholder="0"
              value={bulkFee}
              onChange={(e) => {
                setBulkFee(e.target.value);
                setBulkError(null);
              }}
              className={`${INPUT} w-[80px] text-right tabular-nums`}
            />
            <span className="text-[12.5px] text-neutral-500">₺</span>
          </span>
          <button type="button" onClick={applyBulkFee} className={BUTTON}>
            Ücret uygula
          </button>
          <button
            type="button"
            onClick={() => {
              // only where a fee was entered: an empty fee never opens delivery
              const ok = [...picked].filter((k) => typeof parseFee(current(k)?.feeText ?? "") === "number");
              patch(ok.map((k) => [k, { enabled: true }]));
              setBulkError(ok.length < picked.size ? `${picked.size - ok.length} mahallede ücret tanımsız; önce ücret girin, gönderimi açılmadı.` : null);
            }}
            className={BUTTON}
          >
            Gönderimi aç
          </button>
          <button type="button" onClick={() => patch([...picked].map((k) => [k, { enabled: false }]))} className={BUTTON}>
            Gönderimi kapat
          </button>
          <button type="button" onClick={() => setPicked(new Set())} className="text-[12px] font-semibold text-neutral-500 underline hover:text-neutral-900">
            Seçimi kaldır
          </button>
          {bulkError && <span className="text-[12px] font-medium text-neutral-900">{bulkError}</span>}
        </div>
      )}

      {/* the table */}
      <div className="overflow-x-auto rounded-md border border-neutral-200">
        {/* fixed columns: name, fee and switch stay close; narrow screens scroll instead of overlapping */}
        <table className="w-full min-w-[540px] table-fixed border-collapse">
          <colgroup>
            {!readOnly && <col className="w-[36px]" />}
            <col className="w-[110px]" />
            <col />
            <col className="w-[150px]" />
            <col className="w-[112px]" />
          </colgroup>
          <thead>
            <tr>
              {!readOnly && (
                <th className={`${TH} pr-0`}>
                  <input
                    type="checkbox"
                    aria-label={`Listede görünen ${visibleKeys.length} mahalleyi seç`}
                    title="Yalnızca listede görünen (filtrelenmiş) mahalleler"
                    checked={allPicked}
                    disabled={visibleKeys.length === 0}
                    onChange={(e) => setPicked(e.target.checked ? new Set(visibleKeys) : new Set())}
                    className="h-3.5 w-3.5 accent-neutral-900"
                  />
                </th>
              )}
              <th className={TH}>İlçe</th>
              <th className={TH}>Mahalle</th>
              <th className={TH}>
                Teslimat Ücreti
                <span className="block font-normal normal-case tracking-normal text-neutral-400">0 TL = ücretsiz</span>
              </th>
              <th className={TH}>Gönderim</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-[12.5px] text-neutral-400">
                  {q || district ? "Eşleşen mahalle yok." : "Bu şubeye bağlı mahalle yok."}
                </td>
              </tr>
            )}
            {rows.map(({ key, e }) => {
              const saved = base.get(key);
              const dirty = edits.has(key);
              const problem = dirty ? rowProblem(e, saved) : null;
              const movedFrom = saved && saved.branchId !== e.branchId ? saved.branchId : null;
              return (
                <tr key={key} className={dirty ? "bg-neutral-50" : undefined}>
                  {!readOnly && (
                    <td className={`${TD} pr-0`}>
                      <input
                        type="checkbox"
                        aria-label={`Seç: ${e.neighborhood}`}
                        checked={picked.has(key)}
                        onChange={(ev) =>
                          setPicked((cur) => {
                            const next = new Set(cur);
                            if (ev.target.checked) next.add(key);
                            else next.delete(key);
                            return next;
                          })
                        }
                        className="h-3.5 w-3.5 accent-neutral-900"
                      />
                    </td>
                  )}
                  <td className={`${TD} truncate text-neutral-600`}>{e.district}</td>
                  <td className={`${TD} break-words`}>
                    <span className="font-medium text-neutral-900">{e.neighborhood}</span>
                    <PoolHint district={e.district} neighborhood={e.neighborhood} />
                    {e.isNew && <span className="ml-2 text-[11px] font-semibold text-neutral-500">yeni</span>}
                    {movedFrom && <span className="ml-2 text-[11px] font-semibold text-neutral-500">{branchName(movedFrom)} şubesinden taşınacak</span>}
                  </td>
                  <td className={TD}>
                    {readOnly ? (
                      <span className="tabular-nums">{parseFee(e.feeText) === null ? "—" : tl(parseFee(e.feeText) as number)}</span>
                    ) : (
                      <>
                        <span className="flex items-center gap-1">
                          <input
                            aria-label={`${e.neighborhood} teslimat ücreti`}
                            aria-invalid={Boolean(problem)}
                            inputMode="decimal"
                            placeholder="—"
                            value={e.feeText}
                            onChange={(ev) => patch([[key, { feeText: ev.target.value }]])}
                            className={`${INPUT} w-[84px] text-right tabular-nums ${problem ? "border-neutral-900" : ""}`}
                          />
                          <span className="text-[12.5px] text-neutral-500">₺</span>
                        </span>
                        {problem && <span className="mt-0.5 block text-[11.5px] font-medium text-neutral-900">{problem}</span>}
                      </>
                    )}
                  </td>
                  <td className={TD}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={e.enabled}
                      aria-label={`${e.neighborhood} gönderim ${e.enabled ? "açık" : "kapalı"}`}
                      // opening needs a fee Merkez entered (0 = free); an empty fee is never free
                      disabled={readOnly || (!e.enabled && typeof parseFee(e.feeText) !== "number")}
                      title={!readOnly && !e.enabled && typeof parseFee(e.feeText) !== "number" ? "Önce geçerli bir ücret girin (0 = ücretsiz)" : undefined}
                      onClick={() => patch([[key, { enabled: !e.enabled }]])}
                      className="inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className={`relative h-5 w-9 rounded-full transition-colors ${e.enabled ? "bg-neutral-900" : "bg-neutral-300"}`}>
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${e.enabled ? "left-[18px]" : "left-0.5"}`} />
                      </span>
                      <span className="text-[12px] text-neutral-600">{e.enabled ? "Açık" : "Kapalı"}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* "Vazgeç · Kaydet" only while there are changes */}
      {!readOnly && changed.length > 0 && (
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t border-neutral-200 bg-white/95 py-3 backdrop-blur">
          <span className="text-[12.5px] text-neutral-700">
            <strong className="text-neutral-900">{changed.length} mahalle</strong> değişti
            {problems.length > 0 && <> · {problems.length} satırda ücret eksik veya geçersiz</>}
          </span>
          {error && (
            <span role="alert" className="text-[12.5px] font-medium text-neutral-900">
              {error}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={discard} disabled={saving} className={BUTTON}>
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={!canSave || saving || problems.length > 0}
              title={!canSave ? "Kurulum bekleniyor" : undefined}
              className={PRIMARY}
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </div>
      )}

      {dialog === "add" && (
        <AddNeighborhoodsDialog
          branchId={branchId}
          branchName={branchName(branchId)}
          defaultDistrict={district}
          find={(key) => current(key)}
          ownerName={branchName}
          onClose={() => setDialog(null)}
          onAdd={(changes) => {
            patch(changes);
            // show everything that was added
            setDistrict("");
            setQuery("");
            setPicked(new Set());
            setDialog(null);
          }}
        />
      )}

      {dialog === "excel" && (
        <ExcelDialog
          current={current}
          branchName={branchName}
          onClose={() => setDialog(null)}
          onApply={(changes) => {
            patch(changes);
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Dialog({ title, onClose, size = "sm", children }: { title: string; onClose: () => void; size?: "sm" | "md" | "lg"; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  // once per opening: focus inside, Escape closes, focus goes back afterwards
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>("select, input, textarea")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      before?.focus?.();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden className="absolute inset-0 bg-neutral-900/30" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white p-5 shadow-xl ${size === "lg" ? "max-w-3xl" : size === "md" ? "max-w-lg" : "max-w-sm"}`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-neutral-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Kapat" className="-mr-1 -mt-1 rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
            <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** a saved area's tie to the official list: another official name, or none */
function PoolHint({ district, neighborhood }: { district: string; neighborhood: string }) {
  const entry = findPoolEntry(district, neighborhood);
  if (entry && entry.name === neighborhood) return null;
  return (
    <span className="ml-2 text-[11px] text-neutral-400" title={entry ? undefined : "Bu ad mahalle kaynaklarında yok; kayıt olduğu gibi korunur."}>
      {entry ? `resmî ad: ${entry.name}` : "resmî listede yok"}
    </span>
  );
}

/** one neighbourhood picked in "Mahalle Ekle", kept with its district while switching districts */
type Choice = {
  key: string;
  district: string;
  name: string;
  /** new: from the list, unassigned · manual: typed by hand · move: saved for another branch */
  kind: "new" | "manual" | "move";
  from: string | null;
};

function AddNeighborhoodsDialog({
  branchId,
  branchName,
  defaultDistrict,
  find,
  ownerName,
  onClose,
  onAdd,
}: {
  branchId: string;
  branchName: string;
  defaultDistrict: string;
  find: (key: string) => Edit | null;
  ownerName: (id: string) => string;
  onClose: () => void;
  onAdd: (changes: [string, Partial<Edit> | Edit][]) => void;
}) {
  const [district, setDistrict] = useState(AREA_DISTRICTS.includes(defaultDistrict) ? defaultDistrict : "");
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<Map<string, Choice>>(new Map());
  const [fee, setFee] = useState("");
  const [moveOk, setMoveOk] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualNote, setManualNote] = useState<string | null>(null);

  /** the record a list entry is saved as (under its name or an alias), if any */
  const savedAs = (entry: PoolEntry): { key: string; edit: Edit } | null => {
    for (const key of poolEntryKeys(entry)) {
      const edit = find(key);
      if (edit) return { key, edit };
    }
    return null;
  };

  /** what ticking an entry means — null when it can't be ticked (already here, waiting for checking) */
  const choiceFor = (entry: PoolEntry): Choice | null => {
    if (entry.status !== "verified") return null;
    const saved = savedAs(entry);
    if (saved && saved.edit.branchId === branchId) return null;
    if (saved) return { key: saved.key, district: entry.district, name: saved.edit.neighborhood, kind: "move", from: saved.edit.branchId };
    return { key: entry.key, district: entry.district, name: entry.name, kind: "new", from: null };
  };

  const hasList = Boolean(district) && poolDistricts().includes(district);
  const q = normalize(search);
  const list = hasList ? poolFor(district).filter((entry) => poolEntryMatches(entry, q)) : [];
  // "select all results": unassigned ones only — a move is always ticked one by one
  const bulkable = list.map(choiceFor).filter((c): c is Choice => c !== null && c.kind === "new");
  const allResults = bulkable.length > 0 && bulkable.every((c) => chosen.has(c.key));

  const toggle = (c: Choice, on: boolean) =>
    setChosen((cur) => {
      const next = new Map(cur);
      if (on) next.set(c.key, c);
      else next.delete(c.key);
      return next;
    });

  const all = [...chosen.values()];
  const moves = all.filter((c) => c.kind === "move");
  const perDistrict = [...new Set(all.map((c) => c.district))].map((d) => `${d} ${all.filter((c) => c.district === d).length}`);
  const feeValue = parseFee(fee);
  const feeProblem = feeValue === "invalid" ? `Geçerli bir tutar girin (0–${AREA_LIMITS.maxFee.toLocaleString("tr-TR")} ₺).` : null;
  // an empty fee is allowed and stays undefined (never 0): those areas are added closed
  const ready = all.length > 0 && feeValue !== "invalid" && (moves.length === 0 || moveOk);

  const addManual = () => {
    setManualNote(null);
    if (!district) return setManualNote("Önce ilçe seçin.");
    const name = cleanAreaName(manualName);
    const problem = areaNameProblem(name);
    if (problem) return setManualNote(problem);
    const entry = findPoolEntry(district, name);
    if (entry) {
      // it is on the list: pick it from there, never a second record
      const c = choiceFor(entry);
      if (entry.status !== "verified") return setManualNote(`“${entry.name}” listede doğrulama bekliyor; eklenemez.`);
      if (!c) return setManualNote(`“${entry.name}” zaten ekli.`);
      toggle(c, true);
      setManualName("");
      return setManualNote(`“${entry.name}” listede var; listeden seçildi.`);
    }
    const key = areaKey(district, name);
    const existing = find(key);
    if (existing && existing.branchId === branchId) return setManualNote(`“${existing.neighborhood}” zaten ekli.`);
    if (existing) {
      toggle({ key, district, name: existing.neighborhood, kind: "move", from: existing.branchId }, true);
      setManualName("");
      return setManualNote(`“${existing.neighborhood}” şu an ${ownerName(existing.branchId)} şubesinde; taşıma için seçildi.`);
    }
    toggle({ key, district, name, kind: "manual", from: null }, true);
    setManualName("");
    setManualNote(`“${name}” seçime eklendi (listede olmayan ad).`);
  };

  const submit = () => {
    if (!ready) return; // `ready` already excludes an invalid fee
    const given = typeof feeValue === "number";
    const feeText = typeof feeValue === "number" ? feeToText(feeValue) : "";
    onAdd(
      all.map((c): [string, Partial<Edit> | Edit] =>
        c.kind === "move"
          ? // a move without a fee keeps the area's own fee and on / off
            [c.key, given ? { branchId, enabled: true, feeText } : { branchId }]
          : [c.key, { district: c.district, neighborhood: c.name, branchId, enabled: given, feeText, isNew: true, manual: c.kind === "manual" }],
      ),
    );
  };

  return (
    <Dialog title={`Mahalle Ekle — ${branchName}`} onClose={onClose} size="md">
      <div className="space-y-3 text-[13px] text-neutral-800">
        <label className="block text-[12px] font-semibold text-neutral-600">
          İlçe
          <select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setSearch("");
              setManualNote(null);
            }}
            className={`${INPUT} mt-1 w-full`}
          >
            <option value="">Seçin</option>
            {AREA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {poolDistricts().includes(d) ? d : `${d} (liste yok)`}
              </option>
            ))}
          </select>
        </label>

        {district && !hasList && (
          <p className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-[12.5px] text-neutral-600">{district} için mahalle listesi henüz yüklenmedi.</p>
        )}

        {hasList && (
          <div>
            <div className="flex items-center gap-2">
              <input
                type="search"
                aria-label={`${district} mahallelerinde ara`}
                placeholder="Mahalle ara"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${INPUT} min-w-0 flex-1`}
              />
              <button
                type="button"
                disabled={bulkable.length === 0}
                onClick={() => bulkable.forEach((c) => toggle(c, !allResults))}
                className={`${BUTTON} shrink-0`}
              >
                {allResults ? "Sonuçlardaki seçimi kaldır" : `Sonuçların tümünü seç (${bulkable.length})`}
              </button>
            </div>
            <ul aria-label={`${district} mahalleleri`} className="mt-1.5 max-h-[240px] overflow-y-auto rounded border border-neutral-200">
              {list.length === 0 && <li className="px-3 py-3 text-[12.5px] text-neutral-400">Eşleşen mahalle yok.</li>}
              {list.map((entry) => {
                const c = choiceFor(entry);
                const saved = savedAs(entry);
                const here = saved?.edit.branchId === branchId;
                const pending = entry.status !== "verified";
                const ticked = c ? chosen.has(c.key) : here;
                const alias = q && !normalize(entry.name).includes(q) ? entry.aliases.find((a) => normalize(a).includes(q)) : null;
                const state = pending ? "Doğrulama bekliyor" : here ? "Zaten ekli" : saved ? `${ownerName(saved.edit.branchId)} şubesinde` : null;
                return (
                  <li key={entry.key} className="border-b border-neutral-100 last:border-0">
                    <label className={`flex items-center gap-2.5 px-3 py-1.5 ${c ? "cursor-pointer hover:bg-neutral-50" : "cursor-not-allowed text-neutral-400"}`} title={entry.note ?? undefined}>
                      <input
                        type="checkbox"
                        checked={ticked}
                        disabled={!c}
                        onChange={(e) => c && toggle(c, e.target.checked)}
                        className="h-3.5 w-3.5 shrink-0 accent-neutral-900"
                      />
                      <span className="min-w-0 flex-1">
                        {entry.name}
                        {alias && <span className="text-neutral-400"> ({alias})</span>}
                        {saved && saved.edit.neighborhood !== entry.name && <span className="text-neutral-400"> · kayıtta: {saved.edit.neighborhood}</span>}
                      </span>
                      {state && <span className={`shrink-0 text-[11.5px] ${saved && !here ? "font-semibold text-neutral-700" : ""}`}>{state}</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {district && (
          <div className="text-[12px]">
            {!manualOpen ? (
              <button type="button" onClick={() => setManualOpen(true)} className="text-neutral-500 underline underline-offset-2 hover:text-neutral-900">
                Listede yok, elle ekle
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  aria-label="Elle eklenecek mahalle adı"
                  placeholder={`${district} — mahalle adı`}
                  value={manualName}
                  maxLength={AREA_LIMITS.nameMax}
                  onChange={(e) => setManualName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addManual();
                    }
                  }}
                  className={`${INPUT} min-w-0 flex-1`}
                />
                <button type="button" onClick={addManual} className={BUTTON}>
                  Seçime ekle
                </button>
              </div>
            )}
            {manualNote && <p className="mt-1 text-neutral-600">{manualNote}</p>}
          </div>
        )}

        {/* the picks, of every district */}
        <div className="rounded border border-neutral-200 px-3 py-2">
          <p className="text-[12.5px] font-semibold text-neutral-900">
            {all.length} mahalle seçili{perDistrict.length > 1 || (perDistrict.length === 1 && all[0]?.district !== district) ? ` (${perDistrict.join(" · ")})` : ""}
          </p>
          {all.length > 0 && (
            <ul className="mt-1.5 flex max-h-[84px] flex-wrap gap-1.5 overflow-y-auto">
              {all.map((c) => (
                <li key={c.key} className="inline-flex items-center gap-1 rounded border border-neutral-300 px-1.5 py-0.5 text-[11.5px] text-neutral-700">
                  {c.name} <span className="text-neutral-400">({c.district})</span>
                  {c.kind === "manual" && <span className="text-neutral-400">· elle</span>}
                  <button type="button" onClick={() => toggle(c, false)} aria-label={`${c.name} seçimini kaldır`} className="ml-0.5 text-neutral-400 hover:text-neutral-900">
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {moves.length > 0 && (
          <label className="flex items-start gap-2 rounded-md border border-neutral-900 p-2.5 text-[12.5px] text-neutral-900">
            <input type="checkbox" checked={moveOk} onChange={(e) => setMoveOk(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-neutral-900" />
            <span>
              <strong>
                {moves.length} mahallenin şubesi değişecek; onaylıyorum:
              </strong>{" "}
              {moves.map((c) => `${c.name} (${c.district}) ${ownerName(c.from ?? "")} → ${branchName}`).join(", ")}
            </span>
          </label>
        )}

        <label className="block text-[12px] font-semibold text-neutral-600">
          Ortak teslimat ücreti
          <span className="mt-1 flex items-center gap-1">
            <input
              inputMode="decimal"
              aria-invalid={Boolean(feeProblem)}
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className={`${INPUT} w-[110px] text-right tabular-nums ${feeProblem ? "border-neutral-900" : ""}`}
            />
            <span className="text-[12.5px] font-normal text-neutral-500">₺</span>
          </span>
          <span className="mt-0.5 block font-normal text-neutral-400">
            0 TL = ücretsiz. Seçilen bütün mahallelere uygulanır; sonra tabloda ayrı ayrı değiştirilebilir. Boş bırakılırsa ücret tanımsız kalır ve
            mahalleler gönderime kapalı eklenir.
          </span>
          {feeProblem && <span className="mt-0.5 block font-medium text-neutral-900">{feeProblem}</span>}
        </label>

        <p className="text-[11px] text-neutral-400">
          Liste: ilçe belediyelerinin ve Ankara Büyükşehir Belediyesi&apos;nin muhtarlık listeleri · erişim {POOL_ACCESSED_AT.split("-").reverse().join(".")}
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={BUTTON}>
            Vazgeç
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!ready}
            title={
              all.length === 0 ? "Mahalle seçin" : feeValue === "invalid" ? "Geçerli bir ücret girin" : moves.length > 0 && !moveOk ? "Şube değişikliğini onaylayın" : undefined
            }
            className={PRIMARY}
          >
            {all.length} Mahalleyi Listeye Ekle
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function ExcelDialog({
  current,
  branchName,
  onClose,
  onApply,
}: {
  current: (key: string) => Edit | null;
  branchName: (id: string | null | undefined) => string;
  onClose: () => void;
  onApply: (changes: [string, Edit][]) => void;
}) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [moveOk, setMoveOk] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const read = async (file: File | undefined) => {
    if (!file || busy) return;
    if (input.current) input.current.value = "";
    setProblem(null);
    setPreview(null);
    setMoveOk(false);
    if (!/\.xlsx$/i.test(file.name)) return setProblem("Yalnızca .xlsx dosyası yüklenebilir.");
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/admin/delivery-areas/import", { method: "POST", body: form });
      const data = (await res.json().catch(() => null)) as ({ ok?: boolean; error?: string } & Omit<ImportPreview, "fileName">) | null;
      if (!res.ok || !data?.ok) setProblem(data?.error ?? "Dosya okunamadı.");
      else setPreview({ fileName: file.name, sheet: data.sheet, fileErrors: data.fileErrors, warnings: data.warnings, rows: data.rows });
    } catch {
      setProblem("Bağlantı kurulamadı; dosya okunamadı.");
    } finally {
      setBusy(false);
    }
  };

  const feeText = (r: ImportRow) => feeToText(r.fee);
  const verdicts: Verdict[] = (preview?.rows ?? []).map((row) => {
    if (row.errors.length > 0 || !row.key) return { row, kind: "error", notes: row.errors, move: null };
    const was = current(row.key);
    const fee = tl(row.fee ?? 0);
    if (!was) return { row, kind: "new", notes: [`${branchName(row.branchId)} · ${fee} · ${row.enabled ? "açık" : "kapalı"}`], move: null };
    const notes: string[] = [];
    if (was.branchId !== row.branchId) notes.push(`Şube: ${branchName(was.branchId)} → ${branchName(row.branchId)}`);
    if (was.enabled !== row.enabled) notes.push(`Gönderim: ${was.enabled ? "açık" : "kapalı"} → ${row.enabled ? "açık" : "kapalı"}`);
    const before = parseFee(was.feeText);
    if (before !== row.fee) notes.push(`Ücret: ${typeof before === "number" ? tl(before) : "—"} → ${fee}`);
    return { row, kind: notes.length ? "changed" : "same", notes, move: was.branchId !== row.branchId ? was.branchId : null };
  });
  const count = (k: Verdict["kind"]) => verdicts.filter((v) => v.kind === k).length;
  const moves = verdicts.filter((v) => v.move);
  const usable = verdicts.filter((v) => v.kind === "new" || v.kind === "changed");

  return (
    <Dialog title="Excel’den Yükle" onClose={onClose} size="lg">
      <div className="space-y-3 text-[12.5px] text-neutral-700">
        <p>
          Sütunlar: İlçe · Mahalle · Şube · Gönderim Açık (Evet/Hayır) · Teslimat Ücreti (TL, 0 = ücretsiz).{" "}
          <a href="/api/admin/delivery-areas/template" download className="font-semibold text-neutral-900 underline underline-offset-2">
            Örnek şablonu indir
          </a>
        </p>
        <div className="flex items-center gap-2">
          <input ref={input} type="file" accept=".xlsx" className="hidden" onChange={(e) => void read(e.target.files?.[0])} />
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className={BUTTON}>
            {busy ? "Okunuyor…" : preview ? "Başka dosya seç" : "Dosya seç (.xlsx)"}
          </button>
          {preview && <span className="truncate text-[12px] text-neutral-500">{preview.fileName}</span>}
        </div>

        {problem && (
          <p role="alert" className="font-medium text-neutral-900">
            {problem}
          </p>
        )}
        {preview && preview.fileErrors.length > 0 && (
          <p role="alert" className="font-medium text-neutral-900">
            Dosya kullanılamaz: {preview.fileErrors.join(" ")}
          </p>
        )}
        {preview && preview.warnings.length > 0 && <p className="text-[12px] text-neutral-500">{preview.warnings.join(" ")}</p>}

        {verdicts.length > 0 && (
          <>
            <p className="text-neutral-800">
              {count("new")} yeni · {count("changed")} değişecek · {count("same")} aynı · {count("error")} hatalı. Dosyada olmayan bölgeler değişmez.
            </p>
            <div className="max-h-[320px] overflow-auto rounded border border-neutral-200">
              <table className="w-full min-w-[560px] border-collapse">
                <thead className="sticky top-0">
                  <tr>
                    <th className={`${TH} w-[56px]`}>Satır</th>
                    <th className={TH}>Mahalle</th>
                    <th className={`${TH} w-[100px]`}>Durum</th>
                    <th className={TH}>Ayrıntı</th>
                  </tr>
                </thead>
                <tbody>
                  {verdicts.map((v) => (
                    <tr key={v.row.row}>
                      <td className={`${TD} tabular-nums`}>{v.row.row}</td>
                      <td className={TD}>
                        {v.row.neighborhood ?? (v.row.input.neighborhood || "—")}{" "}
                        <span className="text-neutral-500">({v.row.district ?? (v.row.input.district || "—")})</span>
                      </td>
                      <td className={`${TD} font-semibold`}>{{ new: "Yeni", changed: "Değişecek", same: "Aynı", error: "Hatalı" }[v.kind]}</td>
                      <td className={`${TD} text-[12px] ${v.kind === "error" ? "font-medium text-neutral-900" : "text-neutral-600"}`}>{v.notes.join(" · ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {moves.length > 0 && (
          <label className="flex items-start gap-2 rounded-md border border-neutral-900 p-2.5 text-neutral-900">
            <input type="checkbox" checked={moveOk} onChange={(e) => setMoveOk(e.target.checked)} className="mt-0.5 h-4 w-4 accent-neutral-900" />
            <span>
              <strong>Şube değişikliklerini onaylıyorum ({moves.length}):</strong>{" "}
              {moves.map((v) => `${v.row.neighborhood} ${branchName(v.move)} → ${branchName(v.row.branchId)}`).join(", ")}
            </span>
          </label>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          {count("error") > 0 && usable.length > 0 && <span className="mr-auto text-[12px] text-neutral-500">Hatalı satırlar aktarılmaz.</span>}
          <button type="button" onClick={onClose} className={BUTTON}>
            Vazgeç
          </button>
          <button
            type="button"
            disabled={usable.length === 0 || (moves.length > 0 && !moveOk)}
            onClick={() =>
              onApply(
                usable.map(({ row, kind }) => [
                  row.key!,
                  {
                    district: row.district!,
                    neighborhood: row.neighborhood!,
                    branchId: row.branchId!,
                    enabled: row.enabled!,
                    feeText: feeText(row),
                    // an area added in this session stays "new" when the file changes it
                    isNew: kind === "new" || Boolean(current(row.key!)?.isNew),
                  },
                ]),
              )
            }
            className={PRIMARY}
          >
            Tabloya aktar ({usable.length})
          </button>
        </div>
      </div>
    </Dialog>
  );
}
