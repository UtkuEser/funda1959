"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Badge, Panel } from "./ui";
import { IMAGE_RULES, PRODUCT_LIMITS, imageProblem, type FieldErrors } from "@/lib/catalog/rules";
import type { AdminProduct, BranchId, ProductStatus } from "@/lib/catalog/types";

/**
 * "Ürün Ekle" / "Ürün Düzenle" (D45, D46, D48) — Merkez only, test data only.
 * Saves through /api/admin/products; says "saved" / "published" only after
 * the server confirmed it. Photos are checked in the browser for an early
 * hint and on the server for real; nothing is cropped or resized here. With
 * `initial` the form opens a product added in the panel (e.g. a draft from
 * the Excel import) and keeps its photo until another one is chosen.
 */

export type ProductFormCategory = { slug: string; name: string; sizes: { id: string; label: string }[] };

type SizeState = Record<string, { on: boolean; price: string }>;
type Photo = {
  previewUrl: string;
  fileName: string;
  bytes: number;
  width: number | null;
  height: number | null;
  uploadId: string;
  /** null: the product's current photo (nothing to upload) */
  file: File | null;
  state: "checking" | "invalid" | "uploading" | "uploaded" | "failed" | "not-sent";
  message: string | null;
  imageId: string | null;
};

const inputClass =
  "h-9 w-full rounded border border-neutral-300 bg-white px-2.5 text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none disabled:bg-neutral-50";
const labelClass = "mb-1 block text-[11.5px] font-semibold uppercase tracking-[0.04em] text-neutral-500";
const hintClass = "mt-1 text-[11.5px] text-neutral-400";
const errorClass = "mt-1 text-[12px] font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-2";

const STATUS_LABEL: Record<ProductStatus, string> = { draft: "Taslak", published: "Yayında", unpublished: "Yayında değil" };

/** "1250" / "1250,5" / "1.250,50" is not accepted — like the "Ürün Bilgisi" list: digits, optional 1–2 decimals */
function parsePrice(text: string): number | null | "invalid" {
  const t = text.trim();
  if (!t) return null;
  if (!/^\d{1,6}([.,]\d{1,2})?$/.test(t)) return "invalid";
  const n = Number(t.replace(",", "."));
  return n > 0 && n <= PRODUCT_LIMITS.maxPrice ? n : "invalid";
}

const priceText = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));

function initialSizes(p: AdminProduct | undefined): SizeState {
  const out: SizeState = {};
  for (const s of p?.sizes ?? []) if (s.key !== "") out[s.key] = { on: true, price: priceText(s.price) };
  return out;
}

function initialPhoto(p: AdminProduct | undefined): Photo | null {
  if (!p?.imageId || !p.imageUrl) return null;
  return { previewUrl: p.imageUrl, fileName: "Mevcut görsel", bytes: 0, width: null, height: null, uploadId: "", file: null, state: "uploaded", message: null, imageId: p.imageId };
}

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.round(n / 1024)} KB`);

export function ProductForm({
  categories,
  branches,
  canSave,
  notice,
  initial,
}: {
  /** a product to edit (else a new one) */
  initial?: AdminProduct;
  categories: ProductFormCategory[];
  branches: { id: BranchId; name: string }[];
  /** false when nothing can be stored here (closed, or migration 0013 missing) */
  canSave: boolean;
  /** why saving is not possible, shown above the form */
  notice: string | null;
}) {
  // one id per form: a double click or a retry creates one draft, not two
  const [requestId] = useState(() => crypto.randomUUID());
  const [saved, setSaved] = useState<Pick<AdminProduct, "id" | "version" | "status" | "slug"> | null>(() =>
    initial ? { id: initial.id, version: initial.version, status: initial.status, slug: initial.slug } : null,
  );

  const [name, setName] = useState(initial?.name ?? "");
  const [categorySlug, setCategorySlug] = useState(initial?.categorySlug ?? "");
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? "");
  const [sizes, setSizes] = useState<SizeState>(() => initialSizes(initial));
  const [singlePrice, setSinglePrice] = useState(() => priceText(initial?.sizes.find((s) => s.key === "")?.price ?? null));
  const [branchStock, setBranchStock] = useState<Partial<Record<BranchId, boolean>>>(initial?.branchStock ?? {});
  const [allergens, setAllergens] = useState(initial?.allergens ?? "");
  const [cakeMessage, setCakeMessage] = useState(initial?.cakeMessage ?? false);
  const [isNew, setIsNew] = useState(initial?.isNew ?? false);
  const [isBestSeller, setIsBestSeller] = useState(initial?.isBestSeller ?? false);
  const [isGift, setIsGift] = useState(initial?.isGift ?? false);
  const [photo, setPhoto] = useState<Photo | null>(() => initialPhoto(initial));

  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [done, setDone] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const category = categories.find((c) => c.slug === categorySlug) ?? null;
  const sized = Boolean(category && category.sizes.length > 0);

  const touch = () => {
    setDone(null);
  };

  /* ---------------------------------------------------------------- photo */

  const upload = async (p: Photo) => {
    if (!p.file) return;
    setPhoto({ ...p, state: "uploading", message: null });
    const form = new FormData();
    form.set("clientUploadId", p.uploadId);
    form.set("file", p.file);
    try {
      const res = await fetch("/api/admin/products/image", { method: "POST", body: form });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; image?: { id: string }; error?: string } | null;
      if (res.ok && data?.ok && data.image?.id) {
        setPhoto((cur) => (cur && cur.uploadId === p.uploadId ? { ...cur, state: "uploaded", imageId: data.image!.id, message: null } : cur));
        setFieldErrors((e) => ({ ...e, imageId: undefined }));
      } else {
        const message = data?.error ?? "Görsel kaydedilemedi.";
        setPhoto((cur) => (cur && cur.uploadId === p.uploadId ? { ...cur, state: "failed", imageId: null, message } : cur));
      }
    } catch {
      setPhoto((cur) => (cur && cur.uploadId === p.uploadId ? { ...cur, state: "failed", imageId: null, message: "Bağlantı kurulamadı; tekrar deneyin." } : cur));
    }
  };

  const pick = (file: File | undefined) => {
    if (!file) return;
    touch();
    if (photo?.file) URL.revokeObjectURL(photo.previewUrl);
    const next: Photo = {
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      bytes: file.size,
      width: null,
      height: null,
      uploadId: crypto.randomUUID(),
      file,
      state: "checking",
      message: null,
      imageId: null,
    };
    setPhoto(next);
    // early hint in the browser (the server checks the file's content again)
    if (!(IMAGE_RULES.types as readonly string[]).includes(file.type)) {
      setPhoto({ ...next, state: "invalid", message: "Yalnızca JPEG, PNG veya WebP görsel yüklenebilir." });
      return;
    }
    const img = new Image();
    img.onload = () => {
      const measured = { ...next, width: img.naturalWidth, height: img.naturalHeight };
      const problem = imageProblem({ width: img.naturalWidth, height: img.naturalHeight, bytes: file.size, animated: false });
      if (problem) setPhoto({ ...measured, state: "invalid", message: problem });
      else if (!canSave) setPhoto({ ...measured, state: "not-sent", message: "Önizleme yalnızca bu tarayıcıda; görsel kaydedilemiyor (yukarıdaki nota bakın)." });
      else void upload(measured);
    };
    img.onerror = () => setPhoto({ ...next, state: "invalid", message: "Görsel okunamadı." });
    img.src = next.previewUrl;
  };

  const removePhoto = () => {
    touch();
    if (photo?.file) URL.revokeObjectURL(photo.previewUrl);
    setPhoto(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  /* ---------------------------------------------------------------- save */

  const buildFields = (): { fields: Record<string, unknown> } | { problem: FieldErrors } => {
    let sizeList: { key: string; price: number | null }[] = [];
    if (category && sized) {
      for (const s of category.sizes) {
        const st = sizes[s.id];
        if (!st?.on) continue;
        const price = parsePrice(st.price);
        if (price === "invalid") return { problem: { sizes: `${s.label} fiyatını 1250 veya 1250,50 biçiminde girin (en fazla ${PRODUCT_LIMITS.maxPrice.toLocaleString("tr-TR")} TL).` } };
        sizeList.push({ key: s.id, price });
      }
    } else if (category) {
      const price = parsePrice(singlePrice);
      if (price === "invalid") return { problem: { sizes: `Fiyatı 1250 veya 1250,50 biçiminde girin (en fazla ${PRODUCT_LIMITS.maxPrice.toLocaleString("tr-TR")} TL).` } };
      sizeList = price === null ? [] : [{ key: "", price }];
    }
    return {
      fields: {
        name,
        categorySlug: categorySlug || null,
        shortDescription,
        imageId: photo?.state === "uploaded" ? photo.imageId : null,
        sizes: sizeList,
        branchStock,
        allergens: allergens.trim() ? allergens : null,
        cakeMessage,
        isNew,
        isBestSeller,
        isGift,
      },
    };
  };

  const submit = async (publish: boolean) => {
    if (busy || !canSave) return;
    setError(null);
    setFieldErrors({});
    setDone(null);
    if (photo && (photo.state === "uploading" || photo.state === "checking")) {
      setError("Görsel yükleniyor; bitince tekrar deneyin.");
      return;
    }
    const built = buildFields();
    if ("problem" in built) {
      setFieldErrors(built.problem);
      setError("Lütfen işaretli alanları düzeltin.");
      return;
    }
    setBusy(publish ? "publish" : "save");
    try {
      const res = await fetch("/api/admin/products", {
        method: saved ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saved ? { id: saved.id, expectedVersion: saved.version, fields: built.fields } : { clientRequestId: requestId, fields: built.fields }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; product?: AdminProduct; error?: string; fields?: FieldErrors } | null;
      if (!res.ok || !data?.ok || !data.product) {
        setError(data?.error ?? "Kaydedilemedi. Lütfen tekrar deneyin.");
        setFieldErrors(data?.fields ?? {});
        return;
      }
      let product = data.product;
      setSaved({ id: product.id, version: product.version, status: product.status, slug: product.slug });

      if (publish && product.status !== "published") {
        const pub = await fetch("/api/admin/products/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: product.id, expectedVersion: product.version, status: "published" }),
        });
        const pubData = (await pub.json().catch(() => null)) as { ok?: boolean; product?: AdminProduct; error?: string; fields?: FieldErrors } | null;
        if (!pub.ok || !pubData?.ok || !pubData.product) {
          setError(`Taslak kaydedildi, ancak yayınlanamadı: ${pubData?.error ?? "lütfen tekrar deneyin."}`);
          setFieldErrors(pubData?.fields ?? {});
          return;
        }
        product = pubData.product;
        setSaved({ id: product.id, version: product.version, status: product.status, slug: product.slug });
      }
      setDone(publish ? "Ürün yayınlandı." : product.status === "draft" ? "Taslak kaydedildi." : "Değişiklikler kaydedildi.");
    } catch {
      setError("Bağlantı kurulamadı; kaydedilmedi. Lütfen tekrar deneyin.");
    } finally {
      setBusy(null);
    }
  };

  /* ---------------------------------------------------------------- view */

  const fieldError = (k: keyof FieldErrors) => (fieldErrors[k] ? <p className={errorClass}>{fieldErrors[k]}</p> : null);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="space-y-5">
        <Panel title="Ürün bilgileri">
          <div className="space-y-4 p-4">
            <div>
              <label htmlFor="pf-name" className={labelClass}>Ürün adı</label>
              <input
                id="pf-name"
                className={inputClass}
                value={name}
                maxLength={PRODUCT_LIMITS.nameMax}
                onChange={(e) => {
                  touch();
                  setName(e.target.value);
                }}
              />
              {saved && saved.status !== "draft" ? (
                <p className={hintClass}>Adres sabit: /urunler/{saved.slug}</p>
              ) : (
                <p className={hintClass}>Ürün sayfasının adresi addan oluşur ve ürün yayınlanınca değişmez.</p>
              )}
              {fieldError("name")}
            </div>

            <div>
              <label htmlFor="pf-category" className={labelClass}>Kategori</label>
              <select
                id="pf-category"
                className={inputClass}
                value={categorySlug}
                onChange={(e) => {
                  touch();
                  setCategorySlug(e.target.value);
                  setSizes({});
                  setSinglePrice("");
                }}
              >
                <option value="">Kategori seçin</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldError("categorySlug")}
            </div>

            <div>
              <label htmlFor="pf-desc" className={labelClass}>Açıklama</label>
              <textarea
                id="pf-desc"
                rows={3}
                className={`${inputClass} h-auto py-2`}
                value={shortDescription}
                maxLength={PRODUCT_LIMITS.shortMax}
                onChange={(e) => {
                  touch();
                  setShortDescription(e.target.value);
                }}
              />
              <p className={hintClass}>
                Kartta ve ürün sayfasında görünür. {PRODUCT_LIMITS.shortMin}–{PRODUCT_LIMITS.shortMax} karakter ({shortDescription.trim().length}).
              </p>
              {fieldError("shortDescription")}
            </div>
          </div>
        </Panel>

        <Panel title="Boyut ve fiyat">
          <div className="p-4">
            {!category ? (
              <p className="text-[12.5px] text-neutral-500">Önce kategori seçin; boyutlar kategoriye göre belirlenir.</p>
            ) : sized ? (
              <>
                <p className="mb-3 text-[12px] text-neutral-500">
                  Satılacak boyutları seçin; her boyutun fiyatı ayrı girilir. Kartta en küçük boyutun fiyatı görünür.
                </p>
                <div className="divide-y divide-neutral-100 rounded border border-neutral-200">
                  {category.sizes.map((s) => {
                    const st = sizes[s.id] ?? { on: false, price: "" };
                    return (
                      <div key={s.id} className="flex items-center gap-3 px-3 py-2">
                        <label className="flex min-w-[130px] items-center gap-2 text-[13px] text-neutral-800">
                          <input
                            type="checkbox"
                            checked={st.on}
                            onChange={(e) => {
                              touch();
                              setSizes((cur) => ({ ...cur, [s.id]: { on: e.target.checked, price: cur[s.id]?.price ?? "" } }));
                            }}
                          />
                          {s.label}
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            aria-label={`${s.label} fiyatı`}
                            inputMode="decimal"
                            placeholder="0,00"
                            disabled={!st.on}
                            className={`${inputClass} w-[120px] text-right tabular-nums`}
                            value={st.price}
                            onChange={(e) => {
                              touch();
                              setSizes((cur) => ({ ...cur, [s.id]: { on: true, price: e.target.value } }));
                            }}
                          />
                          <span className="text-[12.5px] text-neutral-500">TL</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  aria-label="Fiyat"
                  inputMode="decimal"
                  placeholder="0,00"
                  className={`${inputClass} w-[140px] text-right tabular-nums`}
                  value={singlePrice}
                  onChange={(e) => {
                    touch();
                    setSinglePrice(e.target.value);
                  }}
                />
                <span className="text-[12.5px] text-neutral-500">TL · bu kategoride ürün tek fiyatla satılır</span>
              </div>
            )}
            {fieldError("sizes")}
          </div>
        </Panel>

        <Panel title="Diğer bilgiler">
          <div className="space-y-4 p-4">
            <div>
              <label htmlFor="pf-allergens" className={labelClass}>Alerjen bilgisi</label>
              <textarea
                id="pf-allergens"
                rows={2}
                className={`${inputClass} h-auto py-2`}
                value={allergens}
                maxLength={PRODUCT_LIMITS.allergensMax}
                placeholder="Örn. Gluten, süt, yumurta, fındık"
                onChange={(e) => {
                  touch();
                  setAllergens(e.target.value);
                }}
              />
              <p className={hintClass}>Yalnızca doğrulanmış bilgi girin. Boş bırakılırsa ürün sayfasında alerjen bölümü gösterilmez.</p>
              {fieldError("allergens")}
            </div>
            <label className="flex items-center gap-2 text-[13px] text-neutral-800">
              <input
                type="checkbox"
                checked={cakeMessage}
                onChange={(e) => {
                  touch();
                  setCakeMessage(e.target.checked);
                }}
              />
              Müşteri pasta yazısı ekleyebilir
            </label>
            <div>
              <p className={labelClass}>Etiketler</p>
              <div className="flex flex-wrap gap-4">
                {(
                  [
                    ["Yeni", isNew, setIsNew],
                    ["Çok Satan", isBestSeller, setIsBestSeller],
                    ["Hediyelik", isGift, setIsGift],
                  ] as const
                ).map(([label, value, set]) => (
                  <label key={label} className="flex items-center gap-2 text-[13px] text-neutral-800">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => {
                        touch();
                        set(e.target.checked);
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="space-y-5 lg:sticky lg:top-[84px]">
        <Panel title="Görsel">
          <div className="p-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
              {photo ? (
                // the chosen file (blob URL) or the product's stored photo — shown as is, not optimised
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.previewUrl} alt="Seçilen ürün görseli" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-[12.5px] text-neutral-400">
                  Kare görsel seçin ({IMAGE_RULES.minSide}–{IMAGE_RULES.maxSide} piksel, en fazla 4 MB, JPEG / PNG / WebP)
                </div>
              )}
            </div>
            {photo && (
              <p className="mt-2 truncate text-[12px] text-neutral-500">
                {photo.fileName}
                {photo.bytes > 0 ? ` · ${kb(photo.bytes)}` : ""}
                {photo.width && photo.height ? ` · ${photo.width} × ${photo.height} px` : ""}
              </p>
            )}
            {photo?.state === "uploading" && <p className="mt-1 text-[12px] text-neutral-500">Yükleniyor…</p>}
            {photo?.state === "uploaded" && photo.file && <p className="mt-1 text-[12px] font-medium text-neutral-800">Görsel yüklendi.</p>}
            {photo?.message && <p className={errorClass}>{photo.message}</p>}
            {fieldError("imageId")}
            <input
              ref={fileInput}
              type="file"
              accept={IMAGE_RULES.types.join(",")}
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-[12.5px] font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                {photo ? "Görseli değiştir" : "Görsel seç"}
              </button>
              {photo?.state === "failed" && canSave && (
                <button
                  type="button"
                  onClick={() => void upload(photo)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-[12.5px] font-semibold text-neutral-800 hover:bg-neutral-50"
                >
                  Tekrar dene
                </button>
              )}
              {photo && (
                <button type="button" onClick={removePhoto} className="text-[12.5px] font-semibold text-neutral-500 underline hover:text-neutral-900">
                  Kaldır
                </button>
              )}
            </div>
            <p className={hintClass}>Görsel kırpılmaz veya küçültülmez; uymayan dosya reddedilir.</p>
          </div>
        </Panel>

        <Panel title="Şube stokları">
          <div className="divide-y divide-neutral-100">
            {branches.map((b) => {
              const v = branchStock[b.id];
              return (
                <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-[13px] font-medium text-neutral-800">{b.name}</span>
                  <div role="radiogroup" aria-label={`${b.name} stok durumu`} className="flex overflow-hidden rounded border border-neutral-300">
                    {([true, false] as const).map((active) => (
                      <button
                        key={String(active)}
                        type="button"
                        role="radio"
                        aria-checked={v === active}
                        onClick={() => {
                          touch();
                          setBranchStock((cur) => ({ ...cur, [b.id]: active }));
                        }}
                        className={`px-3 py-1 text-[12.5px] font-semibold ${
                          v === active ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"
                        } ${active ? "" : "border-l border-neutral-300"}`}
                      >
                        {active ? "Aktif" : "Pasif"}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="px-4 pb-3 pt-1 text-[11.5px] text-neutral-400">
            Aktif: bugün için sipariş alınabilir. Pasif: en erken yarına teslim. Yayından sonra &ldquo;Şube Stokları&rdquo; ekranından da değişir.
          </p>
          {fieldErrors.branchStock && <p className={`${errorClass} px-4 pb-3`}>{fieldErrors.branchStock}</p>}
        </Panel>

        <Panel
          title="Kayıt"
          action={saved ? <Badge strong={saved.status === "published"}>{STATUS_LABEL[saved.status]}</Badge> : <Badge>Kaydedilmedi</Badge>}
        >
          <div className="space-y-3 p-4">
            {error && (
              <p role="alert" className="rounded border border-neutral-300 bg-neutral-50 px-3 py-2 text-[12.5px] text-neutral-900">
                {error}
              </p>
            )}
            {done && (
              <p role="status" className="rounded border border-neutral-900 px-3 py-2 text-[12.5px] font-medium text-neutral-900">
                {done}
                {saved?.status === "published" && (
                  <>
                    {" "}
                    <Link href={`/urunler/${saved.slug}`} target="_blank" className="underline">
                      Ürün sayfasını aç
                    </Link>
                  </>
                )}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!canSave || busy !== null}
                onClick={() => void submit(false)}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-[12.5px] font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-400"
              >
                {busy === "save" ? "Kaydediliyor…" : saved && saved.status !== "draft" ? "Değişiklikleri kaydet" : "Taslak kaydet"}
              </button>
              <button
                type="button"
                disabled={!canSave || busy !== null || saved?.status === "published"}
                onClick={() => void submit(true)}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {busy === "publish" ? "Yayınlanıyor…" : saved?.status === "published" ? "Yayında" : "Yayınla"}
              </button>
            </div>
            <p className="text-[11.5px] leading-relaxed text-neutral-400">
              Taslak sitede görünmez. Yayınlamak için ad, kategori, açıklama, görsel, fiyat ve her şubenin stok durumu gerekir.
            </p>
            {!canSave && notice && <p className="text-[12px] font-medium text-neutral-800">{notice}</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
