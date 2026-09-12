import { NextResponse } from "next/server";
import { resolveAdminScope } from "@/lib/admin/access";
import { setInventoryOverride, getInventoryRepository } from "@/lib/inventory";
import { getBranchStockRows } from "@/lib/inventory/stock-view";

export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** manager may only touch a branch in their authorized set */
function authorized(as: string | undefined, branchId: string): boolean {
  const scope = resolveAdminScope({ as });
  return scope.authorizedBranchIds ? scope.authorizedBranchIds.includes(branchId) : true;
}

/** GET ?as=&branch=&date= — effective stock rows for a branch */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const as = url.searchParams.get("as") ?? undefined;
  const branchId = url.searchParams.get("branch") ?? "";
  const date = url.searchParams.get("date") ?? todayISO();

  if (!branchId) return NextResponse.json({ error: "branch gerekli." }, { status: 400 });
  if (!authorized(as, branchId)) {
    return NextResponse.json({ error: "Bu şube için yetkiniz yok." }, { status: 403 });
  }

  return NextResponse.json({ branchId, date, rows: getBranchStockRows(branchId, date) });
}

type PatchBody = {
  as?: string;
  branchId?: string;
  date?: string;
  changes?: Record<
    string,
    { active?: boolean; stockQuantity?: number; dailyCapacity?: number }
  >;
};

const clampInt = (v: unknown, max = 9999): number | null => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
};

/** PATCH — apply row edits as inventory overrides (demo persistence) */
export async function PATCH(request: Request) {
  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const branchId = body.branchId ?? "";
  const changes = body.changes ?? {};
  if (!branchId) return NextResponse.json({ error: "branchId gerekli." }, { status: 400 });
  if (!authorized(body.as, branchId)) {
    return NextResponse.json({ error: "Bu şube için yetkiniz yok." }, { status: 403 });
  }

  const repo = getInventoryRepository();
  const applied: string[] = [];

  for (const [productId, patch] of Object.entries(changes)) {
    const seed = repo.getSeed(branchId, productId);
    if (!seed) continue; // unknown product for this branch — skip silently

    const next: { active?: boolean; stockQuantity?: number; dailyCapacity?: number } = {};

    if (typeof patch.active === "boolean") next.active = patch.active;

    if (seed.stockMode === "quantity" && patch.stockQuantity !== undefined) {
      const q = clampInt(patch.stockQuantity);
      if (q === null) {
        return NextResponse.json(
          { error: `${productId}: geçersiz stok değeri.` },
          { status: 400 },
        );
      }
      next.stockQuantity = q;
    }

    if (
      (seed.stockMode === "daily_capacity" || seed.stockMode === "made_to_order") &&
      patch.dailyCapacity !== undefined
    ) {
      const c = clampInt(patch.dailyCapacity, 999);
      if (c === null) {
        return NextResponse.json(
          { error: `${productId}: geçersiz kapasite değeri.` },
          { status: 400 },
        );
      }
      next.dailyCapacity = c;
    }

    if (Object.keys(next).length > 0) {
      setInventoryOverride(branchId, productId, next);
      applied.push(productId);
    }
  }

  const date = body.date ?? todayISO();
  return NextResponse.json({
    ok: true,
    updated: applied.length,
    branchId,
    rows: getBranchStockRows(branchId, date),
  });
}
