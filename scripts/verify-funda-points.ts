/**
 * Funda Puan — app-side check (Aşama 6). Run with:
 *   npx tsx scripts/verify-funda-points.ts
 * Not part of the build. NO real Supabase: parts 1–2 run in memory, part 3
 * answers every request from an in-process mock (any other host fails).
 *
 * The ledger rules themselves (lots, 1-year expiry, FEFO, reservation,
 * release, refund, reversal, debt, idempotency) live in SQL and are tested
 * by supabase/tests/0011_funda_points_test.sql. This script checks what the
 * app adds around them: the arithmetic shown on screens, the off switch,
 * the order's server-side point checks, and that every database call takes
 * the member / admin from the server — never from the request.
 */
import { buildOrderPayload, quoteFromPayload } from "@/lib/order-server";
import {
  calculateEarnedPoints,
  getEligibleFundaPointAmount,
  isFundaPointsActive,
  isOnlineSalesChannel,
  maxRedeemablePoints,
  FUNDA_POINTS_RULES,
} from "@/lib/funda-points";
import { getFundaPointsStore, FundaPointsNotReadyError } from "@/lib/funda-points/store";
import {
  adjustFundaPointsAsAdmin,
  FundaPointsAccessError,
  getCheckoutPoints,
  getFundaPointsAdminPage,
  getMemberPointsSummary,
  searchFundaPointsMembers,
} from "@/lib/funda-points/service";
import type { AdminScope } from "@/lib/admin/access";
import { DataEnvironmentError } from "@/lib/supabase-server";
import { requireTestEnvironmentForWrites } from "./test-environment-guard";
import { installMemoryFeeStore } from "./test-fee-store";
import { installMemoryPriceStore } from "./test-price-store";

let failures = 0;
let passes = 0;
function check(label: string, cond: boolean, detail = "") {
  console.log(`${cond ? "  ok  " : " FAIL "} ${label}${cond || !detail ? "" : `  -> ${detail}`}`);
  if (cond) passes += 1;
  else failures += 1;
}

const at = (iso: string) => new Date(`${iso}+03:00`);
const NOW = at("2026-10-12T11:00:00");
const TODAY = "2026-10-12";
const customer = { fullName: "Puan Test Üye", phone: "0555 123 45 67", email: "puan@example.com" };
const MEMBER = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";
const incek = { district: "Gölbaşı", neighborhood: "İncek", addressLine: "TONA Residence B blok 12" };
const macaron = (quantity: number) => ({ productSlug: "cikolatali-macaron", quantity });
const pickup = (extra: Record<string, unknown> = {}) => ({
  customer,
  items: [macaron(2)],
  delivery: { type: "pickup", branchSlug: "gop", date: TODAY, timeSlot: "16:00 – 17:00" },
  ...extra,
});
const ON = (available: number | null) => ({ active: true, available });

async function partRules() {
  console.log("\n── 1. rules (D9, D33, D36) ──");
  check("1 puan = 1 TL", FUNDA_POINTS_RULES.pointValueTL === 1);
  check("earning and spending are switched OFF until the payment integration", isFundaPointsActive() === false);
  const base = getEligibleFundaPointAmount({ subtotal: 1000, discount: 0, pointsRedeemed: 200 });
  check("1.000 TL products, 200 points used -> 800 TL earns", base === 800);
  check("…80 points (the agreed example)", calculateEarnedPoints(base) === 80);
  check("discount comes off first: 1.000 − 200 discount -> 80", calculateEarnedPoints(getEligibleFundaPointAmount({ subtotal: 1000, discount: 200 })) === 80);
  check("floor: 785 TL -> 78", calculateEarnedPoints(785) === 78);
  check("kuruş exact: 598,80 TL -> 59", calculateEarnedPoints(598.8) === 59);
  check("kuruş exact: 0,1 + 0,2 style amounts don't drift (299,99 -> 29)", calculateEarnedPoints(299.99) === 29);
  check("never negative", getEligibleFundaPointAmount({ subtotal: 100, discount: 0, pointsRedeemed: 150 }) === 0 && calculateEarnedPoints(0) === 0);
  check("redeem cap: whole product amount (598,80 -> 598 points)", maxRedeemablePoints({ subtotal: 598.8, discount: 0 }, 10_000) === 598);
  check("redeem cap: the balance (40)", maxRedeemablePoints({ subtotal: 598.8, discount: 0 }, 40) === 40);
  check("redeem cap: after discount (500 − 100 -> 400)", maxRedeemablePoints({ subtotal: 500, discount: 100 }, 10_000) === 400);
  check("store sales never earn / spend", isOnlineSalesChannel("store") === false && isOnlineSalesChannel("web") && isOnlineSalesChannel("mobile"));
}

async function partOrders() {
  console.log("\n── 2. order: server-side point checks (memory stores) ──");
  const fees = installMemoryFeeStore();
  await installMemoryPriceStore().ready;
  await fees.set("zone-incek-golbasi", "paid", 70);

  const plain = buildOrderPayload(pickup(), { now: NOW, customerUserId: MEMBER });
  check("no points asked -> points_redeemed 0, total = products", plain.ok && plain.payload.points_redeemed === 0 && plain.payload.total === 90);
  const off = buildOrderPayload(pickup({ pointsToRedeem: 50 }), { now: NOW, customerUserId: MEMBER });
  check("points OFF: a request for points -> 409 POINTS_DISABLED (no balance read needed)", !off.ok && off.status === 409 && off.code === "POINTS_DISABLED");
  for (const bad of [-5, 1.5, "abc", 2_000_000]) {
    const r = buildOrderPayload(pickup({ pointsToRedeem: bad }), { now: NOW, customerUserId: MEMBER, points: ON(1000) });
    check(`invalid points value ${JSON.stringify(bad)} -> 400`, !r.ok && r.status === 400);
  }
  const guest = buildOrderPayload(pickup({ pointsToRedeem: 10 }), { now: NOW, customerUserId: null, points: ON(1000) });
  check("ON: a guest can't use points -> 409", !guest.ok && guest.code === "POINTS_MEMBER_ONLY");
  const all = buildOrderPayload(pickup({ pointsToRedeem: 90 }), { now: NOW, customerUserId: MEMBER, points: ON(1000) });
  check("ON: whole product amount paid with points -> total 0", all.ok && all.payload.points_redeemed === 90 && all.payload.total === 0);
  const over = buildOrderPayload(pickup({ pointsToRedeem: 91 }), { now: NOW, customerUserId: MEMBER, points: ON(1000) });
  check("ON: more than the products -> 409", !over.ok && over.code === "POINTS_EXCEED_PRODUCTS");
  const poor = buildOrderPayload(pickup({ pointsToRedeem: 50 }), { now: NOW, customerUserId: MEMBER, points: ON(40) });
  check("ON: more than the balance -> 409", !poor.ok && poor.code === "POINTS_INSUFFICIENT");
  const unread = buildOrderPayload(pickup({ pointsToRedeem: 10 }), { now: NOW, customerUserId: MEMBER, points: ON(null) });
  check("ON: balance not read -> refused, never assumed", !unread.ok && unread.code === "POINTS_INSUFFICIENT");
  const browserBalance = buildOrderPayload(pickup({ pointsToRedeem: 50, available: 9999, pointsEarned: 500 }), {
    now: NOW,
    customerUserId: MEMBER,
    points: ON(40),
  });
  check("ON: a balance or earning sent by the browser is ignored", !browserBalance.ok && browserBalance.code === "POINTS_INSUFFICIENT");

  // D35: the 500 TL delivery minimum is on products − discount BEFORE points
  const delivery = (quantity: number, pointsToRedeem: number) =>
    buildOrderPayload(
      { customer, items: [macaron(quantity)], delivery: { type: "delivery", date: TODAY, timeSlot: "16:00 – 17:00", address: incek }, pointsToRedeem },
      { now: NOW, customerUserId: MEMBER, points: ON(1000) },
    );
  const d1 = delivery(12, 100); // 540 TL products, 100 points -> 440 TL paid for products
  check("minimum before points: 540 TL products with 100 points passes", d1.ok, d1.ok ? "" : d1.error);
  check("…total = 540 − 100 + 70 fee = 510 (the fee is never paid with points)", d1.ok && d1.payload.total === 510 && d1.payload.delivery_fee === 70);
  check("…quote shows the points line", d1.ok && quoteFromPayload(d1.payload, d1.deliveryFeeState).pointsRedeemed === 100);
  const d2 = delivery(11, 0); // 495 TL
  check("minimum unchanged: 495 TL delivery still refused", !d2.ok && d2.reason === "BELOW_MINIMUM");
  const d3 = delivery(12, 540); // products fully paid, fee still due
  check("whole products with points on delivery -> only the fee is left (70)", d3.ok && d3.payload.total === 70);
}

/* ---- part 3: mock Supabase ---- */
const MOCK = "https://mock-project.supabase.test";
const calls: { path: string; method: string; search: string; body: Record<string, unknown> | null }[] = [];
let marker: "test" | "production" = "test";
let notReady = false;
let adjustError: string | null = null;

const json = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
async function mockFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.origin !== MOCK) throw new Error(`verify-funda-points: unexpected request to ${url.origin}`);
  const body = typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null;
  calls.push({ path: url.pathname, method: init?.method ?? "GET", search: url.search, body });
  if (url.pathname === "/rest/v1/app_environment") return json(200, [{ name: marker }]);
  if (notReady) return json(404, { code: "PGRST202", message: "Could not find the function" });
  const detail = { user_id: body?.p_user_id, full_name: "Puan Test", email: "p@example.com", phone: "0555", available: 30, debt: 0, lots: [], transactions: [] };
  switch (url.pathname) {
    case "/rest/v1/rpc/get_funda_points_summary":
      return json(200, { available: 120, debt: 0, lots: [{ id: "l1", source: "earn", points: 120, remaining: 120, earned_at: "2026-10-01T10:00:00Z", expires_at: "2027-10-01T10:00:00Z", order_number: "FND-1" }], transactions: [] });
    case "/rest/v1/rpc/list_funda_point_accounts":
      return json(200, {
        total: body?.p_search ? 1 : 0,
        overview: { available: 0, debt: 0, earned: 0, spent: 0, members_with_points: 0 },
        rows: body?.p_search
          ? [{ user_id: OTHER, full_name: "Puanlı Üye", email: "puanli@example.com", phone: "0555", available: 40, debt: 0, earned: 40, spent: 0, last_activity: "2026-10-01T10:00:00Z" }]
          : [],
      });
    case "/rest/v1/customer_profiles":
      return json(200, [
        { auth_user_id: OTHER, full_name: "Puanlı Üye", email: "puanli@example.com", phone: "0555" },
        { auth_user_id: MEMBER, full_name: "Puan Test Üye", email: "puan@example.com", phone: "0555 123 45 67" },
      ]);
    case "/rest/v1/rpc/get_funda_points_admin_detail":
      return json(200, detail);
    case "/rest/v1/rpc/adjust_funda_points":
      return adjustError ? json(400, { code: "P0001", message: adjustError }) : json(200, detail);
  }
  return json(404, { message: `mock: no route ${url.pathname}` });
}

const merkez: AdminScope = { user: { name: "Merkez Yönetim", role: "SUPER_ADMIN" }, authorizedBranchIds: null, activeBranchId: null };
const gop: AdminScope = { user: { name: "GOP", role: "BRANCH_MANAGER" }, authorizedBranchIds: ["gop"], activeBranchId: "gop" };
const g = globalThis as unknown as Record<string, unknown>;
const since = (n: number) => calls.slice(n).filter((c) => c.path !== "/rest/v1/app_environment");

async function partStore() {
  console.log("\n── 3. database calls (mock Supabase) ──");
  delete process.env.SUPABASE_URL;
  check("no Supabase: no ledger, writes refused", getFundaPointsStore().kind === "none" && (await getFundaPointsStore().adjust({ userId: MEMBER, direction: "add", points: 1, reason: "abc", requestId: "r" }, { account: "merkez", name: "M" })).ok === false);

  process.env.SUPABASE_URL = MOCK;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role";
  delete process.env.VERCEL_ENV;
  globalThis.fetch = mockFetch as typeof fetch;
  delete g.__fundaEnvMarker;

  let n = calls.length;
  const s = await getMemberPointsSummary(MEMBER);
  const sc = since(n);
  check("member summary: one RPC with the session's id", sc.length === 1 && sc[0].path.endsWith("get_funda_points_summary") && sc[0].body?.p_user_id === MEMBER);
  check("member summary: lots with expiry mapped", s.available === 120 && s.lots[0].expiresAt === "2027-10-01T10:00:00Z");
  n = calls.length;
  const junk = await getMemberPointsSummary("not-a-uuid");
  check("member summary: a malformed id sends nothing", junk.available === 0 && since(n).length === 0);
  n = calls.length;
  check("checkout: points OFF -> nothing offered, no balance read", (await getCheckoutPoints(MEMBER)) === null && since(n).length === 0);

  n = calls.length;
  const adj = await adjustFundaPointsAsAdmin(merkez, { userId: MEMBER, direction: "add", points: 25, reason: "Müşteri hizmetleri düzeltmesi", requestId: "req-1" });
  const ac = since(n)[0];
  check("Merkez correction: RPC adjust_funda_points", adj.ok && ac?.path.endsWith("adjust_funda_points"));
  check("…signed by the session's admin (merkez / Merkez Yönetim), with reason and request id", ac?.body?.p_actor_account === "merkez" && ac.body.p_actor_name === "Merkez Yönetim" && ac.body.p_reason === "Müşteri hizmetleri düzeltmesi" && ac.body.p_request_id === "req-1");
  adjustError = "insufficient_points";
  const poor = await adjustFundaPointsAsAdmin(merkez, { userId: MEMBER, direction: "subtract", points: 999, reason: "Fazla", requestId: "req-2" });
  check("Merkez correction: insufficient balance mapped", !poor.ok && poor.error === "INSUFFICIENT_POINTS");
  adjustError = "reason_required";
  const noReason = await adjustFundaPointsAsAdmin(merkez, { userId: MEMBER, direction: "add", points: 1, reason: "x", requestId: "req-3" });
  check("Merkez correction: missing reason mapped", !noReason.ok && noReason.error === "REASON_REQUIRED");
  adjustError = null;

  n = calls.length;
  let threw = false;
  try {
    await adjustFundaPointsAsAdmin(gop, { userId: MEMBER, direction: "add", points: 5, reason: "Şube", requestId: "req-4" });
  } catch (err) {
    threw = err instanceof FundaPointsAccessError;
  }
  check("branch account: correction refused before any request", threw && since(n).length === 0);
  threw = false;
  try {
    await getFundaPointsAdminPage("BRANCH_MANAGER");
  } catch (err) {
    threw = err instanceof FundaPointsAccessError;
  }
  check("branch account: the points list is refused", threw);
  const page = await getFundaPointsAdminPage("SUPER_ADMIN");
  check("Merkez list: empty database -> empty list (no demo customers)", page.total === 0 && page.rows.length === 0);

  n = calls.length;
  const found = await searchFundaPointsMembers("SUPER_ADMIN", "puan@example.com");
  const fc = since(n);
  const fresh = found.find((r) => r.userId === MEMBER);
  check("Merkez search: a member with no points account is found (0 points, no activity)", !!fresh && fresh.available === 0 && fresh.earned === 0 && fresh.lastActivity === null);
  check("…a member with an account keeps the balance from the ledger, listed once", found.filter((r) => r.userId === OTHER).length === 1 && found.find((r) => r.userId === OTHER)?.available === 40);
  check("…reads only: the list RPC + one GET on customer_profiles, nothing written", fc.length === 2 && fc.every((c) => c.path.endsWith("list_funda_point_accounts") || (c.path.endsWith("customer_profiles") && c.method === "GET")));
  n = calls.length;
  await searchFundaPointsMembers("SUPER_ADMIN", 'a_b%,c)"*');
  const ec = since(n);
  const rpcSearch = ec.find((c) => c.path.endsWith("list_funda_point_accounts"))?.body?.p_search;
  const orFilter = new URLSearchParams(ec.find((c) => c.path.endsWith("customer_profiles"))?.search ?? "").get("or") ?? "";
  check("…search text is escaped: LIKE wildcards literal, PostgREST value quoted", rpcSearch === 'a\\_b\\%,c)"' && orFilter.includes('email.ilike."*a\\\\_b\\\\%,c)\\"*"'), `${String(rpcSearch)} | ${orFilter}`);
  threw = false;
  n = calls.length;
  try {
    await searchFundaPointsMembers("BRANCH_MANAGER", "puan@example.com");
  } catch (err) {
    threw = err instanceof FundaPointsAccessError;
  }
  check("branch account: member search refused before any request", threw && since(n).length === 0);

  notReady = true;
  threw = false;
  try {
    await getMemberPointsSummary(MEMBER);
  } catch (err) {
    threw = err instanceof FundaPointsNotReadyError;
  }
  check("0011 not applied -> 'not ready', never a made-up balance", threw);
  notReady = false;

  marker = "production";
  delete g.__fundaEnvMarker;
  n = calls.length;
  threw = false;
  try {
    await getMemberPointsSummary(MEMBER);
  } catch (err) {
    threw = err instanceof DataEnvironmentError;
  }
  check("wrong project (marker production, local expects test) -> refused, no RPC", threw && since(n).length === 0);
  marker = "test";
}

async function main() {
  await requireTestEnvironmentForWrites("verify-funda-points");
  await partRules();
  await partOrders();
  await partStore();
  console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`} (${passes}/${passes + failures})\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
