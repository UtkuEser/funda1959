import { NextResponse } from "next/server";
import { resolveAdminScope } from "@/lib/admin/access";
import { getBranch } from "@/lib/branch";
import { isSameOrigin } from "@/lib/customer-auth/next";
import { AREA_DISTRICTS, areaKey, areaNameProblem, cleanAreaName, isValidAreaFee, type AreaFeeState } from "@/lib/delivery/areas";
import {
  AreaChangeRefusedError,
  AreasNotReadyError,
  adminAreaRecords,
  areaStoreStatus,
  refreshDeliveryAreas,
  saveDeliveryAreas,
  type AreaSaveItem,
} from "@/lib/delivery/areas-server";
import { refreshDeliveryFees } from "@/lib/delivery/fees-server";
import { findPoolEntry, poolEntryKeys } from "@/lib/delivery/neighborhood-pool";
import { areaAssignments, areasState } from "@/lib/delivery/zones";
import { PersistenceUnavailableError, assertPersistentWrite, logPersistenceRefusal } from "@/lib/persistence";

export const dynamic = "force-dynamic";

/**
 * POST { items: [{ district, neighborhood, branchId, enabled, feeState, fee, expected }] }
 * — one save of "Teslimat Bölgeleri" (D50): branch, open / closed and fee of
 * every changed area together, all or nothing. `expected` is the area as the
 * panel showed it (null: a new area); if any area changed meanwhile nothing
 * is saved (409, with the current areas). Nothing is ever deleted; closing an
 * area keeps it. Merkez only (branch accounts 403), same origin, and the
 * database must be this deployment's (D3). Orders already placed keep their
 * branch, zone and fee. A NEW area must be a checked entry of the
 * neighbourhood pool under its official name (D52), and must not already be
 * saved under another of its names (e.g. "Oran" for "Or-An"); one typed by
 * hand (`manual`, "Listede yok, elle ekle") must be a place the list does not have.
 */

const MAX_ITEMS = 2000;
const STATES: AreaFeeState[] = ["unset", "paid", "free"];
const NO_STORE = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

type Fee = { feeState: AreaFeeState; fee: number | null };

/** a fee as sent: paid > 0 (≤ 10.000, kuruş), free = 0, unset = none — else null */
function readFee(stateRaw: unknown, feeRaw: unknown): Fee | null {
  const feeState = STATES.find((s) => s === stateRaw);
  if (!feeState) return null;
  if (feeState === "paid") return isValidAreaFee(feeRaw) ? { feeState, fee: Math.round(feeRaw * 100) / 100 } : null;
  if (feeState === "free") return feeRaw === 0 || feeRaw === null || feeRaw === undefined ? { feeState, fee: 0 } : null;
  return feeRaw === null || feeRaw === undefined ? { feeState, fee: null } : null;
}

function readItems(raw: unknown): { items: AreaSaveItem[]; manual: Set<string> } | { error: string } {
  if (!Array.isArray(raw) || raw.length === 0) return { error: "Kaydedilecek değişiklik yok." };
  if (raw.length > MAX_ITEMS) return { error: `Bir kayıtta en fazla ${MAX_ITEMS} mahalle olabilir.` };
  const items: AreaSaveItem[] = [];
  const manual = new Set<string>();
  const seen = new Set<string>();
  for (const entry of raw) {
    const r = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
    const district = typeof r.district === "string" ? r.district : "";
    const neighborhood = typeof r.neighborhood === "string" ? r.neighborhood : "";
    if (!AREA_DISTRICTS.includes(district)) return { error: `Geçersiz ilçe: “${district}”.` };
    const nameProblem = areaNameProblem(neighborhood);
    if (nameProblem || cleanAreaName(neighborhood) !== neighborhood) return { error: `${neighborhood || "Mahalle"}: ${nameProblem ?? "Mahalle adı geçersiz."}` };
    const key = areaKey(district, neighborhood);
    if (seen.has(key)) return { error: `${neighborhood} (${district}) iki kez gönderildi; sayfayı yenileyin.` };
    seen.add(key);
    const branchId = typeof r.branchId === "string" ? r.branchId : "";
    if (!getBranch(branchId)) return { error: `${neighborhood} (${district}): geçerli bir şube seçin.` };
    if (typeof r.enabled !== "boolean") return { error: "Gönderim durumu geçersiz; sayfayı yenileyin." };
    const fee = readFee(r.feeState, r.fee);
    if (!fee) return { error: `${neighborhood} (${district}): ücret geçersiz. Ücretli için 0'dan büyük, en fazla 10.000 TL ve en fazla iki ondalık girin.` };
    if (r.enabled && fee.feeState === "unset") return { error: `${neighborhood} (${district}): gönderimi açmak için geçerli bir ücret girilmeli (0 = ücretsiz; boş ücret ücretsiz sayılmaz).` };

    let expected: AreaSaveItem["expected"] = null;
    if (r.expected !== null && r.expected !== undefined) {
      const e = (typeof r.expected === "object" ? r.expected : {}) as Record<string, unknown>;
      const eFee = readFee(e.feeState, e.fee);
      if (typeof e.branchId !== "string" || !getBranch(e.branchId) || typeof e.enabled !== "boolean" || !eFee) {
        return { error: "Kayıt bilgisi eksik; sayfayı yenileyip tekrar deneyin." };
      }
      expected = { branchId: e.branchId, enabled: e.enabled, ...eFee };
    }
    items.push({ district, neighborhood, branchId, enabled: r.enabled, ...fee, expected });
    // typed by hand behind "Listede yok, elle ekle" (a new area only)
    if (!expected && r.manual === true) manual.add(key);
  }
  return { items, manual };
}

export async function POST(request: Request) {
  const scope = await resolveAdminScope();
  if (!scope) return json({ error: "Oturum açmanız gerekiyor." }, 401);
  if (scope.user.role !== "SUPER_ADMIN") return json({ error: "Teslimat bölgelerini yalnızca Merkez Yönetim değiştirebilir." }, 403);
  if (!isSameOrigin(request)) return json({ error: "Geçersiz istek." }, 403);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Geçersiz istek." }, 400);
  }
  const parsed = readItems(body?.items);
  if ("error" in parsed) return json({ error: parsed.error }, 400);

  // new areas: only from the pool (D52), never a second record of a saved place
  const added = parsed.items.filter((i) => !i.expected);
  if (added.length > 0) {
    try {
      await refreshDeliveryAreas({ strict: true });
    } catch {
      return json({ error: "Bölge bilgileri şu an okunamadı; hiçbir şey kaydedilmedi. Lütfen tekrar deneyin." }, 503);
    }
    const saved = new Map(areaAssignments().map((a) => [areaKey(a.district, a.neighborhood), a]));
    for (const i of added) {
      const entry = findPoolEntry(i.district, i.neighborhood);
      if (parsed.manual.has(areaKey(i.district, i.neighborhood))) {
        // a name typed by hand: only for a place the list does not have
        if (entry) return json({ error: `${i.neighborhood} (${i.district}) mahalle listesinde “${entry.name}” olarak var; listeden seçin.` }, 400);
        continue; // a second record of the same name is refused by the database (one row per district + neighbourhood)
      }
      if (!entry || entry.name !== i.neighborhood) return json({ error: `${i.neighborhood} (${i.district}) mahalle listesinde yok; listeden seçin.` }, 400);
      if (entry.status !== "verified") return json({ error: `${entry.name} (${entry.district}) doğrulama bekliyor; teslimata eklenemez.` }, 400);
      const other = areasState() === "ready" ? poolEntryKeys(entry).map((k) => saved.get(k)).find(Boolean) : undefined;
      if (other) {
        return json({ error: `${entry.name} (${entry.district}) zaten “${other.neighborhood}” adıyla kayıtlı; sayfayı yenileyip o kaydı kullanın.` }, 409);
      }
    }
  }

  // never a change that only looks saved: wrong / missing database -> 503
  try {
    await assertPersistentWrite("delivery-areas");
  } catch (err) {
    if (!(err instanceof PersistenceUnavailableError)) throw err;
    logPersistenceRefusal(err, { items: parsed.items.length, by: scope.user.name });
    return json({ error: err.userMessage }, 503);
  }

  try {
    const areas = await saveDeliveryAreas(scope.user, parsed.items);
    const moved = parsed.items.filter((i) => i.expected && i.expected.branchId !== i.branchId).length;
    console.info(`[delivery-areas] saved items=${parsed.items.length} new=${parsed.items.filter((i) => !i.expected).length} moved=${moved} by=${scope.user.name}`);
    return json({ ok: true, areas });
  } catch (err) {
    if (err instanceof AreasNotReadyError) {
      return json(
        {
          error:
            err.why === "table-missing"
              ? "Kaydedilemedi: teslimat bölgesi tablosu bu veritabanında henüz kurulmadı (migration 0015). Düzenlemeleriniz bu ekranda duruyor."
              : "Kaydedilemedi: bu ortamda veritabanı bağlantısı yok.",
        },
        503,
      );
    }
    if (err instanceof AreaChangeRefusedError) {
      if (err.code === "conflict") {
        // the current areas, only if they can be read now (never an older map)
        await Promise.all([refreshDeliveryAreas(), refreshDeliveryFees()]);
        const current = areaStoreStatus() === "database" ? adminAreaRecords(areaAssignments()) : null;
        return json(
          {
            error: current
              ? "Bu sırada bölgelerde başka bir değişiklik yapıldı; hiçbir şey kaydedilmedi. Güncel durum yüklendi, düzenlemeleriniz duruyor — kontrol edip tekrar kaydedin."
              : "Bu sırada bölgelerde başka bir değişiklik yapıldı; hiçbir şey kaydedilmedi. Sayfayı yenileyip tekrar deneyin.",
            areas: current,
          },
          409,
        );
      }
      if (err.code === "forbidden") return json({ error: "Bu işlem için yetkiniz yok." }, 403);
      return json({ error: "Bölge bilgileri geçersiz; hiçbir şey kaydedilmedi. Sayfayı yenileyip tekrar deneyin." }, 400);
    }
    console.error("[delivery-areas] save failed", { by: scope.user.name, error: (err as Error).message.slice(0, 300) });
    return json({ error: "Kaydedilemedi; hiçbir şey kaydedilmedi. Lütfen tekrar deneyin." }, 502);
  }
}
