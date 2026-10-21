import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ReferenceTabBar from "./ReferenceTabBar";
import { usePartnerMode } from "../context/HouseholdPartnerContext";
import HomeScreen from "../screens/HomeScreen";
import DailyTasksScreen from "../screens/Tasks/DailyTasksScreen";
import EventsScreen from "../screens/EventsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import PartnerKudosScreen from "../screens/PartnerKudosScreen";

const Tab = createBottomTabNavigator();

function AddTaskTabPlaceholder() {
  return <View />;
}

export default function MainTabNavigator() {
  const { isPartnered } = usePartnerMode();
  const FourthScreen = isPartnered ? PartnerKudosScreen : EventsScreen;

  return (
    <Tab.Navigator
      tabBar={(props) => <ReferenceTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="DailyTasks" component={DailyTasksScreen} />
      <Tab.Screen
        name="AddTaskTab"
        component={AddTaskTabPlaceholder}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen name="FourthTab" component={FourthScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
