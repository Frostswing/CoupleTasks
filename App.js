import {
  app,
  auth,
  database,
  checkFirebaseStatus,
} from "./src/firebase/config";

import "react-native-gesture-handler";
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import {
  I18nManager,
  View,
  Text,
  ActivityIndicator,
  LogBox,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import DrawerNavigator from "./src/navigation/DrawerNavigator";
import LanguageSelectionScreen from "./src/screens/LanguageSelectionScreen";
import { subscribeToAuthChanges } from "./src/services/userService";
import { loadLanguagePreference } from "./src/localization/i18n";
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

// התעלמות משגיאות ידועות שקשורות ל-Firebase
LogBox.ignoreLogs([
  "Error: Component auth has not been registered yet",
  "Non-serializable values were found in the navigation state",
]);

function AppInner() {
  const { navTheme } = useTheme();
  // original App component body moved here
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState(null);
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        await loadLanguagePreference();
        const hasSelectedLanguage = await AsyncStorage.getItem('hasSelectedLanguage');
        if (!hasSelectedLanguage) {
          setShowLanguageSelection(true);
        }
        setLanguageLoaded(true);
      } catch (error) {
        console.error('Error loading language:', error);
        setLanguageLoaded(true);
      }
    };
    initializeLanguage();
  }, []);

  useEffect(() => {
    const checkFirebase = async () => {
      try {
        const status = checkFirebaseStatus();
        setFirebaseStatus(status);
        if (status.appInitialized && status.authInitialized && status.databaseInitialized) {
          setFirebaseReady(true);
        } else {
          setFirebaseReady(false);
        }
      } catch (error) {
        console.error("Error checking Firebase:", error);
        setFirebaseStatus({ error: error.message });
        setFirebaseReady(false);
      }
    };
    if (languageLoaded) checkFirebase();
  }, [languageLoaded]);

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [firebaseReady, initializing]);

  const handleLanguageSelectionComplete = () => {
    setShowLanguageSelection(false);
  };

  if (!languageLoaded || initializing || !firebaseReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: navTheme.colors.background }}>
        <Text style={{ fontSize: 60, marginBottom: 20 }}>💜</Text>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10, color: navTheme.colors.text }}>CoupleTasks</Text>
        <ActivityIndicator size="large" color={navTheme.colors.primary} />
        <Text style={{ marginTop: 10, color: navTheme.colors.text }}>טוען את האפליקציה...</Text>
      </View>
    );
  }

  if (showLanguageSelection) {
    return (
      <>
        <LanguageSelectionScreen onComplete={handleLanguageSelectionComplete} />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <DrawerNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
