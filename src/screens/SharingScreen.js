import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  getCurrentUser,
  findUserByEmail,
  createSharedSpace,
  removeSharing,
  checkIfSharing,
} from "../services/userService";
import { ThemedScreenShell } from "../components/common/ThemedScreenShell";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

const SharingScreen = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

    if (user.email === sharingEmail) {
      Alert.alert("שגיאה", "לא ניתן לשתף רשימות עם עצמך");
      return;
    }

    setLoading(true);

    try {
      const result = await findUserByEmail(sharingEmail);

      if (!result.success) {
        Alert.alert("שגיאה", "המשתמש לא נמצא. וודא שהמשתמש נרשם למערכת.");
        setLoading(false);
        return;
      }

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
              const sharedResult = await createSharedSpace(
                user.uid,
                result.userId
              );

              if (sharedResult.success) {
                Alert.alert("הצלחה", "הרשימות משותפות כעת עם המשתמש שבחרת");
                setSharingEmail("");
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
    return <ThemedScreenShell loading />;
  }

  if (!currentUser) {
    return (
      <ThemedScreenShell scroll={false}>
        <Text style={styles.notLoggedInText}>
          יש להתחבר תחילה כדי לשתף רשימות
        </Text>
      </ThemedScreenShell>
    );
  }

  return (
    <ThemedScreenShell contentStyle={styles.content}>
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
            placeholderTextColor={colors.textTertiary}
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
    </ThemedScreenShell>
  );
};

function createStyles(colors) {
  return StyleSheet.create({
    content: {
      paddingTop: SPACING.l,
    },
    formContainer: {
      marginBottom: SPACING.xl,
    },
    formLabel: {
      ...TYPOGRAPHY.body,
      color: colors.text,
      marginBottom: SPACING.m,
      textAlign: "right",
    },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.s,
      marginBottom: SPACING.m,
      paddingHorizontal: SPACING.l,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
      textAlign: "right",
    },
    shareButton: {
      backgroundColor: colors.primary,
      height: 50,
      borderRadius: RADIUS.s,
      justifyContent: "center",
      alignItems: "center",
    },
    buttonText: {
      color: COLORS.textInverse,
      fontSize: 18,
      fontWeight: "bold",
    },
    sharingInfoContainer: {
      marginBottom: SPACING.xl,
      alignItems: "center",
    },
    sharingInfoText: {
      ...TYPOGRAPHY.body,
      color: colors.textSecondary,
      marginBottom: SPACING.m,
    },
    userName: {
      ...TYPOGRAPHY.h3,
      color: colors.text,
      marginBottom: SPACING.xs,
    },
    userEmail: {
      ...TYPOGRAPHY.body,
      color: colors.textSecondary,
      marginBottom: SPACING.xl,
    },
    stopSharingButton: {
      backgroundColor: COLORS.error,
      height: 50,
      borderRadius: RADIUS.s,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    infoContainer: {
      marginTop: SPACING.l,
      padding: SPACING.l,
      backgroundColor: colors.surface,
      borderRadius: RADIUS.m,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    infoTitle: {
      ...TYPOGRAPHY.h3,
      color: colors.text,
      marginBottom: SPACING.m,
      textAlign: "right",
    },
    infoText: {
      ...TYPOGRAPHY.bodySmall,
      color: colors.textSecondary,
      marginBottom: SPACING.s,
      lineHeight: 20,
      textAlign: "right",
    },
    notLoggedInText: {
      ...TYPOGRAPHY.body,
      textAlign: "center",
      color: colors.textSecondary,
      padding: SPACING.xl,
    },
  });
}

export default SharingScreen;
