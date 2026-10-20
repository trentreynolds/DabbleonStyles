# Figma

Design happens in Figma. The repo is what code reads. This page is how the two
stay in step — see decision 0009 for why it works this way round.

**Library file:** [Dabbleon Styles](https://www.figma.com/design/JPRTz3aj26m1mMIKfyG6it) —
every colour, size and text style as Figma variables and styles, plus the shared
elements (Button, Site Header, Site Footer, Project Card, Tabs, Gallery) on a
page each, shown on their own and at 390 / 768 / 1280 px.

## Who owns what

| Thing | Authored in | Code reads it from | How it moves |
|---|---|---|---|
| Colours, spacing, radii, borders, font sizes | **Figma** variables | `tokens/tokens.json` → generated CSS/Swift | Pull (below) — mechanical |
| Base text styles (Heading/H1, Body/Base …) | `tokens.json` (`typeScale`, `lineHeight`, `letterSpacing`) | same | Push only. A size change in Figma comes back through its font-size variable. |
| Component text styles (Heading/Card Title …) | Figma | `figma/text-styles.json` (a record), CSS modules | Recorded on every pull; Claude applies them when changing the component |
| Elements and layouts (Project Card, Header …) | Figma | the site's React + CSS modules | Claude reads the Figma component and edits the code — reviewed in a PR |

The join key between the two is the CSS custom property: every Figma variable
carries it as its code syntax (`var(--fg-primary)`), and
`scripts/figma/tokens-map.mjs` is the single mapping both directions use.

## Pull: Figma → repo

After changing variables in Figma, ask Claude to **"pull my Figma changes into
DabbleonStyles"**. Claude:

1. runs `scripts/figma/read.js` in the Figma file (read-only) and saves the
   result to `figma/snapshot.json`;
2. runs `node scripts/figma/apply.mjs` — a three-way merge against
   `figma/baseline.json` (Figma as of the last sync):
   - changed in Figma only → written to `tokens.json`;
   - changed in code only → kept; reported as "repo is ahead";
   - changed in both, differently → **conflict**, nothing applied until you
     decide (`--prefer=figma` / `--prefer=repo`);
   - a role set to a raw colour → rejected (roles must point at a palette colour);
   - a variable that is new in Figma → reported; added only with `--accept-new`
     (a new token is a system decision, CLAUDE.md rule 2);
3. regenerates `web/tokens.css` and `apple/DesignTokens.swift`, logs a draft
   entry in `docs/decisions.md` (fill in the *why*), and records component text
   styles in `figma/text-styles.json`;
4. pushes back (below) so Figma's derived values — e.g. Artist Laser modes that
   inherit a Dabbleon colour you just changed — are current, then
   `node scripts/figma/apply.mjs --record-push`;
5. opens a pull request with the report (`figma/last-sync.md`).

`--dry-run` shows the report without writing anything.

## Push: repo → Figma

When `tokens.json` changes in code, ask Claude to **"push DabbleonStyles to
Figma"**. Claude runs `node scripts/figma/build-push.mjs`, which writes
`figma/push.js`, runs that in the Figma file, then
`node scripts/figma/apply.mjs --record-push`.

The push creates or updates by name and never deletes, so every binding in the
file survives. **It refuses to run if Figma has edits that were never pulled** —
it lists them instead. Pull first. (`--force` discards them; only on purpose.)

## Elements

Elements don't sync mechanically. To change one:

1. Redesign the original component in the library (the one inside the dashed
   outline). Check it at all three widths on its page.
2. Ask Claude to **"apply the Project Card changes to dabbleon.com"** (or
   whichever element and site).
3. Claude reads the component from Figma, edits the React and CSS module using
   tokens only (the hard rules still apply), and opens a PR with screenshots of
   the real site at 390 / 768 / 1280 next to the Figma frames.

If a design needs a value no token has, Claude stops and asks, as always.

## Checks

```bash
node scripts/figma/selftest.mjs   # merge logic, against a throwaway copy
node scripts/figma/apply.mjs --dry-run
```
