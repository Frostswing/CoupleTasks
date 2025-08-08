import React, { useEffect, useState } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import DashboardScreen from "../screens/DashboardScreen";
import AddTaskScreen from "../screens/AddTaskScreen";
import ShoppingListScreen from "../screens/ShoppingListScreen";
import ShoppingModeScreen from "../screens/ShoppingModeScreen";
import InventoryScreen from "../screens/InventoryScreen";
import ArchiveScreen from "../screens/ArchiveScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AuthScreen from "../screens/AuthScreen";
import LanguageSelectionScreen from "../screens/LanguageSelectionScreen";
import {
  getCurrentUser,
  subscribeToAuthChanges,
} from "../services/userService";
import i18n from "../localization/i18n";
import { TouchableOpacity, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  const [user, setUser] = useState(null);
  const [initialUser, setInitialUser] = useState(null);
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    // Get current user immediately for initialRouteName
    const checkCurrentUser = () => {
      try {
        const currentUser = getCurrentUser();
        setInitialUser(currentUser);
        setUser(currentUser);
      } catch (error) {
        setInitialUser(false); // No user
        setUser(null);
      }
    };
    
    checkCurrentUser();

    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Don't render until we know the initial user state
  if (initialUser === null) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Drawer.Navigator
        initialRouteName={user ? "Dashboard" : "Auth"}
        screenOptions={{
          headerStyle: {
            backgroundColor: "#8B5CF6",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          drawerPosition: "right", // מתאים לעברית - תפריט מימין
          drawerLabelStyle: {
            textAlign: "right", // מיושר לימין
          },
          drawerActiveBackgroundColor: "#EDE9FE",
          drawerActiveTintColor: "#8B5CF6",
          headerRight: ({ tintColor, canGoBack }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {user && (
                <TouchableOpacity onPress={() => {}}
                  style={{ marginRight: 12, padding: 6 }}>
                  <Icon name="add-task" size={22} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={toggle} style={{ marginRight: 8, padding: 6 }}>
                <Icon name={isDark ? 'light-mode' : 'dark-mode'} size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          )
        }}
      >
        {user ? (
          // Screens for authenticated users
          <>
            <Drawer.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{
                title: i18n.t('navigation.tasks'),
                drawerLabel: i18n.t('navigation.tasks'),
                drawerIcon: ({ color, size }) => (
                  <Icon name="home" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="AddTask"
              component={AddTaskScreen}
              options={{
                title: i18n.t('navigation.addTask'),
                drawerLabel: i18n.t('navigation.addTask'),
                drawerIcon: ({ color, size }) => (
                  <Icon name="add" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="ShoppingList"
              component={ShoppingListScreen}
              options={{
                title: i18n.t('navigation.shoppingList'),
                drawerLabel: i18n.t('navigation.shoppingList'),
                drawerIcon: ({ color, size }) => (
                  <Icon name="shopping-cart" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="ShoppingMode"
              component={ShoppingModeScreen}
              options={{
                title: "Shopping Mode",
                drawerLabel: "Shopping Mode",
                drawerIcon: ({ color, size }) => (
                  <Icon name="local-grocery-store" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="Inventory"
              component={InventoryScreen}
              options={{
                title: "Inventory",
                drawerLabel: "Inventory",
                drawerIcon: ({ color, size }) => (
                  <Icon name="inventory" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="Archive"
              component={ArchiveScreen}
              options={{
                title: "Archive",
                drawerLabel: "Archive",
                drawerIcon: ({ color, size }) => (
                  <Icon name="archive" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: "Settings",
                drawerLabel: "Settings",
                drawerIcon: ({ color, size }) => (
                  <Icon name="settings" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="Language"
              component={LanguageSelectionScreen}
              options={{
                title: "בחירת שפה / Language",
                drawerLabel: "🌐 שפה / Language",
                drawerIcon: ({ color, size }) => (
                  <Icon name="language" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="Auth"
              component={AuthScreen}
              options={{
                title: i18n.t('navigation.profile'),
                drawerLabel: i18n.t('navigation.profile'),
                drawerIcon: ({ color, size }) => (
                  <Icon name="person" size={size} color={color} />
                ),
              }}
            />
          </>
        ) : (
          // Screens for non-authenticated users
          <>
            <Drawer.Screen
              name="Auth"
              component={AuthScreen}
              options={{
                title: i18n.t('auth.signIn'),
                drawerLabel: i18n.t('auth.signIn'),
                drawerIcon: ({ color, size }) => (
                  <Icon name="person" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen
              name="Language"
              component={LanguageSelectionScreen}
              options={{
                title: "בחירת שפה / Language",
                drawerLabel: "🌐 שפה / Language",
                drawerIcon: ({ color, size }) => (
                  <Icon name="language" size={size} color={color} />
                ),
              }}
            />
          </>
        )}
      </Drawer.Navigator>
    </SafeAreaView>
  );
};

export default DrawerNavigator;
