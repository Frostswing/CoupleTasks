import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  getCurrentUser,
  findUserByEmail,
  createSharedSpace,
  removeSharing,
  checkIfSharing,
  getUserProfile,
} from "../services/userService";

const SharingScreen = () => {
  const [loading, setLoading] = useState(true);
  const [sharingEmail, setSharingEmail] = useState("");
  const [sharingStatus, setSharingStatus] = useState({
    isSharing: false,
    sharingWith: null,
  });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadSharingStatus();
  }, []);

  const loadSharingStatus = async () => {
    setLoading(true);
    const user = getCurrentUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setCurrentUser(user);

    try {
      // קבל מידע על שיתוף רשימות
      const status = await checkIfSharing(user.uid);

      if (status.success) {
        setSharingStatus({
          isSharing: status.isSharing,
          sharingWith: status.isSharing ? status.sharingWith : null,
        });
      }
    } catch (error) {
      console.error("Error checking sharing status:", error);
    }

    setLoading(false);
  };

  const handleShareLists = async () => {
    if (!sharingEmail.trim()) {
      Alert.alert("שגיאה", "יש להזין אימייל לשיתוף");
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      Alert.alert("שגיאה", "יש להתחבר תחילה");
      return;
    }

    // לא לאפשר שיתוף עם המשתמש עצמו
    if (user.email === sharingEmail) {
      Alert.alert("שגיאה", "לא ניתן לשתף רשימות עם עצמך");
      return;
    }

    setLoading(true);

    try {
      // חיפוש המשתמש לפי אימייל
      const result = await findUserByEmail(sharingEmail);

      if (!result.success) {
        Alert.alert("שגיאה", "המשתמש לא נמצא. וודא שהמשתמש נרשם למערכת.");
        setLoading(false);
        return;
      }

      // שאל את המשתמש אם הוא בטוח שרוצה לשתף
      Alert.alert(
        "שיתוף רשימות",
        `האם אתה בטוח שברצונך לשתף את הרשימות שלך עם ${
          result.user.name || result.user.email
        }?
        שים לב: כאשר משתפים רשימות, הרשימות של שני המשתמשים מתמזגות לרשימה משותפת חדשה.`,
        [
          { text: "ביטול", style: "cancel" },
          {
            text: "שתף",
            onPress: async () => {
              // יצירת מרחב משותף
              const sharedResult = await createSharedSpace(
                user.uid,
                result.userId
              );

              if (sharedResult.success) {
                Alert.alert("הצלחה", "הרשימות משותפות כעת עם המשתמש שבחרת");
                setSharingEmail("");
                // רענן את מצב השיתוף
                loadSharingStatus();
              } else {
                Alert.alert("שגיאה", "אירעה שגיאה בתהליך השיתוף");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error sharing lists:", error);
      Alert.alert("שגיאה", "אירעה שגיאה בתהליך השיתוף");
    }

    setLoading(false);
  };

  const handleStopSharing = async () => {
    if (!sharingStatus.isSharing || !sharingStatus.sharingWith) {
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      Alert.alert("שגיאה", "יש להתחבר תחילה");
      return;
    }

    Alert.alert(
      "הפסקת שיתוף",
      `האם אתה בטוח שברצונך להפסיק לשתף רשימות עם ${
        sharingStatus.sharingWith.profile.name ||
        sharingStatus.sharingWith.profile.email
      }?
      שים לב: הרשימות המשותפות יועתקו לחשבון שלך.`,
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "הפסק שיתוף",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const result = await removeSharing(
                user.uid,
                sharingStatus.sharingWith.userId
              );

              if (result.success) {
                Alert.alert("הצלחה", "הופסק שיתוף הרשימות");
                // רענן את מצב השיתוף
                loadSharingStatus();
              } else {
                Alert.alert("שגיאה", "אירעה שגיאה בתהליך הפסקת השיתוף");
              }
            } catch (error) {
              console.error("Error stopping sharing:", error);
              Alert.alert("שגיאה", "אירעה שגיאה בתהליך הפסקת השיתוף");
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#f4511e" />
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.notLoggedInText}>
          יש להתחבר תחילה כדי לשתף רשימות
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>שיתוף רשימות</Text>

        {sharingStatus.isSharing ? (
          <View style={styles.sharingInfoContainer}>
            <Text style={styles.sharingInfoText}>
              אתה משתף כרגע את הרשימות שלך עם:
            </Text>
            <Text style={styles.userName}>
              {sharingStatus.sharingWith.profile.name || "משתמש"}
            </Text>
            <Text style={styles.userEmail}>
              {sharingStatus.sharingWith.profile.email}
            </Text>

            <TouchableOpacity
              style={styles.stopSharingButton}
              onPress={handleStopSharing}
            >
              <Text style={styles.buttonText}>הפסק שיתוף</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>
              שתף רשימות עם משתמש אחר על ידי הזנת האימייל שלו:
            </Text>
            <TextInput
              style={styles.input}
              placeholder="הזן אימייל משתמש"
              value={sharingEmail}
              onChangeText={setSharingEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareLists}
            >
              <Text style={styles.buttonText}>שתף רשימות</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>איך זה עובד?</Text>
          <Text style={styles.infoText}>
            כאשר אתה משתף רשימות עם משתמש אחר, הרשימות שלך והרשימות של המשתמש
            האחר מתמזגות לרשימה משותפת.
          </Text>
          <Text style={styles.infoText}>
            שני המשתמשים יוכלו לצפות ולערוך את הרשימות המשותפות.
          </Text>
          <Text style={styles.infoText}>
            אם תפסיק את השיתוף, תקבל מחדש את הרשימות המשותפות לחשבון הפרטי שלך.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#f4511e",
  },
  formContainer: {
    marginBottom: 30,
  },
  formLabel: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "right",
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
  shareButton: {
    backgroundColor: "#f4511e",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  sharingInfoContainer: {
    marginBottom: 30,
    alignItems: "center",
  },
  sharingInfoText: {
    fontSize: 16,
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  stopSharingButton: {
    backgroundColor: "#e74c3c",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  infoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "right",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
    textAlign: "right",
  },
  notLoggedInText: {
    fontSize: 18,
    textAlign: "center",
    color: "#888",
  },
});

export default SharingScreen;
