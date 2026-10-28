/**
 * The checks every product API runs, in this order, and the answers for
 * product errors. Server-only.
 *   1. closed on this deployment (Production, D46) -> 503, before the
 *      session or the body is read;
 *   2. no admin session -> 401; a branch account -> 403 (Merkez only, D45);
 *   3. writes: another origin -> 403; data store not usable -> 503.
 */

import { NextResponse } from "next/server";
import { resolveAdminScope, type AdminScope } from "../admin/access";
import { isSameOrigin } from "../customer-auth/next";
import { PersistenceUnavailableError, assertPersistentWrite, logPersistenceRefusal } from "../persistence";
import { DataEnvironmentError } from "../supabase-server";
import { ImageRejectedError, ProductAccessError, ProductManagementClosedError, ProductValidationError } from "./admin";
import { isProductManagementOpen } from "./config";
import { ImageStorageError } from "./storage";
import { ProductNotReadyError, ProductRefusedError, ProductStoreUnavailableError } from "./store";

const NO_STORE = { "Cache-Control": "no-store" };

export const CLOSED_MESSAGE = "Ürün yönetimi bu ortamda kapalı.";
const FORBIDDEN = { error: "Bu işlem için yetkiniz yok." } as const;

export function productJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export async function productGate(request: Request, { write }: { write: boolean }): Promise<{ scope: AdminScope } | NextResponse> {
  if (!isProductManagementOpen()) return productJson({ error: CLOSED_MESSAGE }, 503);
  const scope = await resolveAdminScope();
  if (!scope) return productJson({ error: "Oturum açmanız gerekiyor." }, 401);
  if (scope.user.role !== "SUPER_ADMIN") return productJson(FORBIDDEN, 403);
  if (write) {
    if (!isSameOrigin(request)) return productJson({ error: "Geçersiz istek." }, 403);
    try {
      // there is no local stand-in for products: only the database counts as saved
      if ((await assertPersistentWrite("products")) !== "database") {
        return productJson({ error: "Ürün kaydı için veritabanı bağlantısı gerekli." }, 503);
      }
    } catch (err) {
      if (!(err instanceof PersistenceUnavailableError)) throw err;
      logPersistenceRefusal(err, { by: scope.user.name });
      return productJson({ error: err.userMessage }, 503);
    }
  }
  return { scope };
}

const REFUSAL: Record<string, { status: number; error: string; field?: string }> = {
  forbidden: { status: 403, error: FORBIDDEN.error },
  version_conflict: { status: 409, error: "Ürün başka bir oturumda değişti. Sayfayı yenileyip tekrar deneyin." },
  slug_taken: { status: 409, error: "Bu adla bir ürün zaten var.", field: "name" },
  not_found: { status: 404, error: "Ürün bulunamadı." },
  incomplete: { status: 400, error: "Yayındaki ürünün zorunlu alanları eksik bırakılamaz." },
  not_published: { status: 409, error: "Ürün yayında değil." },
  image_not_found: { status: 400, error: "Görsel bulunamadı; yeniden yükleyin.", field: "imageId" },
  upload_id_reused: { status: 409, error: "Bu yükleme başka bir dosyayla yapılmış; görseli yeniden seçin." },
  invalid_fields: { status: 400, error: "Ürün bilgileri geçersiz." },
  invalid_request_id: { status: 400, error: "İstek kimliği geçersiz; sayfayı yenileyin." },
  invalid_status: { status: 400, error: "Geçersiz durum." },
  invalid_upload_id: { status: 400, error: "Yükleme kimliği geçersiz; görseli yeniden seçin." },
};

/** The message a refusal from the database is shown with. */
export function refusalMessage(code: string): string {
  return (REFUSAL[code] ?? REFUSAL.invalid_fields).error;
}

/** Product errors -> status and body; anything else is logged and answered 500 without details. */
export function productErrorBody(err: unknown, where: string): { status: number; body: { error: string; code?: string; fields?: Record<string, string> } } {
  if (err instanceof ProductManagementClosedError) return { status: 503, body: { error: CLOSED_MESSAGE } };
  if (err instanceof ProductAccessError) return { status: 403, body: FORBIDDEN };
  if (err instanceof ProductValidationError) {
    return { status: 400, body: { error: err.errors.form ?? "Lütfen işaretli alanları düzeltin.", fields: err.errors as Record<string, string> } };
  }
  if (err instanceof ImageRejectedError) return { status: 400, body: { error: err.reason, fields: { imageId: err.reason } } };
  if (err instanceof ProductRefusedError) {
    const r = REFUSAL[err.code] ?? REFUSAL.invalid_fields;
    return { status: r.status, body: { error: r.error, code: err.code, ...(r.field ? { fields: { [r.field]: r.error } } : {}) } };
  }
  if (err instanceof ProductNotReadyError) {
    // nothing was saved: the table this needs is not in the database yet
    return {
      status: 503,
      body: { error: err.message.includes("(0014)") ? "Kaydedilemedi: yayın ayarı tablosu henüz kurulmadı (migration 0014)." : "Kaydedilemedi: ürün tabloları henüz kurulmadı (migration 0013)." },
    };
  }
  if (err instanceof ProductStoreUnavailableError || err instanceof DataEnvironmentError) {
    return { status: 503, body: { error: "Ürün kaydı şu an yapılamıyor: kayıt servisi kullanılamıyor." } };
  }
  if (err instanceof ImageStorageError) {
    console.error(`[${where}] storage failed`, { error: err.message });
    return { status: 502, body: { error: "Görsel kaydedilemedi. Lütfen tekrar deneyin." } };
  }
  console.error(`[${where}] failed`, { error: (err as Error)?.message?.slice(0, 300) });
  return { status: 500, body: { error: "İşlem tamamlanamadı. Lütfen tekrar deneyin." } };
}

/** Product errors -> answers (see `productErrorBody`). */
export function productErrorResponse(err: unknown, where: string): NextResponse {
  const { status, body } = productErrorBody(err, where);
  return productJson(body, status);
}
