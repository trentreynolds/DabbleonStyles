// The one mapping between tokens/tokens.json and Figma variables.
//
// Both directions use it — build-push.mjs (repo -> Figma) and apply.mjs
// (Figma -> repo) — so a token can never be named one way going out and another
// way coming back. The join key is the CSS custom property name, which is also
// what every Figma variable carries as its WEB code syntax (`var(--fg-primary)`).
// CSS names come from the same rules build-tokens.mjs uses, so they match
// web/tokens.css exactly.
//
// Zero dependencies, like the rest of scripts/.

import { readFileSync, writeFileSync } from "node:fs";

export const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const title = (s) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

/** Figma collection + mode names. Changing these renames things in Figma. */
export const FIGMA = {
  primitives: "Primitives",
  color: "Color",
  dimensions: "Dimensions",
  baseModes: { light: "Dabbleon Light", dark: "Dabbleon Dark" },
  worldMode: (world, theme) => `${title(world)} ${theme === "light" ? "Light" : "Dark"}`,
};

export function readTokens(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Writes tokens.json byte-compatible with how it is authored (2-space, \u escapes). */
export function writeTokens(path, t) {
  const out = JSON.stringify(t, null, 2).replace(/[\u007f-￿]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
  writeFileSync(path, out + "\n");
}

/**
 * Every syncable token as a flat entry:
 *   { key, css, kind, figmaName, collection, mode?, value }
 * key   — dotted path into tokens.json ("semantic.dark.fgPrimary")
 * css   — custom property name ("--fg-primary")
 * kind  — "hex" | "ref" | "number"
 * value — "#RRGGBB" for primitives, "color.neutral.900" for semantic refs, px for numbers
 * Worlds are flattened to their EFFECTIVE value per mode (override, else base),
 * because that is what a Figma mode shows.
 */
export function flatten(t) {
  const out = [];
  for (const [group, val] of Object.entries(t.color)) {
    if (typeof val === "string") {
      out.push({ key: `color.${group}`, css: `--color-${kebab(group)}`, kind: "hex", collection: FIGMA.primitives, figmaName: primName(group), value: val });
    } else {
      for (const [step, hex] of Object.entries(val))
        out.push({ key: `color.${group}.${step}`, css: `--color-${kebab(group)}-${step}`, kind: "hex", collection: FIGMA.primitives, figmaName: `${kebab(group)}/${step}`, value: hex });
    }
  }
  for (const theme of ["light", "dark"])
    for (const [k, ref] of Object.entries(t.semantic[theme]))
      out.push({ key: `semantic.${theme}.${k}`, css: `--${kebab(k)}`, kind: "ref", collection: FIGMA.color, figmaName: semanticName(k), mode: FIGMA.baseModes[theme], value: ref });
  for (const [world, themes] of Object.entries(t.worlds || {}))
    for (const theme of ["light", "dark"])
      for (const [k, ref] of Object.entries(t.semantic[theme]))
        out.push({ key: `worlds.${world}.${theme}.${k}`, css: `--${kebab(k)}`, kind: "ref", collection: FIGMA.color, figmaName: semanticName(k), mode: FIGMA.worldMode(world, theme), value: (themes[theme] || {})[k] ?? ref, world, theme, prop: k });
  const num = (key, css, figmaName, value, scopes) => out.push({ key, css, kind: "number", collection: FIGMA.dimensions, figmaName, value, scopes });
  for (const [k, v] of Object.entries(t.space)) num(`space.${k}`, `--space-${k}`, `space/${k}`, v, ["GAP", "WIDTH_HEIGHT"]);
  for (const [k, v] of Object.entries(t.radius)) num(`radius.${k}`, `--radius-${k}`, `radius/${k}`, v, ["CORNER_RADIUS"]);
  for (const [k, v] of Object.entries(t.borderWidth)) num(`borderWidth.${k}`, `--border-${k}`, `border-width/${k}`, v, ["STROKE_FLOAT"]);
  for (const [k, v] of Object.entries(t.typeScale)) num(`typeScale.${k}`, `--text-${k}`, `font-size/${k}`, v, ["FONT_SIZE"]);
  num("constraints.uiFontMinSize", "--ui-font-min-size", "constraint/ui-font-min-size", t.constraints.uiFontMinSize, ["FONT_SIZE"]);
  num("constraints.touchTargetMin", "--touch-target-min", "constraint/touch-target-min", t.constraints.touchTargetMin, ["WIDTH_HEIGHT"]);
  return out;
}

// Status colours sit in a "status/" folder in Figma; page gradient stops in "page-gradient/".
function primName(group) {
  if (["success", "warning", "danger", "info"].includes(group)) return `status/${group}`;
  return kebab(group);
}

/** Semantic roles grouped into folders so the Figma picker reads by purpose. */
export function semanticName(k) {
  const css = kebab(k);
  if (css === "surface") return "surface/default";
  if (css === "surface-inverse") return "surface/inverse";
  if (css === "focus-ring") return "accent/focus-ring";
  const [head, ...rest] = css.split("-");
  const folder = { bg: "background", fg: "foreground", border: "border", accent: "accent" }[head] || head;
  return `${folder}/${rest.join("-") || "default"}`;
}

/** Inverse of the semantic camelCase key, from a CSS name ("--fg-on-inverse" -> "fgOnInverse"). */
export const semanticKeyFromCss = (css) => camel(css.replace(/^--/, ""));

/** Read/write a dotted key in tokens.json. */
export function getPath(t, key) { return key.split(".").reduce((o, k) => (o == null ? o : o[k]), t); }
export function setPath(t, key, value) {
  const parts = key.split("."); let o = t;
  for (const p of parts.slice(0, -1)) o = o[p] ??= {};
  o[parts.at(-1)] = value;
}
