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
import taskCleanupService from "../../services/taskCleanupService";
import { handleError, showSuccess } from "../../services/errorHandlingService";
import { getCurrentUser } from "../../services/userService";
import { addDays, format } from "date-fns";
import { getCachedTasks, cacheTasks, clearTaskCache, getLastSyncTimestamp } from "../../services/taskCache";

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

  // Load cached tasks immediately, then set up real-time listener
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    
    const userEmails = [currentUser.email];
    const userUids = [currentUser.uid];
    if (currentUser.partner_email) {
      userEmails.push(currentUser.partner_email);
    }

    // Filter function for tasks
    const filterTasks = (taskList) => {
      return taskList.filter(t => {
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
    };

    // Track if we've loaded initial data (from cache or Firebase)
    let hasLoadedInitialData = false;
    let loadingTimeout = null;

    // Set timeout to prevent infinite loading (only if no initial data loaded)
    loadingTimeout = setTimeout(() => {
      if (isMounted && !hasLoadedInitialData) {
        console.warn('Task loading timeout - clearing loading state');
        setIsLoading(false);
      }
    }, 10000);

    // Load cached tasks first for instant display, then check for updates
    const loadCachedTasksAndSync = async () => {
      try {
        const cached = await getCachedTasks(currentUser.uid);
        let cachedTaskList = [];
        let lastSyncTimestamp = null;
        
        if (cached && cached.tasks) {
          cachedTaskList = cached.tasks;
          lastSyncTimestamp = cached.lastSyncTimestamp;
          
          // Show cached data immediately
          if (isMounted) {
            const filtered = filterTasks(cachedTaskList);
            setTasks(filtered);
            setIsLoading(false);
            hasLoadedInitialData = true;
            // Clear timeout since we have data
            if (loadingTimeout) {
              clearTimeout(loadingTimeout);
              loadingTimeout = null;
            }
          }
        }
        // If no cache, keep isLoading = true until real-time listener fires

        // Check if there are updates since last sync
        if (lastSyncTimestamp) {
          const hasUpdates = await Task.hasUpdatesSince(lastSyncTimestamp);
          
          if (!hasUpdates) {
            // No updates, cache is still fresh - skip full fetch
            console.log('No updates since last sync, using cache');
            return;
          }
          
          // Fetch only updated tasks and merge with cache
          try {
            const updatedTasks = await Task.getUpdatedSince(lastSyncTimestamp, { is_archived: { '$ne': true } });
            
            // Merge updated tasks with cached tasks
            const taskMap = new Map();
            
            // Add all cached tasks to map
            cachedTaskList.forEach(task => {
              taskMap.set(task.id, task);
            });
            
            // Update/overwrite with updated tasks
            updatedTasks.forEach(task => {
              taskMap.set(task.id, task);
            });
            
            const mergedTasks = Array.from(taskMap.values());
            const filtered = filterTasks(mergedTasks);
            
            if (isMounted) {
              setTasks(filtered);
              // Update cache with merged data
              await cacheTasks(currentUser.uid, mergedTasks);
            }
          } catch (error) {
            console.error('Error fetching updated tasks:', error);
            // Fall through to full fetch - real-time listener will handle it
          }
        }
      } catch (error) {
        console.error('Error loading cached tasks:', error);
        // Keep loading state - real-time listener will handle it
      }
    };

    loadCachedTasksAndSync();

    // Set up real-time listener for future changes (only sends deltas)
    const unsubscribe = Task.onSnapshot(
      (taskList) => {
        if (!isMounted) return;
        
        // Clear timeout since we received data
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
          loadingTimeout = null;
        }
        
        const filtered = filterTasks(taskList);
        
        // Update cache with fresh data
        cacheTasks(currentUser.uid, taskList).catch(err => {
          console.error('Error caching tasks:', err);
        });
        
        setTasks(filtered);
        setIsLoading(false);
        hasLoadedInitialData = true;
      },
      { is_archived: { '$ne': true } }
    );

    return () => {
      isMounted = false;
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Group tasks by urgency
  useEffect(() => {
    const grouped = taskSchedulingService.groupTasksByUrgency(tasks);
    setGroupedTasks(grouped);
  }, [tasks]);

  // Auto-generate tasks for upcoming month and cleanup old archived tasks on mount
  useEffect(() => {
    const initializeTasks = async () => {
      if (!currentUser?.uid) return;
      
      try {
        // Generate tasks for upcoming month (runs in background, doesn't block)
        taskGenerationService.generateTasksForUpcomingMonth();
        
        // Cleanup old archived tasks (60+ days old) - also runs in background
        taskCleanupService.runAutomaticCleanup().catch(err => {
          console.error('Cleanup error:', err);
        });
      } catch (error) {
        console.error('Error initializing tasks:', error);
      }
    };
    
    initializeTasks();
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
      
      // Clear cache to force fresh data
      if (user?.uid) {
        await clearTaskCache(user.uid);
      }
      
      // Generate new tasks from templates for upcoming month (runs in background)
      taskGenerationService.generateTasksForUpcomingMonth();
      
      const allTasks = await Task.filter({ is_archived: { '$ne': true } });
      const userEmails = [user.email];
      if (user.partner_email) {
        userEmails.push(user.partner_email);
      }
      const filtered = allTasks.filter(t => userEmails.includes(t.created_by));
      setTasks(filtered);
      
      // Update cache with fresh data
      if (user?.uid) {
        await cacheTasks(user.uid, allTasks);
      }
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

      // Clear cache to force refresh
      if (currentUser?.uid) {
        await clearTaskCache(currentUser.uid);
      }

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

  const handleTaskPress = (task) => {
    setEditingTask(task);
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
      
      // Clear cache to force refresh
      if (currentUser?.uid) {
        await clearTaskCache(currentUser.uid);
      }
      
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
      
      // Clear cache to force refresh
      if (currentUser?.uid) {
        await clearTaskCache(currentUser.uid);
      }
      
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
            onPress={handleTaskPress}
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
          <ActivityIndicator size="large" color="#14B8A6" />
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
            colors={["#14B8A6"]}
            tintColor="#14B8A6"
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
              <Icon name="check-circle" size={48} color="#14B8A6" />
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
            {renderTaskGroup('This Week', groupedTasks.thisWeek, 'calendar-today', '#0D9488')}
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
    backgroundColor: '#14B8A6',
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
    backgroundColor: '#E6FFFA',
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
    backgroundColor: '#14B8A6',
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
    backgroundColor: '#E6FFFA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deferOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0D9488',
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

