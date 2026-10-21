import { StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from "../../constants/theme";

/** Shared layout tokens for screens (modern minimal). */
export const screenStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  loading: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.l,
  },
  pageHeader: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.l,
    paddingBottom: SPACING.l,
  },
  pageTitle: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.xs,
  },
  pageSubtitle: {
    ...TYPOGRAPHY.bodySmall,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.l,
    ...SHADOWS.xs,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderRadius: RADIUS.m,
    gap: SPACING.s,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textInverse,
    fontWeight: "600",
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.l,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.l,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    paddingVertical: SPACING.m,
    color: COLORS.text,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.l,
    backgroundColor: COLORS.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.l,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.s,
    textAlign: "center",
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    fontSize: 15,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
  inputLabel: {
    ...TYPOGRAPHY.label,
    marginBottom: SPACING.s,
  },
});

export const LEGACY_ACCENT = COLORS.primary;
