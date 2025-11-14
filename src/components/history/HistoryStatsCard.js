import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getRecentHistory, getPopularItems } from '../../services/historyService';

const { width } = Dimensions.get('window');

const HistoryStatsCard = ({ type = 'shopping' }) => {
  const [stats, setStats] = useState({
    totalItems: 0,
    thisWeek: 0,
    thisMonth: 0,
    mostPopular: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [type]);

  const loadStats = async () => {
    try {
      const [allTime, lastWeek, lastMonth, popular] = await Promise.all([
        getRecentHistory(type, 365, 1000),
        getRecentHistory(type, 7, 1000),
        getRecentHistory(type, 30, 1000),
        getPopularItems(type, 1)
      ]);

      setStats({
        totalItems: allTime.length,
        thisWeek: lastWeek.length,
        thisMonth: lastMonth.length,
        mostPopular: popular[0] || null,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>טוען סטטיסטיקות...</Text>
      </View>
    );
  }

  const isTask = type === 'tasks';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon 
            name={isTask ? 'analytics' : 'bar-chart'} 
            size={20} 
            color="#8B5CF6" 
          />
        </View>
        <Text style={styles.headerTitle}>
          {isTask ? 'סטטיסטיקות מטלות' : 'סטטיסטיקות קניות'}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalItems}</Text>
          <Text style={styles.statLabel}>
            {isTask ? 'מטלות הושלמו' : 'מוצרים נקנו'}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.thisMonth}</Text>
          <Text style={styles.statLabel}>החודש</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.thisWeek}</Text>
          <Text style={styles.statLabel}>השבוע</Text>
        </View>
      </View>

      {stats.mostPopular && (
        <View style={styles.popularSection}>
          <View style={styles.popularBadge}>
            <Icon name="star" size={14} color="#F59E0B" />
            <Text style={styles.popularBadgeText}>הכי פופולרי</Text>
          </View>
          <Text style={styles.popularName}>
            {stats.mostPopular.name}
          </Text>
          <Text style={styles.popularCount}>
            {stats.mostPopular.frequency} פעמים
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  popularSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 4,
  },
  popularName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  popularCount: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default HistoryStatsCard; 