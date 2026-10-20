#!/usr/bin/env node
// Figma -> tokens.json. The "pull" half of the Figma sync (see docs/figma.md).
//
//   node scripts/figma/apply.mjs                 apply figma/snapshot.json
//   node scripts/figma/apply.mjs --dry-run       report only, change nothing
//   node scripts/figma/apply.mjs --accept-new    also add variables that are new in Figma
//   node scripts/figma/apply.mjs --prefer=figma  resolve conflicts in Figma's favour (or =repo)
//   node scripts/figma/apply.mjs --record-push   after a push: record that Figma now matches the repo
//
// It is a THREE-WAY merge, not a copy. figma/baseline.json holds every value as
// it was at the last sync. For each token:
//   Figma changed, repo didn't  -> take Figma's value
//   repo changed, Figma didn't  -> keep the repo (Figma is behind; push to update it)
//   both changed, differently   -> conflict: reported, left alone unless --prefer
// so a code edit and a Figma edit can never silently overwrite each other.
//
// Rules from CLAUDE.md still hold: semantic roles must point at a palette colour
// (a raw colour on a role is rejected, not applied), and a token that is new in
// Figma is a system decision — it is reported, and only added with --accept-new.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { FIGMA, flatten, readTokens, writeTokens, setPath, semanticKeyFromCss, kebab } from "./tokens-map.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const P = {
  tokens: join(root, "tokens/tokens.json"),
  baseline: join(root, "figma/baseline.json"),
  snapshot: join(root, "figma/snapshot.json"),
  textStyles: join(root, "figma/text-styles.json"),
  report: join(root, "figma/last-sync.md"),
  decisions: join(root, "docs/decisions.md"),
};
const args = new Set(process.argv.slice(2));
const flag = (n) => args.has(n);
const prefer = [...args].find((a) => a.startsWith("--prefer="))?.split("=")[1];
const snapArg = [...args].find((a) => a.startsWith("--snapshot="));
if (snapArg) P.snapshot = join(process.cwd(), snapArg.split("=")[1]);

const t = readTokens(P.tokens);
const same = (a, b) => (typeof a === "string" && typeof b === "string" ? a.toLowerCase() === b.toLowerCase() : a === b);

if (flag("--record-push") || flag("--init-baseline")) {
  mkdirSync(dirname(P.baseline), { recursive: true });
  const b = Object.fromEntries(flatten(t).map((e) => [e.key, e.value]));
  writeFileSync(P.baseline, JSON.stringify(b, null, 2) + "\n");
  console.log(`Recorded: Figma matches tokens.json (${Object.keys(b).length} tokens).`);
  process.exit(0);
}
if (!existsSync(P.snapshot)) { console.error(`No snapshot at ${P.snapshot}. Run scripts/figma/read.js in Figma first (see docs/figma.md).`); process.exit(1); }
if (!existsSync(P.baseline)) { console.error("No figma/baseline.json. Push to Figma, then run with --record-push."); process.exit(1); }
const snap = JSON.parse(readFileSync(P.snapshot, "utf8"));
const baseline = JSON.parse(readFileSync(P.baseline, "utf8"));

// ---- index Figma by collection + CSS name
const fig = new Map();
for (const v of snap.variables) if (v.css) fig.set(`${v.collection}|${v.css}`, v);
const entries = flatten(t);
const primByCss = Object.fromEntries(entries.filter((e) => e.kind === "hex").map((e) => [e.css, e.key]));

const problems = [], applied = [], conflicts = [], stale = [], added = [], newInFigma = [], missingInFigma = [];
function figmaValue(e) {
  const v = fig.get(`${e.collection}|${e.css}`);
  if (!v) return { missing: true };
  const x = v.values[e.mode || "Value"];
  if (!x) return { problem: `mode "${e.mode}" not found on ${v.name}` };
  if (e.kind === "hex") {
    if (!x.color) return { problem: `${v.name} should be a colour, is ${JSON.stringify(x)}` };
    if (x.alpha < 1) return { problem: `${v.name} has ${Math.round(x.alpha * 100)}% opacity — palette colours are opaque` };
    return { value: x.color };
  }
  if (e.kind === "ref") {
    if (x.color) return { problem: `${v.name} (${e.mode}) is set to a raw colour ${x.color}. Roles must point at a palette colour — pick one from Primitives, or add the colour to Primitives first.` };
    const key = primByCss[x.alias];
    if (!key) return { problem: `${v.name} (${e.mode}) points at ${x.aliasName}, which is not a palette colour in tokens.json${flag("--accept-new") ? "" : " (if it is new, rerun with --accept-new)"}` };
    return { value: key };
  }
  if (typeof x.number !== "number") return { problem: `${v.name} should be a number` };
  return { value: x.number };
}

// ---- new palette colours first (so roles may point at them)
const known = new Set(entries.map((e) => `${e.collection}|${e.css}`));
for (const v of snap.variables) {
  if (!v.css || known.has(`${v.collection}|${v.css}`)) continue;
  const where = `${v.collection} › ${v.name} (${v.css})`;
  if (v.collection === FIGMA.primitives && v.values.Value?.color) {
    const group = Object.entries(t.color).find(([g, val]) => typeof val === "object" && v.css.startsWith(`--color-${kebab(g)}-`));
    if (group && flag("--accept-new")) {
      const step = v.css.slice(`--color-${kebab(group[0])}-`.length);
      setPath(t, `color.${group[0]}.${step}`, v.values.Value.color); primByCss[v.css] = `color.${group[0]}.${step}`;
      baseline[`color.${group[0]}.${step}`] = v.values.Value.color; added.push(`${where} = ${v.values.Value.color}`);
    } else newInFigma.push(where);
  } else if (v.collection === FIGMA.color && flag("--accept-new")) {
    const k = semanticKeyFromCss(v.css);
    const l = v.values[FIGMA.baseModes.light], d = v.values[FIGMA.baseModes.dark];
    const lk = l && primByCss[l.alias], dk = d && primByCss[d.alias];
    if (lk && dk) { t.semantic.light[k] = lk; t.semantic.dark[k] = dk; baseline[`semantic.light.${k}`] = lk; baseline[`semantic.dark.${k}`] = dk; added.push(`${where}: light ${lk}, dark ${dk}`); }
    else problems.push(`${where} is new but its Light/Dark values don't both point at palette colours.`);
  } else newInFigma.push(where);
}

// ---- three-way merge, in flatten order (palette, roles, worlds, dimensions)
for (const e of flatten(t)) {
  const f = figmaValue(e);
  if (f.missing) { if (e.collection !== FIGMA.color || !e.world) missingInFigma.push(`${e.key} (${e.css})`); continue; }
  if (f.problem) { problems.push(f.problem); continue; }
  const base = baseline[e.key], repo = e.value, next = f.value;
  const label = `${e.key}${e.mode ? ` [${e.mode}]` : ""}`;
  const figChanged = base === undefined ? !same(next, repo) : !same(next, base);
  const repoChanged = base !== undefined && !same(repo, base);
  if (!figChanged) {
    if (repoChanged) {
      const inherits = e.world && !((t.worlds[e.world][e.theme] || {})[e.prop]);
      stale.push(inherits
        ? `${label}: inherits ${repo} from the Dabbleon theme — Figma’s ${e.mode} mode still shows ${next} until the next push`
        : `${label}: repo ${repo} (Figma still ${next})`);
    }
    continue;
  }
  if (same(next, repo)) { baseline[e.key] = next; continue; }
  if (repoChanged && prefer !== "figma") {
    if (prefer === "repo") { baseline[e.key] = next; stale.push(`${label}: kept repo ${repo} over Figma ${next}`); continue; }
    conflicts.push(`${label}: last sync ${base} · Figma ${next} · repo ${repo}`); continue;
  }
  write(e, next); baseline[e.key] = next;
  applied.push(`${label}: ${repo} → ${next}`);
}
function write(e, v) {
  if (e.world) {
    // A world only stores what differs from the base theme.
    const overrides = (t.worlds[e.world][e.theme] ||= {});
    if (same(v, t.semantic[e.theme][e.prop])) delete overrides[e.prop]; else overrides[e.prop] = v;
  } else setPath(t, e.key, e.kind === "hex" ? v.toUpperCase() : v);
}

// ---- report
const L = [`# Figma sync — ${new Date().toISOString().slice(0, 10)}`, "", `Snapshot of “${snap.file}” taken ${snap.takenAt}.`, ""];
const sec = (h, xs, note) => { if (!xs.length) return; L.push(`## ${h}`, ...(note ? [note, ""] : []), ...xs.map((x) => `- ${x}`), ""); };
sec("Applied from Figma", applied);
sec("Added (new in Figma)", added);
sec("Conflicts — changed in both places", conflicts, "Not applied. Decide which wins, then rerun with --prefer=figma or --prefer=repo.");
sec("Needs a decision", problems);
sec("New in Figma, not added", newInFigma, "A new token is a system decision (CLAUDE.md rule 2). Rerun with --accept-new to add these.");
sec("Repo is ahead of Figma", stale, "These changed in code since the last sync. Push to bring Figma up to date.");
sec("In tokens.json but missing from Figma", missingInFigma, "Not deleted from the repo. Delete it here deliberately, or re-push to restore it in Figma.");
if (L.length === 4) L.push("Nothing changed in Figma since the last sync.", "");
const report = L.join("\n");
console.log(report);
if (flag("--dry-run")) { console.log("(dry run — nothing written)"); process.exit(conflicts.length || problems.length ? 2 : 0); }

writeTokens(P.tokens, t);
writeFileSync(P.baseline, JSON.stringify(baseline, null, 2) + "\n");
writeFileSync(P.report, report);
writeFileSync(P.textStyles, JSON.stringify(snap.textStyles.sort((a, b) => a.name.localeCompare(b.name)), null, 2) + "\n");
if (applied.length || added.length) {
  const res = spawnSync(process.execPath, [join(root, "scripts/build-tokens.mjs")], { stdio: "inherit" });
  if (res.status !== 0) process.exit(res.status);
  const log = readFileSync(P.decisions, "utf8");
  const n = String(Math.max(0, ...[...log.matchAll(/^## (\d{4})/gm)].map((m) => +m[1])) + 1).padStart(4, "0");
  const entry = [
    "", "---", "", `## ${n} — Figma sync: ${[...applied, ...added].length} token change${[...applied, ...added].length === 1 ? "" : "s"}`,
    `**Date:** ${new Date().toISOString().slice(0, 10)} · **Status:** proposed — review in the pull request`, "",
    "Changed in Figma and pulled with `scripts/figma/apply.mjs`:", "",
    ...[...applied, ...added].map((x) => `- ${x}`), "",
    "**Why:** _fill in before merging — what the change is for._", "",
  ].join("\n");
  writeFileSync(P.decisions, log.trimEnd() + "\n" + entry);
}
process.exit(conflicts.length || problems.length ? 2 : 0);
