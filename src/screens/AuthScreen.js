import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  subscribeToAuthChanges,
} from "../services/userService";

const AuthScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // האזנה לשינויים במצב האימות
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleAuth = async () => {
    if (!email.trim()) {
      Alert.alert("שגיאה", "יש להזין אימייל");
      return;
    }

    if (!password.trim() || password.length < 6) {
      Alert.alert("שגיאה", "יש להזין סיסמה באורך 6 תווים לפחות");
      return;
    }

    if (!isLogin && !name.trim()) {
      Alert.alert("שגיאה", "יש להזין שם");
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await loginUser(email, password);
      } else {
        result = await registerUser(email, password, name);
      }

      if (result.success) {
        // איפוס השדות
        setEmail("");
        setPassword("");
        setName("");
      } else {
        const errorMessage = isLogin
          ? "שגיאה בכניסה למערכת. נא לבדוק את פרטי הכניסה."
          : "שגיאה ברישום. ייתכן שכתובת האימייל כבר בשימוש.";
        Alert.alert("שגיאה", errorMessage);
      }
    } catch (error) {
      Alert.alert("שגיאה", "אירעה שגיאה בתהליך ההרשמה/כניסה");
      console.error(error);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
    } catch (error) {
      Alert.alert("שגיאה", "אירעה שגיאה בתהליך היציאה");
      console.error(error);
    }
    setLoading(false);
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // איפוס הטופס
    setEmail("");
    setPassword("");
    setName("");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>אנא המתן...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>
          {user ? "פרטי משתמש" : isLogin ? "כניסה" : "הרשמה"}
        </Text>

        {user ? (
          // אם המשתמש מחובר, הצג את המידע שלו
          <View style={styles.userInfoContainer}>
            <Text style={styles.userInfoText}>מחובר כ: {user.email}</Text>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>התנתק</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // אם אין משתמש מחובר, הצג טופס הרשמה/כניסה
          <View style={styles.formContainer}>
            {!isLogin && (
              <TextInput
                style={styles.input}
                placeholder="שם"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="אימייל"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="סיסמה"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
              <Text style={styles.buttonText}>
                {isLogin ? "כניסה" : "הרשמה"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleAuthMode}
            >
              <Text style={styles.toggleButtonText}>
                {isLogin ? "אין לך חשבון? הירשם כאן" : "יש לך חשבון? היכנס כאן"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#888",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#f4511e",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    textAlign: "right",
  },
  authButton: {
    backgroundColor: "#f4511e",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  toggleButton: {
    padding: 10,
    alignItems: "center",
  },
  toggleButtonText: {
    color: "#f4511e",
    fontSize: 16,
  },
  userInfoContainer: {
    width: "100%",
    alignItems: "center",
  },
  userInfoText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  logoutButton: {
    backgroundColor: "#f4511e",
    width: "100%",
    maxWidth: 200,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AuthScreen;
