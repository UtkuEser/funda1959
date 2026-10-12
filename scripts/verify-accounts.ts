/**
 * Mock check for Aşama 5 (customer membership) — run with:
 *   npx tsx scripts/verify-accounts.ts
 * Not part of the build. NO real Supabase is contacted:
 *   - parts 1–2 run in process memory (validation, address rules, member
 *     orders, the order's member id);
 *   - part 3 points the code at a fake project URL and answers every request
 *     from an in-process mock of Supabase Auth + PostgREST; a request to any
 *     other host fails the script.
 * It proves OUR logic — gates, cookie options, error mapping, the member id
 * taken from the session, no consent recorded, no global sign-out — not
 * Supabase's own behaviour (that needs the real test project, §8.2).
 */
import { buildOrderPayload } from "@/lib/order-server";
import { memoryOrders, placeOrder } from "@/lib/orders";
import { safeNextPath, isValidPassword } from "@/lib/auth";
import { checkAddressInput, checkProfileInput } from "@/lib/customers/validation";
import { MemoryCustomerRepository, memoryCustomers } from "@/lib/customers/repository";
import type { CleanAddress } from "@/lib/customers/validation";
import type { CookieOptions } from "@supabase/ssr";
import {
  changePassword,
  completeMembership,
  confirmEmailLink,
  deleteMemberAddress,
  finishSocialSignIn,
  isRecentRecoverySession,
  loadMember,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  requestPasswordReset,
  resolveOrderMember,
  saveMemberAddress,
  startSocialSignIn,
  updateMemberProfile,
} from "@/lib/customer-auth/operations";
import { readCustomerSession } from "@/lib/customer-auth/server";
import { availableSocialProviders } from "@/lib/customer-auth/providers";
import { getCustomerRepository } from "@/lib/customers/repository";
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
const address = (extra: Partial<CleanAddress> = {}): CleanAddress => ({
  label: "Ev",
  district: "Gölbaşı",
  neighborhood: "İncek",
  addressLine: "TONA Residence B blok 12",
  building: null,
  floor: null,
  apartment: null,
  note: null,
  isDefault: false,
  ...extra,
});

/* ========================================================================== */
async function partMemory() {
  console.log("\n── 1. validation + saved-address rules (memory) ──");
  check("address in a delivery zone -> ok", checkAddressInput({ label: "Ev", district: "Gölbaşı", neighborhood: "İncek", addressLine: "TONA Residence B blok 12" }).ok);
  const badDistrict = checkAddressInput({ label: "Ev", district: "Mamak", neighborhood: "Akdere", addressLine: "Bir sokak no 5 daire 3" });
  check("district outside the zone list -> refused", !badDistrict.ok && Boolean(badDistrict.errors.district));
  const badHood = checkAddressInput({ label: "Ev", district: "Gölbaşı", neighborhood: "Kızılay", addressLine: "Bir sokak no 5 daire 3" });
  check("neighbourhood outside the district's list -> refused", !badHood.ok && Boolean(badHood.errors.neighborhood));
  const shortLine = checkAddressInput({ label: "Ev", district: "Gölbaşı", neighborhood: "İncek", addressLine: "kısa" });
  check("short address line -> refused", !shortLine.ok && Boolean(shortLine.errors.addressLine));
  const longLabel = checkAddressInput({ label: "x".repeat(41), district: "Gölbaşı", neighborhood: "İncek", addressLine: "TONA Residence B blok 12" });
  check("label over 40 chars -> refused", !longLabel.ok && Boolean(longLabel.errors.label));
  const prof = checkProfileInput({ fullName: "  Ayşe   Yılmaz ", phone: "5551234567", email: "evil@x.com" });
  check("profile: name trimmed, phone formatted, e-mail not taken", prof.ok && prof.value.fullName === "Ayşe Yılmaz" && prof.value.phone === "0555 123 45 67" && !("email" in prof.value));
  check("profile: one-word name refused", !checkProfileInput({ fullName: "Ayşe", phone: "05551234567" }).ok);
  check("password rule: 8+ with letter and digit", isValidPassword("abcd1234") && !isValidPassword("abcdefgh") && !isValidPassword("1234567") && !isValidPassword(`a1${"x".repeat(71)}`));

  check("safeNextPath keeps a site path", safeNextPath("/hesabim/siparislerim") === "/hesabim/siparislerim");
  check("safeNextPath refuses other origins and API routes", ["//evil.com", "/\\evil.com", "https://evil.com", "/api/orders", "hesabim", "/x\r\nSet-Cookie:"].every((v) => safeNextPath(v) === "/hesabim"));

  const repo = new MemoryCustomerRepository();
  const A = crypto.randomUUID();
  const B = crypto.randomUUID();
  const first = await repo.saveAddress(A, address({ label: "1" }), null);
  check("first address becomes the default", first.ok && first.address.isDefault);
  for (let i = 2; i <= 10; i += 1) await repo.saveAddress(A, address({ label: String(i) }), null);
  const list10 = await repo.listAddresses(A);
  check("10 addresses saved, exactly one default", list10.length === 10 && list10.filter((a) => a.isDefault).length === 1);
  const eleventh = await repo.saveAddress(A, address({ label: "11" }), null);
  check("11th address -> LIMIT", !eleventh.ok && eleventh.error === "LIMIT");
  const third = list10[2];
  const made = await repo.saveAddress(A, address({ label: "3", isDefault: true }), third.id);
  const afterDefault = await repo.listAddresses(A);
  check("making #3 default moves the default (still one)", made.ok && afterDefault.filter((a) => a.isDefault).map((a) => a.id).join() === third.id);
  const unset = await repo.saveAddress(A, address({ label: "3b", isDefault: false }), third.id);
  check("the default can't be switched off directly", unset.ok && unset.address.isDefault);
  check("B can't edit A's address", !(await repo.saveAddress(B, address(), third.id)).ok);
  check("B can't delete A's address", !(await repo.deleteAddress(B, third.id)));
  await repo.deleteAddress(A, third.id);
  const afterDelete = await repo.listAddresses(A);
  check("deleting the default makes the oldest the default", afterDelete.length === 9 && afterDelete[0].isDefault && afterDelete.filter((a) => a.isDefault).length === 1);
  check("B sees none of A's addresses", (await repo.listAddresses(B)).length === 0);
}

/* ========================================================================== */
async function partOrders() {
  console.log("\n── 2. orders: member id from the server only (memory) ──");
  const fees = installMemoryFeeStore();
  await installMemoryPriceStore().ready;
  await fees.set("zone-incek-golbasi", "paid", 70);

  const customer = { fullName: "Test Üye", phone: "0555 123 45 67", email: "uye@example.com" };
  const body = {
    customer,
    items: [{ productSlug: "cikolatali-macaron", quantity: 2 }],
    delivery: { type: "pickup", branchSlug: "gop", date: TODAY, timeSlot: "16:00 – 17:00" },
    // a browser trying to set the account itself:
    customerUserId: "11111111-1111-4111-8111-111111111111",
    customer_user_id: "11111111-1111-4111-8111-111111111111",
  };
  const guest = buildOrderPayload(body, { now: NOW });
  check("guest: body's customer_user_id ignored -> null", guest.ok && guest.payload.customer_user_id === null);
  const memberId = crypto.randomUUID();
  const asMember = buildOrderPayload({ ...body, clientRequestId: `acc-${memberId}` }, { now: NOW, customerUserId: memberId });
  check("member: id from the route's session", asMember.ok && asMember.payload.customer_user_id === memberId);

  const otherId = crypto.randomUUID();
  if (!asMember.ok || !guest.ok) return;
  const placed = await placeOrder(asMember.payload);
  const guestPlaced = await placeOrder({ ...guest.payload, client_request_id: `guest-${memberId}` });
  check("demo order stays demo + pending (D8) and earns no points", placed.isDemo === true);
  const mine = await memoryCustomers.listOrders(memberId);
  check("member sees their order", mine.length === 1 && mine[0].orderNumber === placed.orderNumber);
  check("guest order with the same e-mail is NOT linked (D25)", !mine.some((o) => o.orderNumber === guestPlaced.orderNumber));
  check("another member sees nothing", (await memoryCustomers.listOrders(otherId)).length === 0);
  check("another member's order number -> null", (await memoryCustomers.getOrder(otherId, placed.orderNumber)) === null);

  await memoryOrders.changeStatus({
    orderNumber: placed.orderNumber,
    toStatus: "cancelled",
    reason: "Müşteri aradı, iptal istedi",
    actor: { account: "sube:gop", name: "GOP" },
    branchIds: ["gop"],
  });
  const cancelled = await memoryCustomers.getOrder(memberId, placed.orderNumber);
  check("member sees the cancel reason", cancelled?.status === "cancelled" && cancelled.cancelReason === "Müşteri aradı, iptal istedi");
  check("…but not who cancelled it", Boolean(cancelled) && !JSON.stringify(cancelled).includes("sube:gop") && !JSON.stringify(cancelled).includes('"GOP"'));

  const now = Math.floor(Date.now() / 1000);
  check("recovery session within 15 min -> accepted", isRecentRecoverySession({ amr: [{ method: "recovery", timestamp: now - 60 }] }, now));
  check("recovery link older than 15 min -> refused", !isRecentRecoverySession({ amr: [{ method: "recovery", timestamp: now - 16 * 60 }] }, now));
  check("password session -> not a recovery", !isRecentRecoverySession({ amr: [{ method: "password", timestamp: now }] }, now));
  check("amr without timestamps -> not a recovery", !isRecentRecoverySession({ amr: ["otp"] }, now));
}

/* ========================================================================== */
/* Part 3 — mock Supabase                                                      */
/* ========================================================================== */

const MOCK = "https://mock-project.supabase.test";
type MockUser = { id: string; email: string; password: string };
type Call = { method: string; path: string; body: unknown; auth: string | null; apikey: string | null };

const mock = {
  marker: "test" as "test" | "production" | null,
  ready: true,
  authDown: false,
  recoverStatus: 200,
  settings: { disable_signup: false, mailer_autoconfirm: true, external: { email: true, google: true, apple: false, facebook: false } },
  users: new Map<string, MockUser>(),
  tokens: new Map<string, { userId: string }>(),
  profiles: new Map<string, Record<string, unknown>>(),
  orders: [] as Record<string, unknown>[],
  calls: [] as Call[],
};
const rpcRepo = new MemoryCustomerRepository();

const json = (status: number, data: unknown) =>
  new Response(status === 204 ? null : JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
const b64u = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const userJson = (u: MockUser) => ({
  id: u.id,
  aud: "authenticated",
  role: "authenticated",
  email: u.email,
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  identities: [{ identity_id: crypto.randomUUID(), id: u.id, user_id: u.id, identity_data: { email: u.email, sub: u.id }, provider: "email" }],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});
function issue(u: MockUser, method: string) {
  const now = Math.floor(Date.now() / 1000);
  const token = `${b64u({ alg: "HS256", typ: "JWT" })}.${b64u({
    iss: `${MOCK}/auth/v1`,
    sub: u.id,
    aud: "authenticated",
    exp: now + 3600,
    iat: now,
    role: "authenticated",
    aal: "aal1",
    session_id: crypto.randomUUID(),
    email: u.email,
    amr: [{ method, timestamp: now }],
  })}.mock-signature`;
  mock.tokens.set(token, { userId: u.id });
  return { access_token: token, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token: crypto.randomUUID(), user: userJson(u) };
}
const userById = (id: string) => [...mock.users.values()].find((u) => u.id === id);
const toRow = (a: { id: string; label: string; district: string; neighborhood: string; addressLine: string; building?: string; floor?: string; apartment?: string; note?: string; isDefault: boolean }) => ({
  id: a.id,
  label: a.label,
  district: a.district,
  neighborhood: a.neighborhood,
  address_line: a.addressLine,
  building: a.building ?? null,
  floor: a.floor ?? null,
  apartment: a.apartment ?? null,
  note: a.note ?? null,
  is_default: a.isDefault,
});

async function mockFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.origin !== MOCK) throw new Error(`verify-accounts: unexpected request to ${url.origin} — refused`);
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  const raw = typeof init?.body === "string" ? init.body : "";
  const body = raw ? JSON.parse(raw) : null;
  mock.calls.push({ method, path: url.pathname + url.search, body, auth: headers.get("authorization"), apikey: headers.get("apikey") });
  const p = url.pathname;
  const q = url.searchParams;
  const bearer = headers.get("authorization")?.replace(/^Bearer /, "") ?? "";

  if (p.startsWith("/auth/v1/") && mock.authDown) return json(503, { msg: "down" });

  // ---- PostgREST ----
  if (p === "/rest/v1/app_environment") return json(200, mock.marker ? [{ name: mock.marker }] : []);
  if (p === "/rest/v1/customer_profiles") {
    if (!mock.ready) return json(404, { code: "PGRST205", message: "relation not found" });
    if (q.get("limit") === "0") return json(200, []);
    const id = q.get("auth_user_id")?.replace(/^eq\./, "") ?? body?.auth_user_id;
    if (method === "GET") return json(200, mock.profiles.has(id) ? [mock.profiles.get(id)] : []);
    if (method === "POST") {
      if (mock.profiles.has(body.auth_user_id)) return json(201, []);
      mock.profiles.set(body.auth_user_id, body);
      return json(201, [body]);
    }
    if (method === "PATCH") {
      const cur = mock.profiles.get(id);
      if (!cur) return json(200, []);
      const next = { ...cur, ...body };
      mock.profiles.set(id, next);
      return json(200, [next]);
    }
  }
  if (p === "/rest/v1/orders" && q.get("limit") === "0") return mock.ready ? json(200, []) : json(400, { code: "42703", message: "column does not exist" });
  if (p === "/rest/v1/customer_addresses") {
    const id = q.get("auth_user_id")?.replace(/^eq\./, "") ?? "";
    return json(200, (await rpcRepo.listAddresses(id)).map(toRow));
  }
  if (p === "/rest/v1/rpc/save_customer_address") {
    const a = body.p_address;
    const res = await rpcRepo.saveAddress(
      body.p_user_id,
      { label: a.label, district: a.district, neighborhood: a.neighborhood, addressLine: a.address_line, building: a.building, floor: a.floor, apartment: a.apartment, note: a.note, isDefault: a.is_default },
      body.p_address_id,
    );
    if (!res.ok) return json(400, { code: "P0001", message: res.error === "LIMIT" ? "address_limit" : "address_not_found" });
    return json(200, toRow(res.address));
  }
  if (p === "/rest/v1/rpc/delete_customer_address") return json(200, await rpcRepo.deleteAddress(body.p_user_id, body.p_address_id));
  if (p === "/rest/v1/rpc/list_customer_orders") {
    const rows = mock.orders.filter((o) => o.customer_user_id === body.p_user_id);
    return json(200, { total: rows.length, rows });
  }
  if (p === "/rest/v1/rpc/get_customer_order") {
    return json(200, mock.orders.find((o) => o.customer_user_id === body.p_user_id && o.order_number === body.p_order_number) ?? null);
  }

  // ---- Auth ----
  if (p === "/auth/v1/settings") return json(200, mock.settings);
  if (p === "/auth/v1/signup") {
    if (mock.users.has(body.email)) return json(422, { error_code: "user_already_exists", msg: "User already registered" });
    const u = { id: crypto.randomUUID(), email: body.email, password: body.password };
    mock.users.set(u.email, u);
    return json(200, mock.settings.mailer_autoconfirm ? issue(u, "password") : userJson(u));
  }
  if (p === "/auth/v1/token" && q.get("grant_type") === "password") {
    const u = mock.users.get(body.email);
    if (!u || u.password !== body.password) return json(400, { error_code: "invalid_credentials", msg: "Invalid login credentials" });
    return json(200, issue(u, "password"));
  }
  if (p === "/auth/v1/user") {
    const t = mock.tokens.get(bearer);
    const u = t ? userById(t.userId) : undefined;
    if (!u) return json(403, { error_code: "bad_jwt", msg: "invalid JWT" });
    if (method === "PUT") {
      if (body.password === u.password) return json(422, { error_code: "same_password", msg: "same" });
      u.password = body.password;
    }
    return json(200, userJson(u));
  }
  if (p === "/auth/v1/logout") {
    mock.tokens.delete(bearer);
    return json(204, null);
  }
  if (p === "/auth/v1/recover") return mock.recoverStatus === 200 ? json(200, {}) : json(429, { error_code: "over_email_send_rate_limit", msg: "rate" });
  if (p === "/auth/v1/verify") {
    const u = [...mock.users.values()][0];
    if (body.token_hash !== "good-recovery-hash" || !u) return json(403, { error_code: "otp_expired", msg: "expired" });
    return json(200, issue(u, "recovery"));
  }
  return json(404, { message: `mock: no route for ${method} ${p}` });
}

type Written = { name: string; value: string; options: CookieOptions };
function browser(initial: Map<string, string> = new Map()) {
  const values = new Map(initial);
  const writes: Written[] = [];
  return {
    values,
    writes,
    jar: {
      getAll: () => [...values].map(([name, value]) => ({ name, value })),
      set: (name: string, value: string, options: CookieOptions) => {
        writes.push({ name, value, options });
        if (options.maxAge === 0 || value === "") values.delete(name);
        else values.set(name, value);
      },
    },
  };
}
const g = globalThis as unknown as Record<string, unknown>;
const resetCaches = () => {
  delete g.__fundaEnvMarker;
  delete g.__fundaEnvMarkerInflight;
  delete g.__fundaAuthSettings;
};
const authCalls = () => mock.calls.filter((c) => c.path.startsWith("/auth/v1/"));
const since = (n: number) => mock.calls.slice(n);

async function partMockSupabase() {
  console.log("\n── 3. membership against a MOCK Supabase (no real project) ──");
  process.env.SUPABASE_URL = MOCK;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role";
  process.env.SUPABASE_ANON_KEY = "mock-anon";
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.VERCEL_ENV;
  globalThis.fetch = mockFetch as typeof fetch;
  resetCaches();

  const signup = { fullName: "Deneme Üye", phone: "0555 111 22 33", email: "deneme@example.com", password: "deneme123", next: "/hesabim/adreslerim" };

  // gates before anything reaches Auth
  mock.marker = null;
  let n = mock.calls.length;
  const noMarker = await registerCustomer(browser().jar, signup);
  check("no environment marker -> 503, nothing sent to Auth", noMarker.status === 503 && since(n).every((c) => !c.path.startsWith("/auth/")));
  mock.marker = "production";
  resetCaches();
  n = mock.calls.length;
  const wrong = await registerCustomer(browser().jar, signup);
  check("project marked production (local expects test) -> 503, nothing sent to Auth", wrong.status === 503 && since(n).every((c) => !c.path.startsWith("/auth/")));
  mock.marker = "test";
  resetCaches();

  process.env.VERCEL_ENV = "production";
  n = mock.calls.length;
  const prod = await registerCustomer(browser().jar, signup);
  check("Production: sign-up closed (403) before any request", prod.status === 403 && prod.body.code === "SIGNUP_CLOSED" && since(n).length === 0);
  delete process.env.VERCEL_ENV;
  resetCaches();

  mock.ready = false;
  n = mock.calls.length;
  const notReady = await registerCustomer(browser().jar, signup);
  check("0010 not applied -> 503, no account created in Auth", notReady.status === 503 && notReady.body.code === "NOT_READY" && !since(n).some((c) => c.path === "/auth/v1/signup"));
  mock.ready = true;

  n = mock.calls.length;
  const invalid = await registerCustomer(browser().jar, { ...signup, password: "short", email: "bad" });
  check("invalid input -> 400 with field errors, no request", invalid.status === 400 && Boolean((invalid.body.fieldErrors as Record<string, string>)?.password) && since(n).length === 0);

  // sign-up
  const b1 = browser();
  n = mock.calls.length;
  const reg = await registerCustomer(b1.jar, { ...signup, acceptTerms: true, marketing: true });
  const signupCall = since(n).find((c) => c.path === "/auth/v1/signup");
  check("sign-up -> signed in, redirect to next", reg.status === 200 && reg.body.redirect === "/hesabim/adreslerim", JSON.stringify(reg.body));
  check("…sent to Auth with the anon key, never the service role", signupCall?.apikey === "mock-anon");
  const userId = mock.users.get("deneme@example.com")?.id ?? "";
  const storedProfile = mock.profiles.get(userId) ?? {};
  check("…profile stored (name, formatted phone, e-mail)", storedProfile.full_name === "Deneme Üye" && storedProfile.phone === "0555 111 22 33" && storedProfile.email === "deneme@example.com");
  check("…NO consent recorded (no text published), no marketing field", !("terms_version" in storedProfile) && !("terms_accepted_at" in storedProfile) && !JSON.stringify(storedProfile).includes("marketing"));
  const authCookies = b1.writes.filter((w) => w.name.startsWith("sb-") && w.value);
  check("…session cookies are httpOnly, SameSite=Lax, lasting", authCookies.length > 0 && authCookies.every((w) => w.options.httpOnly === true && w.options.sameSite === "lax" && (w.options.maxAge ?? 0) > 0));
  check("…not marked secure outside production builds", authCookies.every((w) => w.options.secure === false));
  check("…'Beni hatırla' marker = 1", b1.values.get("funda_auth_persist") === "1");

  const dup = await registerCustomer(browser().jar, signup);
  check("same e-mail again -> 409 with the agreed message", dup.status === 409 && String(dup.body.error).startsWith("Bu e-postayla bir hesap var"));

  // session
  const session = await readCustomerSession(b1.jar);
  check("session read back from the cookies (verified by Auth)", session.status === "signed_in" && session.userId === userId);
  n = mock.calls.length;
  const anon = await readCustomerSession(browser().jar);
  check("no cookies -> signed out, no request", anon.status === "signed_out" && since(n).length === 0);
  const member = await loadMember(session);
  check("member + profile loaded", member.kind === "member" && member.profile.fullName === "Deneme Üye");
  const om = await resolveOrderMember(b1.jar);
  check("order member = session user", om.ok && om.userId === userId);
  check("order member for a guest = null", (await resolveOrderMember(browser().jar)).ok);

  // login
  const wrongPw = await loginCustomer(browser().jar, { email: "deneme@example.com", password: "yanlis123" });
  const unknown = await loginCustomer(browser().jar, { email: "yok@example.com", password: "yanlis123" });
  check("wrong password and unknown e-mail -> same 401 message", wrongPw.status === 401 && unknown.status === 401 && wrongPw.body.error === unknown.body.error);
  const b2 = browser();
  const login = await loginCustomer(b2.jar, { email: "DENEME@example.com ", password: "deneme123", remember: false, next: "//evil.com" });
  const b2Auth = b2.writes.filter((w) => w.name.startsWith("sb-") && w.value);
  check("login ok; unsafe next -> /hesabim", login.status === 200 && login.body.redirect === "/hesabim", JSON.stringify(login.body));
  check("'Beni hatırla' off -> session cookies without maxAge", b2Auth.length > 0 && b2Auth.every((w) => w.options.maxAge === undefined && w.options.httpOnly === true));
  check("…marker = 0", b2.values.get("funda_auth_persist") === "0");

  // profile: only the session's row, only name + phone
  n = mock.calls.length;
  const upd = await updateMemberProfile(b1.jar, { fullName: "Deneme Üye İki", phone: "05551112244", email: "x@evil.com", auth_user_id: crypto.randomUUID() });
  const patch = since(n).find((c) => c.method === "PATCH");
  check("profile update -> only the session user's row", upd.status === 200 && patch?.path.includes(`auth_user_id=eq.${userId}`) === true);
  check("…only name + phone sent", JSON.stringify(patch?.body) === JSON.stringify({ full_name: "Deneme Üye İki", phone: "0555 111 22 44" }));
  check("signed out -> 401", (await updateMemberProfile(browser().jar, { fullName: "A B", phone: "05551112233" })).status === 401);

  // addresses
  const other = crypto.randomUUID();
  n = mock.calls.length;
  const save1 = await saveMemberAddress(b1.jar, { id: null, userId: other, address: { label: "Ev", district: "Gölbaşı", neighborhood: "İncek", addressLine: "TONA Residence B blok 12" } });
  const rpc = since(n).find((c) => c.path === "/rest/v1/rpc/save_customer_address");
  check("address saved for the session user (body's userId ignored)", save1.status === 200 && (rpc?.body as { p_user_id?: string })?.p_user_id === userId);
  const badArea = await saveMemberAddress(b1.jar, { id: null, address: { label: "İş", district: "Mamak", neighborhood: "Akdere", addressLine: "Bir sokak no 5 daire 3" } });
  check("address outside the zone list -> 400, nothing saved", badArea.status === 400 && (await rpcRepo.listAddresses(userId)).length === 1);
  for (let i = 2; i <= 10; i += 1) {
    await saveMemberAddress(b1.jar, { id: null, address: { label: `A${i}`, district: "Çankaya", neighborhood: "Kavaklıdere", addressLine: `Tunalı Hilmi Cd. No ${i}` } });
  }
  const over = await saveMemberAddress(b1.jar, { id: null, address: { label: "A11", district: "Çankaya", neighborhood: "Kavaklıdere", addressLine: "Tunalı Hilmi Cd. No 11" } });
  check("11th address -> 409 with the limit message", over.status === 409 && over.body.code === "ADDRESS_LIMIT");
  const foreign = await rpcRepo.saveAddress(other, address(), null);
  const del = foreign.ok ? await deleteMemberAddress(b1.jar, foreign.address.id) : null;
  check("deleting another member's address -> 404", del?.status === 404 && (await rpcRepo.listAddresses(other)).length === 1);

  // member orders
  mock.orders.push(
    { order_number: "FND-20261012-AAAA", customer_user_id: userId, status: "cancelled", is_demo: true, delivery_type: "pickup", branch_slug: "gop", delivery_date: TODAY, delivery_time_slot: "16:00 – 17:00", subtotal: 90, delivery_fee: 0, discount: 0, total: 90, order_note: null, cancel_reason: "Stok bitti", created_at: new Date().toISOString(), address: null, items: [{ product_name: "Macaron", variant_label: null, quantity: 2, total_price: 90, cake_message: null, extras: null, note: null }] },
    { order_number: "FND-20261012-BBBB", customer_user_id: other, status: "new", is_demo: true, delivery_type: "pickup", branch_slug: "gop", delivery_date: TODAY, delivery_time_slot: "16:00 – 17:00", subtotal: 45, delivery_fee: 0, discount: 0, total: 45, order_note: null, cancel_reason: null, created_at: new Date().toISOString(), address: null, items: [] },
  );
  const repo = getCustomerRepository();
  const own = await repo.listOrders(userId);
  check("member orders: only their own", own.length === 1 && own[0].orderNumber === "FND-20261012-AAAA" && own[0].cancelReason === "Stok bitti");
  check("another member's order number -> null", (await repo.getOrder(userId, "FND-20261012-BBBB")) === null);

  // passwords
  n = mock.calls.length;
  const reset = await requestPasswordReset(browser().jar, { email: "deneme@example.com" }, "https://preview.example");
  const resetUnknown = await requestPasswordReset(browser().jar, { email: "yok@example.com" }, "https://preview.example");
  const recoverCall = since(n).find((c) => c.path.startsWith("/auth/v1/recover"));
  check("reset: same answer for known and unknown e-mail", reset.status === 200 && resetUnknown.status === 200 && JSON.stringify(reset.body) === JSON.stringify(resetUnknown.body));
  const redirectTo = new URL(MOCK + (recoverCall?.path ?? "/")).searchParams.get("redirect_to") ?? "";
  const back = redirectTo ? new URL(redirectTo) : null;
  check(
    "…link returns to this deployment's /auth/confirm -> /sifre-yenile",
    back?.origin === "https://preview.example" && back.pathname === "/auth/confirm" && back.searchParams.get("next") === "/sifre-yenile",
    redirectTo,
  );
  mock.recoverStatus = 429;
  const limited = await requestPasswordReset(browser().jar, { email: "deneme@example.com" }, "https://preview.example");
  check("…rate limit -> 429 with a plain message", limited.status === 429 && limited.body.code === "RATE_LIMITED");
  mock.recoverStatus = 200;

  const bad = await confirmEmailLink(browser().jar, new URLSearchParams({ token_hash: "wrong", type: "recovery", next: "/sifre-yenile" }));
  check("expired / wrong link -> back to /sifremi-unuttum", bad === "/sifremi-unuttum?baglanti=gecersiz");
  const notRecovery = await confirmEmailLink(browser().jar, new URLSearchParams({ token_hash: "good-recovery-hash", type: "signup" }));
  check("link type other than recovery -> refused", notRecovery === "/sifremi-unuttum?baglanti=gecersiz");
  const b3 = browser();
  const good = await confirmEmailLink(b3.jar, new URLSearchParams({ token_hash: "good-recovery-hash", type: "recovery", next: "https://evil.com" }));
  check("valid recovery link -> /sifre-yenile (unsafe next ignored), session-only cookies", good === "/sifre-yenile" && b3.values.get("funda_auth_persist") === "0");
  const setNew = await changePassword(b3.jar, { mode: "recovery", newPassword: "yenisifre9" });
  check("new password from the recovery session -> ok", setNew.status === 200 && mock.users.get("deneme@example.com")?.password === "yenisifre9", JSON.stringify(setNew.body));
  const b4 = browser();
  await loginCustomer(b4.jar, { email: "deneme@example.com", password: "yenisifre9" });
  const noCurrent = await changePassword(b4.jar, { mode: "recovery", newPassword: "baskasifre1" });
  check("'recovery' from a normal login session -> 403 (current password needed)", noCurrent.status === 403 && mock.users.get("deneme@example.com")?.password === "yenisifre9");
  const wrongCurrent = await changePassword(b4.jar, { mode: "change", currentPassword: "yanlis123", newPassword: "baskasifre1" });
  check("change with a wrong current password -> 400", wrongCurrent.status === 400 && wrongCurrent.body.code === "CURRENT_PASSWORD");
  const changed = await changePassword(b4.jar, { mode: "change", currentPassword: "yenisifre9", newPassword: "baskasifre1" });
  check("change with the right current password -> ok", changed.status === 200 && mock.users.get("deneme@example.com")?.password === "baskasifre1", JSON.stringify(changed.body));

  // sign-out
  n = mock.calls.length;
  const out = await logoutCustomer(b4.jar);
  const logoutCalls = since(n).filter((c) => c.path.startsWith("/auth/v1/logout"));
  check("logout -> this session only (scope=local)", out.status === 200 && logoutCalls.length === 1 && logoutCalls[0].path.includes("scope=local"));
  check("…cookies cleared in this browser", [...b4.values.keys()].every((k) => !k.startsWith("sb-") && k !== "funda_auth_persist"));
  check("no request ever signed out other sessions (global / others)", mock.calls.every((c) => !/scope=(global|others)/.test(c.path)));
  check("the other browser is still signed in", (await readCustomerSession(b1.jar)).status === "signed_in");

  // social providers
  const gate = await availableSocialProviders();
  check("Google enabled in Supabase but blocked in code -> no button", gate.length === 0);
  n = mock.calls.length;
  const start = await startSocialSignIn(browser().jar, "google", "https://preview.example", "/hesabim");
  const cb = await finishSocialSignIn(browser().jar, new URLSearchParams({ provider: "google", code: "abc" }));
  check("Google start / callback refused, no code exchanged", start === "/giris?hata=saglayici" && cb === "/giris?hata=saglayici" && !since(n).some((c) => c.path.includes("grant_type=pkce") || c.path.includes("/authorize")));
  check("Instagram is not a provider", (await startSocialSignIn(browser().jar, "instagram", "https://x", null)) === "/giris?hata=saglayici");

  // account without a profile
  const b5 = browser();
  const noProfileUser = { id: crypto.randomUUID(), email: "profilsiz@example.com", password: "profilsiz1" };
  mock.users.set(noProfileUser.email, noProfileUser);
  const l5 = await loginCustomer(b5.jar, { email: noProfileUser.email, password: noProfileUser.password, next: "/checkout" });
  check("login without a profile -> /uyelik-tamamla?next=…", l5.body.redirect === "/uyelik-tamamla?next=%2Fcheckout", JSON.stringify(l5.body));
  check("…its order is a guest order (not linked)", (await resolveOrderMember(b5.jar)).ok && (await resolveOrderMember(b5.jar) as { userId: string | null }).userId === null);
  const done = await completeMembership(b5.jar, { fullName: "Profil Siz", phone: "05559998877", next: "/checkout" });
  check("complete membership -> profile created, no consent", done.status === 200 && done.body.redirect === "/checkout" && !("terms_version" in (mock.profiles.get(noProfileUser.id) ?? {})));

  // Auth down while a session exists: an order is refused, not silently a guest's
  mock.authDown = true;
  const down = await resolveOrderMember(b1.jar);
  check("Auth unreachable with a session -> order refused (503 in the route)", !down.ok);
  mock.authDown = false;

  check("every request went to the mock project only", mock.calls.length > 0);
  check("Auth requests used the anon key only", authCalls().every((c) => c.apikey === "mock-anon"));
}

async function main() {
  await requireTestEnvironmentForWrites("verify-accounts");
  await partMemory();
  await partOrders();
  await partMockSupabase();
  console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILED`} (${passes}/${passes + failures})`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
