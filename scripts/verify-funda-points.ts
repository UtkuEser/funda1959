/* eslint-disable no-console */
/**
 * Manual domain check — run with:  npx tsx scripts/verify-funda-points.ts
 * Not part of the build. Exercises the Funda Puan core end to end: earning,
 * online-only eligibility, idempotency, redemption, refund reversal, admin
 * adjustment, and the SUPER_ADMIN access boundary.
 */

import type { StoredOrder } from "@/lib/orders/repository";
import {
  awardPointsForOrder,
  reversePointsForOrder,
  adjustPoints,
  redeemPoints,
  calculateEarnedPoints,
  getEligibleFundaPointAmount,
  getPointAccount,
  resolveCustomerId,
  listPointAccountsForAdmin,
  FundaPointsAccessError,
} from "@/lib/funda-points";

let failures = 0;
function check(label: string, cond: boolean) {
  console.log(`${cond ? "  ok  " : " FAIL "} ${label}`);
  if (!cond) failures += 1;
}

let seq = 0;
function nextPhone(): string {
  seq += 1;
  return `0555 000 ${String(seq).padStart(4, "0")}`;
}

function makeOrder(overrides: Partial<StoredOrder> & { phone?: string }): StoredOrder {
  seq += 1;
  const orderNumber = overrides.orderNumber ?? `FND-TEST-${String(seq).padStart(4, "0")}`;
  const phone = overrides.phone ?? nextPhone();
  return {
    id: overrides.id ?? `ord_${orderNumber}`,
    orderNumber,
    branchId: "gop",
    deliveryZoneId: null,
    fulfillmentType: "delivery",
    salesChannel: overrides.salesChannel,
    customer: overrides.customer ?? { fullName: "Test Müşteri", phone, email: "test@example.com" },
    address: null,
    items: [],
    deliveryDate: "2026-09-15",
    deliverySlot: "12:00-14:00",
    subtotal: overrides.subtotal ?? 1000,
    deliveryFee: overrides.deliveryFee ?? 50,
    discount: overrides.discount ?? 0,
    total: overrides.total ?? 1000,
    paymentStatus: "paid",
    orderStatus: "new",
    reservationId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function main() {
  console.log("\n── earn rate math ──");
  check("₺1000 eligible -> 100 puan", calculateEarnedPoints(1000) === 100);
  check("₺800 (discount sonrası) eligible -> 80 puan", calculateEarnedPoints(800) === 80);
  check("₺785 eligible -> floors to 78 puan", calculateEarnedPoints(785) === 78);

  console.log("\n── eligible amount excludes delivery fee ──");
  const eligibleNoDiscount = getEligibleFundaPointAmount({ subtotal: 1000, discount: 0 });
  const eligibleWithDiscount = getEligibleFundaPointAmount({ subtotal: 1000, discount: 200 });
  check("no discount -> eligible 1000 (delivery fee never enters the calc)", eligibleNoDiscount === 1000);
  check("₺200 discount -> eligible 800", eligibleWithDiscount === 800);
  check("discount-derived eligible -> 80 puan", calculateEarnedPoints(eligibleWithDiscount) === 80);

  console.log("\n── sales channel eligibility ──");
  const storeOrder = makeOrder({ salesChannel: "store", subtotal: 1000 });
  const storeResult = awardPointsForOrder(storeOrder);
  check("store order does not earn points", storeResult.awarded === false && storeResult.reason === "OFFLINE_CHANNEL");

  const webOrder = makeOrder({ salesChannel: "web", subtotal: 1000 });
  const webResult = awardPointsForOrder(webOrder);
  check("web order earns points", webResult.awarded === true);
  check("web order earns 100 points", webResult.awarded === true && webResult.transaction.points === 100);

  const mobileOrder = makeOrder({ salesChannel: "mobile", subtotal: 500 });
  const mobileResult = awardPointsForOrder(mobileOrder);
  check("mobile order earns points", mobileResult.awarded === true);

  console.log("\n── idempotency ──");
  const dupeResult = awardPointsForOrder(webOrder);
  check(
    "re-awarding the same order does not duplicate",
    dupeResult.awarded === false && dupeResult.reason === "ALREADY_AWARDED",
  );
  const accountAfterDupe = getPointAccount(resolveCustomerId(webOrder.customer)!);
  check("balance unaffected by the duplicate attempt", accountAfterDupe?.balance === 100);

  console.log("\n── redeem ──");
  const redeemCustomerId = resolveCustomerId(webOrder.customer)!;
  const redeemOk = redeemPoints({ customerId: redeemCustomerId, points: 40, salesChannel: "web" });
  check("redeem lowers the balance", redeemOk.ok === true);
  const afterRedeem = getPointAccount(redeemCustomerId);
  check("balance is 100 - 40 = 60 after redeem", afterRedeem?.balance === 60);

  const overRedeem = redeemPoints({ customerId: redeemCustomerId, points: 1000, salesChannel: "web" });
  check("redeeming past the balance is refused", overRedeem.ok === false && overRedeem.reason === "INSUFFICIENT_BALANCE");

  const storeRedeem = redeemPoints({ customerId: redeemCustomerId, points: 10, salesChannel: "store" });
  check("store-channel redemption is refused", storeRedeem.ok === false && storeRedeem.reason === "OFFLINE_CHANNEL");

  console.log("\n── refund reversal ──");
  const reversalOrder = makeOrder({ salesChannel: "web", subtotal: 1200 });
  awardPointsForOrder(reversalOrder);
  const reversalCustomerId = resolveCustomerId(reversalOrder.customer)!;
  const beforeReversal = getPointAccount(reversalCustomerId);
  const reversal = reversePointsForOrder(reversalOrder.id);
  const afterReversal = getPointAccount(reversalCustomerId);
  check("reversal succeeds", reversal.reversed === true);
  check(
    "reversal removes exactly what was earned",
    !!beforeReversal && !!afterReversal && afterReversal.balance === beforeReversal.balance - 120,
  );
  const secondReversal = reversePointsForOrder(reversalOrder.id);
  check("re-reversing the same order is a no-op", secondReversal.reversed === false && secondReversal.reason === "ALREADY_REVERSED");

  console.log("\n── admin adjustment ──");
  const adjustCustomerId = resolveCustomerId(webOrder.customer)!;
  const beforeAdjust = getPointAccount(adjustCustomerId)!.balance;
  const adjustment = adjustPoints({
    customerId: adjustCustomerId,
    direction: "add",
    points: 25,
    description: "Merkez müşteri hizmetleri düzeltmesi",
  });
  check("admin adjustment creates a ledger transaction", adjustment.ok === true && adjustment.transaction.type === "ADMIN_ADJUSTMENT");
  const afterAdjust = getPointAccount(adjustCustomerId)!.balance;
  check("admin adjustment applies the delta", afterAdjust === beforeAdjust + 25);

  const overSubtract = adjustPoints({
    customerId: adjustCustomerId,
    direction: "subtract",
    points: 100_000,
    description: "test",
  });
  check("admin adjustment cannot push balance negative", overSubtract.ok === false && overSubtract.reason === "INSUFFICIENT_BALANCE");

  console.log("\n── SUPER_ADMIN access boundary ──");
  let managerThrew = false;
  try {
    listPointAccountsForAdmin("BRANCH_MANAGER");
  } catch (err) {
    managerThrew = err instanceof FundaPointsAccessError;
  }
  check("manager:gop cannot read Funda Puan data", managerThrew);

  let superOk = false;
  try {
    const rows = listPointAccountsForAdmin("SUPER_ADMIN");
    superOk = Array.isArray(rows) && rows.length > 0;
  } catch {
    superOk = false;
  }
  check("super admin can read Funda Puan data", superOk);

  console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
