import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Task } from "../../entities/Task";
import { TaskTemplate } from "../../entities/TaskTemplate";
import { User } from "../../entities/User";
import CalendarView from "../../components/Tasks/CalendarView";
import EditTaskDialog from "../../components/Tasks/EditTaskDialog";
import TaskForm from "../../components/Tasks/TaskForm";
import taskSchedulingService from "../../services/taskSchedulingService";
import taskGenerationService from "../../services/taskGenerationService";
import { handleError, showSuccess } from "../../services/errorHandlingService";
import { format, parseISO } from "date-fns";

export default function TaskPlanningScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingTask, setEditingTask] = useState(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        handleError(error, 'loadUser');
      }
    };
    loadUser();
  }, []);

  // Set up real-time task listener
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let isMounted = true;
    
    const userEmails = [currentUser.email];
    if (currentUser.partner_email) {
      userEmails.push(currentUser.partner_email);
    }

    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 10000);

    const unsubscribe = Task.onSnapshot(
      (taskList) => {
        if (!isMounted) return;
        
        clearTimeout(loadingTimeout);
        
        const filtered = taskList.filter(t => 
          userEmails.includes(t.created_by) && 
          !t.is_archived
        );
        
        setTasks(filtered);
        setIsLoading(false);
      },
      { is_archived: { '$ne': true } }
    );

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const allTemplates = await TaskTemplate.getAll();
        setTemplates(allTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };
    
    if (currentUser?.uid) {
      loadTemplates();
    }
  }, [currentUser?.uid]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setCreatingTask(true);
  };

  const handleTaskPress = (task) => {
    setSelectedTask(task);
    setEditingTask(task);
  };

  const handleTaskMove = async (taskId, newDate) => {
    try {
      await taskSchedulingService.moveTaskToDate(taskId, newDate);
      showSuccess('Task moved successfully');
    } catch (error) {
      handleError(error, 'moveTask');
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const taskWithDate = {
        ...taskData,
        due_date: format(selectedDate, 'yyyy-MM-dd'),
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      };
      await Task.create(taskWithDate);
      setCreatingTask(false);
      showSuccess('Task created successfully');
    } catch (error) {
      handleError(error, 'createTask');
    }
  };

  const handleCreateFromTemplate = async (template) => {
    try {
      const task = await taskGenerationService.generateTaskForDate(
        template,
        format(selectedDate, 'yyyy-MM-dd')
      );
      if (task) {
        setShowTemplateModal(false);
        showSuccess('Task created from template');
      }
    } catch (error) {
      handleError(error, 'createFromTemplate');
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      await Task.update(editingTask.id, taskData);
      setEditingTask(null);
      setSelectedTask(null);
      showSuccess('Task updated successfully');
    } catch (error) {
      handleError(error, 'updateTask');
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'week' ? 'month' : 'week');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Task Planning</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleViewMode}
          >
            <Icon 
              name={viewMode === 'week' ? 'view-week' : 'calendar-month'} 
              size={24} 
              color="#8B5CF6" 
            />
            <Text style={styles.toggleText}>
              {viewMode === 'week' ? 'Month' : 'Week'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowTemplateModal(true)}
          >
            <Icon name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar View */}
      <CalendarView
        tasks={tasks}
        currentDate={selectedDate}
        viewMode={viewMode}
        onDateSelect={handleDateSelect}
        onTaskPress={handleTaskPress}
        onTaskMove={handleTaskMove}
      />

      {/* Create Task Modal */}
      <Modal
        visible={creatingTask}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCreatingTask(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Create Task for {format(selectedDate, 'MMM d, yyyy')}
              </Text>
              <TouchableOpacity
                onPress={() => setCreatingTask(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TaskForm
              onSubmit={handleCreateTask}
              onCancel={() => setCreatingTask(false)}
              title="Create Task"
            />
          </View>
        </View>
      </Modal>

      {/* Template Selection Modal */}
      <Modal
        visible={showTemplateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create from Template</Text>
              <TouchableOpacity
                onPress={() => setShowTemplateModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.templatesList}>
              {templates.length === 0 ? (
                <View style={styles.emptyTemplates}>
                  <Text style={styles.emptyText}>No templates available</Text>
                  <TouchableOpacity
                    style={styles.createTemplateButton}
                    onPress={() => {
                      setShowTemplateModal(false);
                      navigation.navigate('TaskTemplates');
                    }}
                  >
                    <Text style={styles.createTemplateText}>Create Template</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                templates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={styles.templateItem}
                    onPress={() => handleCreateFromTemplate(template)}
                  >
                    <View style={styles.templateContent}>
                      <Text style={styles.templateName}>{template.template_name}</Text>
                      {template.description && (
                        <Text style={styles.templateDescription} numberOfLines={2}>
                          {template.description}
                        </Text>
                      )}
                      <View style={styles.templateMeta}>
                        <Text style={styles.templateFrequency}>
                          {template.frequency_type} • {template.estimated_duration || 'No duration'}
                        </Text>
                      </View>
                    </View>
                    <Icon name="chevron-right" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Task Dialog */}
      <EditTaskDialog
        task={editingTask}
        visible={!!editingTask}
        onClose={() => {
          setEditingTask(null);
          setSelectedTask(null);
        }}
        onUpdateTask={handleUpdateTask}
      />
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
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    gap: 6,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  templatesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyTemplates: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  createTemplateButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createTemplateText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  templateContent: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateFrequency: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

