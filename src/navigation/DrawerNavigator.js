import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { SafeAreaView } from "react-native-safe-area-context";
import TasksScreen from "../screens/TasksScreen";
import ShoppingListScreen from "../screens/ShoppingListScreen";

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Drawer.Navigator
        initialRouteName="Tasks"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#f4511e",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          drawerPosition: "right", // מתאים לעברית - תפריט מימין
          drawerLabelStyle: {
            textAlign: "right", // מיושר לימין
          },
        }}
      >
        <Drawer.Screen
          name="Tasks"
          component={TasksScreen}
          options={{
            title: "מטלות",
            drawerLabel: "מטלות",
          }}
        />
        <Drawer.Screen
          name="ShoppingList"
          component={ShoppingListScreen}
          options={{
            title: "רשימת קניות",
            drawerLabel: "רשימת קניות",
          }}
        />
      </Drawer.Navigator>
    </SafeAreaView>
  );
};

export default DrawerNavigator;
