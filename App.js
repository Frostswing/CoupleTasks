import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { I18nManager } from "react-native";
import DrawerNavigator from "./src/navigation/DrawerNavigator";
import "react-native-gesture-handler";

// הגדרת תמיכה בשפות RTL (עברית)
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function App() {
  return (
    <NavigationContainer>
      <DrawerNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
