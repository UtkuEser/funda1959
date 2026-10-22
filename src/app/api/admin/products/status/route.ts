import { NextResponse } from "next/server";
import { setProductStatus } from "@/lib/catalog/admin";
import { productErrorResponse, productGate, productJson } from "@/lib/catalog/http";

export const dynamic = "force-dynamic";

/**
 * POST { id, expectedVersion, status: "published" | "unpublished" } — Merkez
 * only, test data only (D46). Publishing needs every required field; an
 * unpublished product leaves the storefront and can't be ordered; there is
 * no delete.
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
    const product = await setProductStatus(gate.scope, { id: body?.id, expectedVersion: body?.expectedVersion, status: body?.status });
    return productJson({ ok: true, product });
  } catch (err) {
    return productErrorResponse(err, "api/admin/products/status");
  }
}
