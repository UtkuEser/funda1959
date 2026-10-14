/**
 * İletişim talepleri — app-side check (Aşama 8, D43). Run with:
 *   npx tsx scripts/verify-contact.ts
 * Not part of the build. NO real Supabase: every request is answered by an
 * in-process mock (any other host fails). The database rules themselves
 * (one row per request id, rate limit, required fields, Merkez-only update)
 * are tested by supabase/tests/0012_contact_requests_test.sql.
 */
import { readFileSync } from "node:fs";
import { POST } from "@/app/api/contact/route";
import { validateContactInput, CONTACT_SUBJECTS } from "@/lib/contact";
import { isContactFormOpen } from "@/lib/contact/config";
import { ContactAccessError, contactClientKey, listContactRequests, updateContactRequest } from "@/lib/contact/service";
import { isSectionAllowed } from "@/lib/admin/section-access";
import type { AdminScope } from "@/lib/admin/access";

let failures = 0;
let passes = 0;
function check(label: string, cond: boolean, detail = "") {
  console.log(`${cond ? "  ok  " : " FAIL "} ${label}${cond || !detail ? "" : `  -> ${detail}`}`);
  if (cond) passes += 1;
  else failures += 1;
}

const valid = { fullName: "Ayşe Yılmaz", phone: "0555 123 45 67", email: "", subject: "genel", message: "Merhaba, bilgi almak istiyorum." };

function partRules() {
  console.log("\n── 1. form rules ──");
  const ok = validateContactInput(valid);
  check("valid: name, subject, message, phone only", ok.ok && ok.value.phone === "0555 123 45 67" && ok.value.email === null);
  const mail = validateContactInput({ ...valid, phone: "", email: "  Ayse@Example.COM " });
  check("e-mail only is enough (trimmed, lower-cased)", mail.ok && mail.value.email === "ayse@example.com" && mail.value.phone === null);
  const none = validateContactInput({ ...valid, phone: " ", email: "" });
  check("no phone and no e-mail -> refused (contact)", !none.ok && !!none.errors.contact);
  const r = (patch: Record<string, string>) => validateContactInput({ ...valid, ...patch });
  check("name required", !r({ fullName: " " }).ok);
  check("subject required", !r({ subject: "" }).ok);
  check("unknown subject refused", !r({ subject: "siparis" }).ok);
  check("message required (min 10)", !r({ message: "kısa" }).ok);
  check("message max 3000", !r({ message: "x".repeat(3001) }).ok);
  check("bad e-mail refused", !r({ email: "ayse@" }).ok);
  check("phone with letters refused", !r({ phone: "0555 ABC 45 67" }).ok);
  check("phone too short refused", !r({ phone: "0555 12" }).ok);
  check("the five subjects of the form", CONTACT_SUBJECTS.map((s) => s.value).join() === "ozel-gun,kurumsal,genel,sikayet,diger");
}

/* ---- mock Supabase ---- */
const MOCK = "https://mock-project.supabase.test";
const calls: { path: string; body: Record<string, unknown> | null }[] = [];
let marker: "test" | "production" = "test";
let submitAnswer: () => Response = () => json(200, { id: "11111111-1111-4111-8111-111111111111", created_at: "2026-10-14T10:00:00Z", duplicate: false });
let rpcError: { status: number; body: unknown } | null = null;

const json = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
async function mockFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.origin !== MOCK) throw new Error(`verify-contact: unexpected request to ${url.origin}`);
  const body = typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null;
  calls.push({ path: url.pathname, body });
  if (url.pathname === "/rest/v1/app_environment") return json(200, [{ name: marker }]);
  if (rpcError) return json(rpcError.status, rpcError.body);
  switch (url.pathname) {
    case "/rest/v1/rpc/submit_contact_request":
      return submitAnswer();
    case "/rest/v1/rpc/list_contact_requests":
      return json(200, { counts: { new: 1, in_progress: 0, closed: 0 }, total: 1, rows: [] });
    case "/rest/v1/rpc/update_contact_request":
      return json(200, { id: body?.p_id, full_name: "A", phone: null, email: "a@b.co", subject: "genel", message: "m".repeat(10), status: body?.p_status ?? "new", internal_note: null, created_at: "2026-10-14T10:00:00Z", handled_by: null, handled_at: null, note_updated_by: null, note_updated_at: null });
  }
  return json(404, { message: `mock: no route ${url.pathname}` });
}
const g = globalThis as unknown as Record<string, unknown>;
const since = (n: number) => calls.slice(n).filter((c) => c.path !== "/rest/v1/app_environment");

const send = (body: unknown, ip = "203.0.113.7") =>
  POST(new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }));
const form = (extra: Record<string, unknown> = {}) => ({ ...valid, clientRequestId: "req-verify-0001", website: "", ...extra });

async function partApi() {
  console.log("\n── 2. POST /api/contact (mock Supabase) ──");
  process.env.SUPABASE_URL = MOCK;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role";
  process.env.ADMIN_SESSION_SECRET = "verify-contact-secret-0123456789";
  delete process.env.VERCEL_ENV;
  globalThis.fetch = mockFetch as typeof fetch;
  delete g.__fundaEnvMarker;

  let n = calls.length;
  let res = await send(form({ email: " Ayse@Example.com " }));
  let data = (await res.json()) as Record<string, unknown>;
  const sc = since(n);
  const payload = sc[0]?.body?.p_payload as Record<string, unknown> | undefined;
  check("valid form -> 201 with the stored row's id", res.status === 201 && data.ok === true && data.id === "11111111-1111-4111-8111-111111111111", JSON.stringify(data));
  check("…one RPC submit_contact_request with the checked values", sc.length === 1 && sc[0].path.endsWith("submit_contact_request") && payload?.email === "ayse@example.com" && payload?.subject === "genel" && payload?.client_request_id === "req-verify-0001");
  const key = String(payload?.client_key ?? "");
  check("…rate-limit key is an HMAC (64 hex), the address itself is not sent", /^[0-9a-f]{64}$/.test(key) && !JSON.stringify(payload).includes("203.0.113.7"));
  check("…same address -> same key, other address -> other key", contactClientKey("203.0.113.7") === key && contactClientKey("198.51.100.1") !== key);

  submitAnswer = () => json(200, { id: "11111111-1111-4111-8111-111111111111", created_at: "2026-10-14T10:00:00Z", duplicate: true });
  res = await send(form());
  data = (await res.json()) as Record<string, unknown>;
  check("same request again -> 201 with the same id (database says duplicate)", res.status === 201 && data.id === "11111111-1111-4111-8111-111111111111");

  submitAnswer = () => json(200, {});
  res = await send(form());
  data = (await res.json()) as Record<string, unknown>;
  check("database answer without a stored row -> no success (502)", res.status === 502 && data.ok === false);
  submitAnswer = () => json(200, { id: "11111111-1111-4111-8111-111111111111", created_at: "2026-10-14T10:00:00Z", duplicate: false });

  n = calls.length;
  res = await send(form({ website: "http://spam.example" }));
  check("trap field filled -> 400, nothing sent to the database", res.status === 400 && since(n).length === 0);
  n = calls.length;
  res = await send(form({ phone: "", email: "" }));
  data = (await res.json()) as Record<string, unknown>;
  check("no phone and no e-mail -> 400 (contact), nothing sent", res.status === 400 && !!(data.errors as Record<string, string>)?.contact && since(n).length === 0);
  n = calls.length;
  res = await send(form({ subject: "" }));
  check("no subject -> 400, nothing sent", res.status === 400 && since(n).length === 0);
  n = calls.length;
  res = await send(form({ clientRequestId: "x" }));
  check("bad request id -> 400, nothing sent", res.status === 400 && since(n).length === 0);
  res = await send("{not json");
  check("not JSON -> 400", res.status === 400);

  rpcError = { status: 400, body: { code: "P0001", message: "rate_limited" } };
  res = await send(form());
  check("database rate limit -> 429", res.status === 429);
  rpcError = { status: 400, body: { code: "P0001", message: "contact_required" } };
  res = await send(form());
  check("database rule refusal -> 400", res.status === 400);
  rpcError = { status: 404, body: { code: "PGRST202", message: "Could not find the function" } };
  res = await send(form());
  data = (await res.json()) as Record<string, unknown>;
  check("0012 not applied -> 503, no success", res.status === 503 && data.ok === false);
  rpcError = null;

  marker = "production";
  delete g.__fundaEnvMarker;
  n = calls.length;
  res = await send(form());
  check("wrong project (marker production, deployment expects test) -> 503, no RPC", res.status === 503 && since(n).length === 0);
  marker = "test";
  delete g.__fundaEnvMarker;

  const secret = process.env.ADMIN_SESSION_SECRET;
  delete process.env.ADMIN_SESSION_SECRET;
  n = calls.length;
  res = await send(form());
  check("no server secret (no rate-limit key) -> 503, no RPC", res.status === 503 && since(n).length === 0);
  process.env.ADMIN_SESSION_SECRET = secret;

  process.env.VERCEL_ENV = "production";
  n = calls.length;
  res = await send(form());
  data = (await res.json()) as Record<string, unknown>;
  check("Production -> 503 'closed' before anything is read or sent", res.status === 503 && calls.length === n && String(data.error).includes("kapalı"));
  check("isContactFormOpen: production false", !isContactFormOpen());
  process.env.VERCEL_ENV = "preview";
  check("isContactFormOpen: preview true", isContactFormOpen());
  delete process.env.VERCEL_ENV;
  check("isContactFormOpen: local true", isContactFormOpen());
}

const merkez: AdminScope = { user: { name: "Merkez Yönetim", role: "SUPER_ADMIN" }, authorizedBranchIds: null, activeBranchId: null };
const gop: AdminScope = { user: { name: "GOP", role: "BRANCH_MANAGER" }, authorizedBranchIds: ["gop"], activeBranchId: "gop" };
const ID = "22222222-2222-4222-8222-222222222222";

async function partAdmin() {
  console.log("\n── 3. Merkez only ──");
  let n = calls.length;
  let threw = false;
  try {
    await listContactRequests("BRANCH_MANAGER");
  } catch (err) {
    threw = err instanceof ContactAccessError;
  }
  check("branch account: list refused before any request", threw && since(n).length === 0);
  n = calls.length;
  threw = false;
  try {
    await updateContactRequest(gop, ID, { status: "closed" });
  } catch (err) {
    threw = err instanceof ContactAccessError;
  }
  check("branch account: update refused before any request", threw && since(n).length === 0);
  check("admin panel: section for Merkez only", isSectionAllowed("SUPER_ADMIN", "contact") && !isSectionAllowed("BRANCH_MANAGER", "contact"));

  n = calls.length;
  const page = await listContactRequests("SUPER_ADMIN", { status: "new" });
  check("Merkez list: RPC list_contact_requests with the filter", page.counts.new === 1 && since(n)[0]?.path.endsWith("list_contact_requests") && since(n)[0]?.body?.p_status === "new");

  n = calls.length;
  await updateContactRequest(merkez, ID, { status: "in_progress" });
  let c = since(n)[0];
  check("status change: signed by the session's admin (merkez / Merkez Yönetim), note untouched", c?.body?.p_actor_account === "merkez" && c.body.p_actor_name === "Merkez Yönetim" && c.body.p_status === "in_progress" && c.body.p_set_note === false);
  n = calls.length;
  await updateContactRequest(merkez, ID, { status: null, note: "Arandı" });
  c = since(n)[0];
  check("note change: set_note true, status untouched", c?.body?.p_set_note === true && c.body.p_note === "Arandı" && c.body.p_status === null);
}

function partPage() {
  console.log("\n── 4. page text ──");
  const page = readFileSync("src/app/iletisim/page.tsx", "utf8");
  const formSrc = readFileSync("src/components/contact/ContactForm.tsx", "utf8");
  check("'24 saat' promise removed", !page.includes("24 saat") && !formSrc.includes("24 saat"));
  check("new reply sentence shown", formSrc.includes("Talebinizi inceleyip belirttiğiniz iletişim kanalından dönüş yapacağız."));
  check("özel gün / kurumsal = talep, not an order", formSrc.includes("Özel gün ve kurumsal başvurular sipariş değildir"));
  check("old form posting to # removed", !page.includes('action="#"'));
}

async function main() {
  partRules();
  await partApi();
  await partAdmin();
  partPage();
  console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`} (${passes}/${passes + failures})\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
