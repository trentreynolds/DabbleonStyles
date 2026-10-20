#!/usr/bin/env node
// tokens.json -> figma/push.js. The "push" half of the Figma sync (see docs/figma.md).
//
//   node scripts/figma/build-push.mjs
//
// Writes figma/push.js: a Figma Plugin API script that Claude runs through the
// Figma MCP tool `use_figma` against the Dabbleon Styles file. It creates or
// updates — never deletes — the Primitives, Color (four modes) and Dimensions
// collections and the base text styles, matching variables by name so every
// binding in the file survives.
//
// SAFETY: the generated script first compares Figma against figma/baseline.json.
// If Figma holds edits that were never pulled, it stops and lists them instead
// of overwriting your design work. Pull first (apply.mjs), then push.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FIGMA, flatten, readTokens } from "./tokens-map.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const t = readTokens(join(root, "tokens/tokens.json"));
const baselinePath = join(root, "figma/baseline.json");
const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : null;
const force = process.argv.includes("--force");

const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((x) => Math.round(x * 10000) / 10000); };
const entries = flatten(t);
const prim = entries.filter((e) => e.kind === "hex");
const primByKey = Object.fromEntries(prim.map((e) => [e.key, e]));
const modes = [FIGMA.baseModes.light, FIGMA.baseModes.dark, ...Object.keys(t.worlds || {}).flatMap((w) => ["light", "dark"].map((th) => FIGMA.worldMode(w, th)))];

// One row per semantic role: [figmaName, css, scopes, [primitive figmaName per mode]]
const roles = new Map();
for (const e of entries.filter((e) => e.kind === "ref")) {
  if (!roles.has(e.css)) roles.set(e.css, { name: e.figmaName, css: e.css, values: {} });
  roles.get(e.css).values[e.mode] = primByKey[e.value].figmaName;
}
const scopesFor = (css) => {
  if (css.startsWith("--fg")) return ["TEXT_FILL", "SHAPE_FILL"];
  if (css.startsWith("--border") || css === "--focus-ring") return ["STROKE_COLOR"];
  if (css.startsWith("--accent") && css !== "--accent-subtle") return ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"];
  return ["FRAME_FILL", "SHAPE_FILL"];
};

// Base text styles: the roles base.css sets up. Component-level styles
// (Heading/Card Title etc.) are authored in Figma and left alone by a push.
const ts = t.typeScale, lh = t.lineHeight, ls = (k) => parseFloat(t.letterSpacing[k]) * 100;
const J = t.font.display.family, S = t.font.body.family, M = t.font.mono.family;
const TEXT = [
  ["Display/5xl", J, 600, ts["5xl"], lh.display, ls("display"), false, "Hero numerals and the largest marketing headline."],
  ["Display/4xl", J, 600, ts["4xl"], lh.display, ls("display"), false, "Section-opening display line."],
  ["Heading/H1", J, 600, ts["3xl"], lh.display, ls("display"), false, "h1 in base.css."],
  ["Heading/H2", J, 600, ts["2xl"], lh.display, ls("display"), false, "h2 in base.css."],
  ["Heading/H3", J, 600, ts.xl, lh.display, ls("heading"), false, "h3 in base.css."],
  ["Heading/H4", J, 600, ts.lg, lh.display, ls("heading"), false, "h4 in base.css."],
  ["Heading/H5", J, 600, ts.md, lh.display, ls("heading"), false, "h5/h6 in base.css."],
  ["Body/Large", S, 400, ts.md, lh.body, 0, false, "Lead paragraphs."],
  ["Body/Base", S, 400, ts.base, lh.body, 0, false, `body in base.css. Measure ${t.constraints.bodyMeasureCh}ch.`],
  ["Body/Base Strong", S, 600, ts.base, lh.body, 0, false, "Emphasis inside body copy."],
  ["UI/Base", J, 400, ts.base, lh.ui, 0, false, "Larger controls."],
  ["UI/Small", J, 400, ts.sm, lh.ui, 0, false, "Buttons, inputs, labels, nav — the base.css default for controls."],
  ["UI/Small Strong", J, 600, ts.sm, lh.ui, 0, false, "Active nav, selected labels."],
  ["UI/Min", J, 400, t.constraints.uiFontMinSize, lh.ui, 0, false, `The ${t.constraints.uiFontMinSize}px floor. Never smaller for UI text.`],
  ["UI/Eyebrow", J, 600, ts.xs, lh.ui, ls("eyebrow"), true, ".eyebrow in base.css."],
  ["Mono/Small", M, 400, ts.sm, lh.ui, 0, false, "Code, IDs, hashes."],
];

// What Figma should look like before this push (the last-synced state), in the
// same shape the plugin reads, so it can refuse to overwrite unpulled edits.
const expect = [];
if (baseline && !force) for (const e of entries) {
  if (!(e.key in baseline)) continue;
  const b = baseline[e.key];
  const val = e.kind === "hex" ? b.toUpperCase() : e.kind === "ref" ? `alias:${primByKey[b]?.css}` : b;
  expect.push([e.collection, e.css, e.mode || "Value", val]);
}

const DATA = {
  P: prim.map((e) => [e.figmaName, rgb(e.value), `var(${e.css})`]),
  M: modes,
  C: [...roles.values()].map((r) => [r.name, `var(${r.css})`, scopesFor(r.css), modes.map((m) => r.values[m])]),
  D: entries.filter((e) => e.kind === "number").map((e) => [e.figmaName, e.value, `var(${e.css})`, e.scopes]),
  T: TEXT,
  E: expect,
  N: FIGMA,
};

const code = `// GENERATED by scripts/figma/build-push.mjs from tokens/tokens.json — do not edit.
// Run with the Figma MCP tool use_figma against the Dabbleon Styles file.
const DATA = ${JSON.stringify(DATA)};
const V = figma.variables;
const cols = await V.getLocalVariableCollectionsAsync();
const allVars = await V.getLocalVariablesAsync();
const byId = Object.fromEntries(allVars.map(v => [v.id, v]));
const hex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const cssOf = v => (v.codeSyntax.WEB || '').replace(/^var\\((.*)\\)$/, '$1');
// 1. Refuse to overwrite edits that were never pulled.
const drift = [];
for (const [colName, css, mode, want] of DATA.E) {
  const col = cols.find(c => c.name === colName); if (!col) continue;
  const v = allVars.find(x => x.variableCollectionId === col.id && cssOf(x) === css); if (!v) continue;
  const m = col.modes.find(x => x.name === mode); if (!m) continue;
  const x = v.valuesByMode[m.modeId];
  const got = x && x.type === 'VARIABLE_ALIAS' ? 'alias:' + cssOf(byId[x.id]) : typeof x === 'number' ? x : x && 'r' in x ? hex(x) : String(x);
  if (String(got).toLowerCase() !== String(want).toLowerCase()) drift.push(v.name + ' [' + mode + ']: Figma ' + got + ', last sync ' + want);
}
if (drift.length) return { stopped: true, reason: 'Figma has changes that were never pulled. Pull first (apply.mjs), or rebuild with --force to discard them.', drift };
// 2. Create or update, matched by name. Never deletes.
async function collection(name, modes) {
  let c = cols.find(x => x.name === name);
  if (!c) c = V.createVariableCollection(name);
  if (c.modes[0].name !== modes[0]) c.renameMode(c.modes[0].modeId, modes[0]);
  for (const m of modes.slice(1)) if (!c.modes.find(x => x.name === m)) c.addMode(m);
  return c;
}
function variable(c, name, type) {
  let v = allVars.find(x => x.name === name && x.variableCollectionId === c.id);
  if (!v) { v = V.createVariable(name, c, type); allVars.push(v); }
  return v;
}
const modeId = (c, m) => c.modes.find(x => x.name === m).modeId;
const prim = await collection(DATA.N.primitives, ['Value']);
const primVar = {};
for (const [name, c, css] of DATA.P) {
  const v = variable(prim, name, 'COLOR');
  v.setValueForMode(prim.modes[0].modeId, { r: c[0], g: c[1], b: c[2], a: 1 });
  v.scopes = []; v.setVariableCodeSyntax('WEB', css); primVar[name] = v;
}
const col = await collection(DATA.N.color, DATA.M);
for (const [name, css, scopes, vals] of DATA.C) {
  const v = variable(col, name, 'COLOR');
  DATA.M.forEach((m, i) => v.setValueForMode(modeId(col, m), V.createVariableAlias(primVar[vals[i]])));
  v.scopes = scopes; v.setVariableCodeSyntax('WEB', css);
}
const dim = await collection(DATA.N.dimensions, ['Value']);
for (const [name, value, css, scopes] of DATA.D) {
  const v = variable(dim, name, 'FLOAT');
  v.setValueForMode(dim.modes[0].modeId, value); v.scopes = scopes; v.setVariableCodeSyntax('WEB', css);
}
const styles = await figma.getLocalTextStylesAsync();
const sizeVar = {};
for (const v of allVars) if (v.variableCollectionId === dim.id && v.name.startsWith('font-size/')) sizeVar[v.valuesByMode[dim.modes[0].modeId]] = v;
for (const [name, family, weight, size, lh, ls, upper, note] of DATA.T) {
  const style = weight >= 600 ? 'SemiBold' : 'Regular';
  await figma.loadFontAsync({ family, style });
  let s = styles.find(x => x.name === name); if (!s) s = figma.createTextStyle();
  s.name = name; s.fontName = { family, style }; s.fontSize = size;
  s.lineHeight = { unit: 'PERCENT', value: Math.round(lh * 1000) / 10 };
  s.letterSpacing = { unit: 'PERCENT', value: ls }; s.textCase = upper ? 'UPPER' : 'ORIGINAL'; s.description = note;
  if (sizeVar[size]) s.setBoundVariable('fontSize', sizeVar[size]);
}
return { stopped: false, collections: [prim, col, dim].map(c => ({ name: c.name, modes: c.modes.map(m => m.name), variables: c.variableIds.length })), textStyles: DATA.T.length };
`;
mkdirSync(join(root, "figma"), { recursive: true });
writeFileSync(join(root, "figma/push.js"), code);
console.log(`Wrote figma/push.js (${code.length} chars${force ? ", --force: drift check disabled" : baseline ? `, drift check over ${expect.length} values` : ", no baseline yet: drift check skipped"}).`);
