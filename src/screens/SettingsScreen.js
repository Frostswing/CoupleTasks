import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { User } from "../entities/User";
import { useTheme } from "../theme/ThemeContext";

const { width } = Dimensions.get('window');

export default function SettingsScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      if (user.partner_email) {
        setPartnerEmail(user.partner_email);
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
      loadUserData(); // Refresh data
    } catch (error) {
      console.error("Error saving partner email:", error);
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your profile and link with your partner.</Text>
        </View>

        {/* Theme */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Icon name="dark-mode" size={24} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Appearance</Text>
            </View>
            <Text style={styles.cardDescription}>Choose between light and dark modes.</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '500' }}>Dark Mode</Text>
              <Switch value={isDark} onValueChange={toggle} />
            </View>
          </View>
        </View>

        {/* Partner Link Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Icon name="link" size={24} color="#EC4899" />
              <Text style={styles.cardTitle}>Link Your Partner</Text>
            </View>
            <Text style={styles.cardDescription}>
              Enter your partner's email to sync tasks. They must be a registered user.
            </Text>
          </View>

          <View style={styles.cardContent}>
            {/* Partner Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Partner's Email</Text>
              <TextInput
                style={styles.input}
                placeholder="partner@example.com"
                value={partnerEmail}
                onChangeText={setPartnerEmail}
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Info Alert */}
            <View style={styles.infoAlert}>
              <View style={styles.alertIcon}>
                <Icon name="favorite" size={16} color="#EC4899" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>For a complete sync</Text>
                <Text style={styles.alertText}>
                  Your partner must also add your email address in their settings.
                </Text>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="save" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Partner Connection'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current User Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Icon name="person" size={24} color="#6366F1" />
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
                  <Icon name="favorite" size={16} color="#EC4899" />
                  <Text style={styles.profileValue}>{currentUser.partner_email}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    marginTop: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cardContent: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#FBCFE8',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  infoAlert: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
  },
  alertIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EC4899',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  profileItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
}); 