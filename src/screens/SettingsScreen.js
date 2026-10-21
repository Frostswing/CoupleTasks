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
import { ThemedScreenShell } from "../components/common/ThemedScreenShell";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

export default function SettingsScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [currentUser, setCurrentUser] = useState(null);
  const [partnerEmail, setPartnerEmail] = useState("");
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
        setPartnerEmail(profile.partner_email);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!partnerEmail || partnerEmail === currentUser.email) {
      Alert.alert("Error", "Please enter a valid partner email.");
      return;
    }

    setIsSaving(true);
    try {
      await User.updateMyUserData({ partner_email: partnerEmail });
      Alert.alert("Success", "Partner linked successfully!");
      loadUserData();
    } catch (error) {
      console.error("Error saving partner email:", error);
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <ThemedScreenShell loading loadingLabel="Loading settings..." />;
  }

  return (
    <ThemedScreenShell scroll contentStyle={styles.scrollContent}>
      <Text style={styles.lead}>
        Manage your profile and link with your partner.
      </Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Icon name="link" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Link Your Partner</Text>
          </View>
          <Text style={styles.cardDescription}>
            Enter your partner's email to sync tasks. They must be a registered user.
          </Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Partner's Email</Text>
            <TextInput
              style={styles.input}
              placeholder="partner@example.com"
              value={partnerEmail}
              onChangeText={setPartnerEmail}
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.infoAlert}>
            <View style={styles.alertIcon}>
              <Icon name="favorite" size={16} color={colors.primary} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>For a complete sync</Text>
              <Text style={styles.alertText}>
                Your partner must also add your email address in their settings.
              </Text>
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
              {isSaving ? 'Saving...' : 'Save Partner Connection'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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

          {currentUser?.partner_email && (
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>Partner</Text>
              <View style={styles.partnerInfo}>
                <Icon name="favorite" size={16} color={colors.primary} />
                <Text style={styles.profileValue}>{currentUser.partner_email}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ThemedScreenShell>
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
  });
}
