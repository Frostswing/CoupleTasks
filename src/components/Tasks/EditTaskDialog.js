import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import TaskForm from "./TaskForm";
import { TaskTemplate } from "../../entities/TaskTemplate";
import { useAppTheme } from "../../context/ThemeContext";

const { height } = Dimensions.get("window");

export default function EditTaskDialog({ task, visible, onClose, onUpdateTask, navigation }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  useEffect(() => {
    if (task?.template_id && visible) {
      loadTemplate();
    } else {
      setTemplate(null);
    }
  }, [task?.template_id, visible]);

  const loadTemplate = async () => {
    if (!task?.template_id) return;

    setLoadingTemplate(true);
    try {
      const loadedTemplate = await TaskTemplate.getById(task.template_id);
      setTemplate(loadedTemplate);
    } catch (error) {
      console.error("Error loading template:", error);
      setTemplate(null);
    } finally {
      setLoadingTemplate(false);
    }
  };

  if (!task) return null;

  const handleSubmit = (taskData) => {
    onUpdateTask(taskData);
  };

  const handleCancel = () => {
    onClose();
  };

  const handleEditTemplate = () => {
    if (!template) return;

    Alert.alert(
      "Edit Template",
      "Editing this template will update all future tasks created from it. Do you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Edit Template",
          onPress: () => {
            onClose();
            if (navigation) {
              navigation.navigate("TaskTemplates", {
                editTemplateId: template.id,
              });
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={styles.content}>
          {task.template_id && template && (
            <View style={styles.templateBanner}>
              <View style={styles.templateBannerContent}>
                <Icon name="auto-awesome" size={20} color={colors.primary} />
                <Text style={styles.templateBannerText}>
                  This task is from template: {template.template_name}
                </Text>
              </View>
              <TouchableOpacity style={styles.editTemplateButton} onPress={handleEditTemplate}>
                <Icon name="edit" size={18} color={colors.primary} />
                <Text style={styles.editTemplateButtonText}>Edit Template</Text>
              </TouchableOpacity>
            </View>
          )}
          <TaskForm
            task={task}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            title="Edit Task"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    content: {
      flex: 1,
      backgroundColor: colors.background,
      marginTop: height * 0.1,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 8,
    },
    templateBanner: {
      backgroundColor: colors.primaryMuted,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    templateBannerContent: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      gap: 8,
    },
    templateBannerText: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
    },
    editTemplateButton: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      gap: 6,
    },
    editTemplateButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
  });
}
