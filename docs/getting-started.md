# Getting started

## Web (Astro / Next on Vercel)

```bash
npm i @fontsource-variable/jost @fontsource/spectral
```

Copy `web/tokens.css` and `web/base.css` into your project (or add this repo as a
git submodule and import from it). Then in your root layout:

```js
import "@fontsource-variable/jost";
import "@fontsource/spectral/400.css";
import "@fontsource/spectral/400-italic.css";
import "@fontsource/spectral/600.css";
import "./styles/tokens.css";
import "./styles/base.css";
```

Use tokens at call sites:

```css
.card {
  background: var(--surface);
  border: var(--border-hairline) solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}
.card h3 { font-size: var(--text-lg); }
.card p  { color: var(--fg-secondary); }
```

### With Tailwind

Point Tailwind's theme at the CSS variables rather than duplicating values:

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      fontFamily: {
        display: "var(--font-display)",
        ui: "var(--font-ui)",
        body: "var(--font-body)",
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        border: "var(--border)",
        fg: { DEFAULT: "var(--fg-primary)", secondary: "var(--fg-secondary)", muted: "var(--fg-muted)" },
        accent: { DEFAULT: "var(--accent)", hover: "var(--accent-hover)" },
      },
    },
  },
};
```

## Apple (SwiftUI, iOS + macOS)

```bash
bash scripts/fetch-fonts.sh
```

1. Drag the `.ttf` files into your target (Copy items if needed, check target membership).
2. Info.plist → `UIAppFonts` (iOS) or `ATSApplicationFontsPath` (macOS).
3. Add `apple/DesignTokens.swift` and `apple/Typography.swift` to the target.
4. Call `DS.Font.verifyRegistration()` once at launch in DEBUG.

```swift
VStack(alignment: .leading, spacing: DS.Space.s5) {
    Text("Sharp where it counts")
        .font(DS.TextStyle.displaySmall)
        .foregroundStyle(DS.Semantic.fgPrimary)

    Text("A typeface earns its keep in the places nobody looks.")
        .font(DS.TextStyle.bodyDefault)
        .foregroundStyle(DS.Semantic.fgSecondary)
}
.padding(DS.Space.s6)
.background(DS.Semantic.surface)
.clipShape(RoundedRectangle(cornerRadius: DS.Radius.lg))
```

## Changing a token

Edit `tokens/tokens.json`, then:

```bash
node scripts/build-tokens.mjs
```

Never edit `web/tokens.css` or `apple/DesignTokens.swift` directly — they are
regenerated and your change will be lost.
