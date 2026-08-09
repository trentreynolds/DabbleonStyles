# Typography

## The pairing

**Jost** (sans) + **Spectral** (serif). Both SIL Open Font License 1.1.

| | Jost | Spectral |
|---|---|---|
| Designer | Owen Earl / indestructible-type | Production Type |
| License | OFL 1.1 | OFL 1.1 |
| Format | Variable (`wght` 100–900) | Static weights |
| x-height | 0.460 em | 0.450 em |
| Ascender (`h`) | 0.780 em | 0.750 em |
| Descender (`p`) | −0.220 em | −0.230 em |
| Extender span | 1.000 em | 0.980 em |

Those numbers are why this pairing holds together. A serif set beside a sans at
the same point size will look mis-sized if its x-height differs much — the
lowercase is what the eye measures, not the em box. Spectral sits within 0.010 em
of Jost on x-height and 0.020 em on total extender span, so the two read as one
system rather than two fonts sharing a page.

For contrast, Faustina (x-height 0.494, span 0.864) was considered and rejected:
larger lowercase and much shorter extenders, so it reads bigger and denser than
Jost at the same size and needs opposite corrections to sit level.

## Roles

| Role | Face | Where |
|---|---|---|
| `display` | Jost SemiBold | Headlines, empty states, onboarding, marketing |
| `ui` | Jost Regular | Buttons, labels, nav, form fields, table headers |
| `body` | Spectral Regular | Paragraphs, articles, docs, anything read at length |
| `mono` | JetBrains Mono | Code, IDs, hashes, fixed-width figures |

The roles are the stable part. Faces can be swapped inside a role for a specific
project without touching any call site, which is the whole point of naming them
this way.

## Rules

1. **Nothing in `ui` goes below 13px.** Jost is geometric with tall extenders and
   a modest x-height; below 13px its counters close up and `Il1` becomes hard to
   tell apart. `DS.Font.ui()` clamps this in Swift; `--ui-font-min-size` documents
   it on web. If a design needs 11px UI text, change the design.
2. **Jost needs leading.** Those tall ascenders and descenders mean default line
   height looks cramped. Use `--leading-ui` (1.45) as the floor for Jost text,
   never the browser default.
3. **Tighten display tracking.** Jost's default spacing is generous at large
   sizes. `--tracking-display` (−0.02em) at 30px and above.
4. **Spectral carries the reading.** If a block runs more than about three lines,
   it belongs in `body`, not `ui`.
5. **Measure caps at ~68ch.** `--body-measure`. Longer lines cost more in
   comprehension than any font choice will win back.
6. **Two weights per face, maximum.** Jost 400/600, Spectral 400/600. Additional
   weights are a smell; use size and colour for hierarchy first.
7. **Tabular figures for anything in a column.** Both families support them.

## Font loading

**Web** — self-host through Fontsource (`npm i @fontsource-variable/jost
@fontsource/spectral`). Do not link `fonts.googleapis.com`: it is a
render-blocking third-party request, it leaks visitor IPs, and it gives you no
version pinning. See `web/fonts.css`.

**Apple** — run `bash scripts/fetch-fonts.sh`, add the `.ttf` files to the target,
register in Info.plist, then call `DS.Font.verifyRegistration()` once in DEBUG.
Silent fallback to the system font is the common failure and it looks *almost*
right, which makes it easy to ship by accident.

## Licensing

Both families are SIL Open Font License 1.1, verified against the upstream
`OFL.txt` in the Google Fonts repository. Permitted: commercial use, web
self-hosting, embedding in shipped iOS/macOS apps, modification, redistribution.
Required: keep the `OFL.txt` alongside the font files wherever they are
redistributed, and do not sell the font files on their own. No attribution in
your interface, no runtime pageview limits, no per-seat fees.

See `LICENSES.md` for the full statement.
