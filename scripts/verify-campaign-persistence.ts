/* eslint-disable no-console */
/**
 * Manual domain check — run with:
 *   npx tsx scripts/verify-campaign-persistence.ts
 *
 * Exercises the CampaignRepository CRUD contract end to end: create, read
 * back, update, read the update back again, active-window + branch
 * filtering, then delete. Self-cleaning — it always removes the row it
 * created, safe to run against a real project.
 *
 * IMPORTANT: this only proves real, durable persistence when
 * SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY
 * are set. Without them, `getCampaignRepository()` falls back to the
 * in-memory mock — every check below will still pass, but that only proves
 * the mock's own CRUD logic is internally consistent, NOT that data
 * survives a refresh, a `npm run dev` restart, or a deploy. The script
 * prints which path it actually exercised.
 */
import "@/lib/campaigns/server-init";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { getCampaignRepository } from "@/lib/campaigns";

let failures = 0;
function check(label: string, cond: boolean) {
  console.log(`${cond ? "  ok  " : " FAIL "} ${label}`);
  if (!cond) failures += 1;
}

async function main() {
  const usingSupabase = isSupabaseConfigured();
  console.log(`\nSupabase configured in this environment: ${usingSupabase}`);
  if (!usingSupabase) {
    console.log(
      "  -> SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set here.\n" +
        "     Every check below runs against the IN-MEMORY MOCK, not real\n" +
        "     Supabase. It proves the CRUD contract is wired correctly, but\n" +
        "     it does NOT prove persistence across a refresh/restart/deploy.\n" +
        "     Set real env vars and re-run this script against an actual\n" +
        "     Supabase project to confirm that.",
    );
  }

  const repo = getCampaignRepository();

  console.log("\n── create ──");
  const created = await repo.create({
    title: "Verify Script Campaign",
    description: "Geçici doğrulama kampanyası — script sonunda silinir.",
    image: "",
    startAt: "2020-01-01T00:00:00+03:00",
    endAt: "2030-01-01T00:00:00+03:00",
    ctaLabel: "İncele",
    ctaHref: "/lezzetlerimiz",
    active: true,
    branchIds: "all",
    priority: 999,
  });
  check("create() returns a row with an id", Boolean(created.id));

  console.log("\n── read after create (refresh simulation) ──");
  const afterCreate = await repo.get(created.id);
  check("created campaign is readable back by id", afterCreate?.title === "Verify Script Campaign");

  console.log("\n── update (the required 'title survives refresh' scenario) ──");
  const updated = await repo.update(created.id, { title: "Verify Script Campaign — Updated" });
  check("update() returns the new title", updated?.title === "Verify Script Campaign — Updated");
  const afterUpdate = await repo.get(created.id);
  check(
    "title change is still there on a FRESH read (not just the mutated in-memory object)",
    afterUpdate?.title === "Verify Script Campaign — Updated",
  );

  console.log("\n── active window + branch filtering ──");
  const now = new Date();
  const activeUnresolved = await repo.listActive(now, null);
  check("shows up in listActive() when branch is unresolved", activeUnresolved.some((c) => c.id === created.id));

  await repo.update(created.id, { active: false });
  const activeAfterDeactivate = await repo.listActive(now, null);
  check(
    "deactivated campaign disappears from listActive() (homepage won't show it)",
    !activeAfterDeactivate.some((c) => c.id === created.id),
  );
  const stillReadableWhenInactive = await repo.get(created.id);
  check("deactivated campaign is still readable in admin (get() ignores active)", stillReadableWhenInactive?.active === false);

  console.log("\n── delete ──");
  const removed = await repo.remove(created.id);
  check("remove() reports success", removed === true);
  const afterRemove = await repo.get(created.id);
  check("removed campaign is gone on a fresh read", afterRemove === null);

  console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`}`);
  if (!usingSupabase) {
    console.log(
      "Reminder: this run only proves the mock fallback's CRUD logic.\n" +
        "Persistence across a real refresh/restart/deploy is only guaranteed\n" +
        "when Supabase is actually configured — see the report for the\n" +
        "manual test still needed against a real project.\n",
    );
  }
  process.exit(failures === 0 ? 0 : 1);
}

main();
