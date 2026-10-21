import React, {  useState, useEffect , useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { getRecentHistory } from '../../services/historyService';
import { getCategoryById } from '../../constants/categories';
import i18n from '../../localization/i18n';
import { COLORS, SHADOWS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

const RecentHistoryWidget = ({ type = 'shopping', onSeeAll }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
            {type === 'shopping' ? i18n.t('history.recentShopping') : i18n.t('history.recentTasks')}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{i18n.t('history.loading')}</Text>
        </View>
      </View>
    );
  }

  if (recentItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {type === 'shopping' ? i18n.t('history.recentShopping') : i18n.t('history.recentTasks')}
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Icon 
            name={type === 'shopping' ? 'shopping-basket' : 'task-alt'} 
            size={32} 
            color=colors.border 
          />
          <Text style={styles.emptyText}>
            {type === 'shopping' ? i18n.t('history.noShoppingYet') : i18n.t('history.noTasksYet')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {type === 'shopping' ? i18n.t('history.recentShopping') : i18n.t('history.recentTasks')}
        </Text>
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>{i18n.t('history.all')}</Text>
          <Icon name="chevron-left" size={16} color={colors.primary} />
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

function createStyles(colors) {
  return StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.shadow,
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
    color: colors.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
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
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  itemDate: {
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 8,
  },
});
}

export default RecentHistoryWidget; 