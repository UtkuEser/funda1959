import { refreshInventory } from "@/lib/inventory/server-init";
import { NextResponse } from "next/server";
import { resolveAdminScope } from "@/lib/admin/access";
import { getBranch } from "@/lib/branch";
import { InventoryStoreError, getInventoryRepository, saveInventoryStatuses, type StockStatusWrite } from "@/lib/inventory";
import { inventoryStoreKind } from "@/lib/inventory/overrides";
import { getBranchStockView } from "@/lib/inventory/stock-view";
import { PersistenceUnavailableError, assertPersistentWrite, logPersistenceRefusal } from "@/lib/persistence";

export const dynamic = "force-dynamic";

/**
 * Branch stock status (Şube Stokları). Scope comes from the signed session
 * cookie on every request — never from a client field: Merkez Yönetim may
 * change any real branch, a branch manager only their own.
 * `branchId` must be a real branch id — "", "all", "Tümü" are rejected.
 */
async function authorize(branchId: string) {
  const scope = await resolveAdminScope();
  if (!scope) return { ok: false as const, status: 401, error: "Oturum açmanız gerekiyor." };
  if (!getBranch(branchId)) return { ok: false as const, status: 400, error: "Geçerli bir şube seçin." };
  const allowed = scope.authorizedBranchIds ? scope.authorizedBranchIds.includes(branchId) : true;
  return allowed ? { ok: true as const, scope } : { ok: false as const, status: 403, error: "Bu şube için yetkiniz yok." };
}

/** GET ?branch= — the branch's product rows, read fresh from the store */
export async function GET(request: Request) {
  const branchId = new URL(request.url).searchParams.get("branch") ?? "";
  const auth = await authorize(branchId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    await refreshInventory({ strict: true });
  } catch {
    return NextResponse.json({ error: "Stok durumları şu an okunamadı. Lütfen tekrar deneyin." }, { status: 503 });
  }
  return NextResponse.json({ branchId, ...getBranchStockView(branchId) });
}

type PatchBody = {
  branchId?: unknown;
  updates?: { productId?: unknown; active?: unknown }[];
};

/**
 * PATCH { branchId, updates: [{ productId, active: boolean }] } — one or many
 * rows of ONE branch. All-or-nothing: an invalid row rejects the request; a
 * failed save changes nothing. Customers see only the effect (passive ->
 * earliest delivery tomorrow); the product's publish state is never touched.
 */
export async function PATCH(request: Request) {
  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const branchId = typeof body.branchId === "string" ? body.branchId : "";
  const auth = await authorize(branchId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const updates = Array.isArray(body.updates) ? body.updates : [];
  if (updates.length === 0 || updates.length > 500) {
    return NextResponse.json({ error: "Güncellenecek ürün yok." }, { status: 400 });
  }

  const repo = getInventoryRepository();
  const rows: StockStatusWrite[] = [];
  const seen = new Set<string>();
  for (const u of updates) {
    const productId = typeof u.productId === "string" ? u.productId : "";
    const bp = productId ? repo.get(branchId, productId) : null;
    // `bp.active` = the branch carries this (published) product — not the stock switch
    if (!bp || !bp.active) return NextResponse.json({ error: "Bu şubede tanımlı olmayan bir ürün seçildi." }, { status: 400 });
    if (typeof u.active !== "boolean") return NextResponse.json({ error: "Geçersiz aktiflik değeri." }, { status: 400 });
    if (seen.has(productId)) continue;
    seen.add(productId);
    rows.push({ productId, active: u.active });
  }

  // never a write that only looks saved: wrong/missing database -> 503
  try {
    await assertPersistentWrite("inventory");
  } catch (err) {
    if (!(err instanceof PersistenceUnavailableError)) throw err;
    logPersistenceRefusal(err, { branchId, productIds: rows.map((r) => r.productId), by: auth.scope.user.name });
    return NextResponse.json({ error: err.userMessage }, { status: 503 });
  }

  try {
    await saveInventoryStatuses(branchId, rows, auth.scope.user.name);
  } catch (err) {
    // technical detail stays in the server log; the panel gets a plain message
    const code = err instanceof InventoryStoreError ? err.code : "UNKNOWN";
    console.error("[inventory] save failed", {
      store: inventoryStoreKind(),
      code,
      branchId,
      productIds: rows.map((r) => r.productId),
      by: auth.scope.user.name,
      error: (err as Error).message,
    });
    return code === "NOT_CONFIGURED"
      ? NextResponse.json({ error: "Kayıt servisi yapılandırılmamış; değişiklik kaydedilmedi." }, { status: 503 })
      : NextResponse.json({ error: "Değişiklik kaydedilemedi." }, { status: 500 });
  }

  // answer with what the store now holds
  try {
    await refreshInventory({ strict: true });
  } catch {
    /* the save succeeded; memory already carries it */
  }
  return NextResponse.json({ ok: true, updated: rows.length, branchId, ...getBranchStockView(branchId) });
}
