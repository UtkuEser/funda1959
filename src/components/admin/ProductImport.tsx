"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ImportAction, ImportOutcome, ImportPreview, ImportResult } from "@/lib/catalog/import";
import { Badge, Panel } from "./ui";

/**
 * "Excel'den Ürün Yükle" (D48) — Merkez only, test data only. A chosen file
 * is first checked on the server (nothing written) and shown row by row;
 * "İçe Aktar" sends the same file with the preview's digest and shows what
 * the server actually did with every row. Nothing is called saved before
 * the server says so.
 */

const ACTION: Record<ImportAction, string> = { create: "Yeni · taslak", update: "Güncellenecek", unchanged: "Değişiklik yok", error: "Hatalı" };
const OUTCOME: Record<ImportOutcome["outcome"], string> = {
  created: "Eklendi (taslak)",
  updated: "Güncellendi",
  unchanged: "Değişmedi",
  failed: "Aktarılmadı",
  skipped: "Denenmedi",
};

const TH = "border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-neutral-500";
const TD = "border-b border-neutral-100 px-3 py-2 align-top text-[12.5px] text-neutral-800";
const ALERT = "rounded-md border border-neutral-900 bg-neutral-50 px-3 py-2 text-[12.5px] font-medium text-neutral-900";
const BUTTON = "rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400";

export function ProductImport({ addHref }: { addHref: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState<"preview" | "commit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const send = async (mode: "preview" | "commit", f: File, digest?: string) => {
    const form = new FormData();
    form.set("file", f);
    if (digest) form.set("digest", digest);
    const res = await fetch(`/api/admin/products/import?mode=${mode}`, { method: "POST", body: form });
    const data = (await res.json().catch(() => null)) as
      | ({ ok?: boolean; error?: string; preview?: ImportPreview } & Partial<ImportResult>)
      | null;
    return { res, data };
  };

  const choose = async (f: File | undefined) => {
    if (!f || busy) return;
    setFile(f);
    setPreview(null);
    setResult(null);
    setError(null);
    if (input.current) input.current.value = ""; // the same file can be chosen again
    if (!/\.xlsx$/i.test(f.name)) {
      setError("Yalnızca .xlsx dosyası yüklenebilir.");
      return;
    }
    setBusy("preview");
    try {
      const { res, data } = await send("preview", f);
      if (!res.ok || !data?.ok || !data.preview) setError(data?.error ?? "Dosya denetlenemedi. Lütfen tekrar deneyin.");
      else setPreview(data.preview);
    } catch {
      setError("Bağlantı kurulamadı; dosya denetlenemedi.");
    } finally {
      setBusy(null);
    }
  };

  const commit = async () => {
    if (!file || !preview || busy) return;
    setBusy("commit");
    setError(null);
    try {
      const { res, data } = await send("commit", file, preview.digest);
      if (!res.ok || !data?.ok || !data.results || !data.counts) {
        setError(data?.error ?? "İçe aktarılamadı. Lütfen tekrar deneyin.");
        return;
      }
      setResult({ results: data.results, counts: data.counts });
      setPreview(null);
      router.refresh();
    } catch {
      setError(
        "Bağlantı koptu; içe aktarmanın tamamlanıp tamamlanmadığı bilinmiyor. Dosyayı yeniden seçip önizlemeye bakın — aktarılmış satırlar tekrar oluşturulmaz.",
      );
    } finally {
      setBusy(null);
    }
  };

  const close = () => {
    if (busy === "commit") return;
    setOpen(false);
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const importable = preview ? preview.counts.create + preview.counts.update : 0;
  const errorRows = preview ? preview.rows.filter((r) => r.action === "error").map((r) => r.row) : [];

  return (
    <div className="mb-4">
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" aria-expanded={open} onClick={() => (open ? close() : setOpen(true))} className={BUTTON}>
          Excel’den Ürün Yükle
        </button>
        <Link
          href={addHref}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          + Ürün Ekle
        </Link>
      </div>

      {open && (
        <div className="mt-3">
          <Panel
            title="Excel’den Ürün Yükle"
            action={
              <button type="button" onClick={close} disabled={busy === "commit"} className="text-[12px] font-semibold text-neutral-500 underline hover:text-neutral-900">
                Kapat
              </button>
            }
          >
            <div className="space-y-3 p-4 text-[12.5px] leading-relaxed text-neutral-700">
              <p>
                <a href="/api/admin/products/import/template" download className="font-semibold text-neutral-900 underline underline-offset-2">
                  Örnek şablonu indir (.xlsx)
                </a>{" "}
                — ürünleri “Ürünler” sayfasına yazın, her satır bir ürün. Sütunların açıklaması ve kategorilerin boyutları şablonun
                “Açıklamalar” sayfasında.
              </p>
              <p>
                <strong className="text-neutral-900">Zorunlu sütunlar:</strong> Ürün Adı, Kategori, Açıklama ve fiyat — tek fiyatlı
                kategoride “Fiyat (TL)”, boyutlu kategoride en az bir boyut sütunu (örn. “4–6 Kişilik (TL)”).{" "}
                <strong className="text-neutral-900">İsteğe bağlı:</strong> şube stokları (Aktif / Pasif), Alerjen, Pasta Yazısı, Yeni,
                Çok Satan, Hediyelik (Evet / Hayır).
              </p>
              <p>
                Yeni ürünler <strong className="text-neutral-900">görselsiz taslak</strong> olarak eklenir ve sitede görünmez; görsel
                listedeki “Düzenle”den eklenir. Aynı adlı ürün varsa satır onu günceller: boş hücre mevcut değeri, görseli ve yayın
                durumunu korur. Aynı dosyayı tekrar yüklemek ikinci bir ürün oluşturmaz. Mevcut 18 ürün Excel ile değişmez.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={input}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => void choose(e.target.files?.[0])}
                />
                <button type="button" disabled={busy !== null} onClick={() => input.current?.click()} className={BUTTON}>
                  {file ? "Başka dosya seç" : "Dosya seç (.xlsx)"}
                </button>
                {file && <span className="truncate text-[12px] text-neutral-500">{file.name}</span>}
                {busy === "preview" && (
                  <span role="status" className="text-[12px] text-neutral-500">
                    Dosya denetleniyor…
                  </span>
                )}
              </div>

              {error && (
                <p role="alert" className={ALERT}>
                  {error}
                </p>
              )}

              {preview && (
                <div className="space-y-3">
                  {preview.notice && (
                    <p role="alert" className={ALERT}>
                      {preview.notice}
                    </p>
                  )}
                  {preview.fileErrors.length > 0 && (
                    <div role="alert" className={ALERT}>
                      <p>Dosya içe aktarılamaz:</p>
                      <ul className="mt-1 list-disc pl-5 font-normal">
                        {preview.fileErrors.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {preview.warnings.length > 0 && (
                    <ul className="list-disc pl-5 text-[12px] text-neutral-500">
                      {preview.warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  )}

                  {preview.rows.length > 0 && (
                    <>
                      <p className="font-medium text-neutral-900">
                        Önizleme{preview.sheet ? ` (“${preview.sheet}” sayfası)` : ""}: {preview.counts.create} yeni ürün ·{" "}
                        {preview.counts.update} güncelleme · {preview.counts.unchanged} değişiklik yok · {preview.counts.error} hatalı satır.
                        Henüz hiçbir şey kaydedilmedi.
                      </p>
                      {errorRows.length > 0 && (
                        <p role="alert" className={ALERT}>
                          Hatalı satırlar: {errorRows.join(", ")}. Bu satırlar içe aktarılmaz; düzeltip dosyayı yeniden yükleyebilirsiniz.
                        </p>
                      )}
                      <div className="max-h-[480px] overflow-auto rounded border border-neutral-200">
                        <table className="w-full min-w-[640px] border-collapse">
                          <thead className="sticky top-0">
                            <tr>
                              <th className={`${TH} w-[64px]`}>Satır</th>
                              <th className={TH}>Ürün</th>
                              <th className={`${TH} w-[130px]`}>İşlem</th>
                              <th className={TH}>Ayrıntı</th>
                            </tr>
                          </thead>
                          <tbody>
                            {preview.rows.map((r) => (
                              <tr key={r.row} className={r.action === "error" ? "bg-neutral-50" : undefined}>
                                <td className={`${TD} tabular-nums`}>{r.row}</td>
                                <td className={TD}>
                                  <span className="font-medium text-neutral-900">{r.name}</span>
                                  {r.category && <span className="block text-[11.5px] text-neutral-500">{r.category}</span>}
                                </td>
                                <td className={TD}>
                                  <Badge strong={r.action === "error"}>{ACTION[r.action]}</Badge>
                                </td>
                                <td className={TD}>
                                  {r.action === "error" ? (
                                    <ul className="list-disc pl-4 font-medium text-neutral-900">
                                      {r.messages.map((m) => (
                                        <li key={m}>{m}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <>
                                      {r.changes.length > 0 && (
                                        <ul className="list-disc pl-4">
                                          {r.changes.map((c) => (
                                            <li key={c}>{c}</li>
                                          ))}
                                        </ul>
                                      )}
                                      {r.action === "create" && r.prices && <p className="tabular-nums">{r.prices}</p>}
                                      {r.messages.map((m) => (
                                        <p key={m} className="text-[11.5px] text-neutral-500">
                                          {m}
                                        </p>
                                      ))}
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!preview.ready || importable === 0 || busy !== null}
                      onClick={() => void commit()}
                      className="rounded-md bg-neutral-900 px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                      {busy === "commit" ? "İçe aktarılıyor…" : `İçe Aktar${importable > 0 ? ` (${importable} ürün)` : ""}`}
                    </button>
                    <button type="button" disabled={busy !== null} onClick={close} className={BUTTON}>
                      Vazgeç
                    </button>
                    {preview.ready && importable === 0 && preview.fileErrors.length === 0 && (
                      <span className="text-[12px] text-neutral-500">İçe aktarılacak yeni ürün veya değişiklik yok.</span>
                    )}
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-3">
                  <p role="status" className="rounded-md border border-neutral-900 px-3 py-2 text-[12.5px] font-medium text-neutral-900">
                    İçe aktarma tamamlandı: {result.counts.created} ürün taslak olarak eklendi · {result.counts.updated} ürün güncellendi ·{" "}
                    {result.counts.unchanged} değişmedi
                    {result.counts.failed > 0 ? ` · ${result.counts.failed} satır aktarılmadı` : ""}
                    {result.counts.skipped > 0 ? ` · ${result.counts.skipped} satır denenmedi` : ""}.
                  </p>
                  <div className="max-h-[480px] overflow-auto rounded border border-neutral-200">
                    <table className="w-full min-w-[560px] border-collapse">
                      <thead className="sticky top-0">
                        <tr>
                          <th className={`${TH} w-[64px]`}>Satır</th>
                          <th className={TH}>Ürün</th>
                          <th className={`${TH} w-[140px]`}>Sonuç</th>
                          <th className={TH}>Not</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.results.map((r) => (
                          <tr key={r.row}>
                            <td className={`${TD} tabular-nums`}>{r.row}</td>
                            <td className={`${TD} font-medium text-neutral-900`}>{r.name}</td>
                            <td className={TD}>
                              <Badge strong={r.outcome === "failed" || r.outcome === "skipped"}>{OUTCOME[r.outcome]}</Badge>
                            </td>
                            <td className={TD}>{r.message ?? ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {result.counts.created > 0 && (
                    <p className="text-[12px] text-neutral-500">
                      Yeni ürünler listede “Taslak” olarak görünür ve sitede gösterilmez. Görsel eklemek için “Düzenle”, sonra “Yayında”.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
