import React, { useState, useEffect, useCallback } from "react";
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
import Icon from "react-native-vector-icons/MaterialIcons";
import { Task } from "../entities/Task";
import { User } from "../entities/User";
import TaskCard from "../components/Tasks/TaskCard";
import TaskFilters from "../components/Tasks/TaskFilters";
import EditTaskDialog from "../components/Tasks/EditTaskDialog";
import { add, addDays, addMonths, addWeeks } from 'date-fns';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: 'pending',
    category: 'all',
    priority: 'all',
    assigned_to: 'all'
  });
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else if (tasks.length === 0) {
      setIsLoading(true);
    }

    try {
      const user = await User.me();
      setCurrentUser(user);

      let taskList = [];
      const userEmails = [user.email];
      if (user.partner_email) {
        userEmails.push(user.partner_email);
      }

      // Fetch tasks that are not archived
      const allTasks = await Task.filter({ is_archived: { '$ne': true } }, '-updated_date');
      taskList = allTasks.filter(t => userEmails.includes(t.created_by));

      setTasks(taskList);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tasks.length]);

  useEffect(() => {
    loadData();

    // Auto-refresh every 30 seconds to sync
    const intervalId = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loadData]);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters, currentUser, showOverdueOnly]);

  const applyFilters = () => {
    let filtered = [...tasks];

    // Filter out completed tasks from view, they get archived immediately
    filtered = filtered.filter(task => task.status !== 'completed');
    
    if (filters.status !== 'all') {
      if (filters.status === 'overdue') {
        // leave status as pending/in_progress implicitly, handled below
      } else {
        filtered = filtered.filter(task => task.status === filters.status);
      }
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

    // Overdue filter
    if (showOverdueOnly || filters.status === 'overdue') {
      filtered = filtered.filter(t =>
        t.due_date && new Date(t.due_date) < new Date()
      );
    }

    setFilteredTasks(filtered);
  };

  const getNextDueDate = (currentDueDate, rule) => {
    const date = currentDueDate ? new Date(currentDueDate) : new Date();
    switch (rule) {
      case 'daily': return addDays(date, 1);
      case 'weekly': return addWeeks(date, 1);
      case 'monthly': return addMonths(date, 1);
      default: return null;
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    if (newStatus !== 'completed') {
      try {
        await Task.update(task.id, { status: newStatus });
        loadData();
      } catch (error) { 
        console.error("Error updating task status:", error); 
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
          subtasks: task.subtasks?.map(st => ({ ...st, is_completed: false })) || []
        };
        delete newTask.id;
        
        await Task.create(newTask);
      }
      
      loadData();
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleSubtaskToggle = async (taskId, subtaskIndex, isCompleted) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newSubtasks = [...task.subtasks];
    newSubtasks[subtaskIndex].is_completed = isCompleted;
    
    try {
      await Task.update(taskId, { subtasks: newSubtasks });
      loadData();
    } catch (error) {
      console.error("Error updating subtask:", error);
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      await Task.update(editingTask.id, taskData);
      setEditingTask(null);
      loadData();
    } catch (error) {
      console.error("Error updating task:", error);
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

  const resetFilters = () => {
    setFilters({ status: 'all', category: 'all', priority: 'all', assigned_to: 'all' });
    setShowOverdueOnly(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            colors={["#8B5CF6"]}
            tintColor="#8B5CF6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>
              Welcome back, {currentUser?.full_name || 'Partner'}!
            </Text>
            <Text style={styles.subtitleText}>
              Let's see what you and your partner need to tackle today
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddTask')}
          >
            <Icon name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard} onPress={resetFilters}>
              <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                <Icon name="favorite" size={20} color="#2563EB" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Total Tasks</Text>
                <Text style={styles.statValue}>{stats.total}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => navigation.navigate('Archive')}
            >
              <View style={[styles.statIcon, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="check-circle" size={20} color="#16A34A" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statValue}>{stats.completed}</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => setFilters(prev => ({ ...prev, assigned_to: prev.assigned_to === 'me' ? 'all' : 'me' }))}
            >
              <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
                <Icon name="person" size={20} color="#9333EA" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Your Tasks</Text>
                <Text style={styles.statValue}>{stats.myTasks}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => {
                setFilters(prev => ({ ...prev, status: 'overdue' }));
                setShowOverdueOnly(true);
              }}
            >
              <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="warning" size={20} color="#DC2626" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Overdue</Text>
                <Text style={styles.statValue}>{stats.overdue}</Text>
              </View>
            </TouchableOpacity>
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
                <Icon name="favorite" size={40} color="#8B5CF6" />
              </View>
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySubtitle}>
                {tasks.length === 0 
                  ? "Start by creating your first shared task together!" 
                  : "Try adjusting your filters to see more tasks."
                }
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AddTask')}
              >
                <Icon name="add" size={20} color="#FFFFFF" />
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
      </ScrollView>

      {/* Edit Task Modal */}
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
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
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
    backgroundColor: '#F3E8FF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  tasksList: {
    gap: 12,
  },
}); 