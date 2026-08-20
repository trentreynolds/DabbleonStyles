#!/usr/bin/env node
// Generates web/tokens.css and apple/DesignTokens.swift from tokens/tokens.json.
// No dependencies. Run: node scripts/build-tokens.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const t = JSON.parse(readFileSync(join(root, "tokens/tokens.json"), "utf8"));
for (const d of ["web", "apple"]) mkdirSync(join(root, d), { recursive: true });

const banner = (comment) =>
  `${comment} GENERATED FILE — do not edit.\n${comment} Source: tokens/tokens.json — regenerate with \`node scripts/build-tokens.mjs\`\n`;

// Resolve "color.neutral.900" -> "#181713"
const deref = (path) => path.split(".").reduce((o, k) => o[k], t);

/* ─────────────────────────────── CSS ─────────────────────────────── */

const cssLines = [
  "/* GENERATED FILE — do not edit.\n   Source: tokens/tokens.json — regenerate with `node scripts/build-tokens.mjs` */\n",
];
cssLines.push(":root {");

cssLines.push("\n  /* Typography — families */");
for (const [role, f] of Object.entries(t.font)) {
  cssLines.push(`  --font-${role}: ${f.stack};`);
  cssLines.push(`  --font-${role}-weight: ${f.weight};`);
}

cssLines.push("\n  /* Typography — scale */");
for (const [k, v] of Object.entries(t.typeScale)) cssLines.push(`  --text-${k}: ${v / 16}rem;`);

cssLines.push("\n  /* Typography — line height & tracking */");
for (const [k, v] of Object.entries(t.lineHeight)) cssLines.push(`  --leading-${k}: ${v};`);
for (const [k, v] of Object.entries(t.letterSpacing)) cssLines.push(`  --tracking-${k}: ${v};`);

cssLines.push("\n  /* Spacing */");
for (const [k, v] of Object.entries(t.space)) cssLines.push(`  --space-${k}: ${v / 16}rem;`);

cssLines.push("\n  /* Radius & borders */");
for (const [k, v] of Object.entries(t.radius))
  cssLines.push(`  --radius-${k}: ${k === "full" ? "9999px" : `${v}px`};`);
for (const [k, v] of Object.entries(t.borderWidth)) cssLines.push(`  --border-${k}: ${v}px;`);

cssLines.push("\n  /* Palette */");
for (const [group, val] of Object.entries(t.color)) {
  // kebab so a camelCase group like accentLaser emits --color-accent-laser-*.
  // No-op for the single-word groups that already exist.
  if (typeof val === "string") cssLines.push(`  --color-${kebab(group)}: ${val};`);
  else for (const [step, hex] of Object.entries(val)) cssLines.push(`  --color-${kebab(group)}-${step}: ${hex};`);
}

cssLines.push("\n  /* Motion */");
for (const [k, v] of Object.entries(t.motion))
  cssLines.push(`  --motion-${kebab(k)}: ${typeof v === "number" ? `${v}ms` : v};`);

cssLines.push("\n  /* Constraints */");
cssLines.push(`  --ui-font-min-size: ${t.constraints.uiFontMinSize}px;`);
cssLines.push(`  --body-measure: ${t.constraints.bodyMeasureCh}ch;`);
cssLines.push(`  --touch-target-min: ${t.constraints.touchTargetMin}px;`);

cssLines.push("\n  /* Semantic — light (default) */");
for (const [k, ref] of Object.entries(t.semantic.light))
  cssLines.push(`  --${kebab(k)}: ${deref(ref)};`);

cssLines.push("}\n");

cssLines.push("@media (prefers-color-scheme: dark) {");
cssLines.push("  :root {");
for (const [k, ref] of Object.entries(t.semantic.dark))
  cssLines.push(`    --${kebab(k)}: ${deref(ref)};`);
cssLines.push("  }");
cssLines.push("}\n");

cssLines.push('[data-theme="dark"] {');
for (const [k, ref] of Object.entries(t.semantic.dark))
  cssLines.push(`  --${kebab(k)}: ${deref(ref)};`);
cssLines.push("}");

// Worlds — decision 0007. A world reassigns only the accent group, so every
// call site keeps using --accent and nothing has to special-case a brand.
// Emitted once per theme scope so a world tracks light/dark like everything
// else.
if (t.worlds) {
  const worldBlock = (sel, vars, indent = "") => {
    cssLines.push(`${indent}${sel} {`);
    for (const [k, ref] of Object.entries(vars))
      cssLines.push(`${indent}  --${kebab(k)}: ${deref(ref)};`);
    cssLines.push(`${indent}}`);
  };

  cssLines.push("\n/* Worlds */");
  for (const [world, themes] of Object.entries(t.worlds))
    worldBlock(`[data-world="${world}"]`, themes.light);

  cssLines.push("\n@media (prefers-color-scheme: dark) {");
  for (const [world, themes] of Object.entries(t.worlds))
    worldBlock(`[data-world="${world}"]:not([data-theme="light"])`, themes.dark, "  ");
  cssLines.push("}\n");

  for (const [world, themes] of Object.entries(t.worlds)) {
    worldBlock(`[data-theme="dark"] [data-world="${world}"]`, themes.dark);
    worldBlock(`[data-world="${world}"][data-theme="dark"]`, themes.dark);
  }
}

writeFileSync(join(root, "web/tokens.css"), cssLines.join("\n") + "\n");

/* ─────────────────────────────── Swift ─────────────────────────────── */

const sw = [];
sw.push(banner("//"));
sw.push("import SwiftUI\n");
sw.push("public enum DS {\n");

sw.push("    // MARK: - Type scale");
sw.push("    public enum TextSize {");
for (const [k, v] of Object.entries(t.typeScale))
  sw.push(`        public static let ${safeIdent(k)}: CGFloat = ${v}`);
sw.push("    }\n");

sw.push("    // MARK: - Line height multipliers");
sw.push("    public enum Leading {");
for (const [k, v] of Object.entries(t.lineHeight))
  sw.push(`        public static let ${safeIdent(k)}: CGFloat = ${v}`);
sw.push("    }\n");

sw.push("    // MARK: - Spacing");
sw.push("    public enum Space {");
for (const [k, v] of Object.entries(t.space))
  sw.push(`        public static let s${k}: CGFloat = ${v}`);
sw.push("    }\n");

sw.push("    // MARK: - Radius");
sw.push("    public enum Radius {");
for (const [k, v] of Object.entries(t.radius))
  sw.push(`        public static let ${safeIdent(k)}: CGFloat = ${v}`);
sw.push("    }\n");

sw.push("    // MARK: - Constraints");
sw.push("    public enum Constraint {");
sw.push(`        public static let uiFontMinSize: CGFloat = ${t.constraints.uiFontMinSize}`);
sw.push(`        public static let touchTargetMin: CGFloat = ${t.constraints.touchTargetMin}`);
sw.push("    }\n");

sw.push("    // MARK: - Motion (seconds)");
sw.push("    public enum Motion {");
for (const [k, v] of Object.entries(t.motion))
  if (typeof v === "number") sw.push(`        public static let ${k}: Double = ${v / 1000}`);
sw.push("    }\n");

sw.push("    // MARK: - Palette");
sw.push("    public enum Palette {");
for (const [group, val] of Object.entries(t.color)) {
  if (typeof val === "string") sw.push(`        public static let ${group} = Color(hex: "${val}")`);
  else
    for (const [step, hex] of Object.entries(val))
      sw.push(`        public static let ${group}${step} = Color(hex: "${hex}")`);
}
sw.push("    }\n");

sw.push("    // MARK: - Semantic colors (adaptive)");
sw.push("    public enum Semantic {");
for (const k of Object.keys(t.semantic.light)) {
  const l = deref(t.semantic.light[k]);
  const d = deref(t.semantic.dark[k]);
  sw.push(
    `        public static let ${k} = Color(light: "${l}", dark: "${d}")`
  );
}
sw.push("    }");
sw.push("}");

writeFileSync(join(root, "apple/DesignTokens.swift"), sw.join("\n") + "\n");

function kebab(s) {
  return s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
function safeIdent(s) {
  return /^[0-9]/.test(s) ? "s" + s.replace(/[^a-zA-Z0-9]/g, "") : s;
}

console.log("Wrote web/tokens.css and apple/DesignTokens.swift");
