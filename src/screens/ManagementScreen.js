import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Task } from "../entities/Task";
import { User } from "../entities/User";
import { 
  differenceInDays, 
  format, 
  subDays, 
  parseISO, 
  startOfDay, 
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isSameDay
} from "date-fns";
import i18n from "../localization/i18n";

const { width } = Dimensions.get('window');

const DATE_RANGES = {
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  LAST_60_DAYS: 'last_60_days',
  CUSTOM: 'custom',
};

export default function ManagementScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [selectedUser, setSelectedUser] = useState('myself'); // 'myself', 'partner', or 'all'
  const [dateRange, setDateRange] = useState(DATE_RANGES.LAST_60_DAYS);
  const [customStartDate, setCustomStartDate] = useState(subDays(new Date(), 60));
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [allTasks, setAllTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  const ARCHIVE_DAYS = 60;

  // Load user and partner data
  useEffect(() => {
    loadUserData();
  }, []);

  // Load tasks when filters change
  useEffect(() => {
    if (currentUser) {
      loadTasks();
    }
  }, [currentUser, selectedUser, dateRange, customStartDate, customEndDate]);

  const loadUserData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Load partner if exists
      if (user.partner_email) {
        try {
          const partnerData = await User.findByEmail(user.partner_email);
          if (partnerData) {
            setPartner(partnerData);
          }
        } catch (error) {
          console.error("Error loading partner:", error);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // Get date range based on selected filter
  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case DATE_RANGES.TODAY:
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case DATE_RANGES.THIS_WEEK:
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case DATE_RANGES.THIS_MONTH:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case DATE_RANGES.LAST_60_DAYS:
        startDate = subDays(now, ARCHIVE_DAYS);
        endDate = now;
        break;
      case DATE_RANGES.CUSTOM:
        startDate = startOfDay(customStartDate);
        endDate = endOfDay(customEndDate);
        break;
      default:
        startDate = subDays(now, ARCHIVE_DAYS);
        endDate = now;
    }

    return { startDate, endDate };
  }, [dateRange, customStartDate, customEndDate]);

  const calculateStatistics = useCallback((tasks) => {
    if (!currentUser) return;

    const { startDate, endDate } = getDateRange();
    const now = new Date();

    // Filter tasks by user
    let userTasks = tasks;
    
    if (selectedUser !== 'all') {
      const targetEmail = selectedUser === 'myself' 
        ? currentUser.email 
        : (partner?.email || currentUser.partner_email);

      if (!targetEmail) {
        setStats(null);
        return;
      }

      userTasks = tasks.filter(task => {
        // Check assigned_to, completed_by, or created_by
        const assignedTo = task.assigned_to || '';
        const completedBy = task.completed_by || '';
        const createdBy = task.created_by || '';

        // Handle "together" assignment
        if (assignedTo === 'together') {
          return true; // Include tasks assigned to both
        }

        // Check if task belongs to selected user
        return assignedTo === targetEmail || 
               completedBy === targetEmail || 
               createdBy === targetEmail;
      });
    } else {
      // Filter "together" tasks and tasks for both users
      const userEmails = [currentUser.email];
      if (partner?.email) userEmails.push(partner.email);
      if (currentUser.partner_email) userEmails.push(currentUser.partner_email);

      userTasks = tasks.filter(task => {
        const assignedTo = task.assigned_to || '';
        const completedBy = task.completed_by || '';
        const createdBy = task.created_by || '';

        if (assignedTo === 'together') return true;
        return userEmails.includes(assignedTo) || 
               userEmails.includes(completedBy) || 
               userEmails.includes(createdBy);
      });
    }

    // Filter tasks by date range
    const filteredTasks = userTasks.filter(task => {
      // For completed tasks, use completion_date or archived_date
      if (task.status === 'completed' || task.is_archived) {
        const completionDate = task.completion_date || task.archived_date;
        if (!completionDate) return false;
        const date = typeof completionDate === 'string' 
          ? parseISO(completionDate) 
          : new Date(completionDate);
        return isWithinInterval(date, { start: startDate, end: endDate });
      }
      
      // For pending/in_progress tasks, use created_date or due_date
      const taskDate = task.due_date || task.created_date;
      if (!taskDate) return false;
      const date = typeof taskDate === 'string' 
        ? parseISO(taskDate) 
        : new Date(taskDate);
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
    const statsData = {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      overdueTasksList: [],
      notPerformedTasks: 0,
      completionRate: 0,
      averageCompletionTime: 0,
      byCategory: {},
      byPriority: {},
      completionTimeline: [],
      recentCompletions: [],
      incompleteTasks: [],
      overdueTasksList: []
    };

    statsData.totalTasks = filteredTasks.length;

    // Categorize tasks
    filteredTasks.forEach(task => {
      const isCompleted = task.status === 'completed' || task.is_archived;
      const isPending = task.status === 'pending';
      const isInProgress = task.status === 'in_progress';
      
      // Check if overdue
      let isOverdue = false;
      if (task.due_date && !isCompleted) {
        const dueDate = typeof task.due_date === 'string' 
          ? parseISO(task.due_date) 
          : new Date(task.due_date);
        isOverdue = dueDate < now;
      }

      // Count by status
      if (isCompleted) {
        statsData.completedTasks++;
        
        // Track completion date
        if (task.completion_date || task.archived_date) {
          const completionDate = task.completion_date || task.archived_date;
          const date = typeof completionDate === 'string' 
            ? parseISO(completionDate) 
            : new Date(completionDate);
          
          if (isWithinInterval(date, { start: startDate, end: endDate })) {
            statsData.recentCompletions.push({
              task,
              date
            });
          }
        }
      } else if (isPending) {
        statsData.pendingTasks++;
      } else if (isInProgress) {
        statsData.inProgressTasks++;
      }

      if (isOverdue && !isCompleted) {
        statsData.overdueTasks++;
        statsData.notPerformedTasks++;
        // Add to overdue tasks list
        statsData.overdueTasksList.push({
          task,
          dueDate: task.due_date ? (typeof task.due_date === 'string' ? parseISO(task.due_date) : new Date(task.due_date)) : null,
          daysOverdue: task.due_date ? differenceInDays(now, typeof task.due_date === 'string' ? parseISO(task.due_date) : new Date(task.due_date)) : 0
        });
      }
      
      // Track all incomplete tasks
      if (!isCompleted) {
        statsData.incompleteTasks.push({
          task,
          dueDate: task.due_date ? (typeof task.due_date === 'string' ? parseISO(task.due_date) : new Date(task.due_date)) : null,
          assignedTo: task.assigned_to || '',
          status: task.status,
          priority: task.priority || 'medium',
          category: task.category || 'other'
        });
      }

      // Count by category
      const category = task.category || 'other';
      if (!statsData.byCategory[category]) {
        statsData.byCategory[category] = {
          total: 0,
          completed: 0,
          pending: 0,
          overdue: 0
        };
      }
      statsData.byCategory[category].total++;
      if (isCompleted) statsData.byCategory[category].completed++;
      if (isPending) statsData.byCategory[category].pending++;
      if (isOverdue && !isCompleted) statsData.byCategory[category].overdue++;

      // Count by priority
      const priority = task.priority || 'medium';
      if (!statsData.byPriority[priority]) {
        statsData.byPriority[priority] = {
          total: 0,
          completed: 0,
          pending: 0,
          overdue: 0
        };
      }
      statsData.byPriority[priority].total++;
      if (isCompleted) statsData.byPriority[priority].completed++;
      if (isPending) statsData.byPriority[priority].pending++;
      if (isOverdue && !isCompleted) statsData.byPriority[priority].overdue++;
    });

    // Calculate completion rate
    const totalWithStatus = statsData.completedTasks + statsData.pendingTasks + statsData.inProgressTasks;
    if (totalWithStatus > 0) {
      statsData.completionRate = Math.round((statsData.completedTasks / totalWithStatus) * 100);
    }

    // Calculate average completion time (if we have completion dates)
    const completedWithDates = statsData.recentCompletions.filter(c => {
      if (!c.task.created_date) return false;
      const createdDate = typeof c.task.created_date === 'string' 
        ? parseISO(c.task.created_date) 
        : new Date(c.task.created_date);
      return createdDate && c.date;
    });

    if (completedWithDates.length > 0) {
      const totalDays = completedWithDates.reduce((sum, c) => {
        const createdDate = typeof c.task.created_date === 'string' 
          ? parseISO(c.task.created_date) 
          : new Date(c.task.created_date);
        return sum + differenceInDays(c.date, createdDate);
      }, 0);
      statsData.averageCompletionTime = Math.round(totalDays / completedWithDates.length);
    }

    // Build completion timeline for selected date range
    const timelineMap = {};
    const daysDiff = differenceInDays(endDate, startDate);
    for (let i = 0; i <= daysDiff; i++) {
      const date = subDays(endDate, daysDiff - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      timelineMap[dateKey] = 0;
    }

    statsData.recentCompletions.forEach(c => {
      const dateKey = format(c.date, 'yyyy-MM-dd');
      if (timelineMap[dateKey] !== undefined) {
        timelineMap[dateKey]++;
      }
    });

    statsData.completionTimeline = Object.entries(timelineMap)
      .map(([date, count]) => ({ date, count }));

    setStats(statsData);
  }, [currentUser, partner, selectedUser, getDateRange]);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load both active and archived tasks
      const [activeTasks, archivedTasks] = await Promise.all([
        Task.filter({ is_archived: { '$ne': true } }),
        Task.filter({ is_archived: true }, '-archived_date')
      ]);

      // Combine and filter by date (archived tasks within 60 days)
      const now = new Date();
      const filteredArchived = archivedTasks.filter(task => {
        if (!task.archived_date) return false;
        const archivedDate = typeof task.archived_date === 'string' 
          ? parseISO(task.archived_date) 
          : new Date(task.archived_date);
        return differenceInDays(now, archivedDate) <= ARCHIVE_DAYS;
      });

      const allTasksData = [...activeTasks, ...filteredArchived];
      setAllTasks(allTasksData);
      
      // Calculate statistics
      calculateStatistics(allTasksData);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [calculateStatistics]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadTasks();
  }, [loadTasks]);

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case DATE_RANGES.TODAY:
        return i18n.t('management.today');
      case DATE_RANGES.THIS_WEEK:
        return i18n.t('management.thisWeek');
      case DATE_RANGES.THIS_MONTH:
        return i18n.t('management.thisMonth');
      case DATE_RANGES.LAST_60_DAYS:
        return i18n.t('management.last60Days');
      case DATE_RANGES.CUSTOM:
        return `${format(customStartDate, 'MMM d')} - ${format(customEndDate, 'MMM d')}`;
      default:
        return i18n.t('management.last60Days');
    }
  };

  const StatCard = ({ icon, title, value, subtitle, color = "#14B8A6" }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.statCardTitle}>{title}</Text>
      </View>
      <Text style={[styles.statCardValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
    </View>
  );

  const CategoryCard = ({ category, data }) => {
    const completionRate = data.total > 0 
      ? Math.round((data.completed / data.total) * 100) 
      : 0;
    
    return (
      <View style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryName}>{category}</Text>
          <Text style={styles.categoryTotal}>{data.total} {i18n.t('management.tasks')}</Text>
        </View>
        <View style={styles.categoryStats}>
          <View style={styles.categoryStatItem}>
            <Icon name="check-circle" size={16} color="#16A34A" />
            <Text style={styles.categoryStatText}>{data.completed} {i18n.t('management.completed')}</Text>
          </View>
          <View style={styles.categoryStatItem}>
            <Icon name="schedule" size={16} color="#F59E0B" />
            <Text style={styles.categoryStatText}>{data.pending} {i18n.t('management.pending')}</Text>
          </View>
          {data.overdue > 0 && (
            <View style={styles.categoryStatItem}>
              <Icon name="warning" size={16} color="#DC2626" />
              <Text style={styles.categoryStatText}>{data.overdue} {i18n.t('management.overdue')}</Text>
            </View>
          )}
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${completionRate}%`, backgroundColor: '#16A34A' }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{completionRate}% {i18n.t('management.complete')}</Text>
      </View>
    );
  };

  if (isLoading && !stats) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text style={styles.loadingText}>{i18n.t('management.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Icon name="analytics" size={32} color="#14B8A6" />
            <Text style={styles.title}>{i18n.t('management.title')}</Text>
          </View>
          <Text style={styles.subtitle}>{i18n.t('management.subtitle', { days: ARCHIVE_DAYS })}</Text>
        </View>

        {/* Filters Section */}
        <View style={styles.filtersContainer}>
          {/* User Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{i18n.t('management.viewStatsFor')}</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedUser === 'myself' && styles.filterButtonActive
                ]}
                onPress={() => setSelectedUser('myself')}
              >
                <Icon 
                  name="person" 
                  size={18} 
                  color={selectedUser === 'myself' ? '#FFFFFF' : '#6B7280'} 
                />
                <Text style={[
                  styles.filterButtonText,
                  selectedUser === 'myself' && styles.filterButtonTextActive
                ]}>
                  {currentUser?.full_name || currentUser?.email || i18n.t('management.myself')}
                </Text>
              </TouchableOpacity>
              {partner && (
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    selectedUser === 'partner' && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedUser('partner')}
                >
                  <Icon 
                    name="people" 
                    size={18} 
                    color={selectedUser === 'partner' ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.filterButtonText,
                    selectedUser === 'partner' && styles.filterButtonTextActive
                  ]}>
                    {partner?.full_name || partner?.email || i18n.t('management.partner')}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedUser === 'all' && styles.filterButtonActive
                ]}
                onPress={() => setSelectedUser('all')}
              >
                <Icon 
                  name="group" 
                  size={18} 
                  color={selectedUser === 'all' ? '#FFFFFF' : '#6B7280'} 
                />
                <Text style={[
                  styles.filterButtonText,
                  selectedUser === 'all' && styles.filterButtonTextActive
                ]}>
                  {i18n.t('management.all')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{i18n.t('management.dateRange')}</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.dateRangeScroll}
              contentContainerStyle={styles.dateRangeContainer}
            >
              <TouchableOpacity
                style={[
                  styles.dateRangeButton,
                  dateRange === DATE_RANGES.TODAY && styles.dateRangeButtonActive
                ]}
                onPress={() => setDateRange(DATE_RANGES.TODAY)}
              >
                <Text style={[
                  styles.dateRangeButtonText,
                  dateRange === DATE_RANGES.TODAY && styles.dateRangeButtonTextActive
                ]}>
                  {i18n.t('management.today')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dateRangeButton,
                  dateRange === DATE_RANGES.THIS_WEEK && styles.dateRangeButtonActive
                ]}
                onPress={() => setDateRange(DATE_RANGES.THIS_WEEK)}
              >
                <Text style={[
                  styles.dateRangeButtonText,
                  dateRange === DATE_RANGES.THIS_WEEK && styles.dateRangeButtonTextActive
                ]}>
                  {i18n.t('management.thisWeek')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dateRangeButton,
                  dateRange === DATE_RANGES.THIS_MONTH && styles.dateRangeButtonActive
                ]}
                onPress={() => setDateRange(DATE_RANGES.THIS_MONTH)}
              >
                <Text style={[
                  styles.dateRangeButtonText,
                  dateRange === DATE_RANGES.THIS_MONTH && styles.dateRangeButtonTextActive
                ]}>
                  {i18n.t('management.thisMonth')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dateRangeButton,
                  dateRange === DATE_RANGES.LAST_60_DAYS && styles.dateRangeButtonActive
                ]}
                onPress={() => setDateRange(DATE_RANGES.LAST_60_DAYS)}
              >
                <Text style={[
                  styles.dateRangeButtonText,
                  dateRange === DATE_RANGES.LAST_60_DAYS && styles.dateRangeButtonTextActive
                ]}>
                  {i18n.t('management.last60Days')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dateRangeButton,
                  dateRange === DATE_RANGES.CUSTOM && styles.dateRangeButtonActive
                ]}
                onPress={() => setDateRange(DATE_RANGES.CUSTOM)}
              >
                <Text style={[
                  styles.dateRangeButtonText,
                  dateRange === DATE_RANGES.CUSTOM && styles.dateRangeButtonTextActive
                ]}>
                  {i18n.t('management.custom')}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Custom Date Range Pickers */}
            {dateRange === DATE_RANGES.CUSTOM && (
              <View style={styles.customDateContainer}>
                <TouchableOpacity
                  style={styles.customDateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Icon name="calendar-today" size={18} color="#6B7280" />
                  <Text style={styles.customDateText}>
                    {i18n.t('management.from')}: {format(customStartDate, 'MMM d, yyyy')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.customDateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Icon name="event" size={18} color="#6B7280" />
                  <Text style={styles.customDateText}>
                    {i18n.t('management.to')}: {format(customEndDate, 'MMM d, yyyy')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={customStartDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setCustomStartDate(selectedDate);
              }
            }}
            maximumDate={customEndDate}
          />
        )}
        {showEndDatePicker && (
          <DateTimePicker
            value={customEndDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setCustomEndDate(selectedDate);
              }
            }}
            minimumDate={customStartDate}
            maximumDate={new Date()}
          />
        )}

        {!stats ? (
          <View style={styles.emptyState}>
            <Icon name="info" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>{i18n.t('management.noData')}</Text>
            <Text style={styles.emptySubtitle}>{i18n.t('management.noDataSubtitle')}</Text>
          </View>
        ) : (
          <>
            {/* Overview Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{i18n.t('management.overview')}</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  icon="check-circle"
                  title={i18n.t('management.completed')}
                  value={stats.completedTasks}
                  subtitle={getDateRangeLabel()}
                  color="#16A34A"
                />
                <StatCard
                  icon="pending"
                  title={i18n.t('management.pending')}
                  value={stats.pendingTasks}
                  subtitle={i18n.t('management.activeTasks')}
                  color="#F59E0B"
                />
                <StatCard
                  icon="warning"
                  title={i18n.t('management.overdue')}
                  value={stats.overdueTasks}
                  subtitle={i18n.t('management.notPerformed')}
                  color="#DC2626"
                />
                <StatCard
                  icon="trending-up"
                  title={i18n.t('management.completionRate')}
                  value={`${stats.completionRate}%`}
                  subtitle={i18n.t('management.ofTotalTasks')}
                  color="#14B8A6"
                />
              </View>
            </View>

            {/* Detailed Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{i18n.t('management.detailedStats')}</Text>
              <View style={styles.detailedStats}>
                <View style={styles.detailedStatRow}>
                  <Icon name="list" size={20} color="#6B7280" />
                  <Text style={styles.detailedStatLabel}>{i18n.t('management.totalTasks')}</Text>
                  <Text style={styles.detailedStatValue}>{stats.totalTasks}</Text>
                </View>
                <View style={styles.detailedStatRow}>
                  <Icon name="play-circle" size={20} color="#6B7280" />
                  <Text style={styles.detailedStatLabel}>{i18n.t('management.inProgress')}</Text>
                  <Text style={styles.detailedStatValue}>{stats.inProgressTasks}</Text>
                </View>
                <View style={styles.detailedStatRow}>
                  <Icon name="schedule" size={20} color="#6B7280" />
                  <Text style={styles.detailedStatLabel}>{i18n.t('management.avgCompletionTime')}</Text>
                  <Text style={styles.detailedStatValue}>
                    {stats.averageCompletionTime > 0 
                      ? `${stats.averageCompletionTime} ${i18n.t('management.days')}`
                      : i18n.t('management.none')
                    }
                  </Text>
                </View>
              </View>
            </View>

            {/* Category Breakdown */}
            {Object.keys(stats.byCategory).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{i18n.t('management.byCategory')}</Text>
                {Object.entries(stats.byCategory).map(([category, data]) => (
                  <CategoryCard key={category} category={category} data={data} />
                ))}
              </View>
            )}

            {/* Priority Breakdown */}
            {Object.keys(stats.byPriority).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{i18n.t('management.byPriority')}</Text>
                {Object.entries(stats.byPriority).map(([priority, data]) => (
                  <CategoryCard key={priority} category={priority} data={data} />
                ))}
              </View>
            )}

            {/* Overdue Tasks - Not Completed */}
            {stats.overdueTasksList && stats.overdueTasksList.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {i18n.t('management.overdueTasks')} ({stats.overdueTasksList.length})
                </Text>
                <View style={styles.tasksList}>
                  {stats.overdueTasksList
                    .sort((a, b) => {
                      // Sort by days overdue (most overdue first)
                      if (a.daysOverdue !== b.daysOverdue) {
                        return b.daysOverdue - a.daysOverdue;
                      }
                      // Then by due date
                      if (a.dueDate && b.dueDate) {
                        return a.dueDate - b.dueDate;
                      }
                      return 0;
                    })
                    .map((item, index) => (
                      <View key={index} style={styles.taskItem}>
                        <View style={styles.taskItemHeader}>
                          <Icon name="warning" size={20} color="#DC2626" />
                          <View style={styles.taskItemContent}>
                            <Text style={styles.taskItemTitle}>{item.task.title}</Text>
                            <View style={styles.taskItemMeta}>
                              {item.dueDate && (
                                <View style={styles.taskMetaBadge}>
                                  <Icon name="schedule" size={14} color="#DC2626" />
                                  <Text style={styles.taskMetaText}>
                                    {format(item.dueDate, 'MMM d, yyyy')}
                                  </Text>
                                  <Text style={styles.overdueBadge}>
                                    {item.daysOverdue} {i18n.t('management.daysOverdue')}
                                  </Text>
                                </View>
                              )}
                              <View style={styles.taskMetaBadge}>
                                <Icon name="label" size={14} color="#6B7280" />
                                <Text style={styles.taskMetaText}>{item.task.category || 'other'}</Text>
                              </View>
                              {item.task.priority && (
                                <View style={[
                                  styles.taskMetaBadge,
                                  item.task.priority === 'high' && styles.priorityHigh,
                                  item.task.priority === 'medium' && styles.priorityMedium,
                                  item.task.priority === 'low' && styles.priorityLow
                                ]}>
                                  <Text style={styles.taskMetaText}>
                                    {item.task.priority}
                                  </Text>
                                </View>
                              )}
                            </View>
                            {item.task.description && (
                              <Text style={styles.taskItemDescription} numberOfLines={2}>
                                {item.task.description}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                </View>
              </View>
            )}

            {/* Incomplete Tasks (Pending/In Progress) */}
            {stats.incompleteTasks && stats.incompleteTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {i18n.t('management.incompleteTasks')} ({stats.incompleteTasks.length})
                </Text>
                <View style={styles.tasksList}>
                  {stats.incompleteTasks
                    .filter(item => !stats.overdueTasksList?.some(overdue => overdue.task.id === item.task.id))
                    .sort((a, b) => {
                      // Sort by due date (earliest first)
                      if (a.dueDate && b.dueDate) {
                        return a.dueDate - b.dueDate;
                      }
                      if (a.dueDate) return -1;
                      if (b.dueDate) return 1;
                      // Then by priority
                      const priorityOrder = { high: 3, medium: 2, low: 1 };
                      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                    })
                    .map((item, index) => (
                      <View key={index} style={styles.taskItem}>
                        <View style={styles.taskItemHeader}>
                          <Icon 
                            name={item.status === 'in_progress' ? 'play-circle' : 'schedule'} 
                            size={20} 
                            color={item.status === 'in_progress' ? '#F59E0B' : '#6B7280'} 
                          />
                          <View style={styles.taskItemContent}>
                            <Text style={styles.taskItemTitle}>{item.task.title}</Text>
                            <View style={styles.taskItemMeta}>
                              {item.dueDate && (
                                <View style={styles.taskMetaBadge}>
                                  <Icon name="event" size={14} color="#6B7280" />
                                  <Text style={styles.taskMetaText}>
                                    {format(item.dueDate, 'MMM d, yyyy')}
                                  </Text>
                                </View>
                              )}
                              <View style={styles.taskMetaBadge}>
                                <Icon name="label" size={14} color="#6B7280" />
                                <Text style={styles.taskMetaText}>{item.category}</Text>
                              </View>
                              <View style={[
                                styles.taskMetaBadge,
                                item.priority === 'high' && styles.priorityHigh,
                                item.priority === 'medium' && styles.priorityMedium,
                                item.priority === 'low' && styles.priorityLow
                              ]}>
                                <Text style={styles.taskMetaText}>{item.priority}</Text>
                              </View>
                              <View style={styles.taskMetaBadge}>
                                <Text style={styles.taskMetaText}>
                                  {item.status === 'in_progress' 
                                    ? i18n.t('management.inProgress') 
                                    : i18n.t('management.pending')}
                                </Text>
                              </View>
                            </View>
                            {item.task.description && (
                              <Text style={styles.taskItemDescription} numberOfLines={2}>
                                {item.task.description}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                </View>
              </View>
            )}

            {/* Recent Completions */}
            {stats.recentCompletions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{i18n.t('management.recentCompletions')}</Text>
                <View style={styles.completionsList}>
                  {stats.recentCompletions
                    .sort((a, b) => b.date - a.date)
                    .slice(0, 10)
                    .map((item, index) => (
                      <View key={index} style={styles.completionItem}>
                        <Icon name="check-circle" size={16} color="#16A34A" />
                        <View style={styles.completionItemContent}>
                          <Text style={styles.completionItemTitle}>{item.task.title}</Text>
                          <Text style={styles.completionItemDate}>
                            {format(item.date, 'MMM d, yyyy')}
                          </Text>
                        </View>
                      </View>
                    ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 80,
  },
  filterButtonActive: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  dateRangeScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateRangeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  dateRangeButtonActive: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  dateRangeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  dateRangeButtonTextActive: {
    color: '#FFFFFF',
  },
  customDateContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  customDateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customDateText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  statCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statCardSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  detailedStats: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailedStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailedStatLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  detailedStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  categoryTotal: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  categoryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryStatText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  completionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  completionItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  completionItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  completionItemDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  tasksList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  taskItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  taskItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  taskItemDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 20,
  },
  taskItemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  taskMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  taskMetaText: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  overdueBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 4,
  },
  priorityHigh: {
    backgroundColor: '#FEE2E2',
  },
  priorityMedium: {
    backgroundColor: '#FEF3C7',
  },
  priorityLow: {
    backgroundColor: '#DCFCE7',
  },
});

