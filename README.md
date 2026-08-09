# Dabbleon Styles

The shared design system for Dabbleon and Artist Laser work — web (Astro/Next +
Supabase on Vercel) and Apple (SwiftUI, iOS + macOS).

One core token set, thin platform adapters, minimal per-project overrides. The
goal is to stop re-deciding the same things on every project.

**Type:** Jost (display + UI) and Spectral (body). Both SIL OFL 1.1 — free for
commercial use, self-hosting, and app embedding. See [`LICENSES.md`](LICENSES.md).

## Layout

```
tokens/tokens.json      ← source of truth. Edit this.
scripts/build-tokens.mjs  → generates the two files below
scripts/fetch-fonts.sh    → downloads fonts + licences from upstream

web/tokens.css          ← GENERATED. CSS custom properties, light + dark.
web/base.css            ← base element styles wired to the tokens
web/fonts.css           ← font loading notes and @font-face fallbacks

apple/DesignTokens.swift ← GENERATED. DS.TextSize, DS.Space, DS.Semantic, …
apple/Typography.swift   ← hand-written: DS.Font, DS.TextStyle, Color helpers

docs/getting-started.md ← wiring it into a project
docs/typography.md      ← the type decisions and the metrics behind them
docs/decisions.md       ← running log of what was decided and why

CLAUDE.md               ← rules for Claude Code when building UI
```

## Quick start

```bash
node scripts/build-tokens.mjs   # regenerate after editing tokens.json
bash scripts/fetch-fonts.sh     # pull font files into ./fonts (gitignored)
```

Then see [`docs/getting-started.md`](docs/getting-started.md).

## The three type roles

| Role | Face | Where it goes |
|---|---|---|
| `display` | Jost SemiBold | Headlines, empty states, onboarding |
| `ui` | Jost Regular | Buttons, labels, nav, form fields |
| `body` | Spectral | Paragraphs, docs, anything read at length |

Roles are the stable part; faces can be swapped inside a role per project without
touching a single call site.

## Rules that matter most

- Never write a raw hex, pixel, or duration value — use a token.
- If no token fits, that's a system decision: change `tokens.json`, log it in
  `docs/decisions.md`. Don't invent a nearby value.
- UI text never below 13px. Jost's counters close up.
- Two weights per family: 400 and 600.
- Semantic tokens (`--fg-primary`, `--surface`) at call sites, never palette
  tokens (`--color-neutral-700`).

## Status

Version 0.1.0 — early and expected to change. Type and structure are settled;
the accent colour is provisional and the component layer doesn't exist yet.
See `docs/decisions.md` for what's open.
