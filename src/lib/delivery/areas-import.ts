/**
 * "Excel'den Yükle" / "Örnek Şablon İndir" for delivery areas (D50) —
 * server-only. Reading a file writes nothing: it returns the rows, checked
 * and with the areas' own spellings, and the panel shows them as a preview
 * (new / changed / unchanged / error) before they join the unsaved edits.
 * Saving is the panel's one "Değişiklikleri Kaydet".
 *
 * Columns: İlçe | Mahalle | Şube | Gönderim Açık | Teslimat Ücreti (TL).
 * Fee 0 = free, > 0 = paid; empty or negative is an error. A neighbourhood
 * is a saved area (its own name) or a checked entry of the pool (D52, name
 * or alias) — the same pool "Bölge Ekle" uses; anything else is an error.
 * A pool entry already saved under another name ("Oran" for "Or-An") is
 * that record, never a second one.
 */

import { getBranch, listBranches } from "../branch";
import { readXlsx, writeXlsx, XlsxError } from "../catalog/xlsx";
import { normalize } from "../search";
import { AREA_DISTRICTS, AREA_LIMITS, areaKey, isValidAreaFee, type AreaRecord } from "./areas";
import { findPoolEntry, NEIGHBORHOOD_POOL, POOL_ACCESSED_AT, POOL_SOURCES, poolDistricts, poolEntryKeys } from "./neighborhood-pool";
import { findArea } from "./zones";

if (typeof window !== "undefined") {
  throw new Error("delivery/areas-import.ts must never be imported on the client");
}

export const AREA_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const AREA_IMPORT_MAX_ROWS = 2000;
const SHEET = "Bölgeler";

type Column = "district" | "neighborhood" | "branch" | "enabled" | "fee";
const HEADERS: { key: Column; header: string; help: string }[] = [
  { key: "district", header: "İlçe", help: `Ankara ilçesi: ${AREA_DISTRICTS.join(", ")}.` },
  { key: "neighborhood", header: "Mahalle", help: "Resmî mahalle adı (“Mahalle Havuzu” sayfası) veya kayıtlı bölgenin adı. Aynı ilçede aynı mahalle bir kez yer alır." },
  { key: "branch", header: "Şube", help: "GOP, Panora AVM veya İncek TONA. Mahalle başka şubeye bağlıysa önizlemede onay istenir." },
  { key: "enabled", header: "Gönderim Açık", help: "Evet / Hayır. Hayır: mahalle silinmez, o adrese adrese teslim siparişi alınmaz." },
  { key: "fee", header: "Teslimat Ücreti (TL)", help: "0 = ücretsiz; 0'dan büyük = ücretli (en fazla 10.000 TL, en fazla iki ondalık). Boş veya negatif hatadır." },
];

/** One row of the file, checked. Values are null where the cell was wrong (see `errors`). */
export type AreaImportRow = {
  row: number;
  /** as written in the file (for the preview) */
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

export type AreaImportResult = { sheet: string | null; fileErrors: string[]; warnings: string[]; rows: AreaImportRow[] };

const norm = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/\*|\(tl\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
const clean = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const YES = new Set(["evet", "e", "açık", "acik", "1", "true", "var"]);
const NO = new Set(["hayır", "hayir", "h", "kapalı", "kapali", "0", "false", "yok"]);

const shortName = (id: string) => getBranch(id)?.shortName ?? id;

function branchOf(text: string): string | null {
  const t = normalize(text);
  if (!t) return null;
  for (const b of listBranches()) {
    const names = [b.id, b.name, b.shortName, b.name.replace("Funda 1959 ", ""), b.shortName.split(" ")[0]];
    if (names.some((n) => normalize(n) === t)) return b.id;
  }
  return null;
}

/** "0", "240", "240,50", "1.250,00", "240 TL" -> number; "" -> null; else "invalid" (negative included) */
function feeOf(raw: string): number | null | "invalid" | "negative" {
  let t = raw.replace(/\s/g, "").replace(/(tl|₺)$/i, "");
  if (!t) return null;
  if (t.startsWith("-")) return "negative";
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else t = t.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(t)) return "invalid";
  const n = Number(t);
  const r = Math.round(n * 100) / 100;
  return Math.abs(r - n) > 1e-6 ? "invalid" : r;
}

export function parseAreaImport(bytes: Uint8Array): AreaImportResult {
  let sheet;
  try {
    sheet = readXlsx(bytes, SHEET);
  } catch (err) {
    if (err instanceof XlsxError) return { sheet: null, fileErrors: [err.message], warnings: [], rows: [] };
    throw err;
  }
  const numbers = [...sheet.rows.keys()].sort((a, b) => a - b);
  const headerNo = numbers.find((n) => sheet.rows.get(n)!.some((c) => c.trim()));
  if (headerNo === undefined) return { sheet: sheet.name, fileErrors: [`“${sheet.name}” sayfası boş.`], warnings: [], rows: [] };

  const fileErrors: string[] = [];
  const warnings: string[] = [];
  const at = new Map<Column, number>();
  sheet.rows.get(headerNo)!.forEach((cell, i) => {
    if (!cell.trim()) return;
    const col = HEADERS.find((h) => norm(h.header) === norm(cell));
    if (!col) warnings.push(`Tanınmayan sütun “${cell.trim()}” yok sayıldı.`);
    else if (at.has(col.key)) fileErrors.push(`“${col.header}” sütunu iki kez var.`);
    else at.set(col.key, i);
  });
  for (const h of HEADERS) if (!at.has(h.key)) fileErrors.push(`Sütun eksik: “${h.header}”.`);
  const dataNos = numbers.filter((n) => n > headerNo && sheet.rows.get(n)!.some((c) => c.trim()));
  if (dataNos.length === 0 && fileErrors.length === 0) fileErrors.push("Dosyada bölge satırı yok.");
  if (dataNos.length > AREA_IMPORT_MAX_ROWS) fileErrors.push(`Bir dosyada en fazla ${AREA_IMPORT_MAX_ROWS} satır olabilir (dosyada ${dataNos.length}).`);
  if (fileErrors.length > 0) return { sheet: sheet.name, fileErrors, warnings, rows: [] };

  const firstRow = new Map<string, number>();
  const rows = dataNos.map((n): AreaImportRow => {
    const cells = sheet.rows.get(n)!;
    const get = (c: Column) => clean(cells[at.get(c)!]);
    const input = { district: get("district"), neighborhood: get("neighborhood"), branch: get("branch"), enabled: get("enabled"), fee: get("fee") };
    const errors: string[] = [];

    const district = AREA_DISTRICTS.find((d) => normalize(d) === normalize(input.district)) ?? null;
    if (!input.district) errors.push("İlçe boş.");
    else if (!district) errors.push(`İlçe “${input.district}” tanınmıyor (${AREA_DISTRICTS.join(", ")}).`);

    let neighborhood: string | null = null;
    if (!input.neighborhood) errors.push("Mahalle boş.");
    else if (district) {
      // a saved area keeps its own spelling ("bahcelievler" is "Bahçelievler"; "Oran" stays "Oran")
      const saved = findArea(district, input.neighborhood);
      const entry = saved ? null : findPoolEntry(district, input.neighborhood);
      if (saved) neighborhood = saved.neighborhood;
      else if (!poolDistricts().includes(district)) errors.push(`${district} için mahalle listesi yok.`);
      else if (!entry) errors.push(`“${input.neighborhood}” ${district} resmî mahalle listesinde yok.`);
      else if (entry.status !== "verified") errors.push(`“${entry.name}” doğrulama bekliyor; teslimata eklenemez.`);
      else {
        // the pool entry, or the record it is already saved as under another of its names
        const other = [entry.name, ...entry.aliases].map((n) => findArea(entry.district, n)).find(Boolean);
        neighborhood = other ? other.neighborhood : entry.name;
      }
    }
    const key = district && neighborhood ? areaKey(district, neighborhood) : null;
    if (key) {
      const earlier = firstRow.get(key);
      if (earlier !== undefined) errors.push(`Aynı mahalle ${earlier}. satırda da var.`);
      else firstRow.set(key, n);
    }

    const branchId = branchOf(input.branch);
    if (!input.branch) errors.push("Şube boş.");
    else if (!branchId) errors.push(`Şube “${input.branch}” tanınmıyor (GOP, Panora AVM, İncek TONA).`);

    const e = norm(input.enabled);
    const enabled = YES.has(e) ? true : NO.has(e) ? false : null;
    if (!input.enabled) errors.push("Gönderim Açık boş (Evet / Hayır).");
    else if (enabled === null) errors.push(`Gönderim Açık “${input.enabled}” anlaşılamadı (Evet / Hayır).`);

    const f = feeOf(input.fee);
    let feeState: AreaImportRow["feeState"] = null;
    let fee: number | null = null;
    if (f === null) errors.push("Teslimat ücreti boş (ücretsiz için 0 yazın).");
    else if (f === "negative") errors.push("Teslimat ücreti negatif olamaz.");
    else if (f === "invalid") errors.push(`Teslimat ücreti “${input.fee}” geçersiz (örn. 0, 150 veya 150,50).`);
    else if (f === 0) {
      feeState = "free";
      fee = 0;
    } else if (isValidAreaFee(f)) {
      feeState = "paid";
      fee = f;
    } else errors.push(`Teslimat ücreti en fazla ${AREA_LIMITS.maxFee.toLocaleString("tr-TR")} TL olabilir.`);

    return { row: n, input, key, district, neighborhood, branchId, enabled, feeState, fee, errors };
  });
  return { sheet: sheet.name, fileErrors, warnings, rows };
}

/** The template: the current areas as rows (re-uploading them unchanged changes nothing) and a sheet that explains. */
export function areaTemplate(areas: AreaRecord[] | null): Uint8Array {
  const sorted = [...(areas ?? [])].sort((a, b) => a.district.localeCompare(b.district, "tr") || a.neighborhood.localeCompare(b.neighborhood, "tr"));
  const rows: (string | number | null)[][] = [
    HEADERS.map((h) => h.header),
    ...sorted.map((a) => [a.district, a.neighborhood, shortName(a.branchId), a.enabled ? "Evet" : "Hayır", a.feeState === "unset" ? null : (a.fee ?? 0)]),
  ];
  const guide: (string | number | null)[][] = [
    ["Funda 1959 — teslimat bölgeleri şablonu"],
    ["“Bölgeler” sayfasında her satır bir ilçe–mahalle. Şablonda mevcut bölgeler yer alır; değiştirmediğiniz satırlar “aynı kalan” olarak görünür."],
    [],
    ["Sütun", "Ne yazılır"],
    ...HEADERS.map((h) => [h.header, h.help]),
    [],
    ["Kurallar"],
    ["• Dosyada olmayan bölgeler silinmez veya değişmez."],
    ["• Aynı ilçe–mahalle tekrar yüklenince yeni kayıt oluşmaz; mevcut satır güncellenir. Aynı adlı mahalle farklı ilçelerde ayrı bölgedir."],
    ["• Mahalle başka şubeye bağlıysa önizleme mevcut şubeyi gösterir ve taşımak için onay ister."],
    ["• Ücreti belirlenmemiş mahallelerde ücret hücresi boştur; yüklemeden önce doldurun (boş ücret hatadır)."],
    ["• Önizlemeden sonra satırlar tabloya kaydedilmemiş düzenleme olarak eklenir; “Kaydet” ile hepsi birlikte kaydedilir."],
    ["• Mahalle, “Mahalle Havuzu” sayfasındaki resmî addan (veya diğer yazımından) ya da kayıtlı bir bölgenin adından olmalıdır; listede olmayan ad hatadır. “Doğrulama bekliyor” durumundaki mahalle eklenemez."],
    [],
    ["Mahalle listesi kaynakları", `erişim: ${POOL_ACCESSED_AT}`],
    ...POOL_SOURCES.map((src) => [`${src.district} — ${src.publisher}`, `${src.url} (${src.pages} sayfa, ${src.count} mahalle)`]),
  ];
  // the pool, with the branch an entry is saved for (under any of its names)
  const byKey = new Map(sorted.map((a) => [a.key, a]));
  const pool: (string | number | null)[][] = [
    ["İlçe", "Mahalle", "Diğer yazımlar", "Durum", "Kayıtlı şube"],
    ...NEIGHBORHOOD_POOL.map((e) => {
      const saved = poolEntryKeys(e).map((k) => byKey.get(k)).find(Boolean);
      return [
        e.district,
        e.name,
        e.aliases.join(", ") || null,
        e.status === "verified" ? "Doğrulandı" : "Doğrulama bekliyor",
        saved ? `${shortName(saved.branchId)}${saved.neighborhood !== e.name ? ` (kayıtta: ${saved.neighborhood})` : ""}` : "Atanmamış",
      ];
    }),
  ];
  return writeXlsx([
    { name: SHEET, rows, widths: [16, 26, 16, 16, 22], header: true },
    { name: "Mahalle Havuzu", rows: pool, widths: [14, 30, 34, 20, 28], header: true },
    { name: "Açıklamalar", rows: guide, widths: [34, 110] },
  ]);
}
