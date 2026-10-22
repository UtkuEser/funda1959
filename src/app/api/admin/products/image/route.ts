import { NextResponse } from "next/server";
import { ImageRejectedError, uploadProductImage } from "@/lib/catalog/admin";
import { productErrorResponse, productGate, productJson } from "@/lib/catalog/http";
import { IMAGE_RULES } from "@/lib/catalog/rules";

export const dynamic = "force-dynamic";

/**
 * POST multipart/form-data { clientUploadId, file } — a product photo
 * (Merkez only, test data only, D46). The file's content is checked on the
 * server (type, pixel size, square, ≤ 4 MB) before it is stored; the answer
 * is the registered photo ({ image: { id, url, … } }) to put on a product.
 * The same clientUploadId again returns the first upload (a retry stores
 * nothing new).
 */
export async function POST(request: Request) {
  const gate = await productGate(request, { write: true });
  if (gate instanceof NextResponse) return gate;

  // refuse an oversized body before reading it (a little room for the form fields)
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > IMAGE_RULES.maxBytes + 64 * 1024) return productJson({ error: "Görsel en fazla 4 MB olabilir.", fields: { imageId: "Görsel en fazla 4 MB olabilir." } }, 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return productJson({ error: "Geçersiz istek." }, 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return productJson({ error: "Görsel seçin.", fields: { imageId: "Görsel seçin." } }, 400);
  if (file.size > IMAGE_RULES.maxBytes) return productJson({ error: "Görsel en fazla 4 MB olabilir.", fields: { imageId: "Görsel en fazla 4 MB olabilir." } }, 413);

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const saved = await uploadProductImage(gate.scope, {
      clientUploadId: form.get("clientUploadId"),
      bytes,
      declaredType: file.type || null,
    });
    return productJson({ ok: true, ...saved }, saved.duplicate ? 200 : 201);
  } catch (err) {
    if (err instanceof ImageRejectedError) return productJson({ error: err.reason, fields: { imageId: err.reason } }, 400);
    return productErrorResponse(err, "api/admin/products/image");
  }
}
