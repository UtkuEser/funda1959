import { NextResponse } from "next/server";
import { AREAS_DISPLAY_MAX_AGE_MS, refreshDeliveryAreas } from "@/lib/delivery/areas-server";
import { areaAssignments, areaSource, areasState } from "@/lib/delivery/zones";

export const dynamic = "force-dynamic";

/**
 * GET — which branch serves each district + neighbourhood (D49), for the
 * browser's delivery context: the address pickers show the branch and "not
 * served" from it. Display reading (a few seconds fresh); quotes and orders
 * resolve the address again on the server. Nothing personal in it.
 *   200 { ok: true, assignments: [{ district, neighborhood, branchId }] }
 *   503 { ok: false } — unreadable: no older map is handed out
 */
export async function GET() {
  await refreshDeliveryAreas({ maxAgeMs: AREAS_DISPLAY_MAX_AGE_MS });
  if (areasState() !== "ready") {
    return NextResponse.json({ ok: false, error: "Teslimat bölgeleri şu an alınamıyor." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ ok: true, source: areaSource(), assignments: areaAssignments() }, { headers: { "Cache-Control": "no-store" } });
}
