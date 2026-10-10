import { NextResponse } from "next/server";
import { resolveAdminScope } from "@/lib/admin/access";
import { getZone } from "@/lib/delivery/zones";
import { DeliveryFeeStoreError, saveDeliveryFee, type DeliveryFeeState } from "@/lib/delivery/fees";
import { refreshDeliveryFees } from "@/lib/delivery/fees-server";
import { PersistenceUnavailableError, assertPersistentWrite, logPersistenceRefusal } from "@/lib/persistence";

export const dynamic = "force-dynamic";

/**
 * PATCH { zoneId, state: "unset" | "paid" | "free", fee? } — a zone's delivery
 * fee (SUPABASE_PLAN.md, D15). Merkez only: the role comes from the signed
 * session, branch accounts get 403 (they see their zones read-only).
 *   unset -> "Belirlenmedi" (no delivery to that zone)
 *   paid  -> fee > 0, at most two decimals (kuruş)
 *   free  -> explicitly free, stored as 0
 * The last editor and the time are stored; there is no history table, and
 * orders already placed keep the fee they were created with.
 */

const MAX_FEE = 10_000;
const STATES: DeliveryFeeState[] = ["unset", "paid", "free"];

type Body = { zoneId?: unknown; state?: unknown; fee?: unknown };

export async function PATCH(request: Request) {
  const scope = await resolveAdminScope();
  if (!scope) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  if (scope.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Teslimat ücretlerini yalnızca Merkez Yönetim değiştirebilir." }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const zoneId = typeof body.zoneId === "string" ? body.zoneId : "";
  if (!getZone(zoneId)) return NextResponse.json({ error: "Geçerli bir bölge seçin." }, { status: 400 });
  const state = STATES.find((s) => s === body.state);
  if (!state) return NextResponse.json({ error: "Geçersiz ücret durumu." }, { status: 400 });

  let fee: number | null = null;
  if (state === "paid") {
    const n = typeof body.fee === "number" ? body.fee : Number.NaN;
    const kurus = Math.round(n * 100);
    if (!Number.isFinite(n) || n <= 0 || n > MAX_FEE || Math.abs(kurus - n * 100) > 1e-6) {
      return NextResponse.json(
        { error: `Ücret 0'dan büyük, en fazla ${MAX_FEE.toLocaleString("tr-TR")} TL ve en fazla iki ondalık basamaklı olmalı. Ücretsiz teslimat için "Ücretsiz"i seçin.` },
        { status: 400 },
      );
    }
    fee = kurus / 100;
  } else if (state === "free") {
    fee = 0;
  }

  // never a change that only looks saved: wrong/missing database -> 503
  try {
    await assertPersistentWrite("delivery-fees");
  } catch (err) {
    if (!(err instanceof PersistenceUnavailableError)) throw err;
    logPersistenceRefusal(err, { zoneId, state, by: scope.user.name });
    return NextResponse.json({ error: err.userMessage }, { status: 503 });
  }

  try {
    await refreshDeliveryFees({ strict: true }); // the cache must be current before it is updated
    const saved = await saveDeliveryFee(zoneId, state, fee, scope.user.name);
    // the row the database returned must be the one requested before the screen says "Kaydedildi"
    if (saved.zoneId !== zoneId || saved.state !== state || saved.fee !== fee) {
      throw new DeliveryFeeStoreError("WRITE_FAILED", `stored row differs from the request (state=${saved.state} fee=${saved.fee})`);
    }
    console.info(`[delivery-fees] saved zone=${zoneId} state=${state} fee=${fee ?? "null"} by=${scope.user.name}`);
    return NextResponse.json({ ok: true, fee: saved });
  } catch (err) {
    const code = err instanceof DeliveryFeeStoreError ? err.code : "UNKNOWN";
    console.error(`[delivery-fees] save failed code=${code} zone=${zoneId} state=${state}`, { code, zoneId, state, by: scope.user.name, error: (err as Error).message });
    return code === "NOT_CONFIGURED"
      ? NextResponse.json({ error: "Kayıt servisi yapılandırılmamış; ücret kaydedilmedi." }, { status: 503 })
      : NextResponse.json({ error: "Teslimat bilgisi şu an alınamıyor; ücret kaydedilmedi." }, { status: 503 });
  }
}
