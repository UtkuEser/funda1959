/* eslint-disable no-console */
/**
 * Manual domain check — run with:  npx tsx scripts/verify-fulfillment.ts
 * Not part of the build. Exercises the demo scenario end to end.
 */

import { getProductAvailability, getCartAvailability } from "@/lib/availability";
import { resolveZone } from "@/lib/delivery/zones";
import { createReservation, reservedSlotUnits } from "@/lib/reservations";
import { placeOrder, getPublicOrder } from "@/lib/orders";

const NOW = new Date();
NOW.setHours(11, 0, 0, 0); // deterministic "morning" clock

let failures = 0;
function check(label: string, cond: boolean) {
  console.log(`${cond ? "  ok  " : " FAIL "} ${label}`);
  if (!cond) failures += 1;
}

async function main() {
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
  check("12:00 slot is full", a.slots.find((s) => s.startTime === "12:00")?.available === false);
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

  console.log("\n── pickup @ GOP, product out of stock (p8) ──");
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
  check("p8 @ gop OUT_OF_STOCK", oos.reason === "OUT_OF_STOCK");

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

  console.log("\n── reservation holds a slot ──");
  const slotBefore = reservedSlotUnits("incek", a.requestedDate, "18:00");
  createReservation({
    branchId: "incek",
    items: [{ productId: "p1", variantId: null, quantity: 1 }],
    deliveryDate: a.requestedDate,
    deliverySlotStart: "18:00",
  });
  check(
    "reserved slot count went up",
    reservedSlotUnits("incek", a.requestedDate, "18:00") === slotBefore + 1,
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
  const rsv = createReservation({
    branchId: "incek",
    items: [{ productId: "p1", variantId: null, quantity: 1 }],
    deliveryDate: a.requestedDate,
    deliverySlotStart: "18:00",
  });
  const summary = await placeOrder(payload, { reservationId: rsv.id, deliveryZoneId: zone?.id ?? null });
  console.log("  order:", summary.orderNumber, "| branch:", summary.branchName, "| total:", summary.total);
  check("order created with branch İncek", summary.branchName === "Funda 1959 İncek");
  const fetched = await getPublicOrder(summary.orderNumber);
  check("order retrievable for tracking", fetched?.orderNumber === summary.orderNumber);

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
