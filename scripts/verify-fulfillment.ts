/* eslint-disable no-console */
/**
 * Manual domain check — run with:  npx tsx scripts/verify-fulfillment.ts
 * Not part of the build. Exercises the demo scenario end to end.
 */

import { getProductAvailability, getCartAvailability } from "@/lib/availability";
import { resolveZone } from "@/lib/delivery/zones";
import { placeOrder, getPublicOrder } from "@/lib/orders";
import { requireTestEnvironmentForWrites } from "./test-environment-guard";

const NOW = new Date();
NOW.setHours(11, 0, 0, 0); // deterministic "morning" clock

let failures = 0;
function check(label: string, cond: boolean) {
  console.log(`${cond ? "  ok  " : " FAIL "} ${label}`);
  if (!cond) failures += 1;
}

async function main() {
  // places an order — only in memory or on the test project
  await requireTestEnvironmentForWrites("verify-fulfillment");

  console.log("\n── zone resolution ──");
  const zone = resolveZone("Gölbaşı", "İncek");
  check("İncek -> incek branch", zone?.branchId === "incek");
  check("unknown neighbourhood -> null", resolveZone("Çankaya", "Nowhere") === null);

  console.log("\n── product availability: Çikolatalı Çilekli Pasta @ İncek, today ──");
  const ctx = {
    fulfillmentType: "delivery" as const,
    district: "Gölbaşı",
    neighborhood: "İncek",
    deliveryZoneId: null,
    branchId: null,
  };
  const a = getProductAvailability({ productId: "p1", quantity: 1, context: ctx, now: NOW });
  console.log(
    "  branch:", a.branchName,
    "| available:", a.available,
    "| reason:", a.reason,
    "| price:", a.unitPrice,
  );
  for (const s of a.slots) {
    console.log(`   ${s.label.padEnd(15)} ${s.available ? "available" : "—"} ${s.reason ?? ""}`);
  }
  check("resolves to İncek", a.branchId === "incek");
  check("today has an available slot", a.available);
  // no hourly order limit (SUPABASE_PLAN.md, D11): a slot closes only for hours / preparation / passive stock
  check("12:00 slot open (no hourly limit)", a.slots.find((s) => s.startTime === "12:00")?.available === true);
  check(
    "closed slots only for hours / preparation",
    a.slots.every((s) => s.available || s.reason === "PREPARATION_TIME" || s.reason === "BRANCH_CLOSED" || s.reason === "SAME_DAY_DISABLED"),
  );
  check("18:00 slot is available", a.slots.find((s) => s.startTime === "18:00")?.available === true);
  check("earliest slot found", a.earliestAvailableSlot !== null);

  console.log("\n── same product, no location ──");
  const noLoc = getProductAvailability({
    productId: "p1",
    quantity: 1,
    context: { ...ctx, district: null, neighborhood: null },
    now: NOW,
  });
  check("LOCATION_REQUIRED", noLoc.reason === "LOCATION_REQUIRED");

  console.log("\n── delivery is address-first: branchId / zone id never replace the address ──");
  // a refusal carries no branch, zone, date or slot — nothing to show as deliverable or as a 0 TL fee
  const noVerdict = (r: ReturnType<typeof getProductAvailability>) =>
    !r.available && r.branchId === null && r.deliveryZoneId === null && r.availableDates.length === 0 && r.earliestAvailableSlot === null;
  const at = (context: Parameters<typeof getProductAvailability>[0]["context"]) =>
    getProductAvailability({ productId: "p1", quantity: 1, context, now: NOW });

  const branchNoAddress = at({ ...ctx, district: null, neighborhood: null, branchId: "incek" });
  check("branchId sent, no address -> LOCATION_REQUIRED", branchNoAddress.reason === "LOCATION_REQUIRED");
  check("…with no availability, branch or fee", noVerdict(branchNoAddress));
  check("district only (+ branchId) -> LOCATION_REQUIRED", at({ ...ctx, neighborhood: null, branchId: "incek" }).reason === "LOCATION_REQUIRED");
  check("neighbourhood only (+ branchId) -> LOCATION_REQUIRED", at({ ...ctx, district: null, branchId: "incek" }).reason === "LOCATION_REQUIRED");
  check("blank district/neighbourhood -> LOCATION_REQUIRED", at({ ...ctx, district: " ", neighborhood: " ", branchId: "incek" }).reason === "LOCATION_REQUIRED");
  const zoneNoAddress = at({ ...ctx, district: null, neighborhood: null, deliveryZoneId: "zone-incek-golbasi", branchId: "incek" });
  check("deliveryZoneId sent, no address -> LOCATION_REQUIRED", zoneNoAddress.reason === "LOCATION_REQUIRED" && noVerdict(zoneNoAddress));

  const cartNoAddress = getCartAvailability({
    context: { ...ctx, district: null, neighborhood: null, branchId: "incek" },
    items: [{ productId: "p1", quantity: 1 }],
    now: NOW,
  });
  check(
    "cart: branchId sent, no address -> LOCATION_REQUIRED, nothing deliverable",
    !cartNoAddress.available && cartNoAddress.branchId === null && cartNoAddress.slots.length === 0 &&
      cartNoAddress.itemIssues[0]?.reason === "LOCATION_REQUIRED",
  );

  const spoofBranch = at({ ...ctx, branchId: "gop" });
  check("İncek address + branchId gop -> still served by İncek", spoofBranch.branchId === "incek" && spoofBranch.deliveryZoneId === zone?.id);
  const spoofZone = at({ ...ctx, branchId: "gop", deliveryZoneId: "zone-gop-cankaya" });
  check(
    "İncek address + GOP zone id -> still İncek, İncek's fee",
    spoofZone.branchId === "incek" && spoofZone.deliveryZoneId === zone?.id && spoofZone.deliveryFee === zone?.deliveryFee,
  );

  const outside = at({ ...ctx, district: "Çankaya", neighborhood: "Nowhere", branchId: "gop" });
  check("address outside every zone (+ branchId) -> DELIVERY_ZONE_NOT_FOUND", outside.reason === "DELIVERY_ZONE_NOT_FOUND" && noVerdict(outside));

  const pickupNoStore = at({ fulfillmentType: "pickup", district: null, neighborhood: null, deliveryZoneId: null, branchId: null });
  check("pickup without a store -> BRANCH_REQUIRED", pickupNoStore.reason === "BRANCH_REQUIRED" && noVerdict(pickupNoStore));

  console.log("\n── pickup @ GOP, product set passive at the branch (p8) ──");
  const oos = getProductAvailability({
    productId: "p8",
    quantity: 1,
    context: {
      fulfillmentType: "pickup",
      district: null,
      neighborhood: null,
      deliveryZoneId: null,
      branchId: "gop",
    },
    now: NOW,
  });
  check("p8 @ gop passive -> next day only", oos.reason === "NEXT_DAY_ONLY" && oos.slots.every((s) => !s.available));

  console.log("\n── branch switch changes behaviour (p1 @ Panora = made-to-order) ──");
  const panora = getProductAvailability({
    productId: "p1",
    quantity: 1,
    context: {
      fulfillmentType: "delivery",
      district: "Çankaya",
      neighborhood: "Balgat",
      deliveryZoneId: null,
      branchId: null,
    },
    now: NOW,
  });
  check("p1 @ panora not same-day today", panora.slots.every((s) => !s.available));
  check(
    "p1 @ panora has a future date",
    panora.earliestAvailableDate !== null && panora.earliestAvailableDate !== a.requestedDate,
  );

  console.log("\n── cart availability ──");
  const cart = getCartAvailability({
    context: ctx,
    items: [
      { productId: "p1", quantity: 1 },
      { productId: "p10", quantity: 2 },
    ],
    now: NOW,
  });
  console.log(
    "  cart available:", cart.available,
    "| issues:", cart.itemIssues.length,
    "| earliest:", cart.earliestAvailableSlot?.label,
  );
  check("cart resolves branch", cart.branchId === "incek");
  check("cart has a shared slot", cart.slots.some((s) => s.available));

  console.log("\n── order engine (mock, no Supabase) ──");
  const payload = {
    customer: { full_name: "Demo Müşteri", phone: "05551112233", email: "demo@funda.test" },
    delivery: {
      type: "delivery",
      branch_slug: "incek",
      date: a.requestedDate,
      time_slot: "18:00 – 20:00",
      address: {
        district: "Gölbaşı",
        neighborhood: "İncek",
        address_line: "TONA Residence B blok 12",
      },
    },
    items: [
      {
        product_id: "p1",
        product_slug: "cikolatali-cilekli-pasta",
        product_name: "Çikolatalı Çilekli Pasta",
        quantity: 1,
        unit_price: 1050,
        total_price: 1050,
      },
    ],
    subtotal: 1050,
    delivery_fee: 70,
    discount: 0,
    total: 1120,
  };
  const summary = await placeOrder(payload, { deliveryZoneId: zone?.id ?? null });
  console.log("  order:", summary.orderNumber, "| branch:", summary.branchName, "| total:", summary.total);
  check("order created with branch İncek", summary.branchName === "Funda 1959 İncek");
  const fetched = await getPublicOrder(summary.orderNumber);
  check("order retrievable for tracking", fetched?.orderNumber === summary.orderNumber);

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
