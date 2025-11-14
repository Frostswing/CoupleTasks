import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getRecentHistory } from '../../services/historyService';
import { getCategoryById } from '../../constants/categories';

const RecentHistoryWidget = ({ type = 'shopping', onSeeAll }) => {
  const [recentItems, setRecentItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentHistory();
  }, [type]);

  const loadRecentHistory = async () => {
    try {
      const items = await getRecentHistory(type, 7, 5); // Last week, max 5 items
      setRecentItems(items);
    } catch (error) {
      console.error('Error loading recent history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isTask = type === 'tasks';
    const name = isTask ? item.display_title : item.display_name;
    const category = getCategoryById(isTask ? 'other' : item.category);
    
    return (
      <View style={styles.historyItem}>
        <View style={[styles.itemIcon, { backgroundColor: category.color + '20' }]}>
          <Icon 
            name={isTask ? 'check-circle' : category.icon} 
            size={14} 
            color={category.color} 
          />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.itemDate}>
            {item.date.toLocaleDateString('he-IL', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {type === 'shopping' ? 'נקנה לאחרונה' : 'הושלם לאחרונה'}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>טוען...</Text>
        </View>
      </View>
    );
  }

  if (recentItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {type === 'shopping' ? 'נקנה לאחרונה' : 'הושלם לאחרונה'}
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Icon 
            name={type === 'shopping' ? 'shopping-basket' : 'task-alt'} 
            size={32} 
            color="#D1D5DB" 
          />
          <Text style={styles.emptyText}>
            {type === 'shopping' ? 'עדיין לא קנית כלום' : 'עדיין לא השלמת מטלות'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {type === 'shopping' ? 'נקנה לאחרונה' : 'הושלם לאחרונה'}
        </Text>
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>הכל</Text>
          <Icon name="chevron-left" size={16} color="#8B5CF6" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={recentItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    marginRight: 4,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  list: {
    maxHeight: 140,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  itemDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
});

export default RecentHistoryWidget; 