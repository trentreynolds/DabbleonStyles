# Dabbleon Styles — instructions for Claude Code

This repo is the design system for all Dabbleon / Artist Laser projects. When it
is available in a project (linked, submodule, or referenced from the project's
own `CLAUDE.md`), these rules apply to any UI work in that project.

## Hard rules

1. **Never write a raw value where a token exists.** No hex colours, no pixel
   spacing, no font sizes, no border radii, no transition durations. Use
   `var(--token)` on web and `DS.*` in Swift.
2. **If no token fits, stop and ask.** Do not invent a nearby value and do not
   quietly add a token. Adding to the system is a decision that goes through
   `tokens/tokens.json` and gets a line in `docs/decisions.md`.
3. **Never hand-edit generated files.** `web/tokens.css` and
   `apple/DesignTokens.swift` are output. Edit `tokens/tokens.json`, then run
   `node scripts/build-tokens.mjs`.
4. **UI text never goes below 13px** (`--ui-font-min-size` / `DS.Constraint.uiFontMinSize`).
   Jost's counters close up below it. If the layout seems to need smaller text,
   say so rather than shrinking it.
5. **Two weights per family.** Jost 400/600, Spectral 400/600. Do not introduce
   300, 500, 700, or 800.
6. **Match the face to the role, not the vibe.** Headlines → `display` (Jost
   SemiBold). Controls and labels → `ui` (Jost). Anything read for more than a
   sentence → `body` (Spectral). Code and IDs → `mono`.
7. **No browser storage in artifacts.** (localStorage / sessionStorage do not
   work in the Claude artifact sandbox.)

## Preferred patterns

- Borders over shadows. If elevation is genuinely needed, use one level, not a scale.
- Radius `md` (4px) for controls, `lg` (8px) for cards. Nothing else by default.
- Semantic colour tokens (`--fg-primary`, `--surface`, `--border`) at call sites,
  never palette tokens (`--color-neutral-700`) directly. The palette exists to
  feed the semantic layer.
- Tabular figures anywhere numbers stack vertically.
- `prefers-reduced-motion` respected; `web/base.css` already handles it.

## Stack notes

- **Web**: Astro / Next on Vercel, Supabase behind it. Import order in the root
  layout: font imports → `tokens.css` → `base.css` → app styles.
- **Apple**: SwiftUI, iOS and macOS. Add `apple/DesignTokens.swift` and
  `apple/Typography.swift` to the target, or consume the whole repo as a local
  Swift package. Call `DS.Font.verifyRegistration()` once in DEBUG.

## When asked to build UI

Read `docs/typography.md` before making type decisions and `tokens/tokens.json`
before making any spacing or colour decision. If the request conflicts with a
hard rule above, flag the conflict rather than silently resolving it — a rule
that keeps getting in the way is worth changing deliberately, not working around.

## What is still unsettled

The accent colour (`color.accent.500`, currently a warm ochre `#8C5921`) is
provisional and was chosen to complement the type, not from any brand decision.
Expect it to change. Everything that references it goes through the semantic
layer so a change is one edit.
