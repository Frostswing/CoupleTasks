import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import i18n from "../localization/i18n";
import { SPACING, RADIUS, TYPOGRAPHY, COLORS } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import { usePartnerMode } from "../context/HouseholdPartnerContext";
import PremiumScreenShell from "../components/premium/PremiumScreenShell";
import PremiumCard from "../components/premium/PremiumCard";
import PressableScale from "../components/premium/PressableScale";
import ProgressRing from "../components/premium/ProgressRing";
import CoupleHomeHero from "../components/home/CoupleHomeHero";
import { Task } from "../entities/Task";
import { ShoppingListItem } from "../entities/ShoppingListItem";
import { User } from "../entities/User";
import taskSchedulingService from "../services/taskSchedulingService";

export default function HomeScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    loading: partnerLoading,
    isPartnered,
    profile,
    userFirstName,
    partnerFirstName,
    partnerEmail,
  } = usePartnerMode();

  const [loading, setLoading] = useState(true);
  const [taskFocus, setTaskFocus] = useState(0);
  const [taskDoneRatio, setTaskDoneRatio] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [shoppingPending, setShoppingPending] = useState(0);

  const loadDashboard = useCallback(async () => {
    try {
      const user = await User.me();
      const userEmails = [user.email];
      if (user.partner_email) userEmails.push(user.partner_email);

      const allTasks = await Task.filter({ is_archived: { "$ne": true } });
      const tasks = allTasks.filter((t) => {
        if (userEmails.includes(t.assigned_to)) return true;
        if (isPartnered && t.assigned_to === "together") return true;
        if (!t.assigned_to) return true;
        return userEmails.includes(t.created_by);
      });
      const grouped = taskSchedulingService.groupTasksByUrgency(tasks);
      setTaskFocus(
        grouped.overdue.length +
          grouped.today.length +
          grouped.thisWeek.length +
          grouped.comingSoon.length
      );
      const completed = tasks.filter((t) => t.status === "completed").length;
      setCompletedCount(completed);
      setTaskDoneRatio(tasks.length ? completed / tasks.length : 0);

      const shopping = await ShoppingListItem.list("-created_date");
      const pending = shopping.filter(
        (item) =>
          !item.is_archived &&
          !item.is_purchased &&
          (userEmails.includes(item.created_by) || userEmails.includes(item.added_by))
      );
      setShoppingPending(pending.length);
    } catch (e) {
      console.error("Home dashboard load", e);
    } finally {
      setLoading(false);
    }
  }, [isPartnered]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const quickActions = useMemo(
    () =>
      [
        {
          id: "dailyTasks",
          title: i18n.t("navigation.drawer.dailyTasks"),
          description: "Today's focus",
          icon: "today",
          screen: "DailyTasks",
        },
        {
          id: "shoppingList",
          title: i18n.t("navigation.drawer.shoppingList"),
          description: "List & aisles",
          icon: "shopping-cart",
          screen: "ShoppingList",
        },
        {
          id: "events",
          title: i18n.t("navigation.drawer.events"),
          description: isPartnered ? "Calendar & invites" : "Your calendar",
          icon: "event",
          screen: "Events",
        },
        {
          id: "taskPlanning",
          title: i18n.t("navigation.drawer.taskPlanning"),
          description: "Plan ahead",
          icon: "event-note",
          screen: "TaskPlanning",
        },
        {
          id: "inventory",
          title: i18n.t("navigation.drawer.inventory"),
          description: "Stock levels",
          icon: "inventory-2",
          screen: "Inventory",
        },
        {
          id: "management",
          title: i18n.t("navigation.drawer.management"),
          description: "Insights",
          icon: "insights",
          screen: "Management",
        },
      ].filter((a) => !a.partnerOnly),
    [isPartnered]
  );

  const openDrawer = () => {
    try {
      navigation.getParent()?.openDrawer?.();
    } catch {
      /* drawer optional */
    }
  };

  const handleNavigate = (screen, params) => {
    try {
      navigation.navigate(screen, params);
    } catch (error) {
      console.error(`Navigation error: ${screen}`, error);
    }
  };

  const heroSlot = (
    <View style={styles.heroRow}>
      <ProgressRing
        onHero
        progress={taskDoneRatio}
        label={`${Math.round(taskDoneRatio * 100)}%`}
        size={64}
      />
      <View style={styles.heroActions}>
        <PressableScale onPress={() => handleNavigate("AddTask")} style={styles.heroChip}>
          <Icon name="add-task" size={18} color={colors.textInverse} />
          <Text style={styles.heroChipText}>Add task</Text>
        </PressableScale>
        <PressableScale
          onPress={() => handleNavigate("ShoppingList", { openAddDialog: true })}
          style={[styles.heroChip, styles.heroChipGhost]}
        >
          <Icon name="add-shopping-cart" size={18} color={colors.textInverse} />
          <Text style={styles.heroChipText}>Add item</Text>
        </PressableScale>
      </View>
    </View>
  );

  const tipText = isPartnered ? i18n.t("home.tipCouple") : i18n.t("home.tipSolo");

  return (
    <PremiumScreenShell
      loading={loading || partnerLoading}
      loadingLabel={i18n.t("common.loading")}
      noHorizontalPadding
      contentStyle={styles.scrollContent}
    >
      <CoupleHomeHero
        isPartnered={isPartnered}
        userFirstName={userFirstName}
        partnerFirstName={partnerFirstName}
        userEmail={profile?.email}
        partnerEmail={partnerEmail}
        completedCount={completedCount}
        onOpenMenu={openDrawer}
        onNotifications={() => handleNavigate("Settings")}
        onInvitePartner={() => handleNavigate("Settings")}
      />

      <View style={styles.bodyPad}>
        <PremiumCard style={styles.statsCard}>
          {heroSlot}
          <View style={styles.inlineStats}>
            <View style={styles.inlineStat}>
              <Text style={[styles.statVal, { color: colors.text }]}>{taskFocus}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Focus</Text>
            </View>
            <View style={styles.inlineStat}>
              <Text style={[styles.statVal, { color: colors.text }]}>{shoppingPending}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>To buy</Text>
            </View>
          </View>
        </PremiumCard>

        <Text style={styles.sectionOverline}>Quick Access</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((action) => (
            <PressableScale
              key={action.id}
              onPress={() => handleNavigate(action.screen, action.params)}
              style={styles.gridItem}
            >
              <PremiumCard style={styles.actionCard} padded>
                <View style={[styles.actionIcon, { backgroundColor: colors.primaryMuted }]}>
                  <Icon name={action.icon} size={22} color={colors.primary} />
                </View>
                <Text style={[styles.actionTitle, { color: colors.text }]} numberOfLines={1}>
                  {action.title}
                </Text>
                <Text style={[styles.actionDesc, { color: colors.textTertiary }]} numberOfLines={2}>
                  {action.description}
                </Text>
              </PremiumCard>
            </PressableScale>
          ))}
        </View>

        <PremiumCard style={[styles.tipCard, { backgroundColor: colors.primaryMuted }]}>
          <Icon name="lightbulb-outline" size={22} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.text }]}>{tipText}</Text>
        </PremiumCard>

        <Text style={styles.sectionOverline}>More</Text>
        <PremiumCard>
          <View style={styles.moreRow}>
            {[
              { icon: "archive", label: "Archive", screen: "Archive" },
              { icon: "history", label: "History", screen: "History" },
              { icon: "settings", label: "Settings", screen: "Settings" },
            ].map((item) => (
              <PressableScale
                key={item.screen}
                onPress={() => handleNavigate(item.screen)}
                style={styles.moreItem}
              >
                <View style={[styles.moreIcon, { backgroundColor: colors.borderLight }]}>
                  <Icon name={item.icon} size={20} color={colors.textSecondary} />
                </View>
                <Text style={[styles.moreLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              </PressableScale>
            ))}
          </View>
        </PremiumCard>
      </View>
    </PremiumScreenShell>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    scrollContent: {
      paddingBottom: SPACING.xxxl,
    },
    bodyPad: {
      paddingHorizontal: SPACING.l,
    },
    statsCard: {
      marginBottom: SPACING.m,
    },
    heroRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.l,
      marginBottom: SPACING.m,
    },
    heroActions: {
      flex: 1,
      gap: SPACING.s,
    },
    heroChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.s,
      backgroundColor: colors.primaryMuted,
      paddingVertical: SPACING.s + 2,
      paddingHorizontal: SPACING.m,
      borderRadius: RADIUS.m,
    },
    heroChipGhost: {
      opacity: 0.92,
    },
    heroChipText: {
      ...TYPOGRAPHY.label,
      color: colors.primary,
      fontWeight: "600",
    },
    inlineStats: {
      flexDirection: "row",
      gap: SPACING.xl,
    },
    inlineStat: {
      alignItems: "flex-start",
    },
    statVal: {
      ...TYPOGRAPHY.h2,
    },
    statLbl: {
      ...TYPOGRAPHY.caption,
    },
    sectionOverline: {
      ...TYPOGRAPHY.overline,
      color: colors.textTertiary,
      marginBottom: SPACING.m,
      marginTop: SPACING.m,
    },
    actionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.s,
    },
    gridItem: {
      width: "48%",
      flexGrow: 1,
      minWidth: "46%",
    },
    actionCard: {
      minHeight: 108,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.m,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.s,
    },
    actionTitle: {
      ...TYPOGRAPHY.h3,
      fontSize: 15,
      marginBottom: 2,
    },
    actionDesc: {
      ...TYPOGRAPHY.caption,
    },
    tipCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.m,
      marginTop: SPACING.l,
    },
    tipText: {
      ...TYPOGRAPHY.bodySmall,
      flex: 1,
    },
    moreRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: SPACING.s,
    },
    moreItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: SPACING.s,
    },
    moreIcon: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.m,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.xs,
    },
    moreLabel: {
      ...TYPOGRAPHY.caption,
      fontWeight: "600",
    },
  });
