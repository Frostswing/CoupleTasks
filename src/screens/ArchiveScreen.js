import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Task } from "../entities/Task";
import { ShoppingListItem } from "../entities/ShoppingListItem";
import { User } from "../entities/User";
import { format, differenceInDays } from "date-fns";

const { width } = Dimensions.get('window');

export default function ArchiveScreen({ navigation }) {
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [archivedShoppingLists, setArchivedShoppingLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  const loadArchivedData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const userEmails = [user.email];
      if (user.partner_email) userEmails.push(user.partner_email);

      // Load archived tasks
      const allArchivedTasks = await Task.filter({ is_archived: true }, '-archived_date');
      const relevantTasks = allArchivedTasks.filter(t => userEmails.includes(t.created_by));
      setArchivedTasks(relevantTasks);

      // Load archived shopping lists (group by date)
      const allArchivedItems = await ShoppingListItem.filter({ is_archived: true }, '-updated_date');
      const relevantItems = allArchivedItems.filter(item => 
        userEmails.includes(item.created_by) || userEmails.includes(item.added_by)
      );
      
      // Group shopping items by date
      const groupedLists = {};
      relevantItems.forEach(item => {
        const date = format(new Date(item.updated_date), 'yyyy-MM-dd');
        if (!groupedLists[date]) {
          groupedLists[date] = [];
        }
        groupedLists[date].push(item);
      });
      
      setArchivedShoppingLists(Object.entries(groupedLists).map(([date, items]) => ({
        date,
        items,
        totalItems: items.length,
        purchasedItems: items.filter(item => item.is_purchased).length
      })));

      // Auto-delete old items
      const now = new Date();
      const itemsToDelete = relevantTasks.filter(task => 
        differenceInDays(now, new Date(task.archived_date)) > 60
      );

      if (itemsToDelete.length > 0) {
        await Promise.all(itemsToDelete.map(task => Task.delete(task.id)));
        loadArchivedData();
      }
    } catch (error) {
      console.error("Error loading archived data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchivedData();
  }, [loadArchivedData]);

  const handleRestoreTask = async (taskId) => {
    Alert.alert(
      "Restore Task",
      "Are you sure you want to restore this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            try {
              await Task.update(taskId, { 
                is_archived: false, 
                archived_date: null,
                status: 'pending' 
              });
              loadArchivedData();
            } catch (error) {
              console.error("Error restoring task:", error);
            }
          }
        }
      ]
    );
  };

  const handleRestoreShoppingList = async (listItems) => {
    Alert.alert(
      "Restore Shopping List",
      "Are you sure you want to restore this shopping list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            try {
              await Promise.all(listItems.map(item => 
                ShoppingListItem.update(item.id, { 
                  is_archived: false, 
                  is_purchased: false 
                })
              ));
              loadArchivedData();
            } catch (error) {
              console.error("Error restoring shopping list:", error);
            }
          }
        }
      ]
    );
  };

  const handleDeletePermanently = async (taskId) => {
    Alert.alert(
      "Delete Permanently",
      "This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await Task.delete(taskId);
              loadArchivedData();
            } catch (error) {
              console.error("Error deleting task:", error);
            }
          }
        }
      ]
    );
  };

  const TabButton = ({ title, count, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>
        {title} ({count})
      </Text>
    </TouchableOpacity>
  );

  const TaskCard = ({ task }) => (
    <View style={styles.archiveCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          {task.description && (
            <Text style={styles.taskDescription}>{task.description}</Text>
          )}
          <View style={styles.taskMeta}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>
            <Text style={styles.completionDate}>
              Completed on {format(new Date(task.completion_date), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={() => handleRestoreTask(task.id)}
          >
            <Icon name="restore" size={20} color="#16A34A" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePermanently(task.id)}
          >
            <Icon name="delete-forever" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const ShoppingListCard = ({ list }) => (
    <View style={styles.archiveCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <Text style={styles.taskTitle}>
            Shopping List - {format(new Date(list.date), 'MMM d, yyyy')}
          </Text>
          <View style={styles.taskMeta}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {list.purchasedItems} of {list.totalItems} purchased
              </Text>
            </View>
            <Text style={styles.completionDate}>
              {list.totalItems} items
            </Text>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => setSelectedList(list)}
          >
            <Icon name="visibility" size={20} color="#3B82F6" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={() => handleRestoreShoppingList(list.items)}
          >
            <Icon name="restore" size={20} color="#16A34A" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading archived items...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Archive</Text>
          <Text style={styles.subtitle}>Completed items are stored here for 60 days.</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TabButton
            title="Completed Tasks"
            count={archivedTasks.length}
            isActive={activeTab === 'tasks'}
            onPress={() => setActiveTab('tasks')}
          />
          <TabButton
            title="Shopping Lists"
            count={archivedShoppingLists.length}
            isActive={activeTab === 'shopping'}
            onPress={() => setActiveTab('shopping')}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'tasks' ? (
            <View style={styles.tabContent}>
              {archivedTasks.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Icon name="check-circle" size={40} color="#9CA3AF" />
                  </View>
                  <Text style={styles.emptyTitle}>No completed tasks</Text>
                  <Text style={styles.emptySubtitle}>Completed tasks will appear here.</Text>
                </View>
              ) : (
                <View style={styles.itemsList}>
                  {archivedTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              {archivedShoppingLists.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Icon name="shopping-cart" size={40} color="#9CA3AF" />
                  </View>
                  <Text style={styles.emptyTitle}>No shopping lists</Text>
                  <Text style={styles.emptySubtitle}>Completed shopping lists will appear here.</Text>
                </View>
              ) : (
                <View style={styles.itemsList}>
                  {archivedShoppingLists.map((list, index) => (
                    <ShoppingListCard key={list.date} list={list} />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Shopping List Detail Modal */}
      <Modal
        visible={!!selectedList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedList(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedList && `Shopping List - ${format(new Date(selectedList.date), 'MMM d, yyyy')}`}
            </Text>
            <TouchableOpacity onPress={() => setSelectedList(null)}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedList?.items.map((item, idx) => (
              <View key={idx} style={styles.shoppingItem}>
                <View style={styles.shoppingItemInfo}>
                  <Text style={[
                    styles.shoppingItemName, 
                    item.is_purchased && styles.purchasedItemName
                  ]}>
                    {item.name}
                  </Text>
                  <Text style={styles.shoppingItemQuantity}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
                {item.is_purchased && (
                  <Icon name="check-circle" size={20} color="#16A34A" />
                )}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  tabContent: {
    flex: 1,
  },
  itemsList: {
    gap: 12,
  },
  archiveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  completionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restoreButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  viewButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
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
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  shoppingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  shoppingItemInfo: {
    flex: 1,
  },
  shoppingItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  purchasedItemName: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  shoppingItemQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
}); 