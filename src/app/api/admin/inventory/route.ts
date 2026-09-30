import "@/lib/inventory/server-init";
import { NextResponse } from "next/server";
import { resolveAdminScope } from "@/lib/admin/access";
import { getInventoryRepository, setInventoryOverrides, type BranchStockStatus } from "@/lib/inventory";
import { getBranchStockView } from "@/lib/inventory/stock-view";

export const dynamic = "force-dynamic";

/**
 * Branch managers may only touch their own branch. The scope comes from the
 * signed session cookie on every request — never from a client field.
 */
async function authorize(branchId: string) {
  const scope = await resolveAdminScope();
  if (!scope) return { ok: false as const, status: 401, error: "Oturum açmanız gerekiyor." };
  const allowed = scope.authorizedBranchIds ? scope.authorizedBranchIds.includes(branchId) : true;
  return allowed ? { ok: true as const, scope } : { ok: false as const, status: 403, error: "Bu şube için yetkiniz yok." };
}

/** GET ?branch= — the branch's product rows */
export async function GET(request: Request) {
  const branchId = new URL(request.url).searchParams.get("branch") ?? "";
  if (!branchId) return NextResponse.json({ error: "branch gerekli." }, { status: 400 });
  const auth = await authorize(branchId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({ branchId, ...getBranchStockView(branchId) });
}

type PatchBody = {
  branchId?: string;
  updates?: { productId?: unknown; status?: unknown }[];
};

const isStatus = (v: unknown): v is BranchStockStatus => v === "active" || v === "passive";

/**
 * PATCH { branchId, updates: [{ productId, status }] } — one or many rows.
 * All-or-nothing: an invalid row rejects the request, a failed save restores
 * the previous state. Only this branch's rows are written.
 */
export async function PATCH(request: Request) {
  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const branchId = typeof body.branchId === "string" ? body.branchId : "";
  if (!branchId) return NextResponse.json({ error: "branchId gerekli." }, { status: 400 });
  const auth = await authorize(branchId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const updates = Array.isArray(body.updates) ? body.updates : [];
  if (updates.length === 0 || updates.length > 500) {
    return NextResponse.json({ error: "Güncellenecek ürün yok." }, { status: 400 });
  }

  const repo = getInventoryRepository();
  const patches: { productId: string; patch: { status: BranchStockStatus; updatedBy: string } }[] = [];
  for (const u of updates) {
    const productId = typeof u.productId === "string" ? u.productId : "";
    const bp = productId ? repo.get(branchId, productId) : null;
    if (!bp || !bp.active) return NextResponse.json({ error: `${productId || "?"}: bu şubede tanımlı ürün değil.` }, { status: 400 });
    if (!isStatus(u.status)) return NextResponse.json({ error: `${productId}: geçersiz durum.` }, { status: 400 });
    patches.push({ productId, patch: { status: u.status, updatedBy: auth.scope.user.name } });
  }

  try {
    setInventoryOverrides(branchId, patches);
  } catch (err) {
    console.error("[inventory] save failed", err);
    return NextResponse.json({ error: "Değişiklik kaydedilemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated: patches.length, branchId, ...getBranchStockView(branchId) });
}
