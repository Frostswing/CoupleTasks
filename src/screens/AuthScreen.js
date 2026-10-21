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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  subscribeToAuthChanges,
  resetPassword,
} from "../services/userService";
import { simpleGoogleSignIn } from "../services/googleAuthService";
import { handleError, showSuccess } from "../services/errorHandlingService";
import { validateForm, commonRules } from "../utils/validation";
import i18n from "../localization/i18n";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

const AuthScreen = ({ navigation }) => {
  const { colors } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const validateAuthForm = () => {
    const rules = {
      email: commonRules.email,
      password: commonRules.password,
    };

    if (!isLogin) {
      rules.name = commonRules.name;
      rules.confirmPassword = [commonRules.passwordConfirm(password)];
    }

    const errors = validateForm({ email, password, name, confirmPassword }, rules);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      Alert.alert(i18n.t("common.error"), firstError);
      return false;
    }

    return true;
  };

  const handleAuth = async () => {
    if (!validateAuthForm()) return;

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await loginUser(email, password);
      } else {
        result = await registerUser(email, password, name);
      }

      if (result.success) {
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setName("");
        showSuccess(isLogin ? i18n.t("auth.loginSuccess") : i18n.t("auth.registrationSuccess"));
      } else {
        handleError(result.error, isLogin ? "loginUser" : "registerUser");
      }
    } catch (error) {
      handleError(error, isLogin ? "loginUser" : "registerUser");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await simpleGoogleSignIn();

      if (result.requiresDevBuild) {
        Alert.alert("Google Sign In", result.error, [{ text: "OK" }]);
      } else if (result.success) {
        const googleUser = result.user;
        const firebaseResult = await registerUser(
          googleUser.email,
          "google-auth-" + googleUser.id,
          googleUser.name
        );

        if (firebaseResult.success) {
          showSuccess(i18n.t("auth.loginSuccess"));
        } else {
          const loginResult = await loginUser(googleUser.email, "google-auth-" + googleUser.id);
          if (loginResult.success) {
            showSuccess(i18n.t("auth.loginSuccess"));
          } else {
            handleError(loginResult.error, "googleSignIn");
          }
        }
      } else {
        if (result.error !== "Login cancelled") {
          handleError(result.error, "googleSignIn");
        }
      }
    } catch (error) {
      handleError(error, "googleSignIn");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      showSuccess(i18n.t("auth.logoutSuccess"));
    } catch (error) {
      handleError(error, "logoutUser");
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(i18n.t("common.error"), i18n.t("auth.enterEmailForReset") || "Please enter your email address first");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(i18n.t("common.error"), i18n.t("auth.invalidEmail"));
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        Alert.alert(
          i18n.t("common.success") || "Success",
          i18n.t("auth.passwordResetEmailSent") || "Password reset email sent!"
        );
      } else {
        handleError(result.error, "resetPassword");
      }
    } catch (error) {
      handleError(error, "resetPassword");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{i18n.t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="favorite" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>CoupleTasks</Text>
            <Text style={styles.subtitle}>Organize together</Text>
          </View>

          {user ? (
            <View style={styles.userSection}>
              <View style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <MaterialIcons name="person" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.welcomeText}>{i18n.t("common.welcome")}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
                  <Text style={styles.logoutButtonText}>{i18n.t("auth.signOut")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.title}>
                {isLogin ? i18n.t("auth.signIn") : i18n.t("auth.signUp")}
              </Text>

              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{i18n.t("auth.fullName")}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={i18n.t("auth.enterFullName")}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    placeholderTextColor={COLORS.textTertiary}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{i18n.t("auth.email")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={i18n.t("auth.enterEmail")}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{i18n.t("auth.password")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={i18n.t("auth.enterPassword")}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>

              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{i18n.t("auth.confirmPassword")}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={i18n.t("auth.confirmPassword")}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    placeholderTextColor={COLORS.textTertiary}
                  />
                </View>
              )}

              <TouchableOpacity style={styles.authButton} onPress={handleAuth} disabled={loading}>
                <Text style={styles.authButtonText}>
                  {isLogin ? i18n.t("auth.signIn") : i18n.t("auth.createAccount")}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                <MaterialIcons name="g-mobiledata" size={24} color={COLORS.textSecondary} />
                <Text style={styles.googleButtonText}>{i18n.t("auth.signInWithGoogle")}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.toggleButton} onPress={toggleAuthMode}>
                <Text style={styles.toggleButtonText}>
                  {isLogin ? i18n.t("auth.noAccount") : i18n.t("auth.hasAccount")}
                </Text>
                <Text style={styles.toggleButtonAction}>
                  {isLogin ? i18n.t("auth.createAccount") : i18n.t("auth.loginToAccount")}
                </Text>
              </TouchableOpacity>

              {isLogin && (
                <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword} disabled={loading}>
                  <Text style={styles.forgotPasswordText}>{i18n.t("auth.forgotPassword")}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.l,
  },
  header: {
    alignItems: "center",
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxxl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.l,
    backgroundColor: COLORS.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.l,
  },
  appName: {
    ...TYPOGRAPHY.displayMedium,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  title: {
    ...TYPOGRAPHY.h1,
    textAlign: "center",
    marginBottom: SPACING.xxl,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  inputGroup: {
    marginBottom: SPACING.l,
  },
  label: {
    ...TYPOGRAPHY.label,
    marginBottom: SPACING.s,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    fontSize: 16,
    color: COLORS.text,
    ...SHADOWS.xs,
  },
  authButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.m,
    paddingVertical: SPACING.l,
    alignItems: "center",
    marginTop: SPACING.s,
    ...SHADOWS.sm,
  },
  authButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textInverse,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginHorizontal: SPACING.l,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.m,
    paddingVertical: SPACING.m,
    ...SHADOWS.xs,
  },
  googleButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.s,
  },
  toggleButton: {
    alignItems: "center",
    marginTop: SPACING.xl,
  },
  toggleButtonText: {
    ...TYPOGRAPHY.bodySmall,
    marginBottom: SPACING.xs,
  },
  toggleButtonAction: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "600",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: SPACING.l,
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
  },
  userSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.l,
    padding: SPACING.xxl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...SHADOWS.md,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.l,
  },
  welcomeText: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    ...TYPOGRAPHY.bodySmall,
    marginBottom: SPACING.xxl,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.m,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.xxl,
    width: "100%",
    alignItems: "center",
  },
  logoutButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textInverse,
    fontWeight: "600",
  },
});

export default AuthScreen;
