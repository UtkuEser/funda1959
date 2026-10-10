/**
 * Manual domain check for Aşama 2 — run with:
 *   npx tsx scripts/verify-orders.ts
 * Not part of the build. No database: order validation (buildOrderPayload),
 * the in-memory order store and the status rules (SUPABASE_PLAN.md, A12).
 * Times are fixed Europe/Istanbul instants, so it behaves the same on a UTC
 * server (run it with TZ=UTC to check).
 */
import { buildOrderPayload, quoteFromPayload } from "@/lib/order-server";
import { memoryOrders, placeOrder, type NewOrderInput, type StatusChangeRequest } from "@/lib/orders";
import { getFundaPointsRepository } from "@/lib/funda-points";
import { getBranch } from "@/lib/branch";
import { resolveZone } from "@/lib/delivery/zones";
import { catalogProducts, getProductDetail } from "@/lib/data";
import { requireTestEnvironmentForWrites } from "./test-environment-guard";

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  console.log(`${cond ? "  ok  " : " FAIL "} ${label}${cond || !detail ? "" : `  -> ${detail}`}`);
  if (!cond) failures += 1;
}

const at = (iso: string) => new Date(`${iso}+03:00`);
const NOW = at("2026-10-12T11:00:00"); // Monday 11:00 Istanbul
const TODAY = "2026-10-12";
const customer = { fullName: "Test Kullanıcı", phone: "0555 123 45 67", email: "test@example.com" };
const incekAddress = { district: "Gölbaşı", neighborhood: "İncek", addressLine: "TONA Residence B blok 12" };
const macaron = (extra: Record<string, unknown> = {}) => ({ productSlug: "cikolatali-macaron", quantity: 2, ...extra });

type Built = ReturnType<typeof buildOrderPayload>;
const delivery = (b: Built) => (b.ok ? (b.payload.delivery as Record<string, unknown>) : {});
const reasonOf = (b: Built) => (b.ok ? "OK" : `${b.status} ${b.reason ?? ""} ${b.error}`);

async function main() {
  await requireTestEnvironmentForWrites("verify-orders");

  console.log("\n── order-time availability (Monday 11:00 Istanbul) ──");
  const pickupOk = buildOrderPayload(
    { customer, items: [macaron({ unitPrice: 1 })], delivery: { type: "pickup", branchSlug: "gop", date: TODAY, timeSlot: "16:00 – 17:00" } },
    { now: NOW },
  );
  check("pickup GOP, macaron today 16:00 (4 h prep fits) -> accepted", pickupOk.ok, reasonOf(pickupOk));
  check("…branch gop, no zone, no delivery fee", delivery(pickupOk).branch_slug === "gop" && delivery(pickupOk).zone_id === null && pickupOk.ok && pickupOk.payload.delivery_fee === 0);
  check("…unit price from the catalog (browser sent 1)", pickupOk.ok && (pickupOk.payload.items as { unit_price: number }[])[0].unit_price === 45);
  check("…total = 2 × 45", pickupOk.ok && pickupOk.payload.total === 90 && pickupOk.payload.subtotal === 90);

  const past = buildOrderPayload({ customer, items: [macaron()], delivery: { type: "pickup", branchSlug: "gop", date: TODAY, timeSlot: "10:00 – 11:00" } }, { now: NOW });
  check("slot already over (10:00–11:00 at 11:00) -> 409 PREPARATION_TIME", !past.ok && past.status === 409 && past.reason === "PREPARATION_TIME", reasonOf(past));
  const tooSoon = buildOrderPayload({ customer, items: [macaron()], delivery: { type: "pickup", branchSlug: "gop", date: TODAY, timeSlot: "13:00 – 14:00" } }, { now: NOW });
  check("4 h prep can't make 13:00–14:00 -> 409 PREPARATION_TIME", !tooSoon.ok && tooSoon.status === 409 && tooSoon.reason === "PREPARATION_TIME", reasonOf(tooSoon));

  const passiveToday = buildOrderPayload(
    { customer, items: [{ productSlug: catalogProducts.find((p) => p.id === "p8")!.slug, quantity: 1 }], delivery: { type: "pickup", branchSlug: "gop", date: TODAY, timeSlot: "17:00 – 18:00" } },
    { now: NOW },
  );
  check("product passive at GOP today -> 409 NEXT_DAY_ONLY", !passiveToday.ok && passiveToday.status === 409 && passiveToday.reason === "NEXT_DAY_ONLY", reasonOf(passiveToday));

  const panora10 = buildOrderPayload({ customer, items: [macaron()], delivery: { type: "pickup", branchSlug: "panora", date: "2026-10-14", timeSlot: "10:00 – 11:00" } }, { now: NOW });
  check("Panora 10:00 (its windows start 12:00) -> 409", !panora10.ok && panora10.status === 409, reasonOf(panora10));

  const yesterday = buildOrderPayload({ customer, items: [macaron()], delivery: { type: "pickup", branchSlug: "gop", date: "2026-10-11", timeSlot: "16:00 – 17:00" } }, { now: NOW });
  check("date in the past -> 409 DATE_UNAVAILABLE", !yesterday.ok && yesterday.status === 409 && yesterday.reason === "DATE_UNAVAILABLE", reasonOf(yesterday));
  const tooFar = buildOrderPayload({ customer, items: [macaron()], delivery: { type: "pickup", branchSlug: "gop", date: "2026-12-11", timeSlot: "16:00 – 17:00" } }, { now: NOW });
  check("date beyond the 60-day horizon -> 409", !tooFar.ok && tooFar.status === 409, reasonOf(tooFar));

  const badSlot = buildOrderPayload({ customer, items: [macaron()], delivery: { type: "pickup", branchSlug: "gop", date: TODAY, timeSlot: "16:30" } }, { now: NOW });
  check("malformed slot -> 400", !badSlot.ok && badSlot.status === 400, reasonOf(badSlot));

  console.log("\n── delivery: branch, zone and fee come from the address ──");
  const zone = resolveZone("Gölbaşı", "İncek");
  const spoof = buildOrderPayload(
    {
      customer,
      items: [macaron()],
      delivery: { type: "delivery", branchSlug: "gop", zoneId: "zone-gop-cankaya", date: TODAY, timeSlot: "16:00 – 17:00", address: incekAddress },
      deliveryFee: 0,
      total: 1,
    },
    { now: NOW },
  );
  check("İncek address + branchSlug gop -> accepted", spoof.ok, reasonOf(spoof));
  check("…branch incek, zone from the address", delivery(spoof).branch_slug === "incek" && delivery(spoof).zone_id === zone?.id, JSON.stringify(delivery(spoof)));
  check(`…delivery fee = the zone's (${zone?.deliveryFee}), total = 90 + fee`, spoof.ok && spoof.payload.delivery_fee === zone?.deliveryFee && spoof.payload.total === 90 + (zone?.deliveryFee ?? NaN));
  const outside = buildOrderPayload(
    { customer, items: [macaron()], delivery: { type: "delivery", date: TODAY, timeSlot: "16:00 – 17:00", address: { district: "Keçiören", neighborhood: "Bilinmeyen", addressLine: "Test sokak no 1 daire 2" } } },
    { now: NOW },
  );
  check("address outside every zone -> 409 DELIVERY_ZONE_NOT_FOUND", !outside.ok && outside.status === 409 && outside.reason === "DELIVERY_ZONE_NOT_FOUND", reasonOf(outside));

  console.log("\n── Europe/Istanbul, not the server's clock ──");
  const midnight = at("2026-10-12T00:30:00"); // still 2026-10-11 in UTC
  const utcToday = buildOrderPayload({ customer, items: [macaron()], delivery: { type: "pickup", branchSlug: "gop", date: "2026-10-11", timeSlot: "18:00 – 19:00" } }, { now: midnight });
  check("00:30 Istanbul: yesterday's date (UTC 'today') -> 409", !utcToday.ok && utcToday.status === 409, reasonOf(utcToday));
  const istToday = buildOrderPayload({ customer, items: [macaron()], delivery: { type: "pickup", branchSlug: "gop", date: "2026-10-12", timeSlot: "10:00 – 11:00" } }, { now: midnight });
  check("00:30 Istanbul: the Istanbul day's 10:00 slot -> accepted", istToday.ok, reasonOf(istToday));

  console.log("\n── variant price is the catalog's ──");
  const withVariants = catalogProducts.find((p) => (getProductDetail(p.slug)?.variants.length ?? 0) > 1);
  const variant = withVariants ? getProductDetail(withVariants.slug)!.variants[1] : null;
  if (withVariants && variant) {
    let accepted: Built | null = null;
    for (const branchSlug of ["gop", "panora", "incek"]) {
      const r = buildOrderPayload(
        { customer, items: [{ productSlug: withVariants.slug, variantId: variant.id, quantity: 1, unitPrice: 1 }], delivery: { type: "pickup", branchSlug, date: "2026-10-20", timeSlot: "14:00 – 15:00" } },
        { now: NOW },
      );
      if (r.ok) {
        accepted = r;
        break;
      }
    }
    const line = accepted?.ok ? (accepted.payload.items as { unit_price: number; variant_label: string }[])[0] : null;
    check(`${withVariants.slug} / ${variant.label}: unit price ${variant.price} from the catalog`, line?.unit_price === variant.price && line?.variant_label === variant.label, JSON.stringify(line));
  } else {
    check("a product with variants exists", false);
  }

  console.log("\n── payment-screen quote = the order's own figures ──");
  if (!spoof.ok || !pickupOk.ok) throw new Error("setup: payload rejected");
  const dq = quoteFromPayload(spoof.payload);
  check("delivery quote: products 90, fee 70, total 160", dq.subtotal === 90 && dq.deliveryFee === 70 && dq.discount === 0 && dq.total === 160, JSON.stringify(dq));
  check("…equals the payload the order is written from", dq.subtotal === spoof.payload.subtotal && dq.deliveryFee === spoof.payload.delivery_fee && dq.total === spoof.payload.total);
  check("…lines priced by the server (2 × 45), branch İncek", dq.lines.length === 1 && dq.lines[0].quantity === 2 && dq.lines[0].unitPrice === 45 && dq.lines[0].lineTotal === 90 && dq.branchName === getBranch("incek")?.name);
  const pq = quoteFromPayload(pickupOk.payload);
  check("pickup quote: fee 0, total = products", pq.deliveryType === "pickup" && pq.deliveryFee === 0 && pq.total === pq.subtotal && pq.total === 90);

  console.log("\n── placing (memory store): demo, idempotent, zone kept ──");
  const requestPayload = { ...spoof.payload, client_request_id: "verify-orders-req-1" };
  const first = await placeOrder(requestPayload);
  const again = await placeOrder(requestPayload);
  check("same client_request_id twice -> same order number", first.orderNumber === again.orderNumber);
  const stored = await memoryOrders.get(first.orderNumber);
  check("stored: branch incek, zone from the address, demo, pending", stored?.branchId === "incek" && stored?.deliveryZoneId === zone?.id && stored?.isDemo === true && stored?.paymentStatus === "pending");
  check("stored total = the quote's total (fee included)", stored?.total === dq.total && stored?.deliveryFee === dq.deliveryFee);
  check(
    "demo order wrote no Funda Puan transaction (memory store)",
    stored !== null && getFundaPointsRepository().findTransactionByBusinessKey(`${stored.id}:PURCHASE_EARN`) === null,
  );

  console.log("\n── list: branch scope, delivery-date filter, paging ──");
  const base = (branchId: string | null, deliveryDate: string, fulfillmentType: "pickup" | "delivery" = "pickup"): NewOrderInput => ({
    branchId,
    deliveryZoneId: null,
    fulfillmentType,
    salesChannel: "web",
    customer: { fullName: "Liste Test", phone: "0555 000 00 00", email: "l@test.example" },
    address: null,
    items: [],
    deliveryDate,
    deliverySlot: "12:00 – 13:00",
    subtotal: 10,
    deliveryFee: 0,
    discount: 0,
    total: 10,
  });
  for (let i = 0; i < 28; i += 1) memoryOrders.create(base("gop", i < 10 ? "2026-10-15" : "2026-10-16"));
  const panoraOrder = memoryOrders.create(base("panora", "2026-10-15"));
  const incekDelivery = memoryOrders.create(base("incek", "2026-10-15", "delivery"));
  const legacy = memoryOrders.create(base(null, "2026-10-15", "delivery"));

  const gopPage1 = await memoryOrders.list({ branchIds: ["gop"], limit: 25, offset: 0 });
  const gopPage2 = await memoryOrders.list({ branchIds: ["gop"], limit: 25, offset: 25 });
  check("GOP sees only GOP orders", [...gopPage1.rows, ...gopPage2.rows].every((o) => o.branchId === "gop"));
  check("paging: 25 + 3 rows, total 28", gopPage1.rows.length === 25 && gopPage2.rows.length === 3 && gopPage1.total === 28, `${gopPage1.rows.length}+${gopPage2.rows.length}/${gopPage1.total}`);
  check("newest first", gopPage1.rows[0].createdAt >= gopPage1.rows[24].createdAt);
  const gopDay = await memoryOrders.list({ branchIds: ["gop"], from: "2026-10-15", to: "2026-10-15", limit: 100, offset: 0 });
  check("delivery-date filter: 10 GOP orders on 15 Oct", gopDay.total === 10 && gopDay.rows.every((o) => o.deliveryDate === "2026-10-15"));
  const all = await memoryOrders.list({ branchIds: null, from: "2026-10-15", to: "2026-10-15", limit: 100, offset: 0 });
  check("Merkez sees every branch on 15 Oct (incl. a legacy order without branch)", all.total === 13 && all.rows.some((o) => o.branchId === null));
  check("status counts over the filtered set", all.statusCounts.new === 13);

  console.log("\n── status changes (A12) ──");
  const gop = { account: "sube:gop", name: "GOP" };
  const merkez = { account: "merkez", name: "Merkez Yönetim" };
  const change = (r: Partial<StatusChangeRequest> & { orderNumber: string }) =>
    memoryOrders.changeStatus({ toStatus: "confirmed", reason: null, actor: gop, branchIds: ["gop"], ...r });
  const gopOrder = gopPage1.rows[0];

  const foreign = await change({ orderNumber: panoraOrder.orderNumber });
  check("GOP advancing a Panora order -> FORBIDDEN", !foreign.ok && foreign.error === "FORBIDDEN");
  check("…the Panora order is untouched", (await memoryOrders.get(panoraOrder.orderNumber))?.orderStatus === "new");
  const foreignCancel = await change({ orderNumber: incekDelivery.orderNumber, toStatus: "cancelled", reason: "deneme gerekçe" });
  check("GOP cancelling an İncek order -> FORBIDDEN", !foreignCancel.ok && foreignCancel.error === "FORBIDDEN");
  const legacyByBranch = await change({ orderNumber: legacy.orderNumber });
  check("branch account on an order without branch -> FORBIDDEN", !legacyByBranch.ok && legacyByBranch.error === "FORBIDDEN");
  check("unknown order -> NOT_FOUND", !(await change({ orderNumber: "FND-YOK" })).ok);

  const skip = await change({ orderNumber: gopOrder.orderNumber, toStatus: "preparing" });
  check("skipping a step (new -> preparing) -> INVALID_TRANSITION", !skip.ok && skip.error === "INVALID_TRANSITION");
  const step = await change({ orderNumber: gopOrder.orderNumber, toStatus: "confirmed" });
  check("GOP advances its own order new -> confirmed", step.ok && step.order.orderStatus === "confirmed");
  check("…the change records account and time", step.ok && step.order.statusHistory.at(-1)?.actorAccount === "sube:gop" && Boolean(step.order.statusHistory.at(-1)?.at));
  const stale = await change({ orderNumber: gopOrder.orderNumber, toStatus: "confirmed" });
  check("same step sent twice (double click) -> INVALID_TRANSITION", !stale.ok && stale.error === "INVALID_TRANSITION");

  const noReason = await change({ orderNumber: gopOrder.orderNumber, toStatus: "cancelled", reason: "  " });
  check("cancel without a reason -> REASON_REQUIRED", !noReason.ok && noReason.error === "REASON_REQUIRED");
  const cancel = await change({ orderNumber: gopOrder.orderNumber, toStatus: "cancelled", reason: "  Müşteri aradı, vazgeçti  " });
  check("cancel with a reason -> cancelled", cancel.ok && cancel.order.orderStatus === "cancelled");
  check("…reason, account and time recorded", cancel.ok && cancel.order.cancellation?.reason === "Müşteri aradı, vazgeçti" && cancel.order.cancellation?.by === "GOP" && Boolean(cancel.order.cancellation?.at) && cancel.order.statusHistory.at(-1)?.reason === "Müşteri aradı, vazgeçti");
  const reopen = await change({ orderNumber: gopOrder.orderNumber, toStatus: "confirmed" });
  check("a cancelled order is closed", !reopen.ok && reopen.error === "ORDER_CLOSED");

  // pickup timeline to delivered, then no cancel
  const pickup = gopPage1.rows[1];
  for (const s of ["confirmed", "preparing", "ready", "delivered"] as const) await change({ orderNumber: pickup.orderNumber, toStatus: s });
  check("pickup: new -> confirmed -> preparing -> ready -> delivered", (await memoryOrders.get(pickup.orderNumber))?.orderStatus === "delivered");
  const cancelDelivered = await change({ orderNumber: pickup.orderNumber, toStatus: "cancelled", reason: "geç kaldı" });
  check("a delivered order can't be cancelled", !cancelDelivered.ok && cancelDelivered.error === "ORDER_CLOSED");

  // delivery timeline has out_for_delivery; Merkez works on any branch
  const m = (r: Partial<StatusChangeRequest> & { orderNumber: string }) => change({ actor: merkez, branchIds: null, ...r });
  for (const s of ["confirmed", "preparing", "ready"] as const) await m({ orderNumber: incekDelivery.orderNumber, toStatus: s });
  const readyToDelivered = await m({ orderNumber: incekDelivery.orderNumber, toStatus: "delivered" });
  check("delivery: ready -> delivered skips 'Yolda' -> INVALID_TRANSITION", !readyToDelivered.ok && readyToDelivered.error === "INVALID_TRANSITION");
  const outFor = await m({ orderNumber: incekDelivery.orderNumber, toStatus: "out_for_delivery" });
  check("Merkez moves an İncek delivery order to 'Yolda'", outFor.ok && outFor.order.orderStatus === "out_for_delivery" && outFor.order.statusHistory.length === 4);
  const legacyByMerkez = await m({ orderNumber: legacy.orderNumber, toStatus: "cancelled", reason: "eski kayıt" });
  check("Merkez may cancel an order without branch", legacyByMerkez.ok);

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
