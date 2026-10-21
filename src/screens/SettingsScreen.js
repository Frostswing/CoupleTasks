import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { User } from "../entities/User";
import { getCurrentUser, getUserProfile } from "../services/userService";
import PremiumScreenShell from "../components/premium/PremiumScreenShell";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import i18n from "../localization/i18n";
import { usePartnerMode } from "../context/HouseholdPartnerContext";

export default function SettingsScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isPartnered, partnerEmail: linkedPartnerEmail, refresh: refreshPartnerMode } =
    usePartnerMode();
  const [currentUser, setCurrentUser] = useState(null);
  const [partnerEmailDraft, setPartnerEmailDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const authUser = getCurrentUser();
      if (!authUser) {
        setCurrentUser(null);
        return;
      }
      const result = await getUserProfile(authUser.uid);
      const profile = result.success
        ? { uid: authUser.uid, email: authUser.email, ...result.profile }
        : { uid: authUser.uid, email: authUser.email, full_name: authUser.displayName || "User" };
      setCurrentUser(profile);
      if (profile.partner_email) {
        setPartnerEmailDraft(profile.partner_email);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!partnerEmailDraft || partnerEmailDraft === currentUser.email) {
      Alert.alert("Error", "Please enter a valid partner email.");
      return;
    }

    setIsSaving(true);
    try {
      await User.updateMyUserData({ partner_email: partnerEmailDraft });
      Alert.alert("Success", "Partner linked successfully!");
      await loadUserData();
      refreshPartnerMode();
    } catch (error) {
      console.error("Error saving partner email:", error);
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PremiumScreenShell loading loadingLabel="Loading settings..." title={i18n.t("navigation.settings")} />
    );
  }

  return (
    <PremiumScreenShell
      scroll
      contentStyle={styles.scrollContent}
      title={i18n.t("navigation.settings")}
      subtitle={
        isPartnered ? i18n.t("settings.subtitleCouple") : i18n.t("settings.subtitleSolo")
      }
      referenceBody
      heroAccent="settings"
    >

      {!isPartnered ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Icon name="person-add" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>{i18n.t("settings.inviteTitle")}</Text>
            </View>
            <Text style={styles.cardDescription}>{i18n.t("settings.inviteDescription")}</Text>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{i18n.t("settings.partnerEmailLabel")}</Text>
              <TextInput
                style={styles.input}
                placeholder="partner@example.com"
                value={partnerEmailDraft}
                onChangeText={setPartnerEmailDraft}
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.infoAlert}>
              <View style={styles.alertIcon}>
                <Icon name="info-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{i18n.t("settings.inviteHintTitle")}</Text>
                <Text style={styles.alertText}>{i18n.t("settings.inviteHintBody")}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.textInverse} />
              ) : (
                <Icon name="save" size={20} color={COLORS.textInverse} />
              )}
              <Text style={styles.saveButtonText}>
                {isSaving ? i18n.t("settings.saving") : i18n.t("settings.savePartnerLink")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryLink}
              onPress={() => navigation.navigate("Sharing")}
            >
              <Text style={[styles.secondaryLinkText, { color: colors.primary }]}>
                {i18n.t("settings.listSharingLink")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Icon name="favorite" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>{i18n.t("settings.partnerLinkedTitle")}</Text>
            </View>
            <Text style={styles.cardDescription}>{i18n.t("settings.partnerLinkedDescription")}</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>{i18n.t("settings.partnerEmailLabel")}</Text>
              <View style={styles.partnerInfo}>
                <Icon name="favorite" size={16} color={colors.primary} />
                <Text style={styles.profileValue}>
                  {linkedPartnerEmail || currentUser?.partner_email}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Icon name="person" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Your Profile</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Name</Text>
            <Text style={styles.profileValue}>
              {currentUser?.full_name || 'Not set'}
            </Text>
          </View>

          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Email</Text>
            <Text style={styles.profileValue}>{currentUser?.email}</Text>
          </View>

        </View>
      </View>
    </PremiumScreenShell>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    scrollContent: {
      paddingTop: SPACING.l,
    },
    lead: {
      ...TYPOGRAPHY.body,
      color: colors.textSecondary,
      marginBottom: SPACING.l,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.l,
      marginBottom: SPACING.l,
      padding: SPACING.l,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    cardHeader: {
      marginBottom: SPACING.l,
    },
    cardTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.s,
    },
    cardTitle: {
      ...TYPOGRAPHY.h3,
      color: colors.text,
      marginLeft: SPACING.s,
    },
    cardDescription: {
      ...TYPOGRAPHY.bodySmall,
      color: colors.textSecondary,
    },
    cardContent: {
      gap: SPACING.l,
    },
    inputGroup: {
      marginBottom: SPACING.xs,
    },
    label: {
      ...TYPOGRAPHY.caption,
      color: colors.textSecondary,
      fontWeight: '500',
      marginBottom: SPACING.s,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.m,
      padding: SPACING.m,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
    },
    infoAlert: {
      flexDirection: 'row',
      backgroundColor: colors.primaryMuted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.m,
      padding: SPACING.m,
      alignItems: 'flex-start',
    },
    alertIcon: {
      marginRight: SPACING.m,
      marginTop: 2,
    },
    alertContent: {
      flex: 1,
    },
    alertTitle: {
      ...TYPOGRAPHY.caption,
      fontWeight: '600',
      color: colors.text,
      marginBottom: SPACING.xs,
    },
    alertText: {
      ...TYPOGRAPHY.caption,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: RADIUS.m,
      padding: SPACING.l,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: COLORS.textInverse,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: SPACING.s,
    },
    profileItem: {
      paddingVertical: SPACING.s,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderLight,
    },
    profileLabel: {
      ...TYPOGRAPHY.caption,
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
    },
    profileValue: {
      ...TYPOGRAPHY.body,
      color: colors.text,
      fontWeight: '500',
    },
    partnerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    secondaryLink: {
      marginTop: SPACING.m,
      alignItems: 'center',
      paddingVertical: SPACING.s,
    },
    secondaryLinkText: {
      ...TYPOGRAPHY.bodySmall,
      fontWeight: '600',
    },
  });
}
