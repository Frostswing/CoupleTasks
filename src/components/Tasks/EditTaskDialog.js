import React, { useState, useEffect } from "react";
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
import Icon from "react-native-vector-icons/MaterialIcons";
import TaskForm from "./TaskForm";
import { TaskTemplate } from "../../entities/TaskTemplate";

const { width, height } = Dimensions.get('window');

export default function EditTaskDialog({ task, visible, onClose, onUpdateTask, navigation }) {
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
      console.error('Error loading template:', error);
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
      'Edit Template',
      'Editing this template will update all future tasks created from it. Do you want to continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Edit Template',
          onPress: () => {
            onClose();
            if (navigation) {
              navigation.navigate('TaskTemplates', { 
                editTemplateId: template.id 
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
                <Icon name="auto-awesome" size={20} color="#14B8A6" />
                <Text style={styles.templateBannerText}>
                  This task is from template: {template.template_name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editTemplateButton}
                onPress={handleEditTemplate}
              >
                <Icon name="edit" size={18} color="#14B8A6" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginTop: height * 0.1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  templateBanner: {
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  templateBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  templateBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  editTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#14B8A6',
    gap: 6,
  },
  editTemplateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14B8A6',
  },
}); 