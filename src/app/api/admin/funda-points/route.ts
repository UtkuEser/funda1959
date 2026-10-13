import { NextResponse } from "next/server";
import { PersistenceUnavailableError, assertPersistentWrite, logPersistenceRefusal } from "@/lib/persistence";
import { resolveAdminScope } from "@/lib/admin/access";
import { FundaPointsNotReadyError } from "@/lib/funda-points/store";
import {
  adjustFundaPointsAsAdmin,
  FundaPointsAccessError,
  getFundaPointsAdminDetail,
  searchFundaPointsMembers,
} from "@/lib/funda-points/service";
import type { AdjustPointsError } from "@/lib/funda-points";

export const dynamic = "force-dynamic";

/**
 * Funda Puan — Merkez only (SUPER_ADMIN, resolved from the signed session).
 * GET ?search= — members by name / e-mail / phone (2–100 characters), also
 *   those with no points yet; reads only.
 * GET ?userId= — a member's balance, lots and history.
 * POST { userId, direction, points, reason, requestId } — correction, signed
 * by the session's admin with a reason; a repeated requestId is applied once.
 */

const FORBIDDEN = { error: "Bu işlem için yetkiniz yok." } as const;
const NOT_READY = { error: "Funda Puan tabloları henüz kurulmadı (0011)." } as const;

const ADJUST_MESSAGE: Record<AdjustPointsError, { status: number; error: string }> = {
  INVALID: { status: 400, error: "Puan geçerli bir pozitif tam sayı olmalı." },
  REASON_REQUIRED: { status: 400, error: "Gerekçe gerekli (3–300 karakter)." },
  INSUFFICIENT_POINTS: { status: 409, error: "Yetersiz bakiye — kullanılabilir puandan fazlası düşülemez." },
  MEMBER_NOT_FOUND: { status: 404, error: "Üye bulunamadı." },
  FORBIDDEN: { status: 403, error: "Bu işlem için yetkiniz yok." },
  UNAVAILABLE: { status: 503, error: "Puan düzeltmesi kaydedilemedi: kayıt servisi şu an kullanılamıyor." },
  NOT_READY: { status: 503, error: "Funda Puan tabloları henüz kurulmadı (0011)." },
};

export async function GET(request: Request) {
  const scope = await resolveAdminScope();
  if (!scope) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const search = params.get("search");
  if (search !== null) {
    const q = search.trim();
    if (q.length < 2 || q.length > 100) return NextResponse.json({ error: "Arama 2–100 karakter olmalı." }, { status: 400 });
    try {
      const rows = await searchFundaPointsMembers(scope.user.role, q);
      return NextResponse.json({ ok: true, rows });
    } catch (err) {
      if (err instanceof FundaPointsAccessError) return NextResponse.json(FORBIDDEN, { status: 403 });
      if (err instanceof FundaPointsNotReadyError) return NextResponse.json(NOT_READY, { status: 503 });
      console.error("[api/admin/funda-points] search failed", { error: (err as Error).message });
      return NextResponse.json({ error: "Arama yapılamadı." }, { status: 502 });
    }
  }
  const userId = params.get("userId") ?? "";
  if (!userId) return NextResponse.json({ error: "userId gerekli." }, { status: 400 });
  try {
    const detail = await getFundaPointsAdminDetail(scope.user.role, userId);
    if (!detail) return NextResponse.json({ error: "Üye bulunamadı." }, { status: 404 });
    return NextResponse.json({ ok: true, detail });
  } catch (err) {
    if (err instanceof FundaPointsAccessError) return NextResponse.json(FORBIDDEN, { status: 403 });
    if (err instanceof FundaPointsNotReadyError) return NextResponse.json(NOT_READY, { status: 503 });
    throw err;
  }
}

type AdjustBody = {
  userId?: unknown;
  direction?: unknown;
  points?: unknown;
  reason?: unknown;
  requestId?: unknown;
};

export async function POST(request: Request) {
  const scope = await resolveAdminScope();
  if (!scope) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  if (scope.user.role !== "SUPER_ADMIN") return NextResponse.json(FORBIDDEN, { status: 403 });

  let body: AdjustBody;
  try {
    body = (await request.json()) as AdjustBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const userId = typeof body.userId === "string" ? body.userId : "";
  const direction = body.direction === "subtract" ? "subtract" : body.direction === "add" ? "add" : null;
  const points = typeof body.points === "number" ? body.points : Number(body.points);
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";

  if (!userId || !direction || !requestId || requestId.length > 80) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  if (!Number.isInteger(points) || points <= 0 || points > 1_000_000) return NextResponse.json(ADJUST_MESSAGE.INVALID, { status: 400 });
  if (reason.length < 3 || reason.length > 300) return NextResponse.json(ADJUST_MESSAGE.REASON_REQUIRED, { status: 400 });

  // the ledger is in the database only: no Supabase / wrong project -> refused, never "saved" in memory
  try {
    const target = await assertPersistentWrite("funda-points");
    if (target !== "database") {
      return NextResponse.json(ADJUST_MESSAGE.UNAVAILABLE, { status: 503 });
    }
  } catch (err) {
    if (!(err instanceof PersistenceUnavailableError)) throw err;
    logPersistenceRefusal(err, { userId });
    return NextResponse.json({ error: err.userMessage }, { status: 503 });
  }

  try {
    const result = await adjustFundaPointsAsAdmin(scope, { userId, direction, points, reason, requestId });
    if (!result.ok) {
      const m = ADJUST_MESSAGE[result.error];
      return NextResponse.json({ error: m.error }, { status: m.status });
    }
    return NextResponse.json({ ok: true, detail: result.detail });
  } catch (err) {
    if (err instanceof FundaPointsAccessError) return NextResponse.json(FORBIDDEN, { status: 403 });
    if (err instanceof FundaPointsNotReadyError) return NextResponse.json(NOT_READY, { status: 503 });
    console.error("[api/admin/funda-points] correction failed", { error: (err as Error).message });
    return NextResponse.json({ error: "Puan düzeltmesi kaydedilemedi." }, { status: 502 });
  }
}
