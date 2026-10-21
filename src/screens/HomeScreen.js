import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import i18n from "../localization/i18n";
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

export default function HomeScreen({ navigation }) {
  const { colors } = useAppTheme();
  const quickActions = [
    {
      id: "dailyTasks",
      title: i18n.t("navigation.drawer.dailyTasks"),
      description: "View today's tasks and upcoming items",
      icon: "today",
      screen: "DailyTasks",
    },
    {
      id: "taskPlanning",
      title: i18n.t("navigation.drawer.taskPlanning"),
      description: "Plan and schedule your tasks",
      icon: "event-note",
      screen: "TaskPlanning",
    },
    {
      id: "shoppingList",
      title: i18n.t("navigation.drawer.shoppingList"),
      description: "Manage your shopping list",
      icon: "shopping-cart",
      screen: "ShoppingList",
    },
    {
      id: "inventory",
      title: i18n.t("navigation.drawer.inventory"),
      description: "Track household inventory",
      icon: "inventory-2",
      screen: "Inventory",
    },
    {
      id: "events",
      title: i18n.t("navigation.drawer.events"),
      description: "Partner events and availability",
      icon: "event",
      screen: "Events",
    },
    {
      id: "management",
      title: i18n.t("navigation.drawer.management"),
      description: "Statistics and insights",
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

  const renderQuickAction = (action, index) => (
    <TouchableOpacity
      key={action.id}
      style={styles.actionCard}
      onPress={() => handleNavigate(action.screen, action.params)}
      activeOpacity={0.7}
    >
      <View style={styles.actionIconContainer}>
        <Icon name={action.icon} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionDescription} numberOfLines={1}>
          {action.description}
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              {i18n.t("home.welcome")}
            </Text>
            <Text style={styles.heroSubtitle}>
              {i18n.t("home.subtitle")}
            </Text>
          </View>
        </View>

        {/* Quick Add Actions */}
        <View style={styles.quickAddRow}>
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => handleNavigate("AddTask")}
            activeOpacity={0.8}
          >
            <Icon name="add" size={20} color={COLORS.textInverse} />
            <Text style={styles.quickAddText}>Add Task</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickAddButton, styles.quickAddButtonSecondary]}
            onPress={() => handleNavigate("ShoppingList", { openAddDialog: true })}
            activeOpacity={0.8}
          >
            <Icon name="add-shopping-cart" size={20} color={COLORS.primary} />
            <Text style={[styles.quickAddText, styles.quickAddTextSecondary]}>
              Add Item
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.actionsList}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Secondary Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => handleNavigate("Archive")}
            >
              <Icon name="archive" size={20} color={COLORS.textSecondary} />
              <Text style={styles.secondaryActionText}>Archive</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => handleNavigate("History")}
            >
              <Icon name="history" size={20} color={COLORS.textSecondary} />
              <Text style={styles.secondaryActionText}>History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => handleNavigate("Settings")}
            >
              <Icon name="settings" size={20} color={COLORS.textSecondary} />
              <Text style={styles.secondaryActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  hero: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  heroContent: {
    alignItems: "flex-start",
  },
  heroTitle: {
    ...TYPOGRAPHY.displayMedium,
    marginBottom: SPACING.s,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  quickAddRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
    gap: SPACING.m,
  },
  quickAddButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderRadius: RADIUS.m,
    gap: SPACING.s,
    ...SHADOWS.sm,
  },
  quickAddButtonSecondary: {
    backgroundColor: COLORS.primaryMuted,
  },
  quickAddText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textInverse,
    fontWeight: "600",
  },
  quickAddTextSecondary: {
    color: COLORS.primary,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.overline,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.m,
  },
  actionsList: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.s,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.l,
    paddingHorizontal: SPACING.l,
    borderRadius: RADIUS.m,
    ...SHADOWS.xs,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.m,
    backgroundColor: COLORS.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.l,
  },
  actionContent: {
    flex: 1,
    marginRight: SPACING.m,
  },
  actionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.xxs,
  },
  actionDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  secondaryActions: {
    flexDirection: "row",
    paddingHorizontal: SPACING.xl,
    gap: SPACING.m,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderRadius: RADIUS.m,
    gap: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryActionText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
  },
});
