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
import { MaterialIcons } from "@expo/vector-icons";
import { getCurrentUser, signOut } from "../services/userService";
import i18n from "../localization/i18n";

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
import SettingsScreen from "../screens/SettingsScreen";
import SharingScreen from "../screens/SharingScreen";
import AuthScreen from "../screens/AuthScreen";
import LanguageSelectionScreen from "../screens/LanguageSelectionScreen";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Stack Navigator for authenticated screens
const AuthenticatedStack = ({ navigation: drawerNavigation }) => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: "#8B5CF6",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => drawerNavigation?.openDrawer()}
            style={{ marginLeft: 16 }}
          >
            <MaterialIcons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
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
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>💜 CoupleTasks</Text>
        {user && (
          <Text style={styles.drawerSubtitle}>
            {user.email || i18n.t("navigation.drawer.profile")}
          </Text>
        )}
      </View>
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
                    color={isActive ? "#8B5CF6" : "#6B7280"}
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
          <MaterialIcons name="exit-to-app" size={24} color="#DC2626" />
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
          backgroundColor: "#FFFFFF",
          width: 280,
        },
        drawerActiveTintColor: "#8B5CF6",
        drawerInactiveTintColor: "#6B7280",
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
    backgroundColor: "#FFFFFF",
  },
  drawerHeader: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#8B5CF6",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  drawerSubtitle: {
    fontSize: 14,
    color: "#E9D5FF",
    marginTop: 4,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 8,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingVertical: 8,
    letterSpacing: 0.5,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  drawerItemActive: {
    backgroundColor: "#F3E8FF",
  },
  drawerItemText: {
    fontSize: 16,
    color: "#6B7280",
    marginLeft: 16,
  },
  drawerItemTextActive: {
    color: "#8B5CF6",
    fontWeight: "600",
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    padding: 16,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  signOutText: {
    fontSize: 16,
    color: "#DC2626",
    marginLeft: 16,
    fontWeight: "500",
  },
});

export default DrawerNavigator;

