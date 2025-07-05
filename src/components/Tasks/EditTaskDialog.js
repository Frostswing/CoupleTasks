import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TaskForm from "./TaskForm";

const { width, height } = Dimensions.get('window');

export default function EditTaskDialog({ task, visible, onClose, onUpdateTask }) {
  if (!task) return null;

  const handleSubmit = (taskData) => {
    onUpdateTask(taskData);
  };

  const handleCancel = () => {
    onClose();
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
}); 