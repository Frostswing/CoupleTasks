import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { 
  getRecentHistory, 
  getPopularItems, 
  exportUserHistory, 
  cleanupOldHistory 
} from '../services/historyService';
import { getCategoryById, getUnitById } from '../constants/categories';

const HistoryScreen = () => {
  const [activeTab, setActiveTab] = useState('shopping');
  const [shoppingHistory, setShoppingHistory] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Cache to avoid refetching when switching tabs
  const [dataCache, setDataCache] = useState({
    shopping: { history: null, popular: null },
    tasks: { history: null, popular: null }
  });

  const loadHistoryData = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = dataCache[activeTab];
      if (cached.history && cached.popular) {
        if (activeTab === 'shopping') {
          setShoppingHistory(cached.history);
          setPopularItems(cached.popular);
        } else {
          setTaskHistory(cached.history);
          setPopularItems(cached.popular);
        }
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    try {
      if (activeTab === 'shopping') {
        const [history, popular] = await Promise.all([
          getRecentHistory('shopping', 30, 30), // Last month, limit 30 items
          getPopularItems('shopping', 10) // Reduced from 15
        ]);
        setShoppingHistory(history);
        setPopularItems(popular);
        // Update cache
        setDataCache(prev => ({
          ...prev,
          shopping: { history, popular }
        }));
      } else {
        const [history, popular] = await Promise.all([
          getRecentHistory('tasks', 30, 30), // Last month, limit 30 items
          getPopularItems('tasks', 10) // Reduced from 15
        ]);
        setTaskHistory(history);
        setPopularItems(popular);
        // Update cache
        setDataCache(prev => ({
          ...prev,
          tasks: { history, popular }
        }));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]); // Remove dataCache from dependencies to avoid infinite loops

  useEffect(() => {
    loadHistoryData();
  }, [loadHistoryData]);

  const handleExportHistory = async () => {
    try {
      const exportData = await exportUserHistory();
      if (!exportData) {
        Alert.alert('שגיאה', 'לא ניתן לייצא את ההיסטוריה כרגע');
        return;
      }

      const shareData = {
        title: 'CoupleTasks History Export',
        message: `היסטוריית CoupleTasks שלי:\n📊 ${exportData.stats.totalShoppingItems} פריטי קניות\n✅ ${exportData.stats.totalTasks} מטלות\n🎯 ${exportData.stats.totalSuggestions} הצעות`,
        url: `data:application/json;base64,${btoa(JSON.stringify(exportData))}`
      };

      await Share.share(shareData);
    } catch (error) {
      console.error('Error exporting history:', error);
      Alert.alert('שגיאה', 'לא ניתן לייצא את ההיסטוריה');
    }
  };

  const handleCleanupHistory = () => {
    Alert.alert(
      'ניקוי היסטוריה',
      'האם אתה בטוח שאתה רוצה למחוק היסטוריה ישנה (מעל 6 חודשים)?',
      [
        { text: 'ביטול', style: 'cancel' },
        { 
          text: 'מחק', 
          style: 'destructive',
          onPress: async () => {
            await cleanupOldHistory();
            // Clear cache and reload
            setDataCache({
              shopping: { history: null, popular: null },
              tasks: { history: null, popular: null }
            });
            loadHistoryData();
          }
        }
      ]
    );
  };

  // Refresh function to clear cache and reload
  const refreshHistory = useCallback(() => {
    setDataCache({
      shopping: { history: null, popular: null },
      tasks: { history: null, popular: null }
    });
    // Force reload with refresh flag
    loadHistoryData(true);
  }, [loadHistoryData]);

  const renderShoppingItem = useCallback(({ item }) => {
    const category = getCategoryById(item.category);
    const unit = getUnitById(item.unit);
    
    return (
      <View style={styles.historyItem}>
        <View style={styles.itemHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
            <Icon name={category.icon} size={16} color={category.color} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.display_name}</Text>
            <Text style={styles.itemDetails}>
              {item.quantity} {unit.shortName} • {category.name}
            </Text>
          </View>
        </View>
        <Text style={styles.itemDate}>
          {item.date.toLocaleDateString('he-IL')}
        </Text>
      </View>
    );
  }, []);

  const renderTaskItem = useCallback(({ item }) => {
    const priorityColors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444'
    };

    return (
      <View style={styles.historyItem}>
        <View style={styles.itemHeader}>
          <View style={[styles.priorityIcon, { backgroundColor: priorityColors[item.priority] + '20' }]}>
            <Icon 
              name={item.priority === 'high' ? 'priority-high' : 'check-circle'} 
              size={16} 
              color={priorityColors[item.priority]} 
            />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.display_title}</Text>
            <Text style={styles.itemDetails}>
              {item.category} • {item.priority} priority
            </Text>
          </View>
        </View>
        <Text style={styles.itemDate}>
          {item.date.toLocaleDateString('he-IL')}
        </Text>
      </View>
    );
  }, []);

  const renderPopularItem = useCallback(({ item }) => {
    return (
      <View style={styles.popularItem}>
        <View style={styles.popularItemContent}>
          <Text style={styles.popularItemName}>{item.name}</Text>
          <Text style={styles.popularItemFrequency}>
            {item.frequency} פעמים
          </Text>
        </View>
        <View style={styles.popularItemBadge}>
          <Icon name="trending-up" size={12} color="#14B8A6" />
        </View>
      </View>
    );
  }, []);

  // Memoize current history data
  const currentHistory = useMemo(() => {
    return activeTab === 'shopping' ? shoppingHistory : taskHistory;
  }, [activeTab, shoppingHistory, taskHistory]);

  const historyCount = useMemo(() => {
    return currentHistory.length;
  }, [currentHistory]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>טוען היסטוריה...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>היסטוריה חכמה</Text>
        <Text style={styles.headerSubtitle}>עקוב אחר הפעילות והשפר את ההצעות</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shopping' && styles.activeTab]}
          onPress={() => setActiveTab('shopping')}
        >
          <Icon name="shopping-cart" size={20} color={activeTab === 'shopping' ? '#14B8A6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'shopping' && styles.activeTabText]}>
            קניות
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Icon name="task-alt" size={20} color={activeTab === 'tasks' ? '#14B8A6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>
            מטלות
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Popular Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'shopping' ? 'מוצרים פופולריים' : 'מטלות חוזרות'}
          </Text>
          <FlatList
            data={popularItems}
            renderItem={renderPopularItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularList}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={3}
          />
        </View>

        {/* Recent History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>היסטוריה אחרונה</Text>
            <Text style={styles.sectionSubtitle}>
              {historyCount} פריטים בחודש האחרון
            </Text>
          </View>
          
          <FlatList
            data={currentHistory}
            renderItem={activeTab === 'shopping' ? renderShoppingItem : renderTaskItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            style={styles.historyList}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowExportModal(true)}
          >
            <Icon name="download" size={20} color="#14B8A6" />
            <Text style={styles.actionButtonText}>ייצא היסטוריה</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleCleanupHistory}
          >
            <Icon name="delete-sweep" size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>נקה היסטוריה ישנה</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ייצא היסטוריה</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                ייצא את כל ההיסטוריה שלך כדי לגבות או להעביר לאפליקציה אחרת
              </Text>
              
              <TouchableOpacity
                style={styles.exportButton}
                onPress={handleExportHistory}
              >
                <Icon name="share" size={20} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>שתף היסטוריה</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  activeTab: {
    backgroundColor: '#CCFBF1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#14B8A6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  popularList: {
    paddingVertical: 8,
  },
  popularItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  popularItemContent: {
    flex: 1,
  },
  popularItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  popularItemFrequency: {
    fontSize: 12,
    color: '#6B7280',
  },
  popularItemBadge: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  historyList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  priorityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionsSection: {
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14B8A6',
    marginLeft: 8,
  },
  dangerButtonText: {
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14B8A6',
    borderRadius: 12,
    paddingVertical: 16,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default HistoryScreen; 