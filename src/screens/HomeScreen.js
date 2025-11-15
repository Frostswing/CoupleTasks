import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import i18n from "../localization/i18n";

export default function HomeScreen({ navigation }) {
  // Quick action cards configuration - ordered by priority (most used at top)
  const quickActions = [
    {
      id: "dailyTasks",
      title: i18n.t("navigation.drawer.dailyTasks"),
      description: "See what's due today and this week",
      icon: "today",
      color: "#8B5CF6",
      backgroundColor: "#EDE9FE",
      screen: "DailyTasks",
      size: "small",
    },
    {
      id: "addShoppingItem",
      title: i18n.t("home.addShoppingItem"),
      description: i18n.t("home.addShoppingItemDescription"),
      icon: "add-shopping-cart",
      color: "#1D4ED8",
      backgroundColor: "#BFDBFE",
      screen: "ShoppingList",
      params: { openAddDialog: true },
      size: "small",
    },
    {
      id: "taskPlanning",
      title: i18n.t("navigation.drawer.taskPlanning"),
      description: "Plan your tasks on calendar",
      icon: "event",
      color: "#7C3AED",
      backgroundColor: "#DDD6FE",
      screen: "TaskPlanning",
      size: "small",
    },
    {
      id: "addTask",
      title: i18n.t("navigation.drawer.addTask"),
      description: "Create a new task quickly",
      icon: "add-circle",
      color: "#A855F7",
      backgroundColor: "#F3E8FF",
      screen: "AddTask",
      size: "small",
    },
    {
      id: "shoppingList",
      title: i18n.t("navigation.drawer.shoppingList"),
      description: "Manage your shopping items",
      icon: "shopping-cart",
      color: "#2563EB",
      backgroundColor: "#DBEAFE",
      screen: "ShoppingList",
      size: "small",
    },
    {
      id: "inventory",
      title: i18n.t("navigation.drawer.inventory"),
      description: "Track household items",
      icon: "inventory-2",
      color: "#16A34A",
      backgroundColor: "#DCFCE7",
      screen: "Inventory",
      size: "small",
    },
    {
      id: "history",
      title: i18n.t("navigation.drawer.history"),
      description: "View completion stats",
      icon: "history",
      color: "#F59E0B",
      backgroundColor: "#FEF3C7",
      screen: "History",
      size: "small",
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
        <View
          style={[
            styles.cardIconContainer,
            { backgroundColor: action.backgroundColor },
          ]}
        >
          <Icon name={action.icon} size={isLarge ? 48 : 40} color={action.color} />
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
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeEmoji}>💜</Text>
          <Text style={styles.welcomeText}>
            {i18n.t("home.welcome")}
          </Text>
          <Text style={styles.subtitleText}>
            {i18n.t("home.subtitle")}
          </Text>
        </View>

        {/* Quick Access Cards */}
        <View style={styles.cardsContainer}>
          {/* First Row - Daily Tasks (Large) + Add Shopping Item (Small) - MOST USED */}
          <View style={styles.row}>
            {renderCard(quickActions[0])}
            {renderCard(quickActions[1])}
          </View>

          {/* Second Row - Task Planning + Add Task */}
          <View style={styles.row}>
            {renderCard(quickActions[2])}
            {renderCard(quickActions[3])}
          </View>

          {/* Third Row - Shopping List + Inventory */}
          <View style={styles.row}>
            {renderCard(quickActions[4])}
            {renderCard(quickActions[5])}
          </View>

          {/* Fourth Row - History */}
          <View style={styles.row}>
            {renderCard(quickActions[6])}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
    paddingHorizontal: 24,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 16,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    position: "relative",
  },
  cardLarge: {
    flex: 1,
    minHeight: 140,
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
});

