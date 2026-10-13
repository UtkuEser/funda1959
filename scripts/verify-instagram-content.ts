/**
 * Homepage Instagram cards (D42) — run before committing a content change:
 *   npx tsx scripts/verify-instagram-content.ts
 * Reads only: no network, no database.
 *
 * 1. the selection rules on made-up entries (nothing is published by them);
 * 2. the real list in src/lib/social/instagram-content.ts: every published
 *    entry is well-formed and its poster (and video, if any) is in public/.
 *    Video files are kept out of the server bundle (next.config.ts), so this
 *    is the only check that a video exists before it goes live.
 */
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  INSTAGRAM_CONTENT,
  INSTAGRAM_MAX_CARDS,
  instagramEntryProblems,
  selectInstagramCards,
  type InstagramContentEntry,
} from "@/lib/social";
import { isSectionAllowed } from "@/lib/admin/section-access";

let failures = 0;
let passes = 0;
function check(label: string, cond: boolean, detail = "") {
  console.log(`${cond ? "  ok  " : " FAIL "} ${label}${cond || !detail ? "" : `  -> ${detail}`}`);
  if (cond) passes += 1;
  else failures += 1;
}

const entry = (n: number, extra: Partial<InstagramContentEntry> = {}): InstagramContentEntry => ({
  title: `İçerik ${n}`,
  poster: `/social/reels/r${n}.webp`,
  instagramUrl: `https://www.instagram.com/reel/R${n}abc/`,
  published: true,
  ...extra,
});

function partRules() {
  console.log("\n── 1. rules (made-up entries) ──");
  const all = () => true;
  check("empty list -> no cards (section hidden)", selectInstagramCards([], all).length === 0);

  const [noVideo] = selectInstagramCards([entry(1)], all);
  check("poster + Instagram link, no video -> published, video null", !!noVideo && noVideo.video === null && noVideo.instagramUrl === entry(1).instagramUrl);
  const [withVideo] = selectInstagramCards([entry(2, { video: "/social/reels/r2.mp4" })], all);
  check("with a video -> video path kept", withVideo?.video === "/social/reels/r2.mp4");

  check("published: false -> hidden", selectInstagramCards([entry(3, { published: false })], all).length === 0);
  check("poster file missing -> hidden", selectInstagramCards([entry(4)], () => false).length === 0);
  check(
    "seven published -> first five, in file order",
    selectInstagramCards([1, 2, 3, 4, 5, 6, 7].map((n) => entry(n)), all).map((c) => c.title).join() ===
      ["İçerik 1", "İçerik 2", "İçerik 3", "İçerik 4", "İçerik 5"].join() && INSTAGRAM_MAX_CARDS === 5,
  );
  check("same Instagram link twice -> shown once", selectInstagramCards([entry(8), entry(8, { title: "Kopya" })], all).length === 1);
  check(
    "an invalid entry doesn't take a slot",
    selectInstagramCards([entry(9, { poster: "/home/hero/1.png" }), ...[1, 2, 3, 4, 5].map((n) => entry(n))], all).length === 5,
  );

  const rejected: [string, Partial<InstagramContentEntry>][] = [
    ["profile link (not a post)", { instagramUrl: "https://www.instagram.com/funda.1959/" }],
    ["another site", { instagramUrl: "https://example.com/reel/ABC/" }],
    ["http link", { instagramUrl: "http://www.instagram.com/reel/ABC/" }],
    ["poster outside /social/", { poster: "/home/hero/1.png" }],
    ["poster not an image", { poster: "/social/reels/r1.mp4" }],
    ["poster path with ..", { poster: "/social/../kampanya/1.png" }],
    ["video not mp4/webm", { video: "/social/reels/r1.mov" }],
    ["video outside /social/", { video: "/videos/r1.mp4" }],
    ["empty title", { title: "  " }],
  ];
  for (const [label, patch] of rejected) {
    const e = entry(1, patch);
    check(`rejected: ${label}`, instagramEntryProblems(e).length > 0 && selectInstagramCards([e], all).length === 0);
  }
  check("accepted: /p/ post link and instagram.com without www", instagramEntryProblems(entry(1, { instagramUrl: "https://instagram.com/p/Cx_9-a/" })).length === 0);
}

function partContentFile() {
  console.log("\n── 2. src/lib/social/instagram-content.ts ──");
  const publicDir = join(process.cwd(), "public");
  const fileOk = (p: string) => existsSync(join(publicDir, p));
  const published = INSTAGRAM_CONTENT.filter((e) => e.published === true);
  console.log(`  (bilgi) ${INSTAGRAM_CONTENT.length} kayıt, ${published.length} yayında`);

  const seen = new Set<string>();
  INSTAGRAM_CONTENT.forEach((e, i) => {
    const name = `#${i + 1} "${e.title ?? ""}"`;
    const problems = instagramEntryProblems(e);
    if (e.published !== true) {
      if (problems.length > 0) console.log(`  (bilgi) ${name} yayında değil; düzeltilmesi gerekenler: ${problems.join("; ")}`);
      return;
    }
    check(`${name}: alanlar geçerli`, problems.length === 0, problems.join("; "));
    check(`${name}: poster dosyası var (public${e.poster})`, fileOk(e.poster));
    if (e.video !== undefined) {
      const there = fileOk(e.video);
      check(`${name}: video dosyası var (public${e.video})`, there);
      if (there) {
        const mb = statSync(join(publicDir, e.video)).size / 1024 / 1024;
        if (mb > 15) console.log(`  (uyarı) ${name}: video ${mb.toFixed(1)} MB — ana sayfa için büyük, sıkıştırmak iyi olur`);
      }
    }
    const url = e.instagramUrl?.trim();
    check(`${name}: Instagram bağlantısı listede bir kez`, !seen.has(url));
    seen.add(url);
  });
  if (published.length > INSTAGRAM_MAX_CARDS) {
    console.log(`  (uyarı) ${published.length} yayında kayıt var; ana sayfada yalnızca ilk ${INSTAGRAM_MAX_CARDS} görünür`);
  }
  const shown = selectInstagramCards(INSTAGRAM_CONTENT, fileOk);
  console.log(`  (bilgi) ana sayfada görünecek: ${shown.length}${shown.length === 0 ? " — bölüm gizli" : ""}`);
}

function partAdmin() {
  console.log("\n── 3. admin ──");
  check("no Instagram section in the admin panel (old bookmark -> overview)", !isSectionAllowed("SUPER_ADMIN", "instagram"));
}

partRules();
partContentFile();
partAdmin();
console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) FAILED.`} (${passes}/${passes + failures})\n`);
process.exit(failures === 0 ? 0 : 1);
