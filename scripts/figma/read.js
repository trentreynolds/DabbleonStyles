// Figma -> snapshot. Runs INSIDE Figma (Plugin API), not in Node.
//
// Claude runs this through the Figma MCP tool `use_figma` against the Dabbleon
// Styles file and saves the returned JSON to figma/snapshot.json, then runs
// `node scripts/figma/apply.mjs`. It only reads; it never changes the file.
//
// Every variable is reported with the CSS name from its WEB code syntax — that
// is the join key back to tokens.json — and its value per mode: an alias (the
// CSS name of the variable it points at), a colour, or a number.

const V = figma.variables;
const vars = await V.getLocalVariablesAsync();
const cols = await V.getLocalVariableCollectionsAsync();
const byId = Object.fromEntries(vars.map((v) => [v.id, v]));
const hex = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const cssOf = (v) => (v.codeSyntax.WEB || "").replace(/^var\((.*)\)$/, "$1") || null;

const variables = [];
for (const col of cols) {
  for (const id of col.variableIds) {
    const v = byId[id];
    const values = {};
    for (const m of col.modes) {
      const x = v.valuesByMode[m.modeId];
      if (x && x.type === "VARIABLE_ALIAS") values[m.name] = { alias: cssOf(byId[x.id]), aliasName: byId[x.id].name };
      else if (typeof x === "number") values[m.name] = { number: x };
      else if (x && typeof x === "object" && "r" in x) values[m.name] = { color: hex(x), alpha: Math.round((x.a ?? 1) * 1000) / 1000 };
      else values[m.name] = { other: x };
    }
    variables.push({ name: v.name, collection: col.name, css: cssOf(v), type: v.resolvedType, scopes: v.scopes, values });
  }
}
const textStyles = (await figma.getLocalTextStylesAsync()).map((s) => ({
  name: s.name,
  family: s.fontName.family,
  style: s.fontName.style,
  size: s.fontSize,
  lineHeight: s.lineHeight.unit === "PERCENT" ? `${Math.round(s.lineHeight.value * 10) / 10}%` : s.lineHeight.unit === "PIXELS" ? `${s.lineHeight.value}px` : "auto",
  letterSpacing: `${Math.round(s.letterSpacing.value * 10) / 10}${s.letterSpacing.unit === "PERCENT" ? "%" : "px"}`,
  textCase: s.textCase,
  sizeVariable: s.boundVariables && s.boundVariables.fontSize ? cssOf(byId[s.boundVariables.fontSize.id]) : null,
  description: s.description,
}));
return { file: figma.root.name, takenAt: new Date().toISOString(), modes: Object.fromEntries(cols.map((c) => [c.name, c.modes.map((m) => m.name)])), variables, textStyles };
