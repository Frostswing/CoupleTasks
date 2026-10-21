import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import i18n from "../localization/i18n";
import { SPACING, RADIUS, TYPOGRAPHY, COLORS } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import PremiumScreenShell from "../components/premium/PremiumScreenShell";
import PremiumCard from "../components/premium/PremiumCard";
import PressableScale from "../components/premium/PressableScale";
import ProgressRing from "../components/premium/ProgressRing";
import { Task } from "../entities/Task";
import { ShoppingListItem } from "../entities/ShoppingListItem";
import { User } from "../entities/User";
import taskSchedulingService from "../services/taskSchedulingService";

export default function HomeScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [taskFocus, setTaskFocus] = useState(0);
  const [taskDoneRatio, setTaskDoneRatio] = useState(0);
  const [shoppingPending, setShoppingPending] = useState(0);
  const [greeting, setGreeting] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const user = await User.me();
      const first = user?.full_name?.split(" ")[0];
      setGreeting(first ? `Hi, ${first}` : i18n.t("home.welcome"));

      const allTasks = await Task.filter({ is_archived: { "$ne": true } });
      const userEmails = [user.email];
      if (user.partner_email) userEmails.push(user.partner_email);
      const tasks = allTasks.filter((t) => {
        if (userEmails.includes(t.assigned_to)) return true;
        if (t.assigned_to === "together") return true;
        if (!t.assigned_to) return true;
        return userEmails.includes(t.created_by);
      });
      const grouped = taskSchedulingService.groupTasksByUrgency(tasks);
      const focus =
        grouped.overdue.length +
        grouped.today.length +
        grouped.thisWeek.length +
        grouped.comingSoon.length;
      setTaskFocus(focus);
      const completed = tasks.filter((t) => t.status === "completed").length;
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
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const quickActions = [
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
      description: "Calendar & invites",
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
  ];

  const handleNavigate = (screen, params) => {
    try {
      navigation.navigate(screen, params);
    } catch (error) {
      console.error(`Navigation error: ${screen}`, error);
    }
  };

  const heroSlot = (
    <View style={styles.heroRow}>
      <ProgressRing progress={taskDoneRatio} label={`${Math.round(taskDoneRatio * 100)}%`} size={64} />
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

  return (
    <PremiumScreenShell
      loading={loading}
      loadingLabel={i18n.t("common.loading")}
      title={greeting || i18n.t("home.welcome")}
      subtitle={i18n.t("home.subtitle")}
      heroStats={[
        { label: "Focus", value: String(taskFocus) },
        { label: "To buy", value: String(shoppingPending) },
      ]}
      heroSlot={heroSlot}
      contentStyle={styles.scrollContent}
    >
      <Text style={styles.sectionOverline}>Quick Access</Text>
      <View style={styles.actionList}>
        {quickActions.map((action) => (
          <PressableScale key={action.id} onPress={() => handleNavigate(action.screen, action.params)}>
            <PremiumCard style={styles.actionCard} padded>
              <View style={styles.actionRow}>
                <View style={[styles.actionIcon, { backgroundColor: colors.primaryMuted }]}>
                  <Icon name={action.icon} size={22} color={colors.primary} />
                </View>
                <View style={styles.actionBody}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
                  <Text style={[styles.actionDesc, { color: colors.textTertiary }]} numberOfLines={1}>
                    {action.description}
                  </Text>
                </View>
                <Icon name="chevron-right" size={22} color={colors.textTertiary} />
              </View>
            </PremiumCard>
          </PressableScale>
        ))}
      </View>

      <Text style={styles.sectionOverline}>More</Text>
      <PremiumCard>
        <View style={styles.moreRow}>
          {[
            { icon: "archive", label: "Archive", screen: "Archive" },
            { icon: "history", label: "History", screen: "History" },
            { icon: "settings", label: "Settings", screen: "Settings" },
          ].map((item) => (
            <PressableScale key={item.screen} onPress={() => handleNavigate(item.screen)} style={styles.moreItem}>
              <View style={[styles.moreIcon, { backgroundColor: colors.borderLight }]}>
                <Icon name={item.icon} size={20} color={colors.textSecondary} />
              </View>
              <Text style={[styles.moreLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            </PressableScale>
          ))}
        </View>
      </PremiumCard>
    </PremiumScreenShell>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    scrollContent: {
      paddingTop: SPACING.s,
    },
    sectionOverline: {
      ...TYPOGRAPHY.overline,
      color: colors.textTertiary,
      marginBottom: SPACING.m,
      marginTop: SPACING.m,
    },
    heroRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: SPACING.l,
      gap: SPACING.l,
    },
    heroActions: {
      flex: 1,
      gap: SPACING.s,
    },
    heroChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.s,
      backgroundColor: COLORS.overlayOnPrimary,
      paddingVertical: SPACING.s + 2,
      paddingHorizontal: SPACING.m,
      borderRadius: RADIUS.m,
    },
    heroChipGhost: {
      opacity: 0.85,
      backgroundColor: COLORS.overlayOnPrimary,
    },
    heroChipText: {
      ...TYPOGRAPHY.label,
      color: COLORS.textInverse,
      fontWeight: "600",
    },
    actionList: {
      gap: SPACING.s,
    },
    actionCard: {
      marginBottom: 0,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    actionIcon: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.m,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.m,
    },
    actionBody: {
      flex: 1,
      marginRight: SPACING.s,
    },
    actionTitle: {
      ...TYPOGRAPHY.h3,
      marginBottom: 2,
    },
    actionDesc: {
      ...TYPOGRAPHY.caption,
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
