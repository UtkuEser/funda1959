import { NextResponse } from "next/server";
import { refreshDeliveryFees } from "@/lib/delivery/fees-server";
import { refreshDeliveryAreas } from "@/lib/delivery/areas-server";
import { reasonMessage, resolveContextBranch } from "@/lib/availability";
import type { DeliveryFeeAnswer } from "@/lib/delivery/fees";

export const dynamic = "force-dynamic";

/**
 * POST { district, neighborhood } — the delivery fee of that address's zone,
 * read fresh from the fee store (SUPABASE_PLAN.md, D15). The cart and checkout
 * show it; quotes and orders resolve the address the same way
 * (`resolveContextBranch`), so the figure is the one the order will carry.
 *   200 { ok: true, state: "paid" | "free", fee, ... }
 *   200 { ok: false, reason, error } — not set, outside every zone, …
 *   503 { ok: false, reason: "DELIVERY_INFO_UNAVAILABLE" } — never an older value
 * Pickup has no fee and needs no call. Nothing is written.
 */
export async function POST(request: Request) {
  let body: { district?: unknown; neighborhood?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, reason: null, error: "Geçersiz istek." }, { status: 400 });
  }
  const district = typeof body.district === "string" ? body.district : null;
  const neighborhood = typeof body.neighborhood === "string" ? body.neighborhood : null;

  // lenient: a failed read leaves the fees "unavailable" -> DELIVERY_INFO_UNAVAILABLE below
  await Promise.all([refreshDeliveryFees(), refreshDeliveryAreas()]);

  const resolved = resolveContextBranch({ fulfillmentType: "delivery", district, neighborhood, deliveryZoneId: null, branchId: null });
  if (!resolved.ok) {
    const answer: DeliveryFeeAnswer = { ok: false, reason: resolved.reason, error: reasonMessage(resolved.reason) };
    return NextResponse.json(answer, { status: resolved.reason === "DELIVERY_INFO_UNAVAILABLE" ? 503 : 200 });
  }
  const answer: DeliveryFeeAnswer = {
    ok: true,
    state: resolved.deliveryFeeState === "free" ? "free" : "paid",
    fee: resolved.deliveryFee,
    zoneId: resolved.zoneId ?? "",
    branchName: resolved.branch.name,
  };
  return NextResponse.json(answer);
}
