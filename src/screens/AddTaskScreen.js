import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Task } from "../entities/Task";
import TaskForm from "../components/Tasks/TaskForm";
import { ThemedScreenShell } from "../components/common/ThemedScreenShell";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import i18n from "../localization/i18n";
import { usePartnerMode } from "../context/HouseholdPartnerContext";

export default function AddTaskScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isPartnered } = usePartnerMode();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (taskData) => {
    setIsSubmitting(true);
    try {
      await Task.create(taskData);
      navigation.navigate('Dashboard');
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <>
      <ThemedScreenShell
        scroll
        contentStyle={styles.content}
        title={i18n.t("navigation.addTask")}
        subtitle={
          isPartnered ? i18n.t("addTask.subtitleCouple") : i18n.t("addTask.subtitleSolo")
        }
      >
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          title="Create New Task"
        />
      </ThemedScreenShell>

      <Modal visible={isSubmitting} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Creating your task...</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    content: {
      paddingTop: SPACING.l,
    },
    lead: {
      ...TYPOGRAPHY.body,
      color: colors.textSecondary,
      marginBottom: SPACING.xl,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.l,
      padding: SPACING.xxl,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    loadingText: {
      ...TYPOGRAPHY.body,
      color: colors.text,
      fontWeight: '500',
      marginLeft: SPACING.l,
    },
  });
}
