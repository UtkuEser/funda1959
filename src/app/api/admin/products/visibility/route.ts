import { NextResponse } from "next/server";
import { setProductPublished, setProductsPublished } from "@/lib/catalog/admin";
import { productErrorBody, productErrorResponse, productGate, productJson } from "@/lib/catalog/http";

export const dynamic = "force-dynamic";

/**
 * POST { items: [{ productId, published }] } — "Yayın Durumlarını Kaydet" in
 * the "Ürün Bilgisi" list (D48, D56): every product applied and confirmed on
 * its own; `results` says per product what the database confirmed, or why
 * not (that one stays pending in the panel). POST { productId, published }
 * still sets one. Merkez only, test data only (D46).
 */
export async function POST(request: Request) {
  const gate = await productGate(request, { write: true });
  if (gate instanceof NextResponse) return gate;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return productJson({ error: "Geçersiz istek." }, 400);
  }
  try {
    if (Array.isArray(body?.items)) {
      const outcomes = await setProductsPublished(gate.scope, body.items);
      return productJson({
        ok: true,
        results: outcomes.map((o) =>
          o.ok
            ? { productId: o.productId, ok: true, published: o.published }
            : { productId: o.productId, ok: false, ...productErrorBody(o.error, "api/admin/products/visibility").body },
        ),
      });
    }
    const result = await setProductPublished(gate.scope, { productId: body?.productId, published: body?.published });
    return productJson({ ok: true, ...result });
  } catch (err) {
    return productErrorResponse(err, "api/admin/products/visibility");
  }
}
