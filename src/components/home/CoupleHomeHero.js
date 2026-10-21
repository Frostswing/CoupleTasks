import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COLORS,
  SPACING,
  RADIUS,
  TYPOGRAPHY,
  SHADOWS,
  getHeroGradient,
} from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import PartnerAvatar from "../premium/PartnerAvatar";
import PressableScale from "../premium/PressableScale";
import i18n from "../../localization/i18n";

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return i18n.t("home.greetingMorning");
  if (h < 17) return i18n.t("home.greetingAfternoon");
  return i18n.t("home.greetingEvening");
}

export default function CoupleHomeHero({
  isPartnered,
  userFirstName,
  partnerFirstName,
  userEmail,
  userFullName,
  partnerFullName,
  partnerEmail,
  completedCount,
  onOpenMenu,
  onNotifications,
  notificationCount = 0,
  onInvitePartner,
}) {
  const { isDark, colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const gradient = getHeroGradient(isDark);
  const displayUser =
    userFirstName?.trim() ||
    (userEmail?.includes("@") ? userEmail.split("@")[0] : "") ||
    i18n.t("home.fallbackName");
  const time = timeGreeting();
  const greetingLine =
    isPartnered && partnerFirstName
      ? `${time}, ${displayUser} & ${partnerFirstName}!`
      : `${time}, ${displayUser}!`;

  const statLine = isPartnered
    ? i18n.t("home.statCompletedTogether", { count: completedCount })
    : i18n.t("home.statCompletedSolo", { count: completedCount });

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + SPACING.m }]}
      >
        <View style={[styles.decor, styles.decorBlob, { top: -20, right: -30 }]} />
        <View style={[styles.decor, styles.decorBlobSm, { top: 90, left: -16 }]} />
        <View style={[styles.decor, styles.decorDot, { top: 100, left: 28 }]} />
        <View style={[styles.decor, styles.decorDot, { top: 64, right: 100 }]} />
        <View style={[styles.decor, styles.decorDot, styles.decorDotSm, { top: 120, right: 40 }]} />
        {isPartnered ? (
          <>
            <View style={[styles.decor, styles.decorHeart, { top: 48, right: 28 }]}>
              <Icon name="favorite" size={32} color={COLORS.heroTextSubtle} />
            </View>
            <View style={[styles.decor, styles.decorHeart, { top: 88, right: 56, opacity: 0.25 }]}>
              <Icon name="favorite" size={18} color={COLORS.heroTextSubtle} />
            </View>
          </>
        ) : null}

        <View style={styles.topRow}>
          <View style={styles.avatarRow}>
            <PartnerAvatar email={userEmail} fullName={userFullName} size={44} variant="primary" />
            {isPartnered && partnerEmail ? (
              <View style={styles.avatarOverlap}>
                <PartnerAvatar
                  email={partnerEmail}
                  fullName={partnerFullName}
                  size={44}
                  variant="partner"
                />
              </View>
            ) : null}
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity
              onPress={onNotifications}
              style={styles.iconBtn}
              accessibilityLabel={i18n.t("home.notifications")}
            >
              <Icon name="notifications-none" size={24} color={COLORS.heroText} />
              {notificationCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationCount > 9 ? "9+" : notificationCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity onPress={onOpenMenu} style={styles.iconBtn} accessibilityRole="button">
              <Icon name="menu" size={26} color={COLORS.heroText} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.greetingNames}>{greetingLine}</Text>
        <Text style={styles.statLine}>{statLine}</Text>
      </LinearGradient>

      {!isPartnered && onInvitePartner ? (
        <PressableScale onPress={onInvitePartner} style={styles.inviteWrap}>
          <View
            style={[
              styles.inviteCard,
              SHADOWS.sm,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.inviteIcon, { backgroundColor: COLORS.primaryMuted }]}>
              <Icon name="person-add" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.inviteBody}>
              <Text style={[styles.inviteTitle, { color: colors.text }]}>
                {i18n.t("home.invitePartnerTitle")}
              </Text>
              <Text style={[styles.inviteSubtitle, { color: colors.textSecondary }]}>
                {i18n.t("home.invitePartnerSubtitle")}
              </Text>
            </View>
            <Icon name="chevron-right" size={22} color={COLORS.textTertiary} />
          </View>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SPACING.m,
  },
  hero: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  decor: {
    position: "absolute",
    opacity: 0.35,
  },
  decorHeart: {
    opacity: 0.5,
  },
  decorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.heroText,
  },
  decorDotSm: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  decorBlob: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.overlayOnPrimary,
    opacity: 0.35,
  },
  decorBlobSm: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.overlayOnPrimary,
    opacity: 0.28,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.l,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarOverlap: {
    marginLeft: -SPACING.m,
    borderWidth: 2,
    borderColor: COLORS.heroText,
    borderRadius: RADIUS.full,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
  },
  iconBtn: {
    padding: SPACING.s,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textInverse,
  },
  greeting: {
    ...TYPOGRAPHY.caption,
    color: COLORS.heroTextMuted,
    marginBottom: SPACING.xxs,
  },
  greetingNames: {
    ...TYPOGRAPHY.displayMedium,
    fontSize: 24,
    color: COLORS.heroText,
    marginBottom: SPACING.s,
  },
  statLine: {
    ...TYPOGRAPHY.body,
    color: COLORS.heroTextMuted,
  },
  inviteWrap: {
    paddingHorizontal: SPACING.l,
    marginTop: -SPACING.m,
  },
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.l,
    padding: SPACING.l,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    gap: SPACING.m,
  },
  inviteIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.m,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteBody: {
    flex: 1,
  },
  inviteTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: 2,
  },
  inviteSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});
