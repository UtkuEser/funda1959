/**
 * "Excel'den Ürün Yükle" (D48) — Merkez only, test data only. Server-only.
 *
 *   template  an .xlsx with the columns and a sheet that explains them;
 *   preview   reads the file, checks every row and says, by its row number,
 *             what importing would do — nothing is written;
 *   commit    reads the same file again (its digest must match the preview),
 *             re-checks against the current data and writes the valid rows.
 *
 * The product name is the key: a row whose name is an existing panel product
 * updates it (an empty cell keeps the current value; the photo always stays),
 * any other row becomes a new DRAFT. A new product's request id comes from its
 * name, so the same file twice — or two clicks at once — never makes a second
 * product. Photos are not in the file: a new product stays a draft until a
 * photo is added in the product form. The 18 code products are not changed here.
 */

import { createHash } from "node:crypto";
import type { AdminScope } from "../admin/access";
import { listBranches } from "../branch";
import { formatTL } from "../cart-utils";
import { categories, isCodeProductSlug, SIZE_OPTIONS, variantKindFor } from "../data";
import { priceKey, priceRowsForCalculation, saveProductPrice, type ProductPriceRecord } from "../pricing/prices";
import { refreshProductPrices } from "../pricing/prices-server";
import { listProducts, ProductValidationError, saveProduct } from "./admin";
import { refusalMessage } from "./http";
import { checkDraft, isValidPrice, PRODUCT_LIMITS, productSlug, publishProblems } from "./rules";
import { ProductNotReadyError, ProductRefusedError, ProductStoreUnavailableError } from "./store";
import { BRANCH_IDS, type AdminProduct, type BranchId, type ProductFields } from "./types";
import { readXlsx, writeXlsx, XlsxError } from "./xlsx";

if (typeof window !== "undefined") {
  throw new Error("catalog/import.ts must never be imported on the client");
}

export const IMPORT_MAX_BYTES = 5 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 300;
const SHEET = "Ürünler";

/** The file changed between the preview and "İçe Aktar". */
export class ImportFileChangedError extends Error {
  constructor() {
    super("import: file differs from the previewed one");
    this.name = "ImportFileChangedError";
  }
}

/** Merkez prices could not be read fresh, so nothing is written. */
export class ImportPricesUnavailableError extends Error {
  constructor() {
    super("import: product prices could not be read");
    this.name = "ImportPricesUnavailableError";
  }
}

export type ImportAction = "create" | "update" | "unchanged" | "error";

export type ImportRowView = {
  /** the row number in the sheet, as Excel shows it */
  row: number;
  name: string;
  category: string | null;
  action: ImportAction;
  /** errors (action "error") or notes */
  messages: string[];
  /** what an update changes */
  changes: string[];
  /** the prices after importing ("4–6 Kişilik 780 TL · …") */
  prices: string;
};

export type ImportPreview = {
  sheet: string | null;
  /** sha256 of the file; "İçe Aktar" sends it back */
  digest: string;
  /** problems with the whole file (no rows are checked then) */
  fileErrors: string[];
  warnings: string[];
  rows: ImportRowView[];
  counts: Record<ImportAction, number>;
  /** false: nothing can be stored here (the notice says why) */
  ready: boolean;
  notice: string | null;
};

export type ImportOutcome = {
  row: number;
  name: string;
  outcome: "created" | "updated" | "unchanged" | "failed" | "skipped";
  message: string | null;
};

export type ImportResult = { results: ImportOutcome[]; counts: Record<ImportOutcome["outcome"], number> };

/* -------------------------------------------------------------------------- */
/* columns                                                                     */
/* -------------------------------------------------------------------------- */

type SizeKind = keyof typeof SIZE_OPTIONS;
type FlagKey = "cakeMessage" | "isNew" | "isBestSeller" | "isGift";
type Column = { key: string; header: string; required: string; help: string; width: number; aliases?: string[] };

const SIZE_COLUMNS = (Object.keys(SIZE_OPTIONS) as SizeKind[]).flatMap((kind) => SIZE_OPTIONS[kind].map((o) => ({ kind, id: o.id, label: o.label })));
const FLAGS: { key: FlagKey; header: string; help: string }[] = [
  { key: "cakeMessage", header: "Pasta Yazısı", help: "Evet / Hayır — müşteri pasta yazısı ekleyebilir." },
  { key: "isNew", header: "Yeni", help: "Evet / Hayır — “Yeni” etiketi." },
  { key: "isBestSeller", header: "Çok Satan", help: "Evet / Hayır — “Çok Satan” etiketi." },
  { key: "isGift", header: "Hediyelik", help: "Evet / Hayır — “Hediyelik” etiketi." },
];

const branchName = (id: BranchId) => listBranches().find((b) => b.id === id)?.name.replace("Funda 1959 ", "") ?? id;
const categoryName = (slug: string | null) => categories.find((c) => c.slug === slug)?.name ?? null;
const categoriesOf = (kind: SizeKind) => categories.filter((c) => variantKindFor(c.slug) === kind).map((c) => c.name);

function columns(): Column[] {
  return [
    {
      key: "name",
      header: "Ürün Adı *",
      required: "Evet",
      help: `Sitede görünen ad (${PRODUCT_LIMITS.nameMin}–${PRODUCT_LIMITS.nameMax} karakter). Eşleştirme anahtarıdır: aynı adla tekrar yüklenen satır mevcut ürünü günceller, yeni ürün oluşturmaz.`,
      width: 32,
    },
    { key: "category", header: "Kategori *", required: "Evet", help: "Sitedeki kategori adı (aşağıdaki listeden).", width: 20 },
    {
      key: "description",
      header: "Açıklama *",
      required: "Evet",
      help: `Kartta ve ürün sayfasında görünen kısa açıklama (${PRODUCT_LIMITS.shortMin}–${PRODUCT_LIMITS.shortMax} karakter).`,
      width: 50,
    },
    {
      key: "price",
      header: "Fiyat (TL)",
      required: "Tek fiyatlı kategoride",
      help: `Tek fiyatlı kategorilerde (${categories.filter((c) => variantKindFor(c.slug) === "none").map((c) => c.name).join(", ")}). Örn. 450 veya 450,50.`,
      width: 12,
    },
    ...SIZE_COLUMNS.map((s) => ({
      key: `size:${s.kind}:${s.id}`,
      header: `${s.label} (TL)`,
      required: "Boyutlu kategoride en az biri",
      help: `${categoriesOf(s.kind).join(", ")} için. Satılmayan boyutu boş bırakın.`,
      width: 14,
    })),
    ...BRANCH_IDS.map((b) => ({
      key: `stock:${b}`,
      header: `${branchName(b)} Stok`,
      required: "Hayır",
      help: "Aktif veya Pasif. Aktif: bugün için sipariş alınabilir; Pasif: en erken yarına. Yayınlamadan önce her şube için seçilmiş olmalı.",
      width: 13,
      aliases: [branchName(b)],
    })),
    {
      key: "allergens",
      header: "Alerjen",
      required: "Hayır",
      help: "Yalnızca doğrulanmış bilgi. Boş bırakılırsa ürün sayfasında alerjen bölümü gösterilmez.",
      width: 30,
    },
    ...FLAGS.map((f) => ({ key: f.key, header: f.header, required: "Hayır", help: f.help, width: 12 })),
  ];
}

const norm = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/[–—]/g, "-")
    .replace(/\*|\(tl\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
const clean = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const colLetter = (i: number) => {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

/* -------------------------------------------------------------------------- */
/* template                                                                    */
/* -------------------------------------------------------------------------- */

export function importTemplate(): Uint8Array {
  const cols = columns();
  const plain = (h: string) => h.replace(" *", "");
  const sized = categories.find((c) => variantKindFor(c.slug) === "serving");
  const single = categories.find((c) => variantKindFor(c.slug) === "none");
  const example = (name: string, cat: string | undefined, desc: string, prices: Record<string, string>) =>
    cols.map((c) => {
      if (c.key === "name") return name;
      if (c.key === "category") return cat ?? "";
      if (c.key === "description") return desc;
      if (c.key.startsWith("stock:")) return "Aktif";
      if (c.key === "cakeMessage") return cat === sized?.name ? "Evet" : "Hayır";
      if (c.key === "isNew") return "Evet";
      if (c.key === "isBestSeller" || c.key === "isGift") return "Hayır";
      return prices[c.key] ?? "";
    });

  const guide: (string | number | null)[][] = [
    ["Funda 1959 — Excel’den ürün yükleme şablonu"],
    ["Ürünleri “Ürünler” sayfasına yazın; her satır bir ürün. Başlık satırını değiştirmeyin."],
    [],
    ["Sütun", "Zorunlu", "Ne yazılır"],
    ...cols.map((c) => [plain(c.header), c.required, c.help]),
    [],
    ["Kategori", "Fiyat sütunları"],
    ...categories.map((c) => {
      const kind = variantKindFor(c.slug);
      return [c.name, kind === "none" ? "Fiyat (TL)" : SIZE_OPTIONS[kind].map((o) => `${o.label} (TL)`).join(", ")];
    }),
    [],
    ["Kurallar"],
    ["• Yeni ürünler görselsiz taslak olarak eklenir ve sitede görünmez. Görsel ürün formundan eklenir; sonra “Yayında” işaretlenir."],
    ["• Aynı adlı ürün zaten varsa satır onu günceller; dosyayı tekrar yüklemek ikinci bir ürün oluşturmaz."],
    ["• Güncellemede boş hücre mevcut değeri korur. Ürün görseli ve yayın durumu Excel’le değişmez."],
    ["• Fiyat: 450 veya 450,50 (TL). Boyutlu kategoride yalnızca o kategorinin boyut sütunları doldurulur."],
    ["• Stok: Aktif / Pasif. Evet/Hayır sütunları: Evet / Hayır."],
    ["• Mevcut 18 ürün Excel ile değiştirilmez; fiyatları Ürün Bilgisi listesinden düzenlenir."],
    ["• Hatalı satırlar satır numarasıyla gösterilir ve içe aktarılmaz; diğer satırlar aktarılır."],
    [],
    ["Örnek satırlar (yalnızca örnek; bu sayfa içe aktarılmaz)"],
    cols.map((c) => plain(c.header)),
    example("Örnek Fıstıklı Yaş Pasta", sized?.name, "Antep fıstıklı krema ve pandispanya katları ile hazırlanır.", {
      [`size:serving:${SIZE_OPTIONS.serving[0].id}`]: "780",
      [`size:serving:${SIZE_OPTIONS.serving[1].id}`]: "1100",
    }),
    example("Örnek Ürün", single?.name, "Kısa açıklama: ürünün kartta görünecek tanımı.", { price: "145,50" }),
  ];

  return writeXlsx([
    { name: SHEET, rows: [cols.map((c) => c.header)], widths: cols.map((c) => c.width), header: true },
    { name: "Açıklamalar", rows: guide, widths: [34, 30, 90] },
  ]);
}

/* -------------------------------------------------------------------------- */
/* reading rows                                                                */
/* -------------------------------------------------------------------------- */

type ParsedRow = {
  row: number;
  name: string;
  slug: string;
  category: string | null;
  /** the category cell was filled (it may still be unknown) */
  categoryGiven: boolean;
  description: string | null;
  single: number | null;
  /** a price cell could not be read */
  priceInvalid: boolean;
  sizes: { kind: SizeKind; id: string; label: string; price: number }[];
  stock: Partial<Record<BranchId, boolean>>;
  allergens: string | null;
  flags: Partial<Record<FlagKey, boolean>>;
  errors: string[];
};

const YES = new Set(["evet", "e", "var", "1", "true", "doğru", "x"]);
const NO = new Set(["hayır", "hayir", "h", "yok", "0", "false", "yanlış"]);
const ACTIVE = new Set(["aktif", "a", "açık", "acik", "1", "true", "evet"]);
const PASSIVE = new Set(["pasif", "p", "kapalı", "kapali", "0", "false", "hayır", "hayir"]);

/** "450", "450,50", "1.250,50", "1250.5", "450 TL" -> the amount; "" -> null */
function parsePrice(raw: string): number | null | "invalid" {
  let t = raw.replace(/\s/g, "").replace(/(tl|₺)$/i, "");
  if (!t) return null;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else t = t.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(t)) return "invalid";
  const n = Number(t);
  const rounded = Math.round(n * 100) / 100;
  if (Math.abs(rounded - n) > 1e-6) return "invalid";
  return isValidPrice(rounded) ? rounded : "invalid";
}

type Sheet = { sheet: string | null; fileErrors: string[]; warnings: string[]; rows: ParsedRow[] };

function readRows(bytes: Uint8Array): Sheet {
  let xlsx;
  try {
    xlsx = readXlsx(bytes, SHEET);
  } catch (err) {
    if (err instanceof XlsxError) return { sheet: null, fileErrors: [err.message], warnings: [], rows: [] };
    throw err;
  }
  const numbers = [...xlsx.rows.keys()].sort((a, b) => a - b);
  const headerNo = numbers.find((n) => xlsx.rows.get(n)!.some((c) => c.trim()));
  if (headerNo === undefined) return { sheet: xlsx.name, fileErrors: [`“${xlsx.name}” sayfası boş.`], warnings: [], rows: [] };

  const cols = columns();
  const lookup = new Map<string, Column>();
  for (const c of cols) for (const h of [c.header, ...(c.aliases ?? [])]) lookup.set(norm(h), c);

  const fileErrors: string[] = [];
  const warnings: string[] = [];
  const at = new Map<string, number>();
  xlsx.rows.get(headerNo)!.forEach((cell, i) => {
    if (!cell.trim()) return;
    const col = lookup.get(norm(cell));
    if (!col) warnings.push(`Tanınmayan sütun “${cell.trim()}” (${colLetter(i)}) yok sayıldı.`);
    else if (at.has(col.key)) fileErrors.push(`“${col.header.replace(" *", "")}” sütunu iki kez var (${colLetter(at.get(col.key)!)} ve ${colLetter(i)}).`);
    else at.set(col.key, i);
  });
  for (const c of cols) if (c.required === "Evet" && !at.has(c.key)) fileErrors.push(`Zorunlu sütun eksik: “${c.header.replace(" *", "")}” (${headerNo}. satırdaki başlıklarda).`);

  const dataNos = numbers.filter((n) => n > headerNo && xlsx.rows.get(n)!.some((c) => c.trim()));
  if (dataNos.length === 0 && fileErrors.length === 0) fileErrors.push("Dosyada ürün satırı yok.");
  if (dataNos.length > IMPORT_MAX_ROWS) fileErrors.push(`Bir dosyada en fazla ${IMPORT_MAX_ROWS} ürün satırı olabilir (dosyada ${dataNos.length}).`);
  if (fileErrors.length > 0) return { sheet: xlsx.name, fileErrors, warnings, rows: [] };

  const rows = dataNos.map((n): ParsedRow => {
    const cells = xlsx.rows.get(n)!;
    const get = (key: string) => {
      const i = at.get(key);
      return i === undefined ? "" : (cells[i] ?? "");
    };
    const errors: string[] = [];
    const name = clean(get("name"));
    const slug = productSlug(name);
    if (!name) errors.push("Ürün adı boş.");
    else if (name.length < PRODUCT_LIMITS.nameMin || name.length > PRODUCT_LIMITS.nameMax || !slug) {
      errors.push(`Ürün adı ${PRODUCT_LIMITS.nameMin}–${PRODUCT_LIMITS.nameMax} karakter olmalı.`);
    } else if (isCodeProductSlug(slug)) {
      errors.push("Bu ad mevcut 18 üründen birinin; Excel ile değiştirilemez (fiyatı Ürün Bilgisi listesinden düzenlenir).");
    }

    let category: string | null = null;
    const catText = clean(get("category"));
    if (catText) {
      const found = categories.find((c) => norm(c.name) === norm(catText) || c.slug === catText.toLowerCase());
      if (found) category = found.slug;
      else errors.push(`Kategori “${catText}” bulunamadı (şablondaki listeye bakın).`);
    }

    const descText = clean(get("description"));
    if (descText.length > PRODUCT_LIMITS.shortMax) errors.push(`Açıklama en fazla ${PRODUCT_LIMITS.shortMax} karakter olabilir (${descText.length}).`);

    let priceInvalid = false;
    const priceOf = (key: string, label: string): number | null => {
      const raw = get(key).trim();
      const p = parsePrice(raw);
      if (p === "invalid") {
        priceInvalid = true;
        errors.push(`“${label}” fiyatı geçersiz: “${raw}” (0’dan büyük, en fazla ${PRODUCT_LIMITS.maxPrice.toLocaleString("tr-TR")} TL; örn. 450 veya 450,50).`);
        return null;
      }
      return p;
    };
    const single = priceOf("price", "Fiyat");
    const sizes: ParsedRow["sizes"] = [];
    for (const s of SIZE_COLUMNS) {
      const p = priceOf(`size:${s.kind}:${s.id}`, s.label);
      if (p !== null) sizes.push({ ...s, price: p });
    }

    const stock: ParsedRow["stock"] = {};
    for (const b of BRANCH_IDS) {
      const v = norm(get(`stock:${b}`));
      if (!v) continue;
      if (ACTIVE.has(v)) stock[b] = true;
      else if (PASSIVE.has(v)) stock[b] = false;
      else errors.push(`“${branchName(b)} Stok” Aktif veya Pasif olmalı (“${get(`stock:${b}`).trim()}”).`);
    }

    const allergensText = clean(get("allergens"));
    if (allergensText.length > PRODUCT_LIMITS.allergensMax) errors.push(`Alerjen bilgisi en fazla ${PRODUCT_LIMITS.allergensMax} karakter olabilir.`);

    const flags: ParsedRow["flags"] = {};
    for (const f of FLAGS) {
      const v = norm(get(f.key));
      if (!v) continue;
      if (YES.has(v)) flags[f.key] = true;
      else if (NO.has(v)) flags[f.key] = false;
      else errors.push(`“${f.header}” Evet veya Hayır olmalı (“${get(f.key).trim()}”).`);
    }

    return {
      row: n,
      name,
      slug,
      category,
      categoryGiven: catText !== "",
      description: descText || null,
      single,
      priceInvalid,
      sizes,
      stock,
      allergens: allergensText || null,
      flags,
      errors,
    };
  });
  return { sheet: xlsx.name, fileErrors, warnings, rows };
}

/* -------------------------------------------------------------------------- */
/* planning                                                                    */
/* -------------------------------------------------------------------------- */

type Op =
  | { kind: "create"; requestId: string; fields: ProductFields }
  | { kind: "update"; id: string; version: number; fields: ProductFields | null; overrides: { key: string; price: number }[] };

type Planned = { view: ImportRowView; op: Op | null };

const sizeLabel = (key: string) => (key === "" ? "Fiyat" : (SIZE_COLUMNS.find((s) => s.id === key)?.label ?? key));
const yesNo = (b: boolean) => (b ? "Evet" : "Hayır");
const stockText = (v: boolean | undefined) => (v === undefined ? "seçilmedi" : v ? "Aktif" : "Pasif");
const pricesText = (sizes: { key: string; price: number | null }[]) =>
  sizes.map((s) => `${s.key === "" ? "" : `${sizeLabel(s.key)} `}${s.price === null ? "—" : formatTL(s.price)}`).join(" · ");

/** The same name always gives the same request id: importing it again returns the first draft. */
const requestIdFor = (slug: string) => `imp-${createHash("sha256").update(`catalog-import:${slug}`).digest("hex").slice(0, 40)}`;

function diff(a: AdminProduct, b: ProductFields): string[] {
  const out: string[] = [];
  if (a.name !== b.name) out.push(`Ad: ${a.name} → ${b.name}`);
  if (a.categorySlug !== b.categorySlug) out.push(`Kategori: ${categoryName(a.categorySlug) ?? "—"} → ${categoryName(b.categorySlug) ?? "—"}`);
  if (a.shortDescription !== b.shortDescription) out.push("Açıklama güncellenir");
  const before = new Map(a.sizes.map((s) => [s.key, s.price]));
  const after = new Map(b.sizes.map((s) => [s.key, s.price]));
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    const x = before.get(key);
    const y = after.get(key);
    if (x === y) continue;
    const fmt = (v: number | null | undefined) => (v === undefined ? "yok" : v === null ? "—" : formatTL(v));
    out.push(`${sizeLabel(key)}: ${fmt(x)} → ${fmt(y)}`);
  }
  for (const br of BRANCH_IDS) {
    if (a.branchStock[br] !== b.branchStock[br]) out.push(`${branchName(br)} stok: ${stockText(a.branchStock[br])} → ${stockText(b.branchStock[br])}`);
  }
  if (a.allergens !== b.allergens) out.push("Alerjen bilgisi güncellenir");
  for (const f of FLAGS) if (a[f.key] !== b[f.key]) out.push(`${f.header}: ${yesNo(a[f.key])} → ${yesNo(b[f.key])}`);
  return out;
}

function plan(sheet: Sheet, existing: AdminProduct[], priceRows: Map<string, ProductPriceRecord>): Planned[] {
  const bySlug = new Map(existing.map((p) => [p.slug, p]));
  const byName = new Map(existing.map((p) => [productSlug(p.name), p]));
  const firstRow = new Map<string, number>();

  return sheet.rows.map((r): Planned => {
    const errors = [...r.errors];
    const match = r.slug ? (bySlug.get(r.slug) ?? byName.get(r.slug) ?? null) : null;
    const dupKey = match ? `id:${match.id}` : `slug:${r.slug}`;
    if (r.slug) {
      const earlier = firstRow.get(dupKey);
      if (earlier !== undefined) errors.push(`Aynı ürün ${earlier}. satırda da var; bir ürün dosyada bir kez yer almalı.`);
      else firstRow.set(dupKey, r.row);
    }

    const category = r.category ?? match?.categorySlug ?? null;
    const view = (action: ImportAction, extra: Partial<ImportRowView> = {}): ImportRowView => ({
      row: r.row,
      name: r.name || "—",
      category: categoryName(category),
      action,
      messages: [],
      changes: [],
      prices: "",
      ...extra,
    });

    // the prices the row gives, for the category it ends up in
    const prices: { key: string; price: number }[] = [];
    if (match && !category && (r.single !== null || r.sizes.length > 0) && !r.categoryGiven) errors.push("Fiyatlar için kategori gerekli.");
    if (category) {
      const kind = variantKindFor(category);
      const catName = categoryName(category);
      if (kind === "none") {
        if (r.sizes.length > 0) errors.push(`“${catName}” kategorisinde boyut yok; fiyatı “Fiyat (TL)” sütununa yazın.`);
        if (r.single !== null) prices.push({ key: "", price: r.single });
      } else {
        if (r.single !== null) errors.push(`“${catName}” kategorisinde fiyat boyut sütunlarına yazılır (${SIZE_OPTIONS[kind].map((o) => o.label).join(", ")}).`);
        for (const s of r.sizes) {
          if (s.kind !== kind) errors.push(`“${s.label}” “${catName}” kategorisinin boyutu değil.`);
          else prices.push({ key: s.id, price: s.price });
        }
      }
    }

    if (!match) {
      if (r.name && !r.categoryGiven) errors.push("Kategori boş.");
      if (r.name && !r.description) errors.push("Açıklama boş.");
      else if (r.description && r.description.length < PRODUCT_LIMITS.shortMin) errors.push(`Açıklama en az ${PRODUCT_LIMITS.shortMin} karakter olmalı.`);
      if (r.category && prices.length === 0 && !r.priceInvalid) {
        errors.push(variantKindFor(r.category) === "none" ? "Fiyat girilmedi." : "En az bir boyutun fiyatını girin.");
      }
      if (errors.length > 0) return { view: view("error", { messages: errors }), op: null };
      const checked = checkDraft({
        name: r.name,
        categorySlug: r.category,
        shortDescription: r.description,
        imageId: null,
        sizes: prices,
        branchStock: r.stock,
        allergens: r.allergens,
        cakeMessage: r.flags.cakeMessage ?? false,
        isNew: r.flags.isNew ?? false,
        isBestSeller: r.flags.isBestSeller ?? false,
        isGift: r.flags.isGift ?? false,
      });
      if (!checked.ok) return { view: view("error", { messages: Object.values(checked.errors).filter(Boolean) as string[] }), op: null };
      const notes = ["Görselsiz taslak olarak eklenir; sitede görünmez. Görsel ürün formundan eklenir."];
      if (BRANCH_IDS.some((b) => r.stock[b] === undefined)) notes.push("Şube stokları eksik; yayından önce formda seçilir.");
      return {
        view: view("create", { messages: notes, prices: pricesText(checked.value.sizes) }),
        op: { kind: "create", requestId: requestIdFor(checked.slug), fields: checked.value },
      };
    }

    // an existing panel product: empty cells keep what it has; the photo always stays
    const categoryChanged = r.category !== null && r.category !== match.categorySlug;
    if (categoryChanged && prices.length === 0) errors.push("Kategori değişiyorsa yeni kategorinin fiyatlarını da girin.");
    if (errors.length > 0) return { view: view("error", { messages: errors }), op: null };

    const sizes = new Map<string, number | null>(categoryChanged ? [] : match.sizes.map((s) => [s.key, s.price]));
    for (const p of prices) sizes.set(p.key, p.price);
    const checked = checkDraft({
      name: r.name,
      categorySlug: category,
      shortDescription: r.description ?? match.shortDescription,
      imageId: match.imageId,
      sizes: [...sizes].map(([key, price]) => ({ key, price })),
      branchStock: { ...match.branchStock, ...r.stock },
      allergens: r.allergens ?? match.allergens,
      cakeMessage: r.flags.cakeMessage ?? match.cakeMessage,
      isNew: r.flags.isNew ?? match.isNew,
      isBestSeller: r.flags.isBestSeller ?? match.isBestSeller,
      isGift: r.flags.isGift ?? match.isGift,
    });
    if (!checked.ok) return { view: view("error", { messages: Object.values(checked.errors).filter(Boolean) as string[] }), op: null };
    if (match.status === "published") {
      const problems = Object.values(publishProblems(checked.value)).filter(Boolean) as string[];
      if (problems.length > 0) return { view: view("error", { messages: problems.map((p) => `Yayındaki ürün: ${p}`) }), op: null };
    }

    const changes = diff(match, checked.value);
    // a Merkez price set on the list wins on the site: the file's price replaces it
    const overrides: { key: string; price: number }[] = [];
    for (const p of prices) {
      const stored = priceRows.get(priceKey(match.id, p.key));
      if (stored && stored.price !== p.price) {
        overrides.push(p);
        changes.push(`Merkez fiyatı (${sizeLabel(p.key)}): ${formatTL(stored.price)} → ${formatTL(p.price)}`);
      }
    }
    const notes = match.status === "draft" ? ["Taslak; görsel ve yayın durumu değişmez."] : ["Görsel ve yayın durumu değişmez."];
    if (changes.length === 0) return { view: view("unchanged", { messages: ["Dosyadaki bilgiler mevcut ürünle aynı."], prices: pricesText(checked.value.sizes) }), op: null };
    return {
      view: view("update", { changes, messages: notes, prices: pricesText(checked.value.sizes) }),
      op: { kind: "update", id: match.id, version: match.version, fields: diff(match, checked.value).length > 0 ? checked.value : null, overrides },
    };
  });
}

const digestOf = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

function countViews(rows: ImportRowView[]): Record<ImportAction, number> {
  const counts: Record<ImportAction, number> = { create: 0, update: 0, unchanged: 0, error: 0 };
  for (const r of rows) counts[r.action]++;
  return counts;
}

/* -------------------------------------------------------------------------- */
/* preview / commit                                                            */
/* -------------------------------------------------------------------------- */

/** Nothing is written. Without the product tables (0013) the rows are still checked; "ready" is false. */
export async function previewImport(scope: AdminScope, bytes: Uint8Array): Promise<ImportPreview> {
  let existing: AdminProduct[] = [];
  let notice: string | null = null;
  try {
    existing = await listProducts(scope); // also: Merkez only, open on this deployment
  } catch (err) {
    if (err instanceof ProductNotReadyError) {
      notice = "İçe aktarılamaz: ürün tabloları bu veritabanında henüz kurulmadı (migration 0013). Önizleme yalnızca dosyayı denetler; hiçbir şey kaydedilmez.";
    } else if (err instanceof ProductStoreUnavailableError) {
      notice = "İçe aktarılamaz: bu ortamda veritabanı bağlantısı yok. Önizleme yalnızca dosyayı denetler.";
    } else throw err;
  }
  const warnings: string[] = [];
  let priceRows = new Map<string, ProductPriceRecord>();
  try {
    await refreshProductPrices({ strict: true });
    priceRows = priceRowsForCalculation() ?? priceRows;
  } catch {
    warnings.push("Merkez fiyatları şu an okunamadı; fiyat karşılaştırması eksik olabilir. İçe aktarma sırasında yeniden okunur.");
  }

  const sheet = readRows(bytes);
  const rows = sheet.fileErrors.length > 0 ? [] : plan(sheet, existing, priceRows).map((p) => p.view);
  return {
    sheet: sheet.sheet,
    digest: digestOf(bytes),
    fileErrors: sheet.fileErrors,
    warnings: [...sheet.warnings, ...warnings],
    rows,
    counts: countViews(rows),
    ready: notice === null,
    notice,
  };
}

function failureMessage(err: unknown): string | null {
  if (err instanceof ProductValidationError) return Object.values(err.errors).filter(Boolean).join(" ");
  if (err instanceof ProductRefusedError) return refusalMessage(err.code);
  return null;
}

/**
 * Writes the valid rows of the previewed file, one by one. A row the
 * database refuses is reported and the next row goes on; if the store
 * itself fails, the remaining rows are not tried (and say so).
 */
export async function commitImport(scope: AdminScope, bytes: Uint8Array, expectedDigest: unknown): Promise<ImportResult> {
  if (typeof expectedDigest !== "string" || expectedDigest !== digestOf(bytes)) throw new ImportFileChangedError();
  const existing = await listProducts(scope); // Merkez only; 0013 missing -> ProductNotReadyError (nothing written)
  try {
    await refreshProductPrices({ strict: true });
  } catch {
    throw new ImportPricesUnavailableError();
  }
  const priceRows = priceRowsForCalculation();
  if (!priceRows) throw new ImportPricesUnavailableError();

  const sheet = readRows(bytes);
  if (sheet.fileErrors.length > 0) throw new XlsxError(sheet.fileErrors.join(" "));

  const results: ImportOutcome[] = [];
  let stopped: string | null = null;
  for (const { view, op } of plan(sheet, existing, priceRows)) {
    const base = { row: view.row, name: view.name };
    if (!op) {
      results.push(view.action === "error" ? { ...base, outcome: "failed", message: `İçe aktarılmadı: ${view.messages.join(" ")}` } : { ...base, outcome: "unchanged", message: null });
      continue;
    }
    if (stopped) {
      results.push({ ...base, outcome: "skipped", message: stopped });
      continue;
    }
    try {
      if (op.kind === "create") {
        const saved = await saveProduct(scope, { clientRequestId: op.requestId, fields: op.fields });
        results.push(
          saved.duplicate
            ? {
                ...base,
                outcome: "unchanged",
                message:
                  saved.product.name === op.fields.name
                    ? "Daha önce içe aktarılmış; yeni ürün oluşturulmadı."
                    : `Daha önce içe aktarılmış (şimdiki adı “${saved.product.name}”); yeni ürün oluşturulmadı.`,
              }
            : { ...base, outcome: "created", message: "Taslak olarak eklendi." },
        );
        continue;
      }
      if (op.fields) await saveProduct(scope, { id: op.id, expectedVersion: op.version, fields: op.fields });
      try {
        for (const o of op.overrides) await saveProductPrice(op.id, o.key, o.price, scope.user.name);
      } catch (err) {
        console.error("[catalog import] price not saved", { productId: op.id, error: (err as Error).message.slice(0, 200) });
        results.push({ ...base, outcome: "failed", message: op.fields ? "Ürün güncellendi, ancak Merkez fiyatı kaydedilemedi." : "Merkez fiyatı kaydedilemedi." });
        continue;
      }
      results.push({ ...base, outcome: "updated", message: null });
    } catch (err) {
      const known = failureMessage(err);
      if (known) {
        results.push({ ...base, outcome: "failed", message: known });
        continue;
      }
      console.error("[catalog import] row failed", { row: view.row, error: (err as Error).message.slice(0, 200) });
      results.push({ ...base, outcome: "failed", message: "Kaydedilemedi: kayıt servisi hata verdi." });
      stopped = "Denenmedi: önceki satırda kayıt servisi hata verdi. Dosyayı tekrar yükleyebilirsiniz; aktarılan satırlar tekrar oluşturulmaz.";
    }
  }

  const counts: ImportResult["counts"] = { created: 0, updated: 0, unchanged: 0, failed: 0, skipped: 0 };
  for (const r of results) counts[r.outcome]++;
  return { results, counts };
}

export { XlsxError };
