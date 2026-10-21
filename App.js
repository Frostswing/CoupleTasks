import {
  app,
  auth,
  database,
  firestore,
  checkFirebaseStatus,
} from "./src/firebase/config";

import "react-native-gesture-handler";
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { I18nManager, LogBox } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DrawerNavigator from "./src/navigation/DrawerNavigator";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthScreen from "./src/screens/AuthScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import LanguageSelectionScreen from "./src/screens/LanguageSelectionScreen";
import { subscribeToAuthChanges } from "./src/services/userService";
import { loadLanguagePreference } from "./src/localization/i18n";
import i18n from "./src/localization/i18n";
import LoadingScreen from "./src/components/common/LoadingScreen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useAppTheme } from "./src/context/ThemeContext";
import { HouseholdPartnerProvider } from "./src/context/HouseholdPartnerContext";
import { getNavigationTheme } from "./src/navigation/navigationTheme";

const Stack = createNativeStackNavigator();

LogBox.ignoreLogs([
  "Error: Component auth has not been registered yet",
  "Non-serializable values were found in the navigation state",
]);

function AppContent() {
  const { isDark, colors } = useAppTheme();
  const navigationTheme = getNavigationTheme(isDark, colors);
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
        const hasSelectedLanguage = await AsyncStorage.getItem("hasSelectedLanguage");
        if (!hasSelectedLanguage) {
          setShowLanguageSelection(true);
        }
        setLanguageLoaded(true);
      } catch (error) {
        console.error("Error loading language:", error);
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

        if (
          status.appInitialized &&
          status.authInitialized &&
          status.databaseInitialized &&
          status.firestoreInitialized
        ) {
          setFirebaseReady(true);
        } else {
          console.error("Firebase not fully initialized:", status);
          setFirebaseReady(false);
        }
      } catch (error) {
        console.error("Error checking Firebase:", error);
        setFirebaseStatus({ error: error.message });
        setFirebaseReady(false);
      }
    };

    if (languageLoaded) {
      checkFirebase();
    }
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
    let statusMessage = i18n.t("app.loadingApp");
    if (!firebaseReady) {
      statusMessage = i18n.t("app.initializingFirebase");
    }

    return (
      <SafeAreaProvider>
        <LoadingScreen message={statusMessage} status={firebaseStatus} />
        <StatusBar style={isDark ? "light" : "dark"} />
      </SafeAreaProvider>
    );
  }

  if (showLanguageSelection) {
    return (
      <SafeAreaProvider>
        <LanguageSelectionScreen onComplete={handleLanguageSelectionComplete} />
        <StatusBar style={isDark ? "light" : "dark"} />
      </SafeAreaProvider>
    );
  }

  const RootNavigator = () => {
    if (!user) {
      return (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
      );
    }

    return <DrawerNavigator />;
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <RootNavigator />
        <StatusBar style={isDark ? "light" : "dark"} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <HouseholdPartnerProvider>
        <AppContent />
      </HouseholdPartnerProvider>
    </ThemeProvider>
  );
}
