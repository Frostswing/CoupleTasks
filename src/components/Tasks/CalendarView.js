import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { format, startOfWeek, addDays, addWeeks, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO } from "date-fns";

const { width } = Dimensions.get('window');

export default function CalendarView({
  tasks = [],
  currentDate = new Date(),
  viewMode = 'week', // 'week' or 'month'
  onDateSelect,
  onTaskPress,
  onTaskMove,
}) {
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const getWeekDays = (date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  const getMonthDays = (date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add days from previous month to fill first week
    const weekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const prevDays = eachDayOfInterval({ 
      start: weekStart, 
      end: addDays(monthStart, -1) 
    });
    
    // Add days from next month to fill last week
    const lastWeekStart = startOfWeek(monthEnd, { weekStartsOn: 0 });
    const nextDays = eachDayOfInterval({ 
      start: addDays(monthEnd, 1), 
      end: addDays(lastWeekStart, 6) 
    });
    
    return [...prevDays, ...days, ...nextDays];
  };

  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = parseISO(task.due_date);
      return isSameDay(taskDate, date);
    });
  };

  const handleDatePress = (date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const navigateWeek = (direction) => {
    const newDate = direction === 'prev' 
      ? addWeeks(selectedDate, -1)
      : addWeeks(selectedDate, 1);
    setSelectedDate(newDate);
  };

  const navigateMonth = (direction) => {
    const newDate = direction === 'prev' 
      ? addMonths(selectedDate, -1)
      : addMonths(selectedDate, 1);
    setSelectedDate(newDate);
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(selectedDate);
    const today = new Date();

    return (
      <View style={styles.weekContainer}>
        <View style={styles.weekHeader}>
          <TouchableOpacity onPress={() => navigateWeek('prev')} style={styles.navButton}>
            <Icon name="chevron-left" size={24} color="#8B5CF6" />
          </TouchableOpacity>
          <Text style={styles.monthYearText}>
            {format(selectedDate, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity onPress={() => navigateWeek('next')} style={styles.navButton}>
            <Icon name="chevron-right" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysHeader}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.dayHeader}>
              <Text style={styles.dayName}>{format(day, 'EEE')}</Text>
              <Text style={styles.dayNumber}>{format(day, 'd')}</Text>
            </View>
          ))}
        </View>

        <ScrollView style={styles.weekContent}>
          {weekDays.map((day, index) => {
            const dayTasks = getTasksForDate(day);
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayColumn,
                  isToday && styles.todayColumn,
                  isSelected && styles.selectedColumn
                ]}
                onPress={() => handleDatePress(day)}
              >
                <View style={styles.dayTasks}>
                  {dayTasks.map((task, taskIndex) => (
                    <TouchableOpacity
                      key={task.id || taskIndex}
                      style={styles.taskItem}
                      onPress={() => onTaskPress && onTaskPress(task)}
                    >
                      <Text style={styles.taskText} numberOfLines={2}>
                        {task.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {dayTasks.length === 0 && (
                    <Text style={styles.emptyDayText}>No tasks</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderMonthView = () => {
    const monthDays = getMonthDays(selectedDate);
    const today = new Date();
    const currentMonth = selectedDate.getMonth();

    return (
      <View style={styles.monthContainer}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
            <Icon name="chevron-left" size={24} color="#8B5CF6" />
          </TouchableOpacity>
          <Text style={styles.monthYearText}>
            {format(selectedDate, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
            <Icon name="chevron-right" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        <View style={styles.monthGrid}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
            <View key={dayName} style={styles.monthDayHeader}>
              <Text style={styles.monthDayName}>{dayName}</Text>
            </View>
          ))}

          {monthDays.map((day, index) => {
            const dayTasks = getTasksForDate(day);
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, selectedDate);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthDay,
                  !isCurrentMonth && styles.otherMonthDay,
                  isToday && styles.monthToday,
                  isSelected && styles.monthSelected
                ]}
                onPress={() => handleDatePress(day)}
              >
                <Text style={[
                  styles.monthDayNumber,
                  !isCurrentMonth && styles.otherMonthText,
                  isToday && styles.monthTodayText
                ]}>
                  {format(day, 'd')}
                </Text>
                {dayTasks.length > 0 && (
                  <View style={styles.monthTaskIndicator}>
                    <View style={styles.monthTaskDot} />
                    {dayTasks.length > 1 && (
                      <Text style={styles.monthTaskCount}>{dayTasks.length}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {viewMode === 'week' ? renderWeekView() : renderMonthView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  weekContainer: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  weekContent: {
    flex: 1,
  },
  dayColumn: {
    minHeight: 200,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    padding: 8,
  },
  todayColumn: {
    backgroundColor: '#F3E8FF',
  },
  selectedColumn: {
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  dayTasks: {
    gap: 4,
  },
  taskItem: {
    backgroundColor: '#8B5CF6',
    padding: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  taskText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyDayText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  monthContainer: {
    flex: 1,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthDayHeader: {
    width: width / 7,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  monthDay: {
    width: width / 7,
    height: width / 7,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  otherMonthDay: {
    backgroundColor: '#F9FAFB',
  },
  monthToday: {
    backgroundColor: '#F3E8FF',
  },
  monthSelected: {
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  monthDayNumber: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  otherMonthText: {
    color: '#9CA3AF',
  },
  monthTodayText: {
    color: '#8B5CF6',
    fontWeight: '700',
  },
  monthTaskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  monthTaskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
  },
  monthTaskCount: {
    fontSize: 10,
    color: '#8B5CF6',
    marginLeft: 2,
    fontWeight: '600',
  },
});

