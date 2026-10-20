#!/usr/bin/env node
// Self-test for the Figma pull. Runs apply.mjs against a throwaway copy of the
// repo with snapshots shaped exactly like read.js output, so the real merge
// logic is exercised without touching Figma or this checkout.
//
//   node scripts/figma/selftest.mjs

import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { FIGMA, flatten, readTokens } from "./tokens-map.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "../..");
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? "  ok  " : "  FAIL"} ${msg}`); if (!cond) failures++; };

function fresh() {
  const dir = mkdtempSync(join(tmpdir(), "ds-figma-"));
  for (const p of ["tokens", "scripts", "docs", "web", "apple"]) cpSync(join(repo, p), join(dir, p), { recursive: true });
  run(dir, ["--record-push"]);
  return dir;
}
function run(dir, args) {
  const r = spawnSync(process.execPath, [join(dir, "scripts/figma/apply.mjs"), ...args], { encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}
/** A snapshot in read.js's shape, built from a tokens.json. */
function snapshotOf(t) {
  const prim = Object.fromEntries(flatten(t).filter((e) => e.kind === "hex").map((e) => [e.key, e]));
  const vars = new Map();
  for (const e of flatten(t)) {
    const id = `${e.collection}|${e.css}`;
    if (!vars.has(id)) vars.set(id, { name: e.figmaName, collection: e.collection, css: e.css, type: e.kind === "number" ? "FLOAT" : "COLOR", scopes: [], values: {} });
    const v = vars.get(id).values;
    if (e.kind === "hex") v.Value = { color: e.value.toUpperCase(), alpha: 1 };
    else if (e.kind === "number") v.Value = { number: e.value };
    else v[e.mode] = { alias: prim[e.value].css, aliasName: prim[e.value].figmaName };
  }
  return { file: "selftest", takenAt: new Date().toISOString(), variables: [...vars.values()], textStyles: [] };
}
const find = (s, css, col = FIGMA.color) => s.variables.find((v) => v.css === css && v.collection === col);
const save = (dir, s) => writeFileSync(join(dir, "figma/snapshot.json"), JSON.stringify(s));
const tok = (dir) => readTokens(join(dir, "tokens/tokens.json"));

console.log("1. Figma unchanged");
{ const d = fresh(); save(d, snapshotOf(tok(d))); const r = run(d, []); ok(r.code === 0 && r.out.includes("Nothing changed"), "reports nothing to do"); rmSync(d, { recursive: true }); }

console.log("2. Figma edits a palette colour and re-points a role");
{
  const d = fresh(); const s = snapshotOf(tok(d));
  find(s, "--color-accent-500", FIGMA.primitives).values.Value.color = "#7A4A1C";
  find(s, "--fg-primary").values[FIGMA.baseModes.light] = { alias: "--color-neutral-950", aliasName: "neutral/950" };
  save(d, s); const r = run(d, []); const t = tok(d);
  ok(r.code === 0, "exit 0");
  ok(t.color.accent["500"] === "#7A4A1C", "accent.500 written to tokens.json");
  ok(t.semantic.light.fgPrimary === "color.neutral.950", "fgPrimary (light) re-pointed");
  ok(readFileSync(join(d, "web/tokens.css"), "utf8").includes("#7A4A1C"), "tokens.css regenerated");
  ok(/Figma sync: 2 token changes/.test(readFileSync(join(d, "docs/decisions.md"), "utf8")), "decision entry logged");
  const again = run(d, []); ok(!again.out.includes("Applied") && again.out.includes("until the next push"), "second pull applies nothing, says Artist Laser modes need a push");
  run(d, ["--record-push"]); save(d, snapshotOf(tok(d)));
  ok(run(d, []).out.includes("Nothing changed"), "after a push, a pull is a no-op");
  rmSync(d, { recursive: true });
}

console.log("3. Same token changed in Figma and in code");
{
  const d = fresh(); const s = snapshotOf(tok(d));
  find(s, "--space-5", FIGMA.dimensions).values.Value.number = 18;
  const t0 = tok(d); t0.space["5"] = 20; writeFileSync(join(d, "tokens/tokens.json"), JSON.stringify(t0, null, 2) + "\n");
  save(d, s); const r = run(d, []);
  ok(r.code === 2 && r.out.includes("Conflicts"), "conflict reported, exit 2");
  ok(tok(d).space["5"] === 20, "repo value left alone");
  const r2 = run(d, ["--prefer=figma"]); ok(r2.code === 0 && tok(d).space["5"] === 18, "--prefer=figma takes Figma's value");
  rmSync(d, { recursive: true });
}

console.log("4. A role set to a raw colour");
{
  const d = fresh(); const s = snapshotOf(tok(d));
  find(s, "--surface").values[FIGMA.baseModes.light] = { color: "#FEFEFE", alpha: 1 };
  save(d, s); const r = run(d, []);
  ok(r.code === 2 && r.out.includes("raw colour"), "rejected with an explanation");
  ok(tok(d).semantic.light.surface === "color.neutral.0", "tokens.json unchanged for that role");
  rmSync(d, { recursive: true });
}

console.log("5. A new palette colour added in Figma");
{
  const d = fresh(); const s = snapshotOf(tok(d));
  s.variables.push({ name: "accent/950", collection: FIGMA.primitives, css: "--color-accent-950", type: "COLOR", scopes: [], values: { Value: { color: "#1A1006", alpha: 1 } } });
  save(d, s); const r = run(d, []);
  ok(r.out.includes("New in Figma, not added") && !tok(d).color.accent["950"], "reported, not added by default");
  const r2 = run(d, ["--accept-new"]); ok(tok(d).color.accent["950"] === "#1A1006", "added with --accept-new");
  rmSync(d, { recursive: true });
}

console.log("6. Artist Laser mode edits");
{
  const d = fresh(); const s = snapshotOf(tok(d));
  const al = FIGMA.worldMode("artist-laser", "light");
  find(s, "--accent").values[al] = { alias: "--color-accent-laser-600", aliasName: "accent-laser/600" };
  find(s, "--bg").values[al] = { alias: "--color-neutral-50", aliasName: "neutral/50" };
  save(d, s); const r = run(d, []); const w = tok(d).worlds["artist-laser"].light;
  ok(w.accent === "color.accentLaser.600", "world accent override updated");
  ok(w.bg === "color.neutral.50", "new world override added for bg");
  ok(tok(d).semantic.light.bg === "color.neutral.0", "base Dabbleon theme untouched");
  rmSync(d, { recursive: true });
}

console.log(failures ? `\n${failures} failed` : "\nAll passed");
process.exit(failures ? 1 : 0);
