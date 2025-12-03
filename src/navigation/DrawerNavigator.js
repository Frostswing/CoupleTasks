import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigationState } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { getCurrentUser, signOut } from "../services/userService";
import SyncIndicator from "../components/common/SyncIndicator";
import i18n from "../localization/i18n";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";

// Import all screens
import HomeScreen from "../screens/HomeScreen";
import DashboardScreen from "../screens/DashboardScreen";
import DailyTasksScreen from "../screens/Tasks/DailyTasksScreen";
import TaskPlanningScreen from "../screens/Tasks/TaskPlanningScreen";
import TaskTemplatesScreen from "../screens/Tasks/TaskTemplatesScreen";
import TaskTableScreen from "../screens/TaskTableScreen";
import AddTaskScreen from "../screens/AddTaskScreen";
import ShoppingListScreen from "../screens/ShoppingListScreen";
import ShoppingModeScreen from "../screens/ShoppingModeScreen";
import InventoryScreen from "../screens/InventoryScreen";
import ArchiveScreen from "../screens/ArchiveScreen";
import HistoryScreen from "../screens/HistoryScreen";
import EventsScreen from "../screens/EventsScreen";
import ManagementScreen from "../screens/ManagementScreen";
import SettingsScreen from "../screens/SettingsScreen";
import SharingScreen from "../screens/SharingScreen";
import AuthScreen from "../screens/AuthScreen";
import LanguageSelectionScreen from "../screens/LanguageSelectionScreen";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Stack Navigator for authenticated screens
const AuthenticatedStack = ({ navigation: drawerNavigation }) => {
  const openDrawer = () => {
    if (drawerNavigation?.openDrawer) {
      drawerNavigation.openDrawer();
    }
  };
  
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: "transparent",
        },
        headerBackground: () => (
          <LinearGradient
            colors={COLORS.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
            pointerEvents="none"
          />
        ),
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerTitle: ({ children }) => (
          <TouchableOpacity
            onPress={openDrawer}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="menu" size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>{children}</Text>
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={{ marginRight: 16 }}>
            <SyncIndicator />
          </View>
        ),
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: i18n.t("home.title") }}
      />
      <Stack.Screen
        name="DailyTasks"
        component={DailyTasksScreen}
        options={{ title: i18n.t("navigation.drawer.dailyTasks") }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: i18n.t("navigation.tasks") }}
      />
      <Stack.Screen
        name="TaskPlanning"
        component={TaskPlanningScreen}
        options={{ title: i18n.t("navigation.drawer.taskPlanning") }}
      />
      <Stack.Screen
        name="TaskTemplates"
        component={TaskTemplatesScreen}
        options={{ title: i18n.t("navigation.drawer.taskTemplates") }}
      />
      <Stack.Screen
        name="TaskTable"
        component={TaskTableScreen}
        options={{ title: i18n.t("navigation.drawer.taskTable") }}
      />
      <Stack.Screen
        name="AddTask"
        component={AddTaskScreen}
        options={{ title: i18n.t("navigation.addTask") }}
      />
      <Stack.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{ title: i18n.t("navigation.shoppingList") }}
      />
      <Stack.Screen
        name="ShoppingMode"
        component={ShoppingModeScreen}
        options={{ title: i18n.t("navigation.drawer.shoppingMode") }}
      />
      <Stack.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{ title: i18n.t("navigation.inventory") }}
      />
      <Stack.Screen
        name="Archive"
        component={ArchiveScreen}
        options={{ title: i18n.t("navigation.archive") }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: i18n.t("navigation.drawer.history") }}
      />
      <Stack.Screen
        name="Events"
        component={EventsScreen}
        options={{ title: i18n.t("navigation.drawer.events") }}
      />
      <Stack.Screen
        name="Management"
        component={ManagementScreen}
        options={{ title: i18n.t("navigation.drawer.management") }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: i18n.t("navigation.settings") }}
      />
      <Stack.Screen
        name="Sharing"
        component={SharingScreen}
        options={{ title: i18n.t("navigation.sharing") }}
      />
      <Stack.Screen
        name="Language"
        component={LanguageSelectionScreen}
        options={{ title: i18n.t("navigation.language") }}
      />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ title: i18n.t("navigation.profile") }}
      />
    </Stack.Navigator>
  );
};

// Custom Drawer Content Component
const CustomDrawerContent = (props) => {
  const user = getCurrentUser();
  
  // Get the current route name from navigation state
  // Access the nested stack navigator state
  const routeName = useNavigationState((state) => {
    if (!state) return "Home";
    try {
      // The drawer navigator wraps a stack navigator
      // We need to access the nested stack's state
      const drawerRoute = state.routes[state.index];
      if (drawerRoute?.name === "MainStack" && drawerRoute?.state) {
        const stackState = drawerRoute.state;
        const stackRoute = stackState.routes[stackState.index];
        return stackRoute?.name || "Home";
      }
      return drawerRoute?.name || "Home";
    } catch (error) {
      console.warn("Error accessing navigation state:", error);
      return "Home";
    }
  });

  const handleSignOut = () => {
    Alert.alert(
      i18n.t("auth.signOut"),
      "Are you sure you want to sign out?",
      [
        {
          text: i18n.t("common.cancel"),
          style: "cancel",
        },
        {
          text: i18n.t("auth.signOut"),
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              // The auth state change listener in App.js will handle navigation
              // No need to manually navigate here
            } catch (error) {
              Alert.alert(i18n.t("errors.error"), error.message);
            }
          },
        },
      ]
    );
  };

  const drawerItems = [
    {
      section: null,
      items: [
        {
          name: "Home",
          label: i18n.t("navigation.drawer.home"),
          icon: "home",
          screen: "Home",
        },
      ],
    },
    {
      section: i18n.t("navigation.tasks"),
      items: [
        {
          name: "DailyTasks",
          label: i18n.t("navigation.drawer.dailyTasks"),
          icon: "today",
          screen: "DailyTasks",
        },
        {
          name: "TaskPlanning",
          label: i18n.t("navigation.drawer.taskPlanning"),
          icon: "event",
          screen: "TaskPlanning",
        },
        {
          name: "TaskTemplates",
          label: i18n.t("navigation.drawer.taskTemplates"),
          icon: "content-copy",
          screen: "TaskTemplates",
        },
        {
          name: "TaskTable",
          label: i18n.t("navigation.drawer.taskTable"),
          icon: "table-chart",
          screen: "TaskTable",
        },
        {
          name: "Dashboard",
          label: i18n.t("navigation.drawer.allTasks"),
          icon: "list",
          screen: "Dashboard",
        },
        {
          name: "AddTask",
          label: i18n.t("navigation.drawer.addTask"),
          icon: "add-circle",
          screen: "AddTask",
        },
      ],
    },
    {
      section: i18n.t("navigation.shoppingList"),
      items: [
        {
          name: "ShoppingList",
          label: i18n.t("navigation.drawer.shoppingList"),
          icon: "shopping-cart",
          screen: "ShoppingList",
        },
        {
          name: "ShoppingMode",
          label: i18n.t("navigation.drawer.shoppingMode"),
          icon: "shopping-bag",
          screen: "ShoppingMode",
        },
      ],
    },
    {
      section: null,
      items: [
        {
          name: "Inventory",
          label: i18n.t("navigation.drawer.inventory"),
          icon: "inventory-2",
          screen: "Inventory",
        },
        {
          name: "Archive",
          label: i18n.t("navigation.drawer.archive"),
          icon: "archive",
          screen: "Archive",
        },
        {
          name: "History",
          label: i18n.t("navigation.drawer.history"),
          icon: "history",
          screen: "History",
        },
        {
          name: "Events",
          label: i18n.t("navigation.drawer.events"),
          icon: "event",
          screen: "Events",
        },
        {
          name: "Management",
          label: i18n.t("navigation.drawer.management"),
          icon: "analytics",
          screen: "Management",
        },
      ],
    },
    {
      section: i18n.t("navigation.settings"),
      items: [
        {
          name: "Settings",
          label: i18n.t("navigation.drawer.settings"),
          icon: "settings",
          screen: "Settings",
        },
        {
          name: "Sharing",
          label: i18n.t("navigation.drawer.sharing"),
          icon: "people",
          screen: "Sharing",
        },
        {
          name: "Language",
          label: i18n.t("navigation.drawer.language"),
          icon: "language",
          screen: "Language",
        },
        {
          name: "Auth",
          label: i18n.t("navigation.drawer.profile"),
          icon: "account-circle",
          screen: "Auth",
        },
      ],
    },
  ];

  const navigateToScreen = (screenName) => {
    try {
      // Navigate to the nested Stack Navigator screen
      // The screens are inside MainStack, so we need to navigate to MainStack first
      props.navigation.navigate("MainStack", { 
        screen: screenName,
        params: undefined 
      });
      props.navigation.closeDrawer();
    } catch (error) {
      console.error(`Error navigating to ${screenName}:`, error);
      // Fallback: try direct navigation (might work if screens are accessible)
      try {
        props.navigation.navigate(screenName);
        props.navigation.closeDrawer();
      } catch (fallbackError) {
        console.error(`Fallback navigation also failed:`, fallbackError);
      }
    }
  };

  return (
    <View style={styles.drawerContainer}>
      <LinearGradient
        colors={COLORS.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.drawerHeader}
      >
        <Text style={styles.drawerTitle}>💜 CoupleTasks</Text>
        {user && (
          <Text style={styles.drawerSubtitle}>
            {user.email || i18n.t("navigation.drawer.profile")}
          </Text>
        )}
      </LinearGradient>
      <ScrollView style={styles.drawerContent}>
        {drawerItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            {section.section && (
              <Text style={styles.sectionTitle}>{section.section}</Text>
            )}
            {section.items.map((item) => {
              const isActive = routeName === item.screen;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.drawerItem,
                    isActive && styles.drawerItemActive,
                  ]}
                  onPress={() => navigateToScreen(item.screen)}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={24}
                    color={isActive ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text
                    style={[
                      styles.drawerItemText,
                      isActive && styles.drawerItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
      <View style={styles.drawerFooter}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <MaterialIcons name="exit-to-app" size={24} color={COLORS.error} />
          <Text style={styles.signOutText}>
            {i18n.t("navigation.drawer.signOut")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Main Drawer Navigator
const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="MainStack"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: {
          backgroundColor: COLORS.surface,
          width: 280,
        },
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.textSecondary,
      }}
    >
      <Drawer.Screen
        name="MainStack"
        component={AuthenticatedStack}
        options={{
          drawerItemStyle: { height: 0 },
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  drawerHeader: {
    padding: SPACING.l,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  drawerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.surface,
    marginBottom: SPACING.xs,
  },
  drawerSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primaryBg,
    marginTop: SPACING.xs,
  },
  drawerContent: {
    flex: 1,
    paddingTop: SPACING.s,
  },
  section: {
    marginBottom: SPACING.s,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    color: COLORS.textTertiary,
    textTransform: "uppercase",
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    letterSpacing: 0.5,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.m,
    paddingVertical: 12,
    marginHorizontal: SPACING.s,
    marginVertical: 2,
    borderRadius: RADIUS.s,
  },
  drawerItemActive: {
    backgroundColor: COLORS.primaryBg,
  },
  drawerItemText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: SPACING.m,
  },
  drawerItemTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.m,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: SPACING.m,
  },
  signOutText: {
    fontSize: 16,
    color: COLORS.error,
    marginLeft: SPACING.m,
    fontWeight: "500",
  },
});

export default DrawerNavigator;

