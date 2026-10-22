import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import i18n from "../localization/i18n";
import { SPACING, RADIUS, TYPOGRAPHY, COLORS } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import { usePartnerMode } from "../context/HouseholdPartnerContext";
import CoupleHomeHero from "../components/home/CoupleHomeHero";
import GradientQuickActionCard from "../components/home/GradientQuickActionCard";
import PastelStatCard from "../components/home/PastelStatCard";
import { Task } from "../entities/Task";
import { ShoppingListItem } from "../entities/ShoppingListItem";
import { User } from "../entities/User";
import taskSchedulingService from "../services/taskSchedulingService";
import { getCurrentUser } from "../services/userService";
import { useTwoColumnGrid } from "../hooks/useTwoColumnGrid";
import { displayFirstName } from "../utils/displayName";
import { buildHouseholdEmailSet, taskBelongsToHousehold, shoppingItemBelongsToHousehold } from "../utils/taskFilters";

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    loading: partnerLoading,
    isPartnered,
    profile,
    userFirstName,
    partnerFirstName,
    partnerEmail,
    partnerProfile,
  } = usePartnerMode();

  const [loading, setLoading] = useState(true);
  const [taskFocus, setTaskFocus] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const grid = useTwoColumnGrid(SPACING.l, SPACING.m);
  const authEmail = getCurrentUser()?.email || "";
  const resolvedEmail = profile?.email || authEmail;
  const greetingName =
    userFirstName || displayFirstName(profile, authEmail, getCurrentUser()?.displayName);

  const loadDashboard = useCallback(async () => {
    try {
      const user = await User.me();
      const emailSet = buildHouseholdEmailSet(user.email, user.partner_email);

      const allTasks = await Task.filter({ is_archived: { "$ne": true } });
      const tasks = allTasks.filter((t) =>
        taskBelongsToHousehold(t, emailSet, { isPartnered })
      );
      const grouped = taskSchedulingService.groupTasksByUrgency(tasks);
      setTaskFocus(
        grouped.overdue.length +
          grouped.today.length +
          grouped.thisWeek.length +
          grouped.comingSoon.length
      );
      const completed = tasks.filter((t) => t.status === "completed").length;
      setCompletedCount(completed);
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      setCompletedThisWeek(
        tasks.filter((t) => {
          if (t.status !== "completed" || !t.completed_at) return false;
          return new Date(t.completed_at).getTime() >= weekAgo;
        }).length
      );

      const shopping = await ShoppingListItem.list("-created_date");
      const pending = shopping.filter(
        (item) =>
          !item.is_archived &&
          !item.is_purchased &&
          shoppingItemBelongsToHousehold(item, emailSet, { userUids: [user.uid] })
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

  const quickActions = useMemo(() => {
    const coupled = [
      {
        id: "grocery",
        featureKey: "grocery",
        icon: "shopping-cart",
        title: i18n.t("home.actions.grocery"),
        subtitle: i18n.t("home.actions.grocerySub"),
        screen: "ShoppingList",
        partnerOnly: false,
      },
      {
        id: "dateNight",
        featureKey: "dateNight",
        icon: "event",
        title: i18n.t("home.actions.dateNight"),
        subtitle: i18n.t("home.actions.dateNightSub"),
        screen: "Events",
        partnerOnly: true,
      },
      {
        id: "tasks",
        featureKey: "tasks",
        icon: "check-circle",
        title: i18n.t("home.actions.completeTasks"),
        subtitle: i18n.t("home.actions.completeTasksSub"),
        screen: "DailyTasks",
        partnerOnly: false,
      },
      {
        id: "kudos",
        featureKey: "kudos",
        icon: "star",
        title: i18n.t("home.actions.kudos"),
        subtitle: i18n.t("home.actions.kudosSub"),
        screen: "FourthTab",
        partnerOnly: true,
      },
      {
        id: "budget",
        featureKey: "budget",
        icon: "savings",
        title: i18n.t("home.actions.budget"),
        subtitle: i18n.t("home.actions.budgetSub"),
        screen: "Management",
        partnerOnly: true,
      },
      {
        id: "chat",
        featureKey: "chat",
        icon: "chat",
        title: i18n.t("home.actions.chat"),
        subtitle: i18n.t("home.actions.chatSub"),
        screen: "Sharing",
        partnerOnly: true,
      },
    ];
    const soloFill = [
      {
        id: "planning",
        featureKey: "planning",
        icon: "event-note",
        title: i18n.t("navigation.drawer.taskPlanning"),
        subtitle: i18n.t("home.actions.planningSub"),
        screen: "TaskPlanning",
        partnerOnly: false,
      },
      {
        id: "inventory",
        featureKey: "inventory",
        icon: "inventory-2",
        title: i18n.t("navigation.drawer.inventory"),
        subtitle: i18n.t("home.actions.inventorySub"),
        screen: "Inventory",
        partnerOnly: false,
      },
      {
        id: "shoppingMode",
        featureKey: "shoppingMode",
        icon: "shopping-bag",
        title: i18n.t("navigation.drawer.shoppingMode"),
        subtitle: i18n.t("home.actions.shoppingModeSub"),
        screen: "ShoppingMode",
        partnerOnly: false,
      },
      {
        id: "eventsSolo",
        featureKey: "events",
        icon: "calendar-today",
        title: i18n.t("navigation.drawer.events"),
        subtitle: i18n.t("home.actions.eventsSub"),
        screen: "Events",
        partnerOnly: false,
      },
    ];
    let list = coupled.filter((a) => !a.partnerOnly || isPartnered);
    if (!isPartnered) {
      const ids = new Set(list.map((a) => a.id));
      for (const item of soloFill) {
        if (list.length >= 6) break;
        if (!ids.has(item.id)) list.push(item);
      }
    }
    return list.slice(0, 6);
  }, [isPartnered]);

  const handleNavigate = (screen, params) => {
    try {
      if (["Home", "DailyTasks", "Settings", "FourthTab"].includes(screen)) {
        navigation.navigate(screen, params);
        return;
      }
      navigation.getParent()?.navigate(screen, params);
    } catch (error) {
      console.error(`Navigation error: ${screen}`, error);
    }
  };

  const openDrawer = () => {
    try {
      navigation.getParent()?.getParent()?.openDrawer?.();
    } catch {
      /* optional */
    }
  };

  const tipText = isPartnered ? i18n.t("home.tipCouple") : i18n.t("home.tipSolo");

  if (loading || partnerLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>{i18n.t("common.loading")}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <CoupleHomeHero
        isPartnered={isPartnered}
        userFirstName={greetingName}
        partnerFirstName={partnerFirstName}
        userEmail={resolvedEmail}
        userFullName={profile?.full_name}
        partnerFullName={partnerProfile?.full_name}
        partnerEmail={partnerEmail}
        completedCount={completedCount}
        onOpenMenu={openDrawer}
        onNotifications={() => handleNavigate("Settings")}
        onInvitePartner={() => handleNavigate("Settings")}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{i18n.t("home.quickActions")}</Text>
          <TouchableOpacity onPress={openDrawer}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>{i18n.t("home.seeAll")}</Text>
          </TouchableOpacity>
        </View>

        <View style={[grid.containerStyle, styles.gridBlock]}>
          {quickActions.map((action) => (
            <GradientQuickActionCard
              key={action.id}
              width={grid.cardWidth}
              featureKey={action.featureKey}
              icon={action.icon}
              title={action.title}
              subtitle={action.subtitle}
              onPress={() => handleNavigate(action.screen)}
            />
          ))}
        </View>

        <View style={[grid.containerStyle, styles.gridBlock]}>
          <PastelStatCard
            width={grid.cardWidth}
            pastel="pink"
            icon="event"
            iconColor={isDark ? COLORS.pastelPink : COLORS.accentPink}
            title={i18n.t("home.statTasksTitle", { count: taskFocus })}
            subtitle={i18n.t("home.statTasksSub")}
            onPress={() => handleNavigate("DailyTasks")}
          />
          <PastelStatCard
            width={grid.cardWidth}
            pastel="teal"
            icon="emoji-events"
            iconColor={colors.primary}
            title={i18n.t("home.statWeekTitle")}
            subtitle={i18n.t("home.statWeekSub", { count: completedThisWeek })}
            onPress={() => handleNavigate("Management")}
          />
        </View>

        <LinearGradient
          colors={isDark ? [COLORS.pastelPurpleDark, COLORS.dark.surface] : [COLORS.pastelPurple, COLORS.pastelPink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tipCard}
        >
          <Icon name="star" size={28} color={colors.primary} />
          <View style={styles.tipBody}>
            <Text style={[styles.tipTitle, { color: colors.text }]}>{i18n.t("home.tipTitle")}</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tipText}</Text>
          </View>
          {isPartnered ? <Icon name="favorite" size={24} color={colors.primary} /> : null}
        </LinearGradient>
      </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: SPACING.xxxl + 72,
    },
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    sheet: {
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      marginTop: -SPACING.l,
      paddingHorizontal: SPACING.l,
      paddingTop: SPACING.l,
      paddingBottom: SPACING.l,
    },
    sectionHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.m,
    },
    sectionTitle: {
      ...TYPOGRAPHY.h2,
      fontSize: 18,
    },
    seeAll: {
      ...TYPOGRAPHY.label,
      fontWeight: "700",
    },
    gridBlock: {
      marginBottom: SPACING.xl,
    },
    tipCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.m,
      borderRadius: RADIUS.l,
      padding: SPACING.l,
    },
    tipBody: {
      flex: 1,
    },
    tipTitle: {
      ...TYPOGRAPHY.h3,
      marginBottom: 4,
    },
    tipText: {
      ...TYPOGRAPHY.bodySmall,
    },
  });
