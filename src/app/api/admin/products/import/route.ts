import { NextResponse } from "next/server";
import { productErrorResponse, productGate, productJson } from "@/lib/catalog/http";
import {
  commitImport,
  IMPORT_MAX_BYTES,
  ImportFileChangedError,
  ImportPricesUnavailableError,
  previewImport,
  XlsxError,
} from "@/lib/catalog/import";

export const dynamic = "force-dynamic";

/**
 * POST multipart/form-data { file, mode, digest? } — "Excel'den Ürün Yükle"
 * (D48). Merkez only, test data only (D46).
 *   mode=preview  checks the file row by row; writes nothing.
 *   mode=commit   writes the valid rows of the SAME file (`digest` from the
 *                 preview); the answer lists what happened to every row.
 */
export async function POST(request: Request) {
  // the mode decides whether this is a write (origin + database checks)
  const mode = new URL(request.url).searchParams.get("mode");
  if (mode !== "preview" && mode !== "commit") return productJson({ error: "Geçersiz istek." }, 400);
  const gate = await productGate(request, { write: mode === "commit" });
  if (gate instanceof NextResponse) return gate;

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > IMPORT_MAX_BYTES + 64 * 1024) return productJson({ error: "Excel dosyası en fazla 5 MB olabilir." }, 413);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return productJson({ error: "Geçersiz istek." }, 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return productJson({ error: "Excel dosyası seçin." }, 400);
  if (file.size > IMPORT_MAX_BYTES) return productJson({ error: "Excel dosyası en fazla 5 MB olabilir." }, 413);
  if (!/\.xlsx$/i.test(file.name)) return productJson({ error: "Yalnızca .xlsx dosyası yüklenebilir." }, 400);

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (mode === "preview") return productJson({ ok: true, preview: await previewImport(gate.scope, bytes) });
    return productJson({ ok: true, ...(await commitImport(gate.scope, bytes, form.get("digest"))) });
  } catch (err) {
    if (err instanceof ImportFileChangedError) return productJson({ error: "Dosya önizlemeden sonra değişti; dosyayı yeniden seçin. Hiçbir şey kaydedilmedi." }, 409);
    if (err instanceof ImportPricesUnavailableError) return productJson({ error: "Fiyat bilgisi şu an alınamıyor; içe aktarma yapılmadı. Lütfen tekrar deneyin." }, 503);
    if (err instanceof XlsxError) return productJson({ error: `${err.message} Hiçbir şey kaydedilmedi.` }, 400);
    return productErrorResponse(err, `api/admin/products/import ${mode}`);
  }
}
