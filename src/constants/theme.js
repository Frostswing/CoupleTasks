// CoupleTasks Modern Design System
// A calm, professional, minimal design with good contrast

export const COLORS = {
  // Primary - A sophisticated deep blue (the ONE accent color)
  primary: "#2563EB",
  primaryLight: "#3B82F6",
  primaryDark: "#1D4ED8",
  primaryMuted: "#DBEAFE",
  
  // Neutrals - Clean grayscale with warm undertones
  background: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  
  // Text hierarchy
  text: "#18181B",
  textSecondary: "#52525B",
  textTertiary: "#A1A1AA",
  textInverse: "#FFFFFF",
  
  // Borders and dividers
  border: "#E4E4E7",
  borderLight: "#F4F4F5",
  divider: "#E4E4E7",
  
  // Semantic colors (used sparingly)
  success: "#22C55E",
  successMuted: "#DCFCE7",
  warning: "#F59E0B",
  warningMuted: "#FEF3C7",
  error: "#EF4444",
  errorMuted: "#FEE2E2",

  /** Shared non-palette tokens (overlays, shadows) */
  shadow: "#000000",
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayMedium: "rgba(0, 0, 0, 0.6)",
  overlayHeavy: "rgba(0, 0, 0, 0.9)",
  overlayOnPrimary: "rgba(255, 255, 255, 0.2)",
  
  // Dark mode support
  dark: {
    background: "#18181B",
    surface: "#27272A",
    surfaceElevated: "#3F3F46",
    text: "#FAFAFA",
    textSecondary: "#A1A1AA",
    textTertiary: "#71717A",
    border: "#3F3F46",
    borderLight: "#27272A",
    primaryMuted: "#1E3A5F",
  }
};

/** Linear gradient color stops (e.g. IridescentGradient) */
export const GRADIENT_STOPS = {
  iridescent: {
    subtle: ["#DBEAFE", "#CCFBF1", "#B2F5EA"],
    vibrant: ["#2563EB", "#06B6D4", "#3B82F6", "#8B5CF6"],
    card: ["#2563EB", "#06B6D4", "#0EA5E9"],
    header: ["#1D4ED8", "#2563EB", "#06B6D4"],
    default: ["#2563EB", "#06B6D4", "#3B82F6"],
  },
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  full: 9999,
};

export const SHADOWS = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  // Display - for hero sections
  displayLarge: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 44,
    color: COLORS.text,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 36,
    color: COLORS.text,
  },
  // Headlines
  h1: {
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.2,
    lineHeight: 32,
    color: COLORS.text,
  },
  h2: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    color: COLORS.text,
  },
  h3: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
    color: COLORS.text,
  },
  // Body text
  bodyLarge: {
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 26,
    color: COLORS.text,
  },
  body: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
    color: COLORS.text,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  // Labels and captions
  label: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    letterSpacing: 0.2,
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    color: COLORS.textTertiary,
  },
  // Overline
  overline: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: COLORS.textTertiary,
  },
};

// Common component styles
export const COMPONENTS = {
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.l,
    padding: SPACING.l,
    ...SHADOWS.sm,
  },
  cardElevated: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.l,
    padding: SPACING.l,
    ...SHADOWS.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    fontSize: 15,
    color: COLORS.text,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSecondary: {
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.primaryMuted,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.primary,
  },
  chip: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.borderLight,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.textInverse,
  },
};

// Category colors - more muted, professional palette
export const CATEGORY_COLORS = {
  household: { bg: "#EFF6FF", text: "#1E40AF" },
  errands: { bg: "#F0FDF4", text: "#166534" },
  planning: { bg: "#F5F3FF", text: "#5B21B6" },
  finance: { bg: "#FFFBEB", text: "#B45309" },
  health: { bg: "#FFF1F2", text: "#BE123C" },
  social: { bg: "#FDF4FF", text: "#A21CAF" },
  personal: { bg: "#EFF6FF", text: "#1D4ED8" },
  other: { bg: "#F4F4F5", text: "#52525B" },
};

// Priority colors
export const PRIORITY_COLORS = {
  low: { bg: "#F4F4F5", text: "#52525B" },
  medium: { bg: "#FEF3C7", text: "#B45309" },
  high: { bg: "#FEE2E2", text: "#DC2626" },
};

// Status colors
export const STATUS_COLORS = {
  pending: { bg: "#F4F4F5", text: "#52525B", icon: "radio-button-unchecked" },
  in_progress: { bg: "#DBEAFE", text: "#2563EB", icon: "schedule" },
  completed: { bg: "#DCFCE7", text: "#16A34A", icon: "check-circle" },
};

/** Root screen background that respects ThemeContext `colors`. */
export function screenBackgroundStyle(colors) {
  return { backgroundColor: colors.background };
}

export default {
  COLORS,
  SPACING,
  RADIUS,
  SHADOWS,
  TYPOGRAPHY,
  COMPONENTS,
  CATEGORY_COLORS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  GRADIENT_STOPS,
  screenBackgroundStyle,
};
