// GENERATED FILE — do not edit.
// Source: tokens/tokens.json — regenerate with `node scripts/build-tokens.mjs`

import SwiftUI

public enum DS {

    // MARK: - Type scale
    public enum TextSize {
        public static let s3xs: CGFloat = 11
        public static let s2xs: CGFloat = 12
        public static let xs: CGFloat = 13
        public static let sm: CGFloat = 14
        public static let base: CGFloat = 16
        public static let md: CGFloat = 18
        public static let lg: CGFloat = 21
        public static let xl: CGFloat = 24
        public static let s2xl: CGFloat = 30
        public static let s3xl: CGFloat = 36
        public static let s4xl: CGFloat = 48
        public static let s5xl: CGFloat = 60
    }

    // MARK: - Line height multipliers
    public enum Leading {
        public static let display: CGFloat = 1.1
        public static let heading: CGFloat = 1.25
        public static let ui: CGFloat = 1.45
        public static let body: CGFloat = 1.65
        public static let tight: CGFloat = 1.2
    }

    // MARK: - Spacing
    public enum Space {
        public static let s0: CGFloat = 0
        public static let s1: CGFloat = 2
        public static let s2: CGFloat = 4
        public static let s3: CGFloat = 8
        public static let s4: CGFloat = 12
        public static let s5: CGFloat = 16
        public static let s6: CGFloat = 24
        public static let s7: CGFloat = 32
        public static let s8: CGFloat = 48
        public static let s9: CGFloat = 64
        public static let s10: CGFloat = 96
    }

    // MARK: - Radius
    public enum Radius {
        public static let none: CGFloat = 0
        public static let sm: CGFloat = 2
        public static let md: CGFloat = 4
        public static let lg: CGFloat = 8
        public static let xl: CGFloat = 12
        public static let full: CGFloat = 9999
    }

    // MARK: - Constraints
    public enum Constraint {
        public static let uiFontMinSize: CGFloat = 13
        public static let touchTargetMin: CGFloat = 44
    }

    // MARK: - Motion (seconds)
    public enum Motion {
        public static let durationFast: Double = 0.12
        public static let durationBase: Double = 0.2
        public static let durationSlow: Double = 0.32
    }

    // MARK: - Palette
    public enum Palette {
        public static let neutral0 = Color(hex: "#FFFFFF")
        public static let neutral50 = Color(hex: "#FAFAF8")
        public static let neutral100 = Color(hex: "#F2F2EF")
        public static let neutral200 = Color(hex: "#E4E3DE")
        public static let neutral300 = Color(hex: "#CFCEC8")
        public static let neutral400 = Color(hex: "#A9A8A1")
        public static let neutral500 = Color(hex: "#78776F")
        public static let neutral600 = Color(hex: "#575650")
        public static let neutral700 = Color(hex: "#3D3C37")
        public static let neutral800 = Color(hex: "#272621")
        public static let neutral900 = Color(hex: "#181713")
        public static let neutral950 = Color(hex: "#0F0E0B")
        public static let accent50 = Color(hex: "#FBF5EC")
        public static let accent100 = Color(hex: "#F3E5D0")
        public static let accent200 = Color(hex: "#E4C69C")
        public static let accent300 = Color(hex: "#D2A567")
        public static let accent400 = Color(hex: "#B9803A")
        public static let accent500 = Color(hex: "#8C5921")
        public static let accent600 = Color(hex: "#73481B")
        public static let accent700 = Color(hex: "#5A3815")
        public static let accent800 = Color(hex: "#402710")
        public static let accent900 = Color(hex: "#2A1A0A")
        public static let success = Color(hex: "#3F6F44")
        public static let warning = Color(hex: "#B9803A")
        public static let danger = Color(hex: "#9E3B2C")
        public static let info = Color(hex: "#3A5F7D")
        public static let accentLaser50 = Color(hex: "#FDF7F7")
        public static let accentLaser100 = Color(hex: "#F9E9E9")
        public static let accentLaser200 = Color(hex: "#F4D4D4")
        public static let accentLaser300 = Color(hex: "#E59999")
        public static let accentLaser400 = Color(hex: "#D75D5D")
        public static let accentLaser500 = Color(hex: "#BB2F2F")
        public static let accentLaser600 = Color(hex: "#A12828")
        public static let accentLaser700 = Color(hex: "#882222")
        public static let accentLaser800 = Color(hex: "#6D1B1B")
        public static let accentLaser900 = Color(hex: "#561515")
    }

    // MARK: - Semantic colors (adaptive)
    public enum Semantic {
        public static let bg = Color(light: "#FFFFFF", dark: "#0F0E0B")
        public static let bgSubtle = Color(light: "#FAFAF8", dark: "#181713")
        public static let bgMuted = Color(light: "#F2F2EF", dark: "#272621")
        public static let surface = Color(light: "#FFFFFF", dark: "#181713")
        public static let border = Color(light: "#E4E3DE", dark: "#272621")
        public static let borderStrong = Color(light: "#CFCEC8", dark: "#3D3C37")
        public static let fgPrimary = Color(light: "#181713", dark: "#F2F2EF")
        public static let fgSecondary = Color(light: "#575650", dark: "#A9A8A1")
        public static let fgMuted = Color(light: "#78776F", dark: "#78776F")
        public static let fgInverse = Color(light: "#FFFFFF", dark: "#0F0E0B")
        public static let accent = Color(light: "#8C5921", dark: "#D2A567")
        public static let accentHover = Color(light: "#73481B", dark: "#E4C69C")
        public static let accentSubtle = Color(light: "#FBF5EC", dark: "#2A1A0A")
        public static let focusRing = Color(light: "#B9803A", dark: "#D2A567")
        public static let surfaceInverse = Color(light: "#0F0E0B", dark: "#272621")
        public static let fgOnInverse = Color(light: "#FFFFFF", dark: "#F2F2EF")
        public static let fgOnInverseMuted = Color(light: "#A9A8A1", dark: "#A9A8A1")
        public static let borderOnInverse = Color(light: "#3D3C37", dark: "#575650")
    }
}
