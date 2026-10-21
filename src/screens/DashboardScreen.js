import React, { useState, useEffect, useCallback , useMemo} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { Task } from "../entities/Task";
import { COLORS, SPACING, SHADOWS, screenBackgroundStyle } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import { ThemedScreenShell } from "../components/common/ThemedScreenShell";
import PremiumScreenShell from "../components/premium/PremiumScreenShell";
import i18n from "../localization/i18n";
import { User } from "../entities/User";
import TaskCard from "../components/Tasks/TaskCard";
import TaskFilters from "../components/Tasks/TaskFilters";
import EditTaskDialog from "../components/Tasks/EditTaskDialog";
import { handleError, showSuccess } from "../services/errorHandlingService";
import { add, addDays, addMonths, addWeeks } from 'date-fns';
import { getCachedTasks, cacheTasks, clearTaskCache, getLastSyncTimestamp } from "../services/taskCache";
import { usePartnerMode } from "../context/HouseholdPartnerContext";

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isPartnered } = usePartnerMode();

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: 'pending',
    category: 'all',
    priority: 'all',
    assigned_to: 'all'
  });

  // Load user data once on mount
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

  // Load cached tasks immediately, then set up real-time listener
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false); // Stop loading if no user
      return;
    }

    let isMounted = true;
    
    // Capture user emails to avoid dependency on currentUser object
    const userEmails = [currentUser.email];
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
        if (userEmails.includes(t.created_by)) return true;
        
        return false;
      });
    };

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
          }
        } else {
          setIsLoading(true);
        }

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
            // Fall through to full fetch
          }
        }
      } catch (error) {
        console.error('Error loading cached tasks:', error);
        setIsLoading(true);
      }
    };

    loadCachedTasksAndSync();

    // Set timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Task loading timeout - clearing loading state');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    // Set up real-time listener for future changes (only sends deltas)
    const unsubscribe = Task.onSnapshot(
      (taskList) => {
        if (!isMounted) return;
        
        clearTimeout(loadingTimeout);
        
        const filtered = filterTasks(taskList);
        
        // Update cache with fresh data
        cacheTasks(currentUser.uid, taskList).catch(err => {
          console.error('Error caching tasks:', err);
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
  }, [currentUser?.uid]); // Only depend on uid, which is stable

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Force reload by fetching once
      const user = await User.me();
      setCurrentUser(user);
      
      // Clear cache to force fresh data
      if (user?.uid) {
        await clearTaskCache(user.uid);
      }
      
      const allTasks = await Task.filter({ is_archived: { '$ne': true } }, '-updated_date');
      const userEmails = [user.email];
      if (user.partner_email) {
        userEmails.push(user.partner_email);
      }
      // Filter tasks: show tasks assigned to current user, "together", or unassigned
      const filtered = allTasks.filter(t => {
        // Show if assigned to current user
        if (userEmails.includes(t.assigned_to)) return true;
        
        // Show if assigned to "together" (both partners)
        if (t.assigned_to === 'together') return true;
        
        // Show if unassigned (empty string or null)
        if (!t.assigned_to || t.assigned_to === '') return true;
        
        // Backward compatibility: show tasks created by user
        if (userEmails.includes(t.created_by)) return true;
        
        return false;
      });
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

  useEffect(() => {
    applyFilters();
  }, [tasks, filters, currentUser?.email]);

  const applyFilters = () => {
    let filtered = [...tasks];

    // Filter out completed tasks from view, they get archived immediately
    filtered = filtered.filter(task => task.status !== 'completed');
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(task => task.category === filters.category);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.assigned_to === 'me' && currentUser) {
      filtered = filtered.filter(task => task.assigned_to === currentUser.email);
    }

    setFilteredTasks(filtered);
  };

  const getNextDueDate = (currentDueDate, rule) => {
    const date = currentDueDate ? new Date(currentDueDate) : new Date();
    switch (rule) {
      case 'daily': return addDays(date, 1);
      case 'weekly': return addWeeks(date, 1);
      case 'biweekly': return addWeeks(date, 2);
      case 'monthly': return addMonths(date, 1);
      default: return null;
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    setIsUpdating(true);
    
    if (newStatus !== 'completed') {
      try {
        await Task.update(task.id, { status: newStatus });
        // Clear cache to force refresh
        if (currentUser?.uid) {
          await clearTaskCache(currentUser.uid);
        }
        // Real-time listener will update automatically
      } catch (error) {
        handleError(error, 'updateTaskStatus');
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    // Handle task completion and archiving
    try {
      // Archive the original task
      await Task.update(task.id, {
        status: 'completed',
        is_archived: true,
        archived_date: new Date().toISOString(),
        completion_date: new Date().toISOString()
      });

      // If it's a recurring task, create the next instance
      if (task.recurrence_rule && task.recurrence_rule !== 'none') {
        const nextDueDate = getNextDueDate(task.due_date, task.recurrence_rule);
        
        const newTask = {
          ...task,
          due_date: nextDueDate ? nextDueDate.toISOString().split('T')[0] : null,
          status: 'pending',
          is_archived: false,
          archived_date: null,
          completion_date: null,
          subtasks: task.subtasks?.map(st => ({ ...st, is_completed: false })) || [],
          // Preserve postponed tracking for future instances
          postponed_from_date: task.postponed_from_date || null,
          postponed_date: task.postponed_date || null,
        };
        delete newTask.id;
        
        await Task.create(newTask);
      }
      
      // Clear cache to force refresh
      if (currentUser?.uid) {
        await clearTaskCache(currentUser.uid);
      }
      // Real-time listener will update automatically
    } catch (error) {
      handleError(error, 'completeTask');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubtaskToggle = async (taskId, subtaskIndex, isCompleted) => {
    setIsUpdating(true);
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      setIsUpdating(false);
      return;
    }
    
    const newSubtasks = [...task.subtasks];
    newSubtasks[subtaskIndex].is_completed = isCompleted;
    
    try {
      await Task.update(taskId, { subtasks: newSubtasks });
      // Clear cache to force refresh
      if (currentUser?.uid) {
        await clearTaskCache(currentUser.uid);
      }
      // Real-time listener will update automatically
    } catch (error) {
      handleError(error, 'updateSubtask');
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
      setEditingTask(null);
      showSuccess('Task updated successfully');
      // Real-time listener will update automatically
    } catch (error) {
      handleError(error, 'updateTask');
    } finally {
      setIsUpdating(false);
    }
  };

  const getTaskCounts = () => {
    const counts = {
      byStatus: {},
      byCategory: {},
      byAssignee: {}
    };

    tasks.forEach(task => {
      counts.byStatus[task.status] = (counts.byStatus[task.status] || 0) + 1;
      counts.byCategory[task.category] = (counts.byCategory[task.category] || 0) + 1;
      counts.byAssignee[task.assigned_to] = (counts.byAssignee[task.assigned_to] || 0) + 1;
    });

    return counts;
  };

  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const myTasks = tasks.filter(t => t.assigned_to === currentUser?.email).length;
    const overdue = tasks.filter(t => 
      t.due_date && 
      new Date(t.due_date) < new Date() && 
      t.status !== 'completed'
    ).length;

    return { total, completed, myTasks, overdue };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <PremiumScreenShell loading loadingLabel="Loading your tasks..." title={i18n.t("navigation.drawer.allTasks")} />
    );
  }

  return (
    <>
    <PremiumScreenShell
      title={i18n.t("navigation.drawer.allTasks")}
      subtitle={
        currentUser?.full_name
          ? `${i18n.t("dashboard.welcomeBack")} ${currentUser.full_name.split(" ")[0]}!`
          : i18n.t("dashboard.subtitleSolo")
      }
      heroStats={[
        { label: "Total", value: String(stats.total) },
        { label: "Done", value: String(stats.completed) },
        { label: "Overdue", value: String(stats.overdue) },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      fab={{
        icon: "add",
        onPress: () => navigation.navigate("AddTask"),
        accessibilityLabel: i18n.t("navigation.addTask"),
      }}
    >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.primaryMuted }]}>
                <Icon name="favorite" size={20} color={colors.primary} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Total Tasks</Text>
                <Text style={styles.statValue}>{stats.total}</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.successMuted }]}>
                <Icon name="check-circle" size={20} color={colors.success} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statValue}>{stats.completed}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.primaryMuted }]}>
                <Icon name="person" size={20} color={colors.primaryDark} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Your Tasks</Text>
                <Text style={styles.statValue}>{stats.myTasks}</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.errorMuted }]}>
                <Icon name="warning" size={20} color={colors.error} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Overdue</Text>
                <Text style={styles.statValue}>{stats.overdue}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <TaskFilters 
            filters={filters}
            onFilterChange={setFilters}
            taskCounts={getTaskCounts()}
            currentUser={currentUser}
          />
        </View>

        {/* Tasks List */}
        <View style={styles.tasksContainer}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Icon name="favorite" size={40} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySubtitle}>
                {tasks.length === 0
                  ? isPartnered
                    ? i18n.t("dashboard.createFirstTaskCouple")
                    : i18n.t("dashboard.createFirstTaskSolo")
                  : i18n.t("dashboard.adjustFilters")}
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AddTask')}
              >
                <Icon name="add" size={20} color={COLORS.textInverse} />
                <Text style={styles.emptyButtonText}>Add Your First Task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onEdit={setEditingTask}
                  onSubtaskToggle={handleSubtaskToggle}
                  currentUser={currentUser}
                />
              ))}
            </View>
          )}
        </View>
    </PremiumScreenShell>

      {/* Edit Task Modal */}
      <EditTaskDialog
        task={editingTask}
        visible={!!editingTask}
        onClose={() => setEditingTask(null)}
        onUpdateTask={handleUpdateTask}
      />
    </>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerText: {
    flex: 1,
    marginRight: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    ...SHADOWS.md,
  },
  addButtonText: {
    color: COLORS.textInverse,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tasksContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.primaryMuted,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: COLORS.textInverse,
    fontWeight: '600',
    marginLeft: 8,
  },
  tasksList: {
    gap: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
}
