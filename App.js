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
import {
  I18nManager,
  View,
  Text,
  ActivityIndicator,
  LogBox,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import DrawerNavigator from "./src/navigation/DrawerNavigator";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthScreen from "./src/screens/AuthScreen";
import LanguageSelectionScreen from "./src/screens/LanguageSelectionScreen";
import { subscribeToAuthChanges } from "./src/services/userService";
import { loadLanguagePreference } from "./src/localization/i18n";
import i18n from "./src/localization/i18n";
import LoadingScreen from "./src/components/common/LoadingScreen";

const Stack = createNativeStackNavigator();

// התעלמות משגיאות ידועות שקשורות ל-Firebase
LogBox.ignoreLogs([
  "Error: Component auth has not been registered yet",
  "Non-serializable values were found in the navigation state",
]);

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState(null);
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);

  // Initialize language and check if user has selected language before
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Load saved language preference
        await loadLanguagePreference();
        
        // Check if user has completed language selection before
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

  // וודא שפיירבייס אותחל
  useEffect(() => {
    const checkFirebase = async () => {
      try {
        // בדיקת מצב האתחול של Firebase
        const status = checkFirebaseStatus();
        console.log("Firebase status:", status);
        setFirebaseStatus(status);

        if (
          status.appInitialized &&
          status.authInitialized &&
          status.databaseInitialized &&
          status.firestoreInitialized
        ) {
          console.log(`Firebase app '${status.appName}' is fully initialized with Firestore`);
          setFirebaseReady(true);
        } else {
          console.error("Firebase is not fully initialized:", status);
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

  // אתחול האימות ומעקב אחר מצב המשתמש - רק אם פיירבייס מוכן
  useEffect(() => {
    if (!firebaseReady) return;

    const unsubscribe = subscribeToAuthChanges((user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      setUser(user);
      if (initializing) setInitializing(false);
    });

    // ניקוי בעת פירוק הקומפוננטה
    return unsubscribe;
  }, [firebaseReady, initializing]);

  // Handle language selection completion
  const handleLanguageSelectionComplete = () => {
    setShowLanguageSelection(false);
  };

  // Loading screen during authentication initialization
  if (!languageLoaded || initializing || !firebaseReady) {
    let statusMessage = i18n.t('app.loadingApp');
    if (!firebaseReady) {
      statusMessage = i18n.t('app.initializingFirebase');
    }
    
    return (
      <LoadingScreen 
        message={statusMessage}
        status={firebaseStatus}
      />
    );
  }

  // Show language selection if not completed
  if (showLanguageSelection) {
    return (
      <>
        <LanguageSelectionScreen onComplete={handleLanguageSelectionComplete} />
        <StatusBar style="auto" />
      </>
    );
  }

  // Root Navigator - shows DrawerNavigator for authenticated users, Auth stack for unauthenticated
  const RootNavigator = () => {
    if (!user) {
      return (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: "transparent",
            },
            headerBackground: () => (
              <LinearGradient
                colors={["#0D9488", "#14B8A6", "#06B6D4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            ),
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ title: i18n.t("auth.signIn") }}
          />
        </Stack.Navigator>
      );
    }

    return <DrawerNavigator />;
  };

  return (
    <NavigationContainer>
      <RootNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
