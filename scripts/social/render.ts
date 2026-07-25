/**
 * Renders the post queue to PNGs.
 *
 * Run:  node --env-file=.env.local scripts/social/render.ts
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL (building photos live in the public
 * `offering-public` bucket) and a local Chrome. No npm dependency is added —
 * screenshots come from headless Chrome, driven with a throwaway profile so it
 * never touches your real browser session.
 *
 * Flags
 *   --list                 print the queue and exit (no rendering)
 *   --only <id,id>         render just these post ids
 *   --pillar <name>        building | howitworks | compare | diligence | market | pov
 *   --tier <1|2>           default 1. Tier 2 names an offering alongside a
 *                          figure and needs Parvis sign-off before it goes out.
 *   --platform <ig|li>     override the frame the post declares
 *   --buildings            only the auto-generated building series
 *   --limit <n>            cap the number of posts
 *   --html                 write the HTML only, skip Chrome (fast iteration)
 *   --out <dir>            default output/social
 *
 * Output
 *   <out>/<id>.<platform>.png          single-frame posts
 *   <out>/<id>.<platform>.01.png       carousel slides, in order
 *   <out>/_html/…                      the source HTML, kept for tweaking
 *   <out>/captions.md                  captions for everything just rendered
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CANVAS, type Platform } from "./tokens.ts";
import { renderSpec } from "./templates.ts";
import { allPosts, buildingPosts, type Post } from "./posts.ts";
import { findChrome, Shooter } from "./chrome.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/* ------------------------------------------------------------------ */
/* Args                                                                */
/* ------------------------------------------------------------------ */

const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(`--${name}`);
const value = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

const outDir = join(repoRoot, value("out") ?? join("output", "social"));
const htmlDir = join(outDir, "_html");
const htmlOnly = flag("html");
const tier = Number(value("tier") ?? 1);
const onlyIds = value("only")?.split(",").map((s) => s.trim());
const pillar = value("pillar");
const platformOverride = value("platform") as Platform | undefined;
const limit = value("limit") ? Number(value("limit")) : undefined;

/* ------------------------------------------------------------------ */
/* Queue                                                               */
/* ------------------------------------------------------------------ */

function queue(): Post[] {
  let posts = flag("buildings") ? buildingPosts() : allPosts();
  if (onlyIds) posts = posts.filter((p) => onlyIds.includes(p.id));
  else {
    posts = posts.filter((p) => p.tier <= tier);
    if (pillar) posts = posts.filter((p) => p.pillar === pillar);
  }
  return limit ? posts.slice(0, limit) : posts;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

const posts = queue();

if (flag("list")) {
  for (const p of posts) {
    console.log(
      `${p.id.padEnd(38)} tier ${p.tier}  ${p.pillar.padEnd(11)} ${p.platform.join(",")}`,
    );
  }
  console.log(`\n${posts.length} post(s).`);
  process.exit(0);
}

if (!posts.length) {
  console.error("Nothing matched. Try --list.");
  process.exit(1);
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("! NEXT_PUBLIC_SUPABASE_URL unset — building photos will not load.");
  console.warn("  Run with: node --env-file=.env.local scripts/social/render.ts\n");
}

mkdirSync(htmlDir, { recursive: true });
const chrome = htmlOnly ? "" : findChrome();


interface Job {
  htmlPath: string;
  pngPath: string;
  platform: Platform;
  label: string;
}

const jobs: Job[] = [];
const failures: string[] = [];

for (const post of posts) {
  const platforms = platformOverride ? [platformOverride] : post.platform;
  for (const platform of platforms) {
    let docs: string[];
    try {
      docs = renderSpec(post.spec, platform);
    } catch (err) {
      failures.push(`${post.id} (${platform}): ${(err as Error).message}`);
      continue;
    }
    docs.forEach((html, i) => {
      const suffix = docs.length > 1 ? `.${String(i + 1).padStart(2, "0")}` : "";
      const base = `${post.id}.${platform}${suffix}`;
      const htmlPath = join(htmlDir, `${base}.html`);
      writeFileSync(htmlPath, html);
      jobs.push({ htmlPath, pngPath: join(outDir, `${base}.png`), platform, label: base });
    });
  }
}

if (!htmlOnly) {
  // One browser for the whole batch — see chrome.ts for why CDP and not
  // `--screenshot`.
  const shooter = await Shooter.launch(chrome);
  try {
    for (const job of jobs) {
      const cv = CANVAS[job.platform];
      try {
        await shooter.shoot(job.htmlPath, job.pngPath, cv.w, cv.h);
        console.log(`✓ ${job.label}.png`);
      } catch (err) {
        failures.push(`${job.label}: ${(err as Error).message}`);
      }
    }
  } finally {
    await shooter.close();
  }
} else {
  for (const job of jobs) console.log(`✓ ${job.label}.html`);
}

/* Captions travel with the images — the copy is half the post. */
const captions = posts
  .map((p) => `## ${p.id}\n_tier ${p.tier} · ${p.pillar} · ${p.platform.join(", ")}_\n\n${p.caption}\n`)
  .join("\n---\n\n");
writeFileSync(join(outDir, "captions.md"), `# Captions\n\n${captions}`);

console.log(
  `\n${jobs.length - failures.length}/${jobs.length} image(s) → ${outDir.replace(repoRoot + "/", "")}`,
);
console.log(`Captions → ${join(outDir, "captions.md").replace(repoRoot + "/", "")}`);
if (failures.length) {
  console.error(`\n${failures.length} failed:`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
