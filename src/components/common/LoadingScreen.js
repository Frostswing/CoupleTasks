import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";

export default function LoadingScreen({ message, status }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <MaterialIcons name="favorite" size={32} color={COLORS.primary} />
        </View>
        
        <Text style={styles.appName}>CoupleTasks</Text>
        
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.spinner}
        />
        
        <Text style={styles.message}>{message || "Loading..."}</Text>
        
        {status?.error && (
          <Text style={styles.errorText}>{status.error}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: SPACING.xxl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.l,
  },
  appName: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.xxl,
  },
  spinner: {
    marginBottom: SPACING.l,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: SPACING.m,
    textAlign: "center",
  },
});
