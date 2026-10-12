import { NextResponse } from "next/server";
import { resolveAdminScope } from "@/lib/admin/access";
import { catalogProducts, productSizes } from "@/lib/data";
import {
  MAX_PRODUCT_PRICE,
  ProductPriceStoreError,
  isPriceKeyOf,
  productPriceTableMissing,
  saveProductPrice,
} from "@/lib/pricing/prices";
import { refreshProductPrices } from "@/lib/pricing/prices-server";
import { PersistenceUnavailableError, assertPersistentWrite, logPersistenceRefusal } from "@/lib/persistence";

export const dynamic = "force-dynamic";

/**
 * PATCH { productId, variantKey, price } — one price of an existing product
 * (SUPABASE_PLAN.md, D5, D20): `variantKey` is one of the product's size ids,
 * or '' (or absent) for a single-price product. Every size is priced on its
 * own; nothing else changes. Merkez only: the role comes from the signed
 * session, branch accounts get 403. Nothing is added, removed or re-worded.
 * Kuruş allowed (at most two decimals). Last editor + time are stored; orders
 * already placed keep the prices they were created with.
 */

type Body = { productId?: unknown; variantKey?: unknown; price?: unknown };

export async function PATCH(request: Request) {
  const scope = await resolveAdminScope();
  if (!scope) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  if (scope.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Ürün fiyatlarını yalnızca Merkez Yönetim değiştirebilir." }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const product = catalogProducts.find((p) => p.id === body.productId);
  if (!product) return NextResponse.json({ error: "Geçerli bir ürün seçin." }, { status: 400 });
  const variantKey = typeof body.variantKey === "string" ? body.variantKey : body.variantKey == null ? "" : null;
  if (variantKey === null || !isPriceKeyOf(product, variantKey)) {
    return NextResponse.json(
      { error: productSizes(product).length > 0 ? "Bu ürünün geçerli bir boyutunu seçin." : "Bu ürünün boyutu yok; tek fiyatı değiştirilebilir." },
      { status: 400 },
    );
  }

  const n = typeof body.price === "number" ? body.price : Number.NaN;
  const kurus = Math.round(n * 100);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_PRODUCT_PRICE || Math.abs(kurus - n * 100) > 1e-6) {
    return NextResponse.json(
      { error: `Fiyat 0'dan büyük, en fazla ${MAX_PRODUCT_PRICE.toLocaleString("tr-TR")} TL ve en fazla iki ondalık basamaklı olmalı.` },
      { status: 400 },
    );
  }
  const price = kurus / 100;

  // never a change that only looks saved: wrong/missing database -> 503
  try {
    await assertPersistentWrite("prices");
  } catch (err) {
    if (!(err instanceof PersistenceUnavailableError)) throw err;
    logPersistenceRefusal(err, { productId: product.id, by: scope.user.name });
    return NextResponse.json({ error: err.userMessage }, { status: 503 });
  }

  try {
    await refreshProductPrices({ strict: true }); // the cache must be current before it is updated
    if (productPriceTableMissing()) throw new ProductPriceStoreError("TABLE_MISSING", "product_prices not found — apply migration 0009");
    const saved = await saveProductPrice(product.id, variantKey, price, scope.user.name);
    // the row the database returned must be the one requested before the screen says "Kaydedildi"
    if (saved.productId !== product.id || saved.variantKey !== variantKey || saved.price !== price) {
      throw new ProductPriceStoreError("WRITE_FAILED", `stored row differs from the request (size=${saved.variantKey} price=${saved.price})`);
    }
    console.info(`[prices] saved product=${product.id} size=${variantKey || "-"} price=${price} by=${scope.user.name}`);
    return NextResponse.json({ ok: true, price: saved });
  } catch (err) {
    const code = err instanceof ProductPriceStoreError ? err.code : "UNKNOWN";
    console.error(`[prices] save failed code=${code} product=${product.id} size=${variantKey || "-"}`, { code, by: scope.user.name, error: (err as Error).message });
    const error =
      code === "TABLE_MISSING"
        ? "Fiyat tablosu henüz kurulmadı (0009); fiyat kaydedilmedi."
        : code === "NOT_CONFIGURED"
          ? "Kayıt servisi yapılandırılmamış; fiyat kaydedilmedi."
          : "Fiyat bilgisi şu an alınamıyor; fiyat kaydedilmedi.";
    return NextResponse.json({ error }, { status: 503 });
  }
}
