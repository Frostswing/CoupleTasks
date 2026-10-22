import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import PremiumScreenShell from "../components/premium/PremiumScreenShell";
import PremiumCard from "../components/premium/PremiumCard";
import PremiumTextField from "../components/premium/PremiumTextField";
import GradientButton from "../components/premium/GradientButton";
import PressableScale from "../components/premium/PressableScale";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  subscribeToAuthChanges,
} from "../services/userService";
import {
  signInWithGoogle,
  resolveGoogleRedirectResult,
} from "../services/googleAuthService";
import { linkGoogleAfterPasswordLogin } from "../services/googleAuthCore";
import { GOOGLE_SIGN_IN_ERROR } from "../utils/googleAuthErrors";
import { getGoogleSignInErrorMessage } from "../utils/googleAuthMessages";
import { handleError, showSuccess } from "../services/errorHandlingService";
import { validateForm, commonRules } from "../utils/validation";
import i18n from "../localization/i18n";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

const AuthScreen = ({ navigation }) => {
  const { colors } = useAppTheme();
  const themed = useMemo(() => createThemedStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [googleLink, setGoogleLink] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return undefined;
    let active = true;
    (async () => {
      const result = await resolveGoogleRedirectResult();
      if (!active || !result) return;
      if (result.success) {
        setGoogleLink(null);
        showSuccess(i18n.t("auth.loginSuccess"));
        return;
      }
      if (result.errorKey === GOOGLE_SIGN_IN_ERROR.ACCOUNT_EXISTS_PASSWORD) {
        setGoogleLink({
          email: result.email,
          pendingCredential: result.pendingCredential,
        });
        if (result.email) setEmail(result.email);
        return;
      }
      const message = getGoogleSignInErrorMessage(result.errorKey);
      if (message) {
        Alert.alert(i18n.t("common.error"), message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const processGoogleSignInResult = (result) => {
    if (result.redirecting) {
      return;
    }
    if (result.cancelled || result.errorKey === GOOGLE_SIGN_IN_ERROR.CANCELLED) {
      return;
    }
    if (result.success) {
      setGoogleLink(null);
      showSuccess(i18n.t("auth.loginSuccess"));
      return;
    }
    if (
      result.errorKey === GOOGLE_SIGN_IN_ERROR.ACCOUNT_EXISTS_PASSWORD &&
      result.pendingCredential
    ) {
      setGoogleLink({
        email: result.email,
        pendingCredential: result.pendingCredential,
      });
      if (result.email) setEmail(result.email);
      Alert.alert(i18n.t("common.error"), i18n.t("auth.googleAccountExistsWithPassword"));
      return;
    }
    const message = getGoogleSignInErrorMessage(result.errorKey);
    if (message) {
      Alert.alert(i18n.t("common.error"), message);
    } else if (result.error) {
      handleError(result.error, "googleSignIn");
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      processGoogleSignInResult(result);
    } catch (error) {
      handleError(error, "googleSignIn");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLinkGoogleAccount = async () => {
    if (!googleLink?.pendingCredential) return;
    if (!email || !password) {
      Alert.alert(i18n.t("common.error"), i18n.t("auth.googleLinkEnterPassword"));
      return;
    }
    setGoogleLoading(true);
    try {
      const result = await linkGoogleAfterPasswordLogin(
        email,
        password,
        googleLink.pendingCredential
      );
      if (result.success) {
        setGoogleLink(null);
        setPassword("");
        showSuccess(i18n.t("auth.googleLinkSuccess"));
      } else {
        const message = getGoogleSignInErrorMessage(result.errorKey);
        if (message) {
          Alert.alert(i18n.t("common.error"), message);
        } else {
          handleError(result.error, "googleLink");
        }
      }
    } catch (error) {
      handleError(error, "googleLink");
    } finally {
      setGoogleLoading(false);
    }
  };

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

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword", { email });
  };

  const heroTitle = user ? i18n.t("navigation.drawer.profile") : i18n.t("app.displayName");
  const heroSubtitle = user
    ? user.email
    : isLogin
      ? i18n.t("auth.signIn")
      : i18n.t("auth.signUp");

  return (
    <KeyboardAvoidingView
      style={themed.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <PremiumScreenShell
        loading={loading || googleLoading}
        loadingLabel={googleLoading ? i18n.t("auth.googleSigningIn") : i18n.t("common.loading")}
        title={heroTitle}
        subtitle={i18n.t("auth.subtitle")}
        contentStyle={themed.scrollPad}
        referenceBody
      >
        {user ? (
          <PremiumCard style={themed.profileCard}>
            <View style={[themed.avatar, { backgroundColor: colors.primaryMuted }]}>
              <MaterialIcons name="person" size={32} color={colors.primary} />
            </View>
            <Text style={[themed.welcomeText, { color: colors.text }]}>{i18n.t("common.welcome")}</Text>
            <Text style={[themed.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
            <GradientButton
              label={i18n.t("auth.signOut")}
              onPress={handleLogout}
              disabled={loading}
              style={themed.fullWidth}
            />
          </PremiumCard>
        ) : (
          <PremiumCard>
            <Text style={[themed.formTitle, { color: colors.text }]}>
              {isLogin ? i18n.t("auth.signIn") : i18n.t("auth.signUp")}
            </Text>
            {!isLogin && (
              <PremiumTextField
                label={i18n.t("auth.fullName")}
                placeholder={i18n.t("auth.enterFullName")}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}
            <PremiumTextField
              label={i18n.t("auth.email")}
              placeholder={i18n.t("auth.enterEmail")}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <PremiumTextField
              label={i18n.t("auth.password")}
              placeholder={i18n.t("auth.enterPassword")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            {isLogin ? (
              <TouchableOpacity
                style={themed.forgotPassword}
                onPress={handleForgotPassword}
                disabled={loading || googleLoading}
                accessibilityRole="button"
              >
                <Text style={[themed.forgotPasswordText, { color: colors.primary }]}>
                  {i18n.t("auth.forgotPassword")}
                </Text>
              </TouchableOpacity>
            ) : null}
            {!isLogin && (
              <PremiumTextField
                label={i18n.t("auth.confirmPassword")}
                placeholder={i18n.t("auth.confirmPassword")}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            )}
            <GradientButton
              label={isLogin ? i18n.t("auth.signIn") : i18n.t("auth.createAccount")}
              onPress={handleAuth}
              loading={loading}
              style={themed.cta}
            />
            <View style={themed.divider}>
              <View style={[themed.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[themed.dividerText, { color: colors.textTertiary }]}>
                {i18n.t("auth.orDivider")}
              </Text>
              <View style={[themed.dividerLine, { backgroundColor: colors.border }]} />
            </View>
            {googleLink ? (
              <View style={[themed.linkBanner, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}>
                <Text style={[themed.linkBannerText, { color: colors.text }]}>
                  {i18n.t("auth.googleLinkPasswordPrompt")}
                </Text>
                <GradientButton
                  label={i18n.t("auth.linkGoogleAccount")}
                  onPress={handleLinkGoogleAccount}
                  loading={googleLoading}
                  style={themed.linkCta}
                />
              </View>
            ) : null}
            <PressableScale onPress={handleGoogleSignIn} disabled={loading || googleLoading}>
              <View style={[themed.googleButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <MaterialIcons name="g-mobiledata" size={24} color={colors.textSecondary} />
                <Text style={[themed.googleButtonText, { color: colors.textSecondary }]}>
                  {i18n.t("auth.signInWithGoogle")}
                </Text>
              </View>
            </PressableScale>
            <TouchableOpacity style={themed.toggleButton} onPress={toggleAuthMode}>
              <Text style={[themed.toggleHint, { color: colors.textSecondary }]}>
                {isLogin ? i18n.t("auth.noAccount") : i18n.t("auth.hasAccount")}
              </Text>
              <Text style={[themed.toggleAction, { color: colors.primary }]}>
                {isLogin ? i18n.t("auth.createAccount") : i18n.t("auth.loginToAccount")}
              </Text>
            </TouchableOpacity>
          </PremiumCard>
        )}
      </PremiumScreenShell>
    </KeyboardAvoidingView>
  );
};

function createThemedStyles(colors) {
  return StyleSheet.create({
    keyboardView: { flex: 1 },
    scrollPad: { paddingTop: SPACING.s },
    profileCard: { alignItems: "center" },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.l,
    },
    welcomeText: { ...TYPOGRAPHY.h2, marginBottom: SPACING.xs },
    userEmail: { ...TYPOGRAPHY.bodySmall, marginBottom: SPACING.xl },
    fullWidth: { alignSelf: "stretch", width: "100%" },
    formTitle: { ...TYPOGRAPHY.h2, textAlign: "center", marginBottom: SPACING.l },
    cta: { marginTop: SPACING.s },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: SPACING.xl,
    },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { ...TYPOGRAPHY.caption, marginHorizontal: SPACING.l },
    googleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: RADIUS.m,
      paddingVertical: SPACING.m,
      ...SHADOWS.xs,
    },
    googleButtonText: { ...TYPOGRAPHY.body, marginLeft: SPACING.s },
    toggleButton: { alignItems: "center", marginTop: SPACING.xl },
    toggleHint: { ...TYPOGRAPHY.bodySmall, marginBottom: SPACING.xs },
    toggleAction: { ...TYPOGRAPHY.body, fontWeight: "600" },
    forgotPassword: { alignSelf: "flex-end", marginTop: -SPACING.s, marginBottom: SPACING.m },
    forgotPasswordText: { ...TYPOGRAPHY.bodySmall, fontWeight: "600" },
    linkBanner: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: RADIUS.m,
      padding: SPACING.m,
      marginBottom: SPACING.l,
    },
    linkBannerText: { ...TYPOGRAPHY.bodySmall, marginBottom: SPACING.m, textAlign: "center" },
    linkCta: { alignSelf: "stretch" },
  });
}

export default AuthScreen;
