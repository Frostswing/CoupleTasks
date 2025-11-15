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
  const [showDayTasksModal, setShowDayTasksModal] = useState(false);
  const [selectedDayTasks, setSelectedDayTasks] = useState([]);
  const [selectedDayDate, setSelectedDayDate] = useState(null);

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
    const userUids = [currentUser.uid];
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
        
        // Filter tasks: show tasks assigned to current user, "together", or unassigned (empty/none)
        // Also include tasks created by user (for backward compatibility)
        const filtered = taskList.filter(t => {
          if (t.is_archived) return false;
          
          // Show if assigned to current user
          if (userEmails.includes(t.assigned_to)) return true;
          
          // Show if assigned to "together" (both partners)
          if (t.assigned_to === 'together') return true;
          
          // Show if unassigned (empty string or null)
          if (!t.assigned_to || t.assigned_to === '') return true;
          
          // Backward compatibility: show tasks created by user
          if (userEmails.includes(t.created_by) || userUids.includes(t.created_by)) return true;
          
          return false;
        });
        
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

  // Set up real-time template listener and auto-generate tasks
  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }

    // Auto-generate tasks from active templates for upcoming month (runs in background)
    taskGenerationService.generateTasksForUpcomingMonth().catch(error => {
      console.error('Error auto-generating tasks:', error);
      handleError(error, 'autoGenerateTasks');
    });

    // Set up real-time listener for ALL templates
    const unsubscribe = TaskTemplate.onSnapshot(
      (templateList) => {
        // Filter to only show active templates in the "Create from Template" modal
        // Treat undefined/null as active (for backwards compatibility with old templates)
        const activeTemplates = templateList.filter(t => {
          // Explicitly check: show if is_active is true OR undefined/null
          return t.is_active !== false;
        });
        setTemplates(activeTemplates);
      }
      // No server-side filter - get all templates, then filter client-side
      // This ensures we see templates even if there's a data inconsistency
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Get all tasks for this date
    const dayTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = parseISO(task.due_date);
      return format(taskDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
    setSelectedDayTasks(dayTasks);
    setSelectedDayDate(date);
    setShowDayTasksModal(true);
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
        key={`${viewMode}-${selectedDate.getTime()}`}
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

      {/* Day Tasks Modal */}
      <Modal
        visible={showDayTasksModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDayTasksModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedDayDate ? format(selectedDayDate, 'EEEE, MMMM d') : 'Tasks'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {selectedDayTasks.length} task{selectedDayTasks.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDayTasksModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dayTasksList}>
              {selectedDayTasks.length === 0 ? (
                <View style={styles.emptyDayTasks}>
                  <Icon name="event-busy" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyText}>No tasks for this day</Text>
                  <TouchableOpacity
                    style={styles.addTaskButton}
                    onPress={() => {
                      setShowDayTasksModal(false);
                      setCreatingTask(true);
                    }}
                  >
                    <Icon name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.addTaskButtonText}>Add Task</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                selectedDayTasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.dayTaskItem,
                      task.status === 'completed' && styles.completedTaskItem
                    ]}
                    onPress={() => {
                      setShowDayTasksModal(false);
                      handleTaskPress(task);
                    }}
                  >
                    <View style={styles.dayTaskContent}>
                      <View style={styles.dayTaskHeader}>
                        <Text style={[
                          styles.dayTaskTitle,
                          task.status === 'completed' && styles.completedTaskText
                        ]}>
                          {task.title}
                        </Text>
                        {task.status === 'completed' && (
                          <Icon name="check-circle" size={20} color="#10B981" />
                        )}
                      </View>
                      {task.description && (
                        <Text style={styles.dayTaskDescription} numberOfLines={2}>
                          {task.description}
                        </Text>
                      )}
                      <View style={styles.dayTaskMeta}>
                        <View style={[
                          styles.priorityBadge,
                          task.priority === 'high' && styles.priorityHigh,
                          task.priority === 'low' && styles.priorityLow
                        ]}>
                          <Text style={styles.priorityText}>{task.priority || 'medium'}</Text>
                        </View>
                        {task.estimated_duration && (
                          <View style={styles.durationText}>
                            <Icon name="schedule" size={14} color="#6B7280" />
                            <Text style={styles.metaText}> {task.estimated_duration} min</Text>
                          </View>
                        )}
                        {task.assigned_to && (
                          <View style={styles.assignedText}>
                            <Icon name="person" size={14} color="#6B7280" />
                            <Text style={styles.metaText}> {task.assigned_to}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Icon name="chevron-right" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            {selectedDayTasks.length > 0 && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={() => {
                    setShowDayTasksModal(false);
                    setCreatingTask(true);
                  }}
                >
                  <Icon name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addTaskButtonText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            )}
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
        navigation={navigation}
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
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  dayTasksList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyDayTasks: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  dayTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  completedTaskItem: {
    opacity: 0.6,
  },
  dayTaskContent: {
    flex: 1,
  },
  dayTaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dayTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  dayTaskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  dayTaskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  priorityHigh: {
    backgroundColor: '#FEE2E2',
  },
  priorityLow: {
    backgroundColor: '#D1FAE5',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textTransform: 'capitalize',
  },
  durationText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  addTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

