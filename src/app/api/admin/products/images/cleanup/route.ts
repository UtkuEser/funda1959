import { NextResponse } from "next/server";
import { cleanupProductImages, IMAGE_CLEANUP_MIN_AGE_MINUTES } from "@/lib/catalog/admin";
import { productErrorResponse, productGate, productJson } from "@/lib/catalog/http";

export const dynamic = "force-dynamic";

/**
 * POST { minAgeMinutes? } — removes product photos NO product uses (any
 * status), older than the given age (default 24 h). Merkez only, test data
 * only (D46). A photo used by any product is never removed.
 */
export async function POST(request: Request) {
  const gate = await productGate(request, { write: true });
  if (gate instanceof NextResponse) return gate;
  let minAgeMinutes = IMAGE_CLEANUP_MIN_AGE_MINUTES;
  try {
    const body = (await request.json().catch(() => ({}))) as { minAgeMinutes?: unknown };
    if (body && body.minAgeMinutes !== undefined) {
      const v = Number(body.minAgeMinutes);
      if (!Number.isFinite(v) || v < 0) return productJson({ error: "Geçersiz süre." }, 400);
      minAgeMinutes = v;
    }
    const result = await cleanupProductImages(gate.scope, { minAgeMinutes });
    return productJson({ ok: true, removed: result.removed.length });
  } catch (err) {
    return productErrorResponse(err, "api/admin/products/images/cleanup");
  }
}
