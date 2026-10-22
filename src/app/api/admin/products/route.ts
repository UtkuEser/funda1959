import { NextResponse } from "next/server";
import { getProduct, listProducts, saveProduct } from "@/lib/catalog/admin";
import { productErrorResponse, productGate, productJson } from "@/lib/catalog/http";

export const dynamic = "force-dynamic";

/**
 * Products added in the panel (D45, D46) — Merkez only, test data only.
 *   GET            every product, drafts included (newest first); ?id= one
 *   POST  { clientRequestId, fields }                  create a draft (same id twice -> same draft)
 *   PATCH { id, expectedVersion, fields }              save a product (draft or published)
 * Publishing / unpublishing: /api/admin/products/status. Photos: /image.
 * No delete.
 */

export async function GET(request: Request) {
  const gate = await productGate(request, { write: false });
  if (gate instanceof NextResponse) return gate;
  const id = new URL(request.url).searchParams.get("id");
  try {
    if (id) {
      const product = await getProduct(gate.scope, id);
      return product ? productJson({ ok: true, product }) : productJson({ error: "Ürün bulunamadı." }, 404);
    }
    return productJson({ ok: true, products: await listProducts(gate.scope) });
  } catch (err) {
    return productErrorResponse(err, "api/admin/products GET");
  }
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = (await request.json()) as unknown;
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const gate = await productGate(request, { write: true });
  if (gate instanceof NextResponse) return gate;
  const body = await readBody(request);
  if (!body) return productJson({ error: "Geçersiz istek." }, 400);
  try {
    const saved = await saveProduct(gate.scope, { clientRequestId: body.clientRequestId, fields: body.fields });
    return productJson({ ok: true, ...saved }, saved.duplicate ? 200 : 201);
  } catch (err) {
    return productErrorResponse(err, "api/admin/products POST");
  }
}

export async function PATCH(request: Request) {
  const gate = await productGate(request, { write: true });
  if (gate instanceof NextResponse) return gate;
  const body = await readBody(request);
  if (!body || typeof body.id !== "string") return productJson({ error: "Geçersiz istek." }, 400);
  try {
    const saved = await saveProduct(gate.scope, { id: body.id, expectedVersion: body.expectedVersion, fields: body.fields });
    return productJson({ ok: true, product: saved.product });
  } catch (err) {
    return productErrorResponse(err, "api/admin/products PATCH");
  }
}
