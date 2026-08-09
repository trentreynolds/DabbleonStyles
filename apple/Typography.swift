//  Typography.swift
//  Hand-written companion to the generated DesignTokens.swift.
//
//  Setup, once per app target:
//    1. Run `bash scripts/fetch-fonts.sh` and drag the .ttf files into the
//       target (Copy items if needed, add to target membership).
//    2. Add the filenames to Info.plist under "Fonts provided by application"
//       (UIAppFonts on iOS, ATSApplicationFontsPath on macOS).
//    3. Call `DS.Font.verifyRegistration()` once in a DEBUG build to confirm
//       the names resolved — silent fallback to the system font is the single
//       most common bug here, and it looks almost right, which is worse.

import SwiftUI

#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

public extension DS {

    // MARK: - Semantic text styles
    //
    // Use these, not Font.custom, at call sites. Every size in the app should
    // trace back to DS.TextSize; if none fits, the design needs revisiting
    // before the token set does.

    enum Font {
        static let display  = "Jost"
        static let ui       = "Jost"
        static let body     = "Spectral"

        /// Headlines, empty states, onboarding.
        public static func display(_ size: CGFloat, weight: SwiftUI.Font.Weight = .semibold) -> SwiftUI.Font {
            .custom(display, size: size).weight(weight)
        }

        /// Buttons, labels, nav, form fields.
        /// Clamped at DS.Constraint.uiFontMinSize — Jost's counters close up below it.
        public static func ui(_ size: CGFloat, weight: SwiftUI.Font.Weight = .regular) -> SwiftUI.Font {
            .custom(ui, size: max(size, DS.Constraint.uiFontMinSize)).weight(weight)
        }

        /// Paragraphs, articles, anything read for more than a sentence.
        public static func body(_ size: CGFloat, weight: SwiftUI.Font.Weight = .regular) -> SwiftUI.Font {
            .custom(body, size: size).weight(weight)
        }

        /// Fails loudly in DEBUG if a family did not register.
        public static func verifyRegistration() {
            #if DEBUG
            for name in [display, body] {
                #if canImport(UIKit)
                let ok = UIFont(name: name, size: 12) != nil
                #elseif canImport(AppKit)
                let ok = NSFont(name: name, size: 12) != nil
                #else
                let ok = true
                #endif
                assert(ok, "DS: font '\(name)' is not registered — check target membership and Info.plist.")
            }
            #endif
        }
    }

    // MARK: - Ready-made styles

    enum TextStyle {
        public static var displayLarge: SwiftUI.Font { Font.display(TextSize.s4xl) }
        public static var displayMedium: SwiftUI.Font { Font.display(TextSize.s3xl) }
        public static var displaySmall: SwiftUI.Font { Font.display(TextSize.s2xl) }

        public static var headline: SwiftUI.Font { Font.display(TextSize.xl) }
        public static var subheadline: SwiftUI.Font { Font.ui(TextSize.md, weight: .medium) }

        public static var bodyLarge: SwiftUI.Font { Font.body(TextSize.md) }
        public static var bodyDefault: SwiftUI.Font { Font.body(TextSize.base) }
        public static var bodySmall: SwiftUI.Font { Font.body(TextSize.sm) }

        public static var label: SwiftUI.Font { Font.ui(TextSize.sm, weight: .medium) }
        public static var caption: SwiftUI.Font { Font.ui(TextSize.xs) }
        public static var eyebrow: SwiftUI.Font { Font.ui(TextSize.xs, weight: .semibold) }
    }
}

// MARK: - Color helpers

public extension Color {

    /// Hex initialiser used by the generated token file. Accepts "#RRGGBB".
    init(hex: String) {
        let s = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
        var v: UInt64 = 0
        Scanner(string: s).scanHexInt64(&v)
        self.init(
            .sRGB,
            red:   Double((v >> 16) & 0xFF) / 255,
            green: Double((v >> 8) & 0xFF) / 255,
            blue:  Double(v & 0xFF) / 255,
            opacity: 1
        )
    }

    /// Adaptive colour that resolves per colour scheme, used by DS.Semantic.
    init(light: String, dark: String) {
        #if canImport(UIKit)
        self.init(UIColor { trait in
            UIColor(Color(hex: trait.userInterfaceStyle == .dark ? dark : light))
        })
        #elseif canImport(AppKit)
        self.init(nsColor: NSColor(name: nil) { appearance in
            let isDark = appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua
            return NSColor(Color(hex: isDark ? dark : light))
        })
        #else
        self.init(hex: light)
        #endif
    }
}

// MARK: - View sugar

public extension View {
    /// Applies a semantic style and the matching line spacing in one call.
    func dsText(_ font: SwiftUI.Font, leading: CGFloat = DS.Leading.ui, size: CGFloat = DS.TextSize.base) -> some View {
        self.font(font).lineSpacing(size * (leading - 1))
    }
}
