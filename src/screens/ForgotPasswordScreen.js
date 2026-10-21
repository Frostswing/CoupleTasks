import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import PremiumScreenShell from "../components/premium/PremiumScreenShell";
import PremiumCard from "../components/premium/PremiumCard";
import PremiumTextField from "../components/premium/PremiumTextField";
import GradientButton from "../components/premium/GradientButton";
import { resetPassword } from "../services/userService";
import i18n, { getCurrentLanguage } from "../localization/i18n";
import {
  validateResetEmail,
  RESET_EMAIL_ERROR,
  RESET_SEND_ERROR,
  getAuthLanguageCode,
} from "../utils/passwordReset";
import { SPACING, TYPOGRAPHY, RADIUS, COLORS } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

const RESEND_COOLDOWN_SEC = 60;

const ForgotPasswordScreen = ({ navigation, route }) => {
  const { colors } = useAppTheme();
  const themed = useMemo(() => createThemedStyles(colors), [colors]);
  const initialEmail = route?.params?.email ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState(null);
  const [sendErrorKey, setSendErrorKey] = useState(null);
  const [cooldownSec, setCooldownSec] = useState(0);

  useEffect(() => {
    if (cooldownSec <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldownSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSec]);

  const resolveValidationMessage = useCallback((reason) => {
    if (reason === RESET_EMAIL_ERROR.MISSING) {
      return i18n.t("auth.forgotPasswordMissingEmail");
    }
    if (reason === RESET_EMAIL_ERROR.INVALID) {
      return i18n.t("auth.invalidEmail");
    }
    return i18n.t("auth.invalidEmail");
  }, []);

  const resolveSendErrorMessage = useCallback((key) => {
    switch (key) {
      case RESET_SEND_ERROR.INVALID_EMAIL:
        return i18n.t("auth.invalidEmail");
      case RESET_SEND_ERROR.TOO_MANY_REQUESTS:
        return i18n.t("auth.resetTooManyRequests");
      case RESET_SEND_ERROR.NETWORK:
        return i18n.t("errors.networkError");
      default:
        return i18n.t("auth.resetEmailFailed");
    }
  }, []);

  const sendResetEmail = useCallback(async () => {
    setSendErrorKey(null);
    const validation = validateResetEmail(email);
    if (!validation.ok) {
      setFieldError(resolveValidationMessage(validation.reason));
      return;
    }
    setFieldError(null);
    setLoading(true);
    try {
      const languageCode = getAuthLanguageCode(getCurrentLanguage());
      const result = await resetPassword(email, { languageCode });
      if (result.success) {
        setSuccess(true);
        setCooldownSec(RESEND_COOLDOWN_SEC);
      } else {
        setSendErrorKey(result.errorKey || RESET_SEND_ERROR.GENERIC);
      }
    } finally {
      setLoading(false);
    }
  }, [email, resolveValidationMessage]);

  const handleBackToSignIn = () => {
    navigation.goBack();
  };

  const backIcon = I18nManager.isRTL ? "arrow-forward" : "arrow-back";
  const canResend = success && cooldownSec === 0 && !loading;

  return (
    <KeyboardAvoidingView
      style={themed.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <PremiumScreenShell
        loading={loading && !success}
        loadingLabel={i18n.t("auth.sendingResetEmail")}
        title={i18n.t("auth.forgotPasswordTitle")}
        subtitle={success ? i18n.t("auth.forgotPasswordSuccessSubtitle") : i18n.t("auth.forgotPasswordSubtitle")}
        contentStyle={themed.scrollPad}
        referenceBody
        heroSlot={
          <TouchableOpacity
            onPress={handleBackToSignIn}
            style={themed.backButton}
            accessibilityRole="button"
            accessibilityLabel={i18n.t("common.back")}
          >
            <MaterialIcons name={backIcon} size={24} color={COLORS.textInverse} />
            <Text style={[themed.backLabel, { color: COLORS.textInverse }]}>{i18n.t("common.back")}</Text>
          </TouchableOpacity>
        }
      >
        <PremiumCard>
          {success ? (
            <View style={themed.successBlock}>
              <View style={[themed.successIconWrap, { backgroundColor: colors.primaryMuted }]}>
                <MaterialIcons name="mark-email-read" size={40} color={colors.primary} />
              </View>
              <Text style={[themed.successTitle, { color: colors.text }]}>{i18n.t("auth.checkYourInbox")}</Text>
              <Text style={[themed.successBody, { color: colors.textSecondary }]}>
                {i18n.t("auth.passwordResetEmailSent")}
              </Text>
              <GradientButton
                label={i18n.t("auth.backToSignIn")}
                onPress={handleBackToSignIn}
                style={themed.fullWidth}
              />
              <TouchableOpacity
                onPress={sendResetEmail}
                disabled={!canResend}
                style={themed.resendWrap}
              >
                <Text
                  style={[
                    themed.resendText,
                    { color: canResend ? colors.primary : colors.textTertiary },
                  ]}
                >
                  {cooldownSec > 0
                    ? i18n.t("auth.resendResetCooldown", { seconds: cooldownSec })
                    : i18n.t("auth.resendResetEmail")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[themed.formTitle, { color: colors.text }]}>{i18n.t("auth.resetPassword")}</Text>
              <Text style={[themed.hint, { color: colors.textSecondary }]}>
                {i18n.t("auth.forgotPasswordHint")}
              </Text>
              <PremiumTextField
                label={i18n.t("auth.email")}
                placeholder={i18n.t("auth.enterEmail")}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (fieldError) setFieldError(null);
                  if (sendErrorKey) setSendErrorKey(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={fieldError}
              />
              {sendErrorKey ? (
                <View style={[themed.errorBanner, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
                  <MaterialIcons name="error-outline" size={20} color={colors.error} />
                  <Text style={[themed.errorText, { color: colors.error }]}>
                    {resolveSendErrorMessage(sendErrorKey)}
                  </Text>
                </View>
              ) : null}
              <GradientButton
                label={i18n.t("auth.sendResetLink")}
                onPress={sendResetEmail}
                loading={loading}
                style={themed.cta}
              />
            </>
          )}
        </PremiumCard>
      </PremiumScreenShell>
    </KeyboardAvoidingView>
  );
};

function createThemedStyles(colors) {
  return StyleSheet.create({
    keyboardView: { flex: 1 },
    scrollPad: { paddingTop: SPACING.s },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      marginBottom: SPACING.m,
      gap: SPACING.xs,
    },
    backLabel: { ...TYPOGRAPHY.bodySmall, fontWeight: "600" },
    formTitle: { ...TYPOGRAPHY.h2, textAlign: "center", marginBottom: SPACING.s },
    hint: { ...TYPOGRAPHY.bodySmall, textAlign: "center", marginBottom: SPACING.l },
    cta: { marginTop: SPACING.m },
    fullWidth: { alignSelf: "stretch", width: "100%", marginTop: SPACING.l },
    errorBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.s,
      padding: SPACING.m,
      borderRadius: RADIUS.m,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: SPACING.m,
    },
    errorText: { ...TYPOGRAPHY.bodySmall, flex: 1 },
    successBlock: { alignItems: "center" },
    successIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.l,
    },
    successTitle: { ...TYPOGRAPHY.h2, textAlign: "center", marginBottom: SPACING.s },
    successBody: { ...TYPOGRAPHY.body, textAlign: "center", marginBottom: SPACING.m },
    resendWrap: { marginTop: SPACING.l, padding: SPACING.s },
    resendText: { ...TYPOGRAPHY.bodySmall, fontWeight: "600", textAlign: "center" },
  });
}

export default ForgotPasswordScreen;
