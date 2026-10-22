import { NextResponse } from "next/server";
import { resolveAdminScope } from "@/lib/admin/access";
import { isSameOrigin } from "@/lib/customer-auth/next";
import { AREA_IMPORT_MAX_BYTES, parseAreaImport } from "@/lib/delivery/areas-import";
import { AREAS_DISPLAY_MAX_AGE_MS, refreshDeliveryAreas } from "@/lib/delivery/areas-server";

export const dynamic = "force-dynamic";

/**
 * POST multipart/form-data { file } — reads a delivery-area .xlsx (D50) and
 * answers its rows, checked, for the panel's preview. Nothing is written:
 * the rows become unsaved edits in the panel and are saved with
 * "Değişiklikleri Kaydet". Merkez only, same origin.
 */
export async function POST(request: Request) {
  const scope = await resolveAdminScope();
  const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (!scope) return json({ error: "Oturum açmanız gerekiyor." }, 401);
  if (scope.user.role !== "SUPER_ADMIN") return json({ error: "Teslimat bölgelerini yalnızca Merkez Yönetim değiştirebilir." }, 403);
  if (!isSameOrigin(request)) return json({ error: "Geçersiz istek." }, 403);

  if (Number(request.headers.get("content-length") ?? 0) > AREA_IMPORT_MAX_BYTES + 64 * 1024) return json({ error: "Excel dosyası en fazla 2 MB olabilir." }, 413);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Geçersiz istek." }, 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "Excel dosyası seçin." }, 400);
  if (file.size > AREA_IMPORT_MAX_BYTES) return json({ error: "Excel dosyası en fazla 2 MB olabilir." }, 413);
  if (!/\.xlsx$/i.test(file.name)) return json({ error: "Yalnızca .xlsx dosyası yüklenebilir." }, 400);

  // the areas' own spellings: a row naming an existing area matches it
  await refreshDeliveryAreas({ maxAgeMs: AREAS_DISPLAY_MAX_AGE_MS });
  try {
    return json({ ok: true, ...parseAreaImport(new Uint8Array(await file.arrayBuffer())) });
  } catch (err) {
    console.error("[delivery-areas import] read failed", { error: (err as Error).message.slice(0, 200) });
    return json({ error: "Excel dosyası okunamadı." }, 400);
  }
}
