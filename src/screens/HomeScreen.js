import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import i18n from "../localization/i18n";
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from "../constants/theme";

export default function HomeScreen({ navigation }) {
  // Quick action cards configuration - ordered by priority (most used at top)
  const quickActions = [
    {
      id: "events",
      title: i18n.t("navigation.drawer.events"),
      description: "Manage partner events and availability",
      icon: "event",
      color: COLORS.accent,
      backgroundColor: COLORS.accentBg,
      screen: "Events",
      size: "large",
      gradient: COLORS.gradientAccent,
    },
    {
      id: "dailyTasks",
      title: i18n.t("navigation.drawer.dailyTasks"),
      description: "See what's due today and this week",
      icon: "today",
      color: COLORS.primaryLight,
      backgroundColor: COLORS.primaryBg,
      screen: "DailyTasks",
      size: "small",
    },
    {
      id: "addShoppingItem",
      title: i18n.t("home.addShoppingItem"),
      description: i18n.t("home.addShoppingItemDescription"),
      icon: "add-shopping-cart",
      color: COLORS.info,
      backgroundColor: COLORS.infoBg,
      screen: "ShoppingList",
      params: { openAddDialog: true },
      size: "small",
    },
    {
      id: "taskPlanning",
      title: i18n.t("navigation.drawer.taskPlanning"),
      description: "Plan your tasks on calendar",
      icon: "event",
      color: COLORS.primary,
      backgroundColor: COLORS.primaryBg,
      screen: "TaskPlanning",
      size: "small",
    },
    {
      id: "addTask",
      title: i18n.t("navigation.drawer.addTask"),
      description: "Create a new task quickly",
      icon: "add-circle",
      color: COLORS.primaryLight,
      backgroundColor: COLORS.primaryBg,
      screen: "AddTask",
      size: "small",
    },
    {
      id: "shoppingList",
      title: i18n.t("navigation.drawer.shoppingList"),
      description: "Manage your shopping items",
      icon: "shopping-cart",
      color: COLORS.info,
      backgroundColor: COLORS.infoBg,
      screen: "ShoppingList",
      size: "small",
    },
    {
      id: "shoppingMode",
      title: i18n.t("navigation.drawer.shoppingMode"),
      description: "Guided shopping flow",
      icon: "shopping-bag",
      color: COLORS.secondary,
      backgroundColor: COLORS.secondaryBg,
      screen: "ShoppingMode",
      size: "small",
    },
    {
      id: "inventory",
      title: i18n.t("navigation.drawer.inventory"),
      description: "Track household items",
      icon: "inventory-2",
      color: COLORS.success,
      backgroundColor: COLORS.successBg,
      screen: "Inventory",
      size: "large",
    },
    {
      id: "history",
      title: i18n.t("navigation.drawer.history"),
      description: "View completion stats",
      icon: "history",
      color: COLORS.warning,
      backgroundColor: COLORS.warningBg,
      screen: "History",
      size: "small",
    },
    {
      id: "management",
      title: i18n.t("navigation.drawer.management"),
      description: "Comprehensive statistics and analytics dashboard",
      icon: "analytics",
      color: COLORS.primaryLight,
      backgroundColor: COLORS.primaryBg,
      screen: "Management",
      size: "large",
      gradient: COLORS.gradientPrimary,
    },
  ];

  const handleNavigate = (screen, params) => {
    try {
      if (params) {
        navigation.navigate(screen, params);
      } else {
        navigation.navigate(screen);
      }
    } catch (error) {
      console.error(`Error navigating to ${screen}:`, error);
    }
  };

  const renderCard = (action) => {
    const isLarge = action.size === "large";
    const isInventory = action.id === "inventory";
    return (
      <TouchableOpacity
        key={action.id}
        style={[
          styles.card,
          isLarge ? styles.cardLarge : styles.cardSmall,
        ]}
        onPress={() => handleNavigate(action.screen, action.params)}
        activeOpacity={0.7}
      >
        {isLarge && !isInventory ? (
          // Large card layout: centered icon and content with gradient
          <LinearGradient
            colors={action.gradient || COLORS.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardLargeContainer}>
              <View
                style={[
                  styles.cardIconContainer,
                  styles.cardIconContainerLarge,
                  { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                ]}
              >
                <Icon name={action.icon} size={48} color="#FFFFFF" />
              </View>
              <View style={styles.cardContentLarge}>
                <Text style={styles.cardTitleLargeWhite} numberOfLines={2}>
                  {action.title}
                </Text>
                <Text style={styles.cardDescriptionLargeWhite} numberOfLines={2}>
                  {action.description}
                </Text>
              </View>
            </View>
            <View style={styles.cardArrow}>
              <Icon name="arrow-forward" size={20} color="#FFFFFF" />
            </View>
          </LinearGradient>
        ) : isLarge && isInventory ? (
          // Large card layout without gradient for inventory
          <>
            <View style={styles.cardLargeContainer}>
              <View
                style={[
                  styles.cardIconContainer,
                  { backgroundColor: action.backgroundColor },
                ]}
              >
                <Icon name={action.icon} size={48} color={action.color} />
              </View>
              <View style={styles.cardContentLarge}>
                <Text style={styles.cardTitleLarge} numberOfLines={2}>
                  {action.title}
                </Text>
                <Text style={styles.cardDescriptionLarge} numberOfLines={2}>
                  {action.description}
                </Text>
              </View>
            </View>
            <View style={styles.cardArrow}>
              <Icon name="arrow-forward" size={20} color={action.color} />
            </View>
          </>
        ) : (
          // Small card layout: original layout
          <>
            <View
              style={[
                styles.cardIconContainer,
                { backgroundColor: action.backgroundColor },
              ]}
            >
              <Icon name={action.icon} size={40} color={action.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {action.title}
              </Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {action.description}
              </Text>
            </View>
            <View style={styles.cardArrow}>
              <Icon name="arrow-forward" size={20} color={action.color} />
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <LinearGradient
          colors={COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeSection}
        >
          <Text style={styles.welcomeEmoji}>💜</Text>
          <Text style={styles.welcomeText}>
            {i18n.t("home.welcome")}
          </Text>
          <Text style={styles.subtitleText}>
            {i18n.t("home.subtitle")}
          </Text>
        </LinearGradient>

        {/* Quick Access Cards */}
        <View style={styles.cardsContainer}>
          {/* First Row - Events (Large, Full Width) */}
          <View style={styles.row}>
            {renderCard(quickActions[0])}
          </View>

          {/* Second Row - Daily Tasks + Add Shopping Item */}
          <View style={styles.row}>
            {renderCard(quickActions[1])}
            {renderCard(quickActions[2])}
          </View>

          {/* Third Row - Task Planning + Add Task */}
          <View style={styles.row}>
            {renderCard(quickActions[3])}
            {renderCard(quickActions[4])}
          </View>

          {/* Fourth Row - Shopping List + Shopping Mode */}
          <View style={styles.row}>
            {renderCard(quickActions[5])}
            {renderCard(quickActions[6])}
          </View>

          {/* Fifth Row - Inventory (Large, Full Width) */}
          <View style={styles.row}>
            {renderCard(quickActions[7])}
          </View>

          {/* Sixth Row - History */}
          <View style={styles.row}>
            {renderCard(quickActions[8])}
          </View>

          {/* Seventh Row - Management (Large, Full Width) */}
          <View style={styles.row}>
            {renderCard(quickActions[9])}
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
    paddingBottom: 24,
  },
  welcomeSection: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 32,
    marginHorizontal: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 20,
  },
  cardGradient: {
    borderRadius: RADIUS.l,
    padding: SPACING.m,
    ...SHADOWS.medium,
    position: "relative",
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  welcomeText: {
    ...TYPOGRAPHY.h1,
    color: COLORS.surface,
    marginBottom: SPACING.s,
    textAlign: "center",
  },
  subtitleText: {
    ...TYPOGRAPHY.body,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    paddingHorizontal: SPACING.m,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.l,
    padding: SPACING.m,
    ...SHADOWS.small,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    position: "relative",
  },
  cardLarge: {
    flex: 1,
    minHeight: 100,
    alignItems: "center",
  },
  cardSmall: {
    flex: 1,
    minHeight: 130,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
    width: "100%",
    paddingRight: 32,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  cardDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    flexWrap: "wrap",
  },
  cardArrow: {
    position: "absolute",
    bottom: 16,
    right: 16,
    opacity: 0.6,
  },
  cardLargeContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingRight: 32,
  },
  cardIconContainerLarge: {
    marginRight: 16,
    marginBottom: 0,
  },
  cardContentLarge: {
    flex: 1,
  },
  cardTitleLarge: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  cardTitleLargeWhite: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardDescriptionLarge: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  cardDescriptionLargeWhite: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
});

