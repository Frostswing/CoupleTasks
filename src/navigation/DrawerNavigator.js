import React, { useEffect, useState } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import TasksScreen from "../screens/TasksScreen";
import ShoppingListScreen from "../screens/ShoppingListScreen";
import AuthScreen from "../screens/AuthScreen";
import SharingScreen from "../screens/SharingScreen";
import {
  getCurrentUser,
  subscribeToAuthChanges,
} from "../services/userService";

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

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
            drawerIcon: ({ color, size }) => (
              <FontAwesome name="tasks" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="ShoppingList"
          component={ShoppingListScreen}
          options={{
            title: "רשימת קניות",
            drawerLabel: "רשימת קניות",
            drawerIcon: ({ color, size }) => (
              <FontAwesome name="shopping-cart" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            title: user ? "פרופיל" : "הרשמה / כניסה",
            drawerLabel: user ? "פרופיל" : "הרשמה / כניסה",
            drawerIcon: ({ color, size }) => (
              <FontAwesome name="user" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Sharing"
          component={SharingScreen}
          options={{
            title: "שיתוף רשימות",
            drawerLabel: "שיתוף רשימות",
            drawerIcon: ({ color, size }) => (
              <FontAwesome name="share-alt" size={size} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    </SafeAreaView>
  );
};

export default DrawerNavigator;
