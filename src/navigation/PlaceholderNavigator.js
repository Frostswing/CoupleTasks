import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import DashboardScreen from "../screens/DashboardScreen";
import DailyTasksScreen from "../screens/Tasks/DailyTasksScreen";
import TaskPlanningScreen from "../screens/Tasks/TaskPlanningScreen";
import TaskTemplatesScreen from "../screens/Tasks/TaskTemplatesScreen";
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
import { getCurrentUser } from "../services/userService";
import i18n from "../localization/i18n";

const Stack = createNativeStackNavigator();

const PlaceholderNavigator = () => {
  const user = getCurrentUser();
  const initialRouteName = user ? "Home" : "Auth";

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerStyle: {
          backgroundColor: "#8B5CF6",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
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
        options={{ title: "Daily Tasks" }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: i18n.t("navigation.tasks") }}
      />
      <Stack.Screen
        name="TaskPlanning"
        component={TaskPlanningScreen}
        options={{ title: "Task Planning" }}
      />
      <Stack.Screen
        name="TaskTemplates"
        component={TaskTemplatesScreen}
        options={{ title: "Task Templates" }}
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
        options={{ title: "Shopping Mode" }}
      />
      <Stack.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{ title: "Inventory" }}
      />
      <Stack.Screen
        name="Archive"
        component={ArchiveScreen}
        options={{ title: "Archive" }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: "History" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      <Stack.Screen
        name="Sharing"
        component={SharingScreen}
        options={{ title: i18n.t("navigation.sharing") }}
      />
      <Stack.Screen
        name="Language"
        component={LanguageSelectionScreen}
        options={{ title: i18n.t("navigation.language") || "Language" }}
      />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{
          title: user ? i18n.t("navigation.profile") : i18n.t("auth.signIn"),
        }}
      />
    </Stack.Navigator>
  );
};

export default PlaceholderNavigator;

