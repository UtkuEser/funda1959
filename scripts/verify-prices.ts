/**
 * Manual domain check for Aşama 4 (product prices, SUPABASE_PLAN.md D5, D16–D21) — run with:
 *   npx tsx scripts/verify-prices.ts
 * Not part of the build. No database: an in-memory price store with TEST
 * FIXTURE prices (not approved prices), the in-memory order store, fixed
 * Europe/Istanbul instants.
 */
import { buildOrderPayload, quoteFromPayload, PRICES_UNAVAILABLE_ERROR } from "@/lib/order-server";
import { findOrderByRequestId, memoryOrders, placeOrder } from "@/lib/orders";
import { canQuickAddToCart, catalogProducts, getProductDetail, oldPriceShown, productSizes, showsOldPrice, type CatalogProduct } from "@/lib/data";
import {
  applyPrice,
  applyPriceToDetail,
  catalogPriceSuffix,
  currentSizes,
  displayPriceMap,
  effectivePriceValue,
  effectiveUnitPrice,
  isPriceKeyOf,
  priceKey,
  priceLabel,
  pricedSizes,
  priceRowsForCalculation,
  priceRowsForDisplay,
  productPriceTableMissing,
} from "@/lib/pricing/prices";
import { requireTestEnvironmentForWrites } from "./test-environment-guard";
import { installMemoryFeeStore } from "./test-fee-store";
import { installMemoryPriceStore } from "./test-price-store";

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  console.log(`${cond ? "  ok  " : " FAIL "} ${label}${cond || !detail ? "" : `  -> ${detail}`}`);
  if (!cond) failures += 1;
}

const at = (iso: string) => new Date(`${iso}+03:00`);
const NOW = at("2026-10-12T11:00:00"); // Monday 11:00 Istanbul
const DAY = "2026-10-12";
const LATER = "2026-10-15"; // Thursday — every product can be ready at GOP
const customer = { fullName: "Test Kullanıcı", phone: "0555 123 45 67", email: "test@example.com" };
const incekAddress = { district: "Gölbaşı", neighborhood: "İncek", addressLine: "TONA Residence B blok 12" };
const incekPickup = { type: "pickup", branchSlug: "incek", date: DAY, timeSlot: "16:00 – 17:00" };
const byId = (id: string) => catalogProducts.find((p) => p.id === id) as CatalogProduct;
const slugOf = (id: string) => byId(id).slug;
type Built = ReturnType<typeof buildOrderPayload>;
type Line = { product_id: string; variant_id: string | null; variant_label: string | null; unit_price: number };
const reasonOf = (b: Built) => (b.ok ? "OK" : `${b.status} ${b.reason ?? ""} ${b.error}`);
const linesOf = (b: Built) => (b.ok ? (b.payload.items as Line[]) : []);
const unitOf = (b: Built, i: number) => linesOf(b)[i]?.unit_price;
const sizesText = (id: string, rows = priceRowsForCalculation()!) => currentSizes(byId(id), rows).map((v) => v.price).join("/");
const mapNow = () => displayPriceMap(catalogProducts, priceRowsForDisplay());

async function main() {
  await requireTestEnvironmentForWrites("verify-prices");
  const fees = installMemoryFeeStore();
  await fees.set("zone-incek-golbasi", "paid", 70); // test fixture
  const prices = installMemoryPriceStore();
  await prices.ready;

  console.log("\n── which prices Merkez can change: every single price and every size (D20) ──");
  const keys = catalogProducts.flatMap((p) => {
    const sizes = productSizes(p);
    return sizes.length > 0 ? sizes.map((s) => priceKey(p.id, s.id)) : [priceKey(p.id)];
  });
  const single = keys.filter((k) => k.endsWith("|")).map((k) => k.slice(0, -1));
  check("47 prices: 6 single prices + 41 sizes of 12 products", keys.length === 47 && single.length === 6, `${keys.length}`);
  check("single prices: p5 p6 p7 p12 p17 p18 (key '')", single.join(" ") === "p5 p6 p7 p12 p17 p18", single.join(" "));
  check(
    "a size is a price of its own: p1 '8-10' yes; p1 '' / '7kg' no; p5 '' yes, p5 '6' no",
    isPriceKeyOf(byId("p1"), "8-10") && !isPriceKeyOf(byId("p1"), "") && !isPriceKeyOf(byId("p1"), "7kg") && isPriceKeyOf(byId("p5"), "") && !isPriceKeyOf(byId("p5"), "6"),
  );
  check("every size id fits 0009's variant_key check (^[0-9a-z.-]{0,20}$)", keys.every((k) => /^[0-9a-z.-]{0,20}$/.test(k.split("|")[1])));

  console.log("\n── starting values: the size prices sold so far, unchanged (no multiplier, nothing new) ──");
  const START: Record<string, string> = {
    p1: "780/1050/1450",
    p2: "720/970/1330/1730",
    p3: "740/1000/1370/1780",
    p4: "760/1030/1410/1820",
    p8: "230/420/610",
    p9: "200/360/520",
    p10: "350/640/930",
    p11: "310/560/810",
    p13: "260/520/990",
    p14: "450/890/1690",
    p15: "1450/1960/2680/3480",
    p16: "950/1280/1760/2280",
  };
  const off = Object.keys(START).filter((id) => sizesText(id) !== START[id]);
  check("41 size prices as before (12 products)", off.length === 0 && catalogProducts.filter((p) => productSizes(p).length > 0).length === 12, off.map((id) => `${id} ${sizesText(id)}`).join(" | "));
  check(
    "single prices as before: p5 45, p6 95, p7 85, p12 120, p17 280, p18 240",
    ["p5:45", "p6:95", "p7:85", "p12:120", "p17:280", "p18:240"].every((x) => byId(x.split(":")[0]).priceValue === Number(x.split(":")[1])),
  );
  check("product pages offer exactly these sizes", catalogProducts.every((p) => JSON.stringify(getProductDetail(p.slug)!.variants) === JSON.stringify(productSizes(p))));
  const sizedIds = catalogProducts.filter((p) => productSizes(p).length > 0);
  check(
    "a product with sizes reaches the cart only with a size (size chooser on its page, no card quick-add)",
    sizedIds.every((p) => getProductDetail(p.slug)!.variantKind !== "none" && !canQuickAddToCart(p)),
  );

  console.log("\n── cards show the smallest size's price, plainly (D16, D21) ──");
  const cardOf = (id: string, map?: Record<string, number>) => {
    const p = applyPrice(byId(id), map);
    return `${p.cardPrice} ${p.displayPrice}`;
  };
  check("weight: kurabiye 500 g ₺230, şekerpare ₺200, baklava ₺350, kadayıf ₺310", cardOf("p8") === "230 ₺230" && cardOf("p9") === "200 ₺200" && cardOf("p10") === "350 ₺350" && cardOf("p11") === "310 ₺310", ["p8", "p9", "p10", "p11"].map((id) => cardOf(id)).join(" | "));
  check("pack: pralin 6'lı ₺450; serving: profiterol ₺720, nişan ₺1.450, p1 ₺780", cardOf("p14") === "450 ₺450" && cardOf("p2") === "720 ₺720" && cardOf("p15") === "1450 ₺1.450" && cardOf("p1") === "780 ₺780");
  check("Trüf Çikolata card: 6'lı ₺260, no old price (D21)", cardOf("p13") === "260 ₺260" && byId("p13").oldPrice === undefined && !showsOldPrice(byId("p13")));
  check("no card says 'başlayan' / 'itibaren'", catalogProducts.every((p) => !/başla|itibaren/i.test(p.displayPrice)));
  check("single-price cards unchanged (p5 '₺45 / adet', p6 '₺95')", cardOf("p5") === "45 ₺45 / adet" && cardOf("p6") === "95 ₺95");

  console.log("\n── struck-through old price: only with the size or product it belongs to (D18, D21) ──");
  const truf = productSizes(byId("p13"));
  check("p13: ₺580 belongs to 12'li only (6'lı, 24'lü none)", truf.map((s) => `${s.id}:${s.oldPrice ?? "-"}`).join(" ") === "6:- 12:₺580 24:-");
  const shownOld = (s: { oldPrice?: string; price: number }) => oldPriceShown(s.oldPrice, s.price);
  check("product page, 12'li chosen: ₺520 with ₺580 struck through; 6'lı / 24'lü without", shownOld(truf[1]) && truf[1].price === 520 && !shownOld(truf[0]) && !shownOld(truf[2]));
  check("no other size carries an old price", catalogProducts.flatMap((p) => productSizes(p)).filter((s) => s.oldPrice).length === 1);
  check("p18 ₺240 shows its ₺290 (single price, card)", showsOldPrice(byId("p18")));
  check(
    "guard: p18 at 250 shown; at 290 or 300 hidden",
    showsOldPrice(applyPrice(byId("p18"), { "p18|": 250 })) && !showsOldPrice(applyPrice(byId("p18"), { "p18|": 290 })) && !showsOldPrice(applyPrice(byId("p18"), { "p18|": 300 })),
  );
  const at12 = (price: number) => shownOld(pricedSizes("p13", truf, { "p13|12": price })[1]);
  check("guard on a size: 12'li at 550 shown; at 580 or 600 hidden", at12(550) && !at12(580) && !at12(600));
  check(
    "no old price is generated when a price drops (p5 at 40, p1 4–6 at 700)",
    !showsOldPrice(applyPrice(byId("p5"), { "p5|": 40 })) && pricedSizes("p1", productSizes(byId("p1")), { "p1|4-6": 700 }).every((s) => !s.oldPrice),
  );

  console.log("\n── labels keep the catalog unit; kuruş shown ──");
  check("p5 unit ' / adet', p8 ' / kg', p6 none", catalogPriceSuffix(byId("p5")) === " / adet" && catalogPriceSuffix(byId("p8")) === " / kg" && catalogPriceSuffix(byId("p6")) === "");
  check("p5 at 49.90 -> '₺49,90 / adet'; p6 at 100 -> '₺100'", priceLabel(byId("p5"), 49.9) === "₺49,90 / adet" && priceLabel(byId("p6"), 100) === "₺100");

  console.log("\n── nothing stored: catalog prices everywhere ──");
  const none = priceRowsForCalculation()!;
  check("p5 45, p8 1 kg 420, p13 12'li 520 (catalog)", effectivePriceValue(byId("p5"), none) === 45 && effectiveUnitPrice(byId("p8"), "1kg", none) === 420 && effectiveUnitPrice(byId("p13"), "12", none) === 520);
  check("display map empty", Object.keys(mapNow()).length === 0);

  console.log("\n── Merkez sets p5 = 49,90 (fixture) ──");
  await prices.set("p5", 49.9);
  check("calculation and display: p5 49.90, only 'p5|' in the map", effectivePriceValue(byId("p5"), priceRowsForCalculation()!) === 49.9 && JSON.stringify(mapNow()) === JSON.stringify({ "p5|": 49.9 }));
  const card = applyPrice(byId("p5"), mapNow());
  check("card: priceValue 49.9, label '₺49,90 / adet'; applying twice changes nothing", card.priceValue === 49.9 && card.displayPrice === "₺49,90 / adet" && applyPrice(card, mapNow()) === card);
  check("product without a stored price keeps its object", applyPrice(byId("p6"), mapNow()) === byId("p6"));
  const macaron = applyPriceToDetail(getProductDetail("cikolatali-macaron")!, mapNow());
  check("product page: basePrice 49.9, related products priced too", macaron.basePrice === 49.9 && macaron.priceValue === 49.9 && macaron.relatedProducts.every((p) => p.id !== "p5" || p.priceValue === 49.9));

  console.log("\n── every size is changed on its own (D20) ──");
  await prices.set("p1", 1100, "8-10");
  check("p1 8–10 -> 1100: 4–6 stays 780, 12–15 stays 1450", sizesText("p1") === "780/1100/1450", sizesText("p1"));
  check("card stays ₺780 (smallest size untouched)", cardOf("p1", mapNow()) === "780 ₺780");
  const p1Page = applyPriceToDetail(getProductDetail(slugOf("p1"))!, mapNow());
  check("product page sizes 780 / 1100 / 1450, card price 780", p1Page.variants.map((v) => v.price).join("/") === "780/1100/1450" && p1Page.cardPrice === 780);
  await prices.set("p1", 800, "4-6");
  check("p1 4–6 -> 800: card ₺800; 8–10 still 1100, 12–15 still 1450", cardOf("p1", mapNow()) === "800 ₺800" && sizesText("p1") === "800/1100/1450");
  await prices.set("p13", 540, "12");
  check("p13 12'li -> 540: 6'lı 260, 24'lü 990; card stays ₺260 without an old price", sizesText("p13") === "260/540/990" && cardOf("p13", mapNow()) === "260 ₺260" && !showsOldPrice(applyPrice(byId("p13"), mapNow())));
  const trufPage = applyPriceToDetail(getProductDetail(slugOf("p13"))!, mapNow());
  check("product page 12'li: ₺540 with ₺580 still struck through (above the price)", trufPage.variants[1].price === 540 && shownOld(trufPage.variants[1]));
  check("p14 (also 6 / 12 / 24) unchanged: 450/890/1690", sizesText("p14") === "450/890/1690");
  check("other products untouched", Object.keys(START).filter((id) => id !== "p1" && id !== "p13").every((id) => sizesText(id) === START[id]));

  console.log("\n── rows that are not a price of the product are ignored (never half-applied) ──");
  await prices.set("p8", 999); // '' row of a product with sizes
  await prices.set("p5", 1, "6"); // a size row on a single-price product
  await prices.set("p1", 5, "99"); // unknown size
  check("p8 sizes 230/420/610, card 230; p5 still 49.90; p1 800/1100/1450", sizesText("p8") === "230/420/610" && cardOf("p8", mapNow()) === "230 ₺230" && effectivePriceValue(byId("p5"), priceRowsForCalculation()!) === 49.9 && sizesText("p1") === "800/1100/1450");
  check("display map holds only real prices", Object.keys(mapNow()).sort().join(" ") === ["p5|", "p1|4-6", "p1|8-10", "p13|12"].sort().join(" "), Object.keys(mapNow()).join(" "));
  await prices.set("p18", 250); // single price with an old price (D18)
  check("p18's stored 250 applies (card 250, old ₺290 still shown)", effectivePriceValue(byId("p18"), priceRowsForCalculation()!) === 250 && showsOldPrice(applyPrice(byId("p18"), mapNow())));

  console.log("\n── every price on the customer screens = the price the order is charged ──");
  const rows = priceRowsForCalculation()!;
  const map = mapNow();
  const mismatches: string[] = [];
  for (const p of catalogProducts) {
    const cardP = applyPrice(p, map);
    const sizes = productSizes(p);
    if (sizes.length === 0) {
      const charged = effectiveUnitPrice(p, null, rows); // cart re-pricing, quote and order use this
      if (cardP.cardPrice !== charged || cardP.priceValue !== charged) mismatches.push(p.id);
      continue;
    }
    const page = applyPriceToDetail(getProductDetail(p.slug)!, map).variants; // product page
    const chips = pricedSizes(p.id, sizes, map); // quick order
    for (const s of sizes) {
      const charged = effectiveUnitPrice(p, s.id, rows);
      if (page.find((v) => v.id === s.id)?.price !== charged || chips.find((v) => v.id === s.id)?.price !== charged) mismatches.push(`${p.id}|${s.id}`);
    }
    if (cardP.cardPrice !== effectiveUnitPrice(p, sizes[0].id, rows)) mismatches.push(`${p.id} card`);
  }
  check("47 prices: card / product page / quick order = cart / quote / order", mismatches.length === 0, mismatches.join(" "));

  console.log("\n── the order is priced from the price store (browser prices ignored) ──");
  const pickup = buildOrderPayload(
    {
      customer,
      items: [
        { productSlug: "cikolatali-macaron", quantity: 2, unitPrice: 1 },
        { productSlug: "tiramisu-shot", quantity: 1, unitPrice: 1 },
        { productSlug: "tereyagli-bademli-kurabiye", variantId: "1kg", quantity: 1, unitPrice: 1 },
        { productSlug: slugOf("p13"), variantId: "12", quantity: 1, unitPrice: 520 },
        { productSlug: slugOf("p13"), variantId: "6", quantity: 1, unitPrice: 1 },
      ],
      delivery: incekPickup,
    },
    { now: NOW },
  );
  check("pickup İncek accepted", pickup.ok, reasonOf(pickup));
  check(
    "lines: p5 49.90, p6 95 (catalog), p8 1 kg 420 (catalog), p13 12'li 540, p13 6'lı 260 (catalog)",
    unitOf(pickup, 0) === 49.9 && unitOf(pickup, 1) === 95 && unitOf(pickup, 2) === 420 && unitOf(pickup, 3) === 540 && unitOf(pickup, 4) === 260,
    linesOf(pickup).map((l) => l.unit_price).join(" "),
  );
  check("size id and label kept on the line (12 / 12'li)", linesOf(pickup)[3]?.variant_id === "12" && linesOf(pickup)[3]?.variant_label === "12'li");
  check("subtotal = total = 99.80 + 95 + 420 + 540 + 260 = 1414.80", pickup.ok && pickup.payload.subtotal === 1414.8 && pickup.payload.total === 1414.8, pickup.ok ? String(pickup.payload.total) : "");
  const q = pickup.ok ? quoteFromPayload(pickup.payload, pickup.deliveryFeeState) : null;
  check("payment-screen quote shows the same lines and total", q?.lines[0].unitPrice === 49.9 && q?.lines[0].lineTotal === 99.8 && q?.lines[3].unitPrice === 540 && q?.lines[3].variantLabel === "12'li" && q?.total === 1414.8);
  const cake = buildOrderPayload({ customer, items: [{ productSlug: slugOf("p1"), variantId: "8-10", quantity: 1, unitPrice: 1 }], delivery: { type: "pickup", branchSlug: "gop", date: LATER, timeSlot: "16:00 – 17:00" } }, { now: NOW });
  check("p1 8–10 (stored 1100) for Thursday at GOP -> 1100", cake.ok && unitOf(cake, 0) === 1100, reasonOf(cake));
  const noSize = buildOrderPayload({ customer, items: [{ productSlug: slugOf("p13"), quantity: 1 }], delivery: incekPickup }, { now: NOW });
  check("a product with sizes without a size -> 400 'Ürün için bir boyut seçin.'", !noSize.ok && noSize.status === 400 && noSize.error === "Ürün için bir boyut seçin.", reasonOf(noSize));
  const sizeOnSingle = buildOrderPayload({ customer, items: [{ productSlug: "cikolatali-macaron", variantId: "6", quantity: 1 }], delivery: incekPickup }, { now: NOW });
  const unknown = buildOrderPayload({ customer, items: [{ productSlug: "yok-boyle-urun", quantity: 1 }], delivery: incekPickup }, { now: NOW });
  const badSize = buildOrderPayload({ customer, items: [{ productSlug: "tereyagli-bademli-kurabiye", variantId: "7kg", quantity: 1 }], delivery: incekPickup }, { now: NOW });
  check("size on a single-price product, unknown product, unknown size -> 400", [sizeOnSingle, unknown, badSize].every((b) => !b.ok && b.status === 400), [sizeOnSingle, unknown, badSize].map(reasonOf).join(" / "));

  console.log("\n── branch stock and delivery rules unchanged by prices ──");
  const notAtIncek = buildOrderPayload({ customer, items: [{ productSlug: slugOf("p3"), variantId: "4-6", quantity: 1 }], delivery: incekPickup }, { now: NOW });
  check("p3 (not sold at İncek) with a valid size -> 409 PRODUCT_DISABLED_AT_BRANCH", !notAtIncek.ok && notAtIncek.status === 409 && notAtIncek.reason === "PRODUCT_DISABLED_AT_BRANCH", reasonOf(notAtIncek));
  const passive = buildOrderPayload({ customer, items: [{ productSlug: "tereyagli-bademli-kurabiye", variantId: "500g", quantity: 1 }], delivery: { type: "pickup", branchSlug: "gop", date: DAY, timeSlot: "16:00 – 17:00" } }, { now: NOW });
  check("p8 passive at GOP today -> 409 NEXT_DAY_ONLY, whatever its price", !passive.ok && passive.status === 409 && passive.reason === "NEXT_DAY_ONLY", reasonOf(passive));

  console.log("\n── the delivery minimum uses current prices (D14) ──");
  const deliveryOf = (qty: number) =>
    buildOrderPayload(
      { customer, items: [{ productSlug: "cikolatali-macaron", quantity: qty }], delivery: { type: "delivery", branchSlug: "incek", date: DAY, timeSlot: "16:00 – 17:00", address: incekAddress } },
      { now: NOW },
    );
  const at499 = deliveryOf(10); // 10 × 49.90 = 499
  check("10 × 49.90 = 499 -> 409 BELOW_MINIMUM", !at499.ok && at499.reason === "BELOW_MINIMUM", reasonOf(at499));
  await prices.set("p5", 50);
  const at500 = deliveryOf(10);
  check("p5 = 50: 10 × 50 = 500 -> accepted, fee 70, total 570", at500.ok && at500.payload.subtotal === 500 && at500.payload.total === 570, reasonOf(at500));
  const trufDelivery = buildOrderPayload(
    { customer, items: [{ productSlug: slugOf("p13"), variantId: "12", quantity: 1 }], delivery: { type: "delivery", branchSlug: "incek", date: DAY, timeSlot: "16:00 – 17:00", address: incekAddress } },
    { now: NOW },
  );
  check("12'li at 540 alone reaches the 500 minimum: 540 + 70 = 610", trufDelivery.ok && trufDelivery.payload.total === 610, reasonOf(trufDelivery));

  console.log("\n── placed orders keep their prices ──");
  const toPlace = buildOrderPayload(
    {
      customer,
      items: [
        { productSlug: "cikolatali-macaron", quantity: 10 },
        { productSlug: slugOf("p13"), variantId: "12", quantity: 2 },
      ],
      delivery: { type: "delivery", branchSlug: "incek", date: DAY, timeSlot: "16:00 – 17:00", address: incekAddress },
    },
    { now: NOW },
  );
  check("order: 10 × 50 + 2 × 540 = 1580, fee 70, total 1650", toPlace.ok && toPlace.payload.subtotal === 1580 && toPlace.payload.total === 1650, reasonOf(toPlace));
  const placed = await placeOrder({ ...(toPlace.ok ? toPlace.payload : {}), client_request_id: "verify-prices-1" });
  await prices.set("p5", 52);
  await prices.set("p13", 560, "12");
  const stored = await memoryOrders.get(placed.orderNumber);
  check(
    "after p5 -> 52 and 12'li -> 560 the order keeps 50 / 540 / 1580 / 1650",
    stored?.items[0].unitPrice === 50 && stored?.items[1].unitPrice === 540 && stored?.items[1].variantLabel === "12'li" && stored?.subtotal === 1580 && stored?.total === 1650,
    JSON.stringify(stored?.items.map((i) => [i.unitPrice, i.variantLabel])),
  );
  const retried = await findOrderByRequestId("verify-prices-1");
  check("same request id again -> the same order (still 1650)", retried?.orderNumber === placed.orderNumber && retried?.total === 1650);
  const later = buildOrderPayload(
    { customer, items: [{ productSlug: "cikolatali-macaron", quantity: 10 }, { productSlug: slugOf("p13"), variantId: "12", quantity: 2 }], delivery: { type: "delivery", branchSlug: "incek", date: DAY, timeSlot: "16:00 – 17:00", address: incekAddress } },
    { now: NOW },
  );
  check("a new order is priced 52 / 560: 520 + 1120 + 70 = 1710", later.ok && unitOf(later, 0) === 52 && unitOf(later, 1) === 560 && later.payload.total === 1710, reasonOf(later));

  console.log("\n── prices unreadable: no order or quote; display keeps the last good read ──");
  await prices.fail(true);
  const down = deliveryOf(10);
  check("buildOrderPayload -> 503, the prices message", !down.ok && down.status === 503 && down.error === PRICES_UNAVAILABLE_ERROR, reasonOf(down));
  check("calculation rows null; display rows still p5 = 52, 12'li = 560", priceRowsForCalculation() === null && mapNow()["p5|"] === 52 && mapNow()["p13|12"] === 560);
  await prices.fail(false);
  check("readable again -> priced", deliveryOf(10).ok);

  console.log("\n── 0009 not applied: no stored price can exist -> catalog prices, saving refused upstream ──");
  await prices.missingTable(true);
  const noTable = buildOrderPayload(
    { customer, items: [{ productSlug: "cikolatali-macaron", quantity: 12 }, { productSlug: slugOf("p13"), variantId: "12", quantity: 1 }], delivery: incekPickup },
    { now: NOW },
  );
  check("table missing flagged; orders priced at the catalog (p5 45, 12'li 520)", productPriceTableMissing() && noTable.ok && unitOf(noTable, 0) === 45 && unitOf(noTable, 1) === 520, reasonOf(noTable));
  await prices.missingTable(false);

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
