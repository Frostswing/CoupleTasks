import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import {
  subscribeTasks,
  addTask,
  deleteTask,
  toggleTaskCompletion,
} from "../services/taskService";

const TasksScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // האזנה לשינויים ברשימת המטלות
    const unsubscribe = subscribeTasks((tasksList) => {
      console.log("Received tasks in component:", tasksList);
      setTasks(tasksList);
      setLoading(false);
    });

    // Set a timeout to handle case where Firebase doesn't respond
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Firebase timeout - still loading after 10 seconds");
        setLoading(false);
      }
    }, 10000);

    // הסרת האזנה כאשר הקומפוננטה נפרדת
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleAddTask = async () => {
    if (newTaskTitle.trim() === "") {
      Alert.alert("שגיאה", "יש להזין כותרת למטלה");
      return;
    }

    setLoading(true);
    const result = await addTask({
      title: newTaskTitle,
      description: newTaskDescription,
    });

    if (result.success) {
      setNewTaskTitle("");
      setNewTaskDescription("");
      setModalVisible(false);
    } else {
      Alert.alert("שגיאה", "לא ניתן להוסיף את המטלה");
    }
    setLoading(false);
  };

  const handleDeleteTask = async (taskId) => {
    Alert.alert("מחיקת מטלה", "האם אתה בטוח שברצונך למחוק את המטלה?", [
      { text: "ביטול", style: "cancel" },
      {
        text: "מחיקה",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          await deleteTask(taskId);
          setLoading(false);
        },
      },
    ]);
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    await toggleTaskCompletion(taskId, !currentStatus);
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity
        style={styles.completeButton}
        onPress={() => handleToggleComplete(item.id, item.completed)}
      >
        <View
          style={[styles.checkbox, item.completed && styles.checkboxChecked]}
        />
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <Text
          style={[styles.taskTitle, item.completed && styles.completedText]}
        >
          {item.title}
        </Text>
        {item.description ? (
          <Text style={styles.taskDescription}>{item.description}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteTask(item.id)}
      >
        <Text style={styles.deleteButtonText}>מחק</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>מטלות</Text>

      {loading ? (
        <Text style={styles.loadingText}>טוען...</Text>
      ) : tasks.length === 0 ? (
        <Text style={styles.emptyText}>אין מטלות עדיין. הוסף מטלה חדשה!</Text>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ הוסף מטלה</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>מטלה חדשה</Text>

            <TextInput
              style={styles.input}
              placeholder="כותרת המטלה"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="תיאור (אופציונלי)"
              value={newTaskDescription}
              onChangeText={setNewTaskDescription}
              multiline
              numberOfLines={4}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewTaskTitle("");
                  setNewTaskDescription("");
                }}
              >
                <Text style={styles.buttonText}>ביטול</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddTask}
              >
                <Text style={styles.buttonText}>שמירה</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  loadingText: {
    textAlign: "center",
    marginTop: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#888",
  },
  list: {
    flex: 1,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  taskContent: {
    flex: 1,
  },
  completeButton: {
    padding: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f4511e",
  },
  checkboxChecked: {
    backgroundColor: "#f4511e",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  taskDescription: {
    marginTop: 5,
    color: "#666",
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    color: "red",
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#f4511e",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    textAlign: "right",
  },
  textArea: {
    minHeight: 100,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: "#f4511e",
  },
  cancelButton: {
    backgroundColor: "#ddd",
  },
  buttonText: {
    fontWeight: "bold",
    color: "white",
  },
});

export default TasksScreen;
