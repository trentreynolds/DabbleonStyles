# Decisions

A running log. Each entry records what was decided, why, and what would make it
worth revisiting. The point is to stop re-litigating settled questions and to
make the unsettled ones visible.

---

## 0001 — Jost + Spectral as the type pairing
**Date:** 2026-08 · **Status:** adopted

Jost for display and UI, Spectral for body.

**Why:** The brief was "rounder than Helvetica, pointier, more personality but
refined." Jost is the sharpest geometric on Google Fonts — Futura lineage,
circular bowls, needle apexes. Spectral is the closest metric match to it among
serifs that survive small sizes: x-height 0.450 against Jost's 0.460, extender
span 0.980 against 1.000. Measured from the font files, not estimated.

**Rejected:** Faustina (x-height 0.494, span 0.864 — reads larger and denser than
Jost, needs opposing corrections). Bodoni Moda is an exact metric match and shares
Jost's rationalist ancestry, but its hairlines fail below ~16px, so it is display-
only and was not worth a third face at this stage.

**Revisit if:** dense UI at 13px proves uncomfortable in real screens. The fallback
is Inter for the `ui` role only, keeping Jost for `display`.

---

## 0002 — Layered system, not per-project style guides
**Date:** 2026-08 · **Status:** adopted

One core token set, thin platform adapters (web CSS, Apple Swift), minimal
per-project overrides.

**Why:** Per-project guides drift into several half-maintained systems. The core
holds the decisions that make work recognisable; the adapters hold only the
platform translation.

**Revisit if:** a project genuinely needs a different visual identity — at which
point it gets its own accent and display face, still through the same roles.

---

## 0003 — Tokens as JSON, generated to CSS and Swift
**Date:** 2026-08 · **Status:** adopted

`tokens/tokens.json` is the source of truth. `scripts/build-tokens.mjs` (zero
dependencies, plain Node) emits `web/tokens.css` and `apple/DesignTokens.swift`.

**Why:** Two platforms drifting apart is the standard failure. Generating both
from one file makes drift impossible rather than merely discouraged. No build
tooling to maintain, which matches the low-overhead preference.

**Revisit if:** a third platform appears, or if Style Dictionary's extra features
start earning their dependency cost. They don't yet.

---

## 0004 — Fonts fetched, not vendored
**Date:** 2026-08 · **Status:** adopted

`scripts/fetch-fonts.sh` downloads the OFL files and licences from upstream;
`fonts/` is gitignored.

**Why:** Keeps the repo text-only and diffable, and pulls the licence files
alongside the fonts automatically, which OFL redistribution requires.

**Revisit if:** upstream paths churn enough to make the script fragile. Vendoring
the files with their `OFL.txt` is a perfectly legal alternative.

---

## 0005 — Accent colour is provisional
**Date:** 2026-08 · **Status:** open

`color.accent.500` is a warm ochre `#8C5921`, chosen to sit well with the type
rather than from any brand decision.

**Open question:** whether Artist Laser, Dabbleon, and client work share one
accent or diverge. Everything routes through the semantic layer, so changing it
is one edit in `tokens.json`.
