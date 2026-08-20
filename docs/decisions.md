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

---

## 0006 — Inverse surface tokens
**Date:** 2026-08 · **Status:** adopted

Add a surface that is deliberately the opposite weight to the page, plus the
foreground tokens that go on it.

```
semantic.light.surfaceInverse    color.neutral.950   #0F0E0B
semantic.light.fgOnInverse       color.neutral.0     #FFFFFF
semantic.light.fgOnInverseMuted  color.neutral.400   #A9A8A1
semantic.light.borderOnInverse   color.neutral.700   #3D3C37

semantic.dark.surfaceInverse     color.neutral.800   #272621
semantic.dark.fgOnInverse        color.neutral.100   #F2F2EF
semantic.dark.fgOnInverseMuted   color.neutral.400   #A9A8A1
semantic.dark.borderOnInverse    color.neutral.600   #575650
```

**Why:** The Artist Laser page opens on a near-black band behind the logo, and
the podcast and artwork pages will want the same device. There is no token for
it. Building that band today means reaching for `--color-neutral-950` at the
call site, which the hard rules forbid — palette tokens exist to feed the
semantic layer, not to be used directly — and it produces a band that does not
adapt to theme at all.

**Why it lifts rather than inverts in dark mode:** a true inversion would make
the band light-on-dark, which turns a quiet accent into the loudest element on
the page. Lifting to `neutral.800` keeps the band reading as a distinct panel
against the `neutral.950` page while staying in the same key. The token means
"deliberately weighted against the page", not "flipped".

**Contrast, measured:**

| Theme | Surface | Foreground | Ratio | Muted | Ratio |
|---|---|---|---|---|---|
| light | `#0F0E0B` | `#FFFFFF` | 19.30 | `#A9A8A1` | 8.09 |
| dark | `#272621` | `#F2F2EF` | 13.51 | `#A9A8A1` | 6.35 |

All above the 4.5 AA threshold for body text, so the muted token is safe for
eyebrows and secondary lines rather than decorative only.

**Revisit if:** a third weight is needed between `surface` and `surfaceInverse`.
That would be a `surfaceRaised`, not a change here.

---

## 0007 — Per-world accent, starting with Artist Laser
**Date:** 2026-08 · **Status:** adopted

Add a second accent ramp and a mechanism for selecting it per world, rather than
changing the shared accent.

```
color.accentLaser.50   #FDF7F7      500  #BB2F2F   <- light accent
color.accentLaser.100  #F9E9E9      600  #A12828
color.accentLaser.200  #F4D4D4      700  #882222
color.accentLaser.300  #E59999  <-  800  #6D1B1B
color.accentLaser.400  #D75D5D      900  #561515
                       dark accent
```

Selected by scope, so nothing at a call site changes:

```css
[data-world="artist-laser"] {
  --accent:        var(--color-accent-laser-500);
  --accent-hover:  var(--color-accent-laser-600);
  --accent-subtle: var(--color-accent-laser-50);
  --focus-ring:    var(--color-accent-laser-400);
}
```

**Why:** 0002 anticipated this — "a project genuinely needs a different visual
identity, at which point it gets its own accent and display face, still through
the same roles." Artist Laser is that project. Its logo is black with a red
mark, and the ochre accent actively fights it. 0005 left open whether the worlds
share one accent; this proposes they do not, while keeping one system.

**Where the red came from:** sampled from the logo file, not chosen. The mark is
a flat `#FF6060` across 4,629 pixels — a real brand value rather than
anti-aliasing. That colour is too light to carry text: 3.0 against white, below
the 4.5 AA threshold. So it sets the hue, and the ramp is built around it.

**How the ramp was built:** the two steps the semantic layer actually uses were
solved to match the ochre's contrast exactly, so the mapping stays identical and
nothing downstream has to special-case a world.

| Step | Hex | On white | On `#0F0E0B` | |
|---|---|---|---|---|
| 300 | `#E59999` | 2.25 | **8.59** | dark accent — ochre's is 8.56 |
| 400 | `#D75D5D` | 3.74 | 5.16 | focus ring |
| 500 | `#BB2F2F` | **5.90** | 3.27 | light accent — ochre's is 5.89 |
| 600 | `#A12828` | 7.37 | 2.62 | hover |

**Rejected:** using the sampled `#FF6060` directly as `accentLaser.500`. It fails
AA on white, so every link and button in that world would have been below
threshold from day one.

**As built:** `worlds` is a section in `tokens.json`, so a world is data rather
than hand-written CSS. `build-tokens.mjs` emits the `[data-world]` block once per
theme scope, meaning a world tracks light and dark like everything else. Verified
in the browser: `--accent` resolves to `#8C5921` outside the world and `#BB2F2F`
inside it, and the measured contrast matches the table above exactly — 8.59:1 for
the accent on the dark ground, 13.51:1 for hero text on the inverse band.

The selector is an attribute rather than a class: it reads better in devtools and
cannot collide with a utility class.

**Revisit if:** a third world needs an accent. Two ramps is a pair; four is a
system that should probably generate ramps from a single hue input instead.
