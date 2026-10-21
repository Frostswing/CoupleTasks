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
import SyncIndicator from "../components/common/SyncIndicator";
import i18n from "../localization/i18n";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import { usePartnerMode } from "../context/HouseholdPartnerContext";

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

const AuthenticatedStack = ({ navigation: drawerNavigation }) => {
  const { colors } = useAppTheme();
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
          backgroundColor: colors.surface,
        },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: {
          ...TYPOGRAPHY.h2,
          fontSize: 17,
          color: colors.text,
        },
        headerTitle: ({ children }) => (
          <TouchableOpacity
            onPress={openDrawer}
            activeOpacity={0.7}
            style={styles.headerTitle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="menu" size={24} color={colors.text} style={{ marginRight: SPACING.s }} />
            <Text style={[styles.headerTitleText, { color: colors.text }]}>{children}</Text>
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={{ marginRight: SPACING.l }}>
            <SyncIndicator />
          </View>
        ),
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: i18n.t("home.title") }} />
      <Stack.Screen name="DailyTasks" component={DailyTasksScreen} options={{ title: i18n.t("navigation.drawer.dailyTasks") }} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: i18n.t("navigation.tasks") }} />
      <Stack.Screen name="TaskPlanning" component={TaskPlanningScreen} options={{ title: i18n.t("navigation.drawer.taskPlanning") }} />
      <Stack.Screen name="TaskTemplates" component={TaskTemplatesScreen} options={{ title: i18n.t("navigation.drawer.taskTemplates") }} />
      <Stack.Screen name="TaskTable" component={TaskTableScreen} options={{ title: i18n.t("navigation.drawer.taskTable") }} />
      <Stack.Screen name="AddTask" component={AddTaskScreen} options={{ title: i18n.t("navigation.addTask") }} />
      <Stack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: i18n.t("navigation.shoppingList") }} />
      <Stack.Screen name="ShoppingMode" component={ShoppingModeScreen} options={{ title: i18n.t("navigation.drawer.shoppingMode") }} />
      <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: i18n.t("navigation.inventory") }} />
      <Stack.Screen name="Archive" component={ArchiveScreen} options={{ title: i18n.t("navigation.archive") }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: i18n.t("navigation.drawer.history") }} />
      <Stack.Screen name="Events" component={EventsScreen} options={{ title: i18n.t("navigation.drawer.events") }} />
      <Stack.Screen name="Management" component={ManagementScreen} options={{ title: i18n.t("navigation.drawer.management") }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: i18n.t("navigation.settings") }} />
      <Stack.Screen name="Sharing" component={SharingScreen} options={{ title: i18n.t("navigation.sharing") }} />
      <Stack.Screen name="Language" component={LanguageSelectionScreen} options={{ title: i18n.t("navigation.language") }} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ title: i18n.t("navigation.profile") }} />
    </Stack.Navigator>
  );
};

const CustomDrawerContent = (props) => {
  const { colors } = useAppTheme();
  const { isPartnered } = usePartnerMode();
  const user = getCurrentUser();

  const routeName = useNavigationState((state) => {
    if (!state) return "Home";
    try {
      const drawerRoute = state.routes[state.index];
      if (drawerRoute?.name === "MainStack" && drawerRoute?.state) {
        const stackState = drawerRoute.state;
        const stackRoute = stackState.routes[stackState.index];
        return stackRoute?.name || "Home";
      }
      return drawerRoute?.name || "Home";
    } catch (error) {
      return "Home";
    }
  });

  const handleSignOut = () => {
    Alert.alert(
      i18n.t("auth.signOut"),
      "Are you sure you want to sign out?",
      [
        { text: i18n.t("common.cancel"), style: "cancel" },
        {
          text: i18n.t("auth.signOut"),
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
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
        { name: "Home", label: i18n.t("navigation.drawer.home"), icon: "home", screen: "Home" },
      ],
    },
    {
      section: i18n.t("navigation.tasks"),
      items: [
        { name: "DailyTasks", label: i18n.t("navigation.drawer.dailyTasks"), icon: "today", screen: "DailyTasks" },
        { name: "TaskPlanning", label: i18n.t("navigation.drawer.taskPlanning"), icon: "event-note", screen: "TaskPlanning" },
        { name: "TaskTemplates", label: i18n.t("navigation.drawer.taskTemplates"), icon: "content-copy", screen: "TaskTemplates" },
        { name: "Dashboard", label: i18n.t("navigation.drawer.allTasks"), icon: "list", screen: "Dashboard" },
        { name: "AddTask", label: i18n.t("navigation.drawer.addTask"), icon: "add", screen: "AddTask" },
      ],
    },
    {
      section: i18n.t("navigation.shoppingList"),
      items: [
        { name: "ShoppingList", label: i18n.t("navigation.drawer.shoppingList"), icon: "shopping-cart", screen: "ShoppingList" },
        { name: "ShoppingMode", label: i18n.t("navigation.drawer.shoppingMode"), icon: "shopping-bag", screen: "ShoppingMode" },
        { name: "Inventory", label: i18n.t("navigation.drawer.inventory"), icon: "inventory-2", screen: "Inventory" },
      ],
    },
    {
      section: null,
      items: [
        { name: "Events", label: i18n.t("navigation.drawer.events"), icon: "event", screen: "Events" },
        { name: "Management", label: i18n.t("navigation.drawer.management"), icon: "insights", screen: "Management" },
        { name: "Archive", label: i18n.t("navigation.drawer.archive"), icon: "archive", screen: "Archive" },
        { name: "History", label: i18n.t("navigation.drawer.history"), icon: "history", screen: "History" },
      ],
    },
    {
      section: i18n.t("navigation.settings"),
      items: [
        { name: "Settings", label: i18n.t("navigation.drawer.settings"), icon: "settings", screen: "Settings" },
        { name: "Sharing", label: i18n.t("navigation.drawer.sharing"), icon: "people", screen: "Sharing" },
        { name: "Language", label: i18n.t("navigation.drawer.language"), icon: "language", screen: "Language" },
        { name: "Auth", label: i18n.t("navigation.drawer.profile"), icon: "person", screen: "Auth" },
      ],
    },
  ];

  const navigateToScreen = (screenName) => {
    try {
      props.navigation.navigate("MainStack", { screen: screenName, params: undefined });
      props.navigation.closeDrawer();
    } catch (error) {
      try {
        props.navigation.navigate(screenName);
        props.navigation.closeDrawer();
      } catch (fallbackError) {
        console.error(`Navigation failed: ${screenName}`);
      }
    }
  };

  return (
    <View style={[styles.drawerContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.drawerHeader}>
        <View style={styles.logoContainer}>
          <MaterialIcons name="favorite" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.drawerTitle}>CoupleTasks</Text>
          {user && (
            <Text style={styles.drawerSubtitle} numberOfLines={1}>
              {user.email}
            </Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
        {drawerItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            {section.section && (
              <Text style={styles.sectionTitle}>{section.section}</Text>
            )}
            {section.items
              .filter((item) => isPartnered || item.screen !== "Sharing")
              .map((item) => {
              const isActive = routeName === item.screen;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                  onPress={() => navigateToScreen(item.screen)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={22}
                    color={isActive ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.drawerItemText, isActive && styles.drawerItemTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <MaterialIcons name="logout" size={20} color={COLORS.error} />
          <Text style={styles.signOutText}>{i18n.t("navigation.drawer.signOut")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
        options={{ drawerItemStyle: { height: 0 } }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitleText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
    paddingBottom: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.m,
    backgroundColor: COLORS.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.m,
  },
  headerInfo: {
    flex: 1,
  },
  drawerTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xxs,
  },
  drawerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  drawerContent: {
    flex: 1,
    paddingTop: SPACING.m,
  },
  section: {
    marginBottom: SPACING.s,
  },
  sectionTitle: {
    ...TYPOGRAPHY.overline,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.s,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    marginHorizontal: SPACING.s,
    marginVertical: 1,
    borderRadius: RADIUS.s,
  },
  drawerItemActive: {
    backgroundColor: COLORS.primaryMuted,
  },
  drawerItemText: {
    ...TYPOGRAPHY.body,
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
    padding: SPACING.l,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
  },
  signOutText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    marginLeft: SPACING.m,
    fontWeight: "500",
  },
});

export default DrawerNavigator;
