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
import DrawerNavigator from "./src/navigation/DrawerNavigator";
import { subscribeToAuthChanges } from "./src/services/userService";

// התעלמות משגיאות ידועות שקשורות ל-Firebase
LogBox.ignoreLogs([
  "Error: Component auth has not been registered yet",
  "Non-serializable values were found in the navigation state",
]);

// הגדרת תמיכה בשפות RTL (עברית)
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState(null);

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
          status.databaseInitialized
        ) {
          console.log(`Firebase app '${status.appName}' is fully initialized`);
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

    checkFirebase();
  }, []);

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

  // מסך טעינה בזמן אתחול האימות
  if (initializing || !firebaseReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>טוען את האפליקציה...</Text>
        {!firebaseReady && (
          <View>
            <Text style={{ marginTop: 5, color: "red" }}>
              מאתחל את Firebase...
            </Text>
            {firebaseStatus && (
              <Text style={{ marginTop: 5, fontSize: 12, color: "gray" }}>
                מצב Firebase: {JSON.stringify(firebaseStatus)}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <NavigationContainer>
      <DrawerNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
