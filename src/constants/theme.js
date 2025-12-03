export const COLORS = {
  // Primary Brand Colors (Teal/Cyan based)
  primary: "#0D9488", // Teal 600
  primaryLight: "#14B8A6", // Teal 500
  primaryDark: "#0F766E", // Teal 700
  primaryBg: "#CCFBF1", // Teal 100
  
  // Secondary Brand Colors (Purple/Pink based for accents)
  secondary: "#7C3AED", // Violet 600
  secondaryLight: "#8B5CF6", // Violet 500
  secondaryDark: "#6D28D9", // Violet 700
  secondaryBg: "#EDE9FE", // Violet 100
  
  // Accent Colors
  accent: "#EC4899", // Pink 500
  accentBg: "#FCE7F3", // Pink 100
  
  // Functional Colors
  success: "#10B981", // Emerald 500
  successBg: "#D1FAE5", // Emerald 100
  warning: "#F59E0B", // Amber 500
  warningBg: "#FEF3C7", // Amber 100
  error: "#EF4444", // Red 500
  errorBg: "#FEE2E2", // Red 100
  info: "#3B82F6", // Blue 500
  infoBg: "#DBEAFE", // Blue 100
  
  // Neutrals
  background: "#F8FAFC", // Slate 50
  surface: "#FFFFFF",
  text: "#1E293B", // Slate 800
  textSecondary: "#64748B", // Slate 500
  textTertiary: "#94A3B8", // Slate 400
  border: "#E2E8F0", // Slate 200
  divider: "#F1F5F9", // Slate 100
  
  // Gradients
  gradientPrimary: ["#0D9488", "#14B8A6", "#06B6D4"],
  gradientSecondary: ["#7C3AED", "#8B5CF6", "#A78BFA"],
  gradientAccent: ["#EC4899", "#F472B6", "#FB7185"],
  gradientDark: ["#1E293B", "#334155", "#475569"],
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  round: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
  },
  body: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
};

export default {
  COLORS,
  SPACING,
  RADIUS,
  SHADOWS,
  TYPOGRAPHY,
};
