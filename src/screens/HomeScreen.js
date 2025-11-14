import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import i18n from "../localization/i18n";

const { width } = Dimensions.get("window");
const CONTENT_PADDING = 48; // 24px on each side
const CARD_GAP = 16;

export default function HomeScreen({ navigation }) {
  // Calculate card width as percentage of available width (after padding)
  // Each card is 48% of the available width to ensure they fit side by side
  const availableWidth = width - CONTENT_PADDING;
  const cardWidth = availableWidth * 0.48;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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
          {/* Tasks Card */}
          <TouchableOpacity
            style={[styles.card, { width: cardWidth }]}
            onPress={() => navigation.navigate("Dashboard")}
            activeOpacity={0.7}
          >
            <View style={[styles.cardIconContainer, styles.tasksIconBg]}>
              <Icon name="check-circle" size={40} color="#8B5CF6" />
            </View>
            <Text style={styles.cardTitle}>
              {i18n.t("navigation.tasks")}
            </Text>
            <Text style={styles.cardDescription}>
              {i18n.t("home.tasksDescription")}
            </Text>
            <View style={styles.cardArrow}>
              <Icon name="arrow-forward" size={24} color="#8B5CF6" />
            </View>
          </TouchableOpacity>

          {/* Shopping List Card */}
          <TouchableOpacity
            style={[styles.card, { width: cardWidth }]}
            onPress={() => navigation.navigate("ShoppingList")}
            activeOpacity={0.7}
          >
            <View style={[styles.cardIconContainer, styles.shoppingIconBg]}>
              <Icon name="shopping-cart" size={40} color="#2563EB" />
            </View>
            <Text style={styles.cardTitle}>
              {i18n.t("navigation.shoppingList")}
            </Text>
            <Text style={styles.cardDescription}>
              {i18n.t("home.shoppingDescription")}
            </Text>
            <View style={styles.cardArrow}>
              <Icon name="arrow-forward" size={24} color="#2563EB" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  welcomeSection: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 48,
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
    paddingHorizontal: 32,
  },
  cardsContainer: {
    flexDirection: "row",
    gap: CARD_GAP,
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
    minHeight: 200,
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  tasksIconBg: {
    backgroundColor: "#EDE9FE",
  },
  shoppingIconBg: {
    backgroundColor: "#DBEAFE",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 12,
  },
  cardArrow: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
});

