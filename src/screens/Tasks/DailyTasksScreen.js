import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Task } from "../../entities/Task";
import { User } from "../../entities/User";
import DailyTaskCard from "../../components/Tasks/DailyTaskCard";
import EditTaskDialog from "../../components/Tasks/EditTaskDialog";
import taskSchedulingService from "../../services/taskSchedulingService";
import taskGenerationService from "../../services/taskGenerationService";
import notificationService from "../../services/notificationService";
import { handleError, showSuccess } from "../../services/errorHandlingService";
import { getCurrentUser } from "../../services/userService";
import { addDays, format } from "date-fns";

export default function DailyTasksScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [groupedTasks, setGroupedTasks] = useState({
    overdue: [],
    today: [],
    thisWeek: [],
    comingSoon: [],
    later: []
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deferModalVisible, setDeferModalVisible] = useState(false);
  const [taskToDefer, setTaskToDefer] = useState(null);

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

  // Initialize notifications
  useEffect(() => {
    notificationService.initialize();
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

  // Group tasks by urgency
  useEffect(() => {
    const grouped = taskSchedulingService.groupTasksByUrgency(tasks);
    setGroupedTasks(grouped);
  }, [tasks]);

  // Auto-generate tasks on mount and refresh
  useEffect(() => {
    const generateTasks = async () => {
      try {
        await taskGenerationService.generateTasksForAllTemplates();
      } catch (error) {
        console.error('Error auto-generating tasks:', error);
      }
    };
    
    if (currentUser?.uid) {
      generateTasks();
    }
  }, [currentUser?.uid]);

  // Schedule notifications for tasks
  useEffect(() => {
    const scheduleNotifications = async () => {
      try {
        await notificationService.scheduleAllTaskNotifications();
      } catch (error) {
        console.error('Error scheduling notifications:', error);
      }
    };
    
    if (tasks.length > 0) {
      scheduleNotifications();
    }
  }, [tasks]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // Generate new tasks from templates
      await taskGenerationService.generateTasksForAllTemplates();
      
      const allTasks = await Task.filter({ is_archived: { '$ne': true } });
      const userEmails = [user.email];
      if (user.partner_email) {
        userEmails.push(user.partner_email);
      }
      const filtered = allTasks.filter(t => userEmails.includes(t.created_by));
      setTasks(filtered);
    } catch (error) {
      handleError(error, 'refreshTasks');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleComplete = async (task) => {
    setIsUpdating(true);
    try {
      await Task.update(task.id, {
        status: 'completed',
        is_archived: true,
        archived_date: new Date().toISOString(),
        completion_date: new Date().toISOString(),
        completed_by: currentUser?.email || null
      });

      // Cancel notification
      await notificationService.cancelTaskNotification(task.id);

      // If recurring, create next instance
      if (task.recurrence_rule && task.recurrence_rule !== 'none') {
        const nextDueDate = taskGenerationService.calculateNextDueDate(
          { frequency_type: task.recurrence_rule, frequency_interval: 1 },
          new Date().toISOString()
        );
        
        const newTask = {
          ...task,
          due_date: format(nextDueDate, 'yyyy-MM-dd'),
          status: 'pending',
          is_archived: false,
          archived_date: null,
          completion_date: null,
          completed_by: null,
        };
        delete newTask.id;
        
        await Task.create(newTask);
      }

      showSuccess('Task completed!');
    } catch (error) {
      handleError(error, 'completeTask');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDefer = (task) => {
    setTaskToDefer(task);
    setDeferModalVisible(true);
  };

  const confirmDefer = async (days) => {
    if (!taskToDefer) return;
    
    setIsUpdating(true);
    try {
      const deferDate = addDays(new Date(), days);
      await taskSchedulingService.deferTask(taskToDefer.id, deferDate);
      showSuccess(`Task deferred for ${days} days`);
      setDeferModalVisible(false);
      setTaskToDefer(null);
    } catch (error) {
      handleError(error, 'deferTask');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateTask = async (taskData) => {
    setIsUpdating(true);
    try {
      await Task.update(editingTask.id, taskData);
      
      // Update notification
      const updatedTask = await Task.getById(editingTask.id);
      await notificationService.updateTaskNotification(updatedTask);
      
      setEditingTask(null);
      showSuccess('Task updated successfully');
    } catch (error) {
      handleError(error, 'updateTask');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderTaskGroup = (title, tasks, icon, color) => {
    if (tasks.length === 0) return null;

    return (
      <View style={styles.group} key={title}>
        <View style={styles.groupHeader}>
          <View style={[styles.groupIcon, { backgroundColor: color }]}>
            <Icon name={icon} size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.groupTitle}>{title}</Text>
          <Text style={styles.groupCount}>({tasks.length})</Text>
        </View>
        {tasks.map((task) => (
          <DailyTaskCard
            key={task.id}
            task={task}
            onComplete={handleComplete}
            onDefer={handleDefer}
            currentUser={currentUser}
          />
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading your tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalTasks = groupedTasks.overdue.length + 
                     groupedTasks.today.length + 
                     groupedTasks.thisWeek.length + 
                     groupedTasks.comingSoon.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#8B5CF6"]}
            tintColor="#8B5CF6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>
              {currentUser?.full_name ? `Hi, ${currentUser.full_name.split(' ')[0]}!` : 'Hi!'}
            </Text>
            <Text style={styles.subtitleText}>
              {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'} to focus on
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddTask')}
            disabled={isUpdating}
          >
            <Icon name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Task Groups */}
        {totalTasks === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="check-circle" size={48} color="#8B5CF6" />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>
              You have no tasks right now. Great job!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddTask')}
            >
              <Icon name="add" size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderTaskGroup('Overdue', groupedTasks.overdue, 'warning', '#DC2626')}
            {renderTaskGroup('Today', groupedTasks.today, 'today', '#2563EB')}
            {renderTaskGroup('This Week', groupedTasks.thisWeek, 'calendar-today', '#9333EA')}
            {renderTaskGroup('Coming Soon', groupedTasks.comingSoon, 'schedule', '#16A34A')}
          </>
        )}
      </ScrollView>

      {/* Defer Modal */}
      <Modal
        visible={deferModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeferModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Defer Task</Text>
            <Text style={styles.modalSubtitle}>
              How many days would you like to defer "{taskToDefer?.title}"?
            </Text>
            <View style={styles.deferOptions}>
              {[1, 2, 3, 7].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={styles.deferOption}
                  onPress={() => confirmDefer(days)}
                >
                  <Text style={styles.deferOptionText}>
                    {days} {days === 1 ? 'day' : 'days'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setDeferModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Task Dialog */}
      <EditTaskDialog
        task={editingTask}
        visible={!!editingTask}
        onClose={() => setEditingTask(null)}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#6B7280',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  group: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  groupCount: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    backgroundColor: '#F3E8FF',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  deferOptions: {
    gap: 12,
    marginBottom: 16,
  },
  deferOption: {
    backgroundColor: '#F3E8FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deferOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9333EA',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

