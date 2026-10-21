import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, getFabGradient } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import i18n from "../localization/i18n";
import { usePartnerMode } from "../context/HouseholdPartnerContext";

export default function ReferenceTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { isPartnered } = usePartnerMode();
  const fabGradient = getFabGradient(isDark);

  const tabs = [
    { routeName: "Home", icon: "home", label: i18n.t("navigation.tabs.home") },
    { routeName: "DailyTasks", icon: "assignment", label: i18n.t("navigation.tabs.tasks") },
    { routeName: "AddTaskTab", icon: "add", label: "", isFab: true },
    {
      routeName: "FourthTab",
      icon: isPartnered ? "favorite" : "event",
      label: isPartnered ? i18n.t("navigation.tabs.kudos") : i18n.t("navigation.tabs.events"),
    },
    { routeName: "Settings", icon: "person", label: i18n.t("navigation.tabs.profile") },
  ];

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, SPACING.s),
        },
      ]}
    >
      {tabs.map((tab) => {
        const routeIndex = state.routes.findIndex((r) => r.name === tab.routeName);
        const isFocused = state.index === routeIndex;

        if (tab.isFab) {
          return (
            <TouchableOpacity
              key={tab.routeName}
              style={styles.fabSlot}
              onPress={() => navigation.getParent()?.navigate("AddTask")}
              accessibilityRole="button"
              accessibilityLabel={i18n.t("navigation.addTask")}
            >
              <LinearGradient colors={fabGradient} style={styles.fab} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <MaterialIcons name="add" size={32} color={COLORS.heroText} />
              </LinearGradient>
            </TouchableOpacity>
          );
        }

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: state.routes[routeIndex]?.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.routeName);
          }
        };

        const tint = isFocused ? colors.primary : colors.textTertiary;

        return (
          <TouchableOpacity
            key={tab.routeName}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            <MaterialIcons name={tab.icon} size={24} color={tint} />
            <Text style={[styles.tabLabel, { color: tint }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: SPACING.s,
    ...Platform.select({
      web: { position: "sticky", bottom: 0, zIndex: 20 },
      default: {},
    }),
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xs,
  },
  tabLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  fabSlot: {
    flex: 1,
    alignItems: "center",
    marginTop: -22,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.lg,
  },
});
