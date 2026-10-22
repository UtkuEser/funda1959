import { NextResponse } from "next/server";
import { setProductPublished } from "@/lib/catalog/admin";
import { productErrorResponse, productGate, productJson } from "@/lib/catalog/http";

export const dynamic = "force-dynamic";

/**
 * POST { productId, published } — "Yayında" in the "Ürün Bilgisi" list (D48).
 * Merkez only, test data only (D46). The answer is the state the database
 * confirmed; on any error nothing changed and the panel puts the tick back.
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
    const result = await setProductPublished(gate.scope, { productId: body?.productId, published: body?.published });
    return productJson({ ok: true, ...result });
  } catch (err) {
    return productErrorResponse(err, "api/admin/products/visibility");
  }
}
