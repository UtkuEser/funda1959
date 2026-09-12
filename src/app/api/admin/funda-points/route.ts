import { NextResponse } from "next/server";
import { resolveAdminScope } from "@/lib/admin/access";
import {
  adjustPointsAsAdmin,
  getCustomerPointDetailForAdmin,
  FundaPointsAccessError,
} from "@/lib/funda-points";

export const dynamic = "force-dynamic";

/** Funda Puan is SUPER_ADMIN-only — resolved fresh per request, never trusted from the client. */
function scopeRole(as: string | null | undefined) {
  return resolveAdminScope({ as: as ?? undefined }).user.role;
}

/** GET ?as=&customerId= — account + transaction history for the detail drawer. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const as = url.searchParams.get("as");
  const customerId = url.searchParams.get("customerId") ?? "";
  if (!customerId) return NextResponse.json({ error: "customerId gerekli." }, { status: 400 });

  try {
    const detail = getCustomerPointDetailForAdmin(scopeRole(as), customerId);
    if (!detail) return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });
    return NextResponse.json({ ok: true, ...detail });
  } catch (err) {
    if (err instanceof FundaPointsAccessError) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }
    throw err;
  }
}

type AdjustBody = {
  as?: string;
  customerId?: string;
  direction?: "add" | "subtract";
  points?: number;
  description?: string;
};

/** POST — manual SUPER_ADMIN correction ("Puan Düzenle"), always ledgered as ADMIN_ADJUSTMENT. */
export async function POST(request: Request) {
  let body: AdjustBody;
  try {
    body = (await request.json()) as AdjustBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const customerId = body.customerId ?? "";
  const direction = body.direction === "subtract" ? "subtract" : "add";
  const points = Math.floor(Number(body.points));
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!customerId) return NextResponse.json({ error: "customerId gerekli." }, { status: 400 });
  if (!Number.isFinite(points) || points <= 0) {
    return NextResponse.json({ error: "Puan geçerli bir pozitif sayı olmalı." }, { status: 400 });
  }
  if (!description) return NextResponse.json({ error: "Açıklama gerekli." }, { status: 400 });

  try {
    const role = scopeRole(body.as);
    const result = adjustPointsAsAdmin(role, { customerId, direction, points, description });
    if (!result.ok) {
      const message =
        result.reason === "INSUFFICIENT_BALANCE"
          ? "Yetersiz bakiye — bu düşüş müşteriyi eksiye götürür."
          : result.reason === "ACCOUNT_NOT_FOUND"
            ? "Müşteri bulunamadı."
            : "Puan değeri geçersiz.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const detail = getCustomerPointDetailForAdmin(role, customerId);
    return NextResponse.json({ ok: true, transaction: result.transaction, ...detail });
  } catch (err) {
    if (err instanceof FundaPointsAccessError) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }
    throw err;
  }
}
