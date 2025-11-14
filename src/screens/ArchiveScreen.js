import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
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
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchQuery, setSearchQuery] = useState('');

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

      // Load archived products (individual items, not grouped by lists)
      const allArchivedItems = await ShoppingListItem.filter({ is_archived: true }, '-purchased_date');
      const relevantProducts = allArchivedItems.filter(item => 
        userEmails.includes(item.created_by) || userEmails.includes(item.added_by)
      );
      
      // Use a hash/dictionary to avoid duplicate products (group by product name, case-insensitive)
      // Keep the most recent purchase for each product
      const productsMap = new Map();
      
      relevantProducts.forEach(product => {
        const productKey = product.name.toLowerCase().trim();
        const existingProduct = productsMap.get(productKey);
        
        if (!existingProduct) {
          // First time seeing this product, add it
          productsMap.set(productKey, product);
        } else {
          // Product already exists, keep the one with the most recent purchase date
          const existingDate = existingProduct.purchased_date 
            ? new Date(existingProduct.purchased_date).getTime() 
            : 0;
          const currentDate = product.purchased_date 
            ? new Date(product.purchased_date).getTime() 
            : 0;
          
          if (currentDate > existingDate) {
            // Current product is more recent, replace it
            productsMap.set(productKey, product);
          }
        }
      });
      
      // Convert map to array and sort by purchase date (most recent first)
      const uniqueProducts = Array.from(productsMap.values()).sort((a, b) => {
        const dateA = a.purchased_date ? new Date(a.purchased_date).getTime() : 0;
        const dateB = b.purchased_date ? new Date(b.purchased_date).getTime() : 0;
        return dateB - dateA;
      });
      
      setArchivedProducts(uniqueProducts);

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

  const handleRestoreProduct = async (product) => {
    Alert.alert(
      "Restore Product",
      `Restore "${product.name}" to shopping list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            try {
              await ShoppingListItem.update(product.id, { 
                is_archived: false, 
                is_purchased: false 
              });
              loadArchivedData();
            } catch (error) {
              console.error("Error restoring product:", error);
              Alert.alert("Error", "Failed to restore product");
            }
          }
        }
      ]
    );
  };

  const handleDeleteProduct = async (productId) => {
    Alert.alert(
      "Delete Product",
      "This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await ShoppingListItem.delete(productId);
              loadArchivedData();
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert("Error", "Failed to delete product");
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

  // Filter tasks and products based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return archivedTasks;
    const query = searchQuery.toLowerCase().trim();
    return archivedTasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query)) ||
      task.category.toLowerCase().includes(query)
    );
  }, [archivedTasks, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return archivedProducts;
    const query = searchQuery.toLowerCase().trim();
    return archivedProducts.filter(product => 
      product.name.toLowerCase().includes(query) ||
      (product.category && product.category.toLowerCase().includes(query))
    );
  }, [archivedProducts, searchQuery]);

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

  const ProductCard = ({ product }) => (
    <View style={styles.archiveCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.taskMeta}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category || 'other'}</Text>
            </View>
            <Text style={styles.completionDate}>
              {product.quantity} {product.unit || 'pcs'}
            </Text>
            {product.purchased_date && (
              <Text style={styles.completionDate}>
                Purchased {format(new Date(product.purchased_date), 'MMM d, yyyy')}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={() => handleRestoreProduct(product)}
          >
            <Icon name="restore" size={20} color="#16A34A" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteProduct(product.id)}
          >
            <Icon name="delete-forever" size={20} color="#EF4444" />
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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'tasks' ? "Search tasks..." : "Search products..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Icon name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TabButton
            title="Completed Tasks"
            count={searchQuery ? filteredTasks.length : archivedTasks.length}
            isActive={activeTab === 'tasks'}
            onPress={() => {
              setActiveTab('tasks');
              setSearchQuery(''); // Clear search when switching tabs
            }}
          />
          <TabButton
            title="Archived Products"
            count={searchQuery ? filteredProducts.length : archivedProducts.length}
            isActive={activeTab === 'shopping'}
            onPress={() => {
              setActiveTab('shopping');
              setSearchQuery(''); // Clear search when switching tabs
            }}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'tasks' ? (
            <View style={styles.tabContent}>
              {filteredTasks.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Icon name={searchQuery ? "search-off" : "check-circle"} size={40} color="#9CA3AF" />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {searchQuery ? "No tasks found" : "No completed tasks"}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery 
                      ? `No tasks match "${searchQuery}"` 
                      : "Completed tasks will appear here."}
                  </Text>
                </View>
              ) : (
                <View style={styles.itemsList}>
                  {filteredTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              {filteredProducts.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Icon name={searchQuery ? "search-off" : "shopping-cart"} size={40} color="#9CA3AF" />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {searchQuery ? "No products found" : "No archived products"}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery 
                      ? `No products match "${searchQuery}"` 
                      : "Products you purchase will be archived here for suggestions."}
                  </Text>
                </View>
              ) : (
                <View style={styles.itemsList}>
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
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
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
}); 