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
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { Task } from "../entities/Task";
import { COLORS, SPACING, SHADOWS, screenBackgroundStyle } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import { ThemedScreenShell } from "../components/common/ThemedScreenShell";
import PremiumScreenShell from "../components/premium/PremiumScreenShell";
import i18n from "../localization/i18n";
import { ShoppingListItem } from "../entities/ShoppingListItem";
import { User } from "../entities/User";
import { format, differenceInDays } from "date-fns";
import { buildHouseholdEmailSet, shoppingItemBelongsToHousehold } from "../utils/taskFilters";
import { emailMatchesUser } from "../utils/email";

const { width } = Dimensions.get('window');

export default function ArchiveScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [archivedTasks, setArchivedTasks] = useState([]);
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [archivedShoppingLists, setArchivedShoppingLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchQuery, setSearchQuery] = useState('');

  const loadArchivedData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const emailSet = buildHouseholdEmailSet(user.email, user.partner_email);

      // Load archived tasks
      const allArchivedTasks = await Task.filter({ is_archived: true }, '-archived_date');
      const relevantTasks = allArchivedTasks.filter((t) =>
        emailMatchesUser(t.created_by, emailSet)
      );
      setArchivedTasks(relevantTasks);

      // Load all archived shopping items
      const allArchivedItems = await ShoppingListItem.filter({ is_archived: true }, '-purchased_date');
      const allRelevantItems = allArchivedItems.filter((item) =>
        shoppingItemBelongsToHousehold(item, emailSet, { userUids: [user.uid] })
      );

      // Load archived products (individual items, not grouped by lists)
      // Only include items WITHOUT shopping_trip_date (these are kept forever for suggestions)
      const relevantProducts = allRelevantItems.filter(item => 
        !item.shopping_trip_date // Only products without shopping_trip_date (kept forever)
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

      // Load archived shopping lists (grouped by shopping_trip_date)
      // Only include items WITH shopping_trip_date (these are deleted after 60 days)
      const shoppingListsMap = new Map();
      
      allRelevantItems.forEach(item => {
        // Only include items that have a shopping_trip_date (from shopping mode)
        if (item.shopping_trip_date) {
          const tripDate = item.shopping_trip_date;
          
          if (!shoppingListsMap.has(tripDate)) {
            shoppingListsMap.set(tripDate, {
              date: tripDate,
              items: [],
              totalItems: 0,
              purchasedItems: 0
            });
          }
          
          const list = shoppingListsMap.get(tripDate);
          list.items.push(item);
          list.totalItems += 1;
          if (item.is_purchased) {
            list.purchasedItems += 1;
          }
        }
      });
      
      // Convert map to array and sort by date (most recent first)
      const shoppingLists = Array.from(shoppingListsMap.values()).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
      
      setArchivedShoppingLists(shoppingLists);

      // Auto-delete old items (tasks and shopping lists, but NOT archived products)
      const now = new Date();
      
      // Delete old tasks (older than 60 days)
      const tasksToDelete = relevantTasks.filter(task => 
        differenceInDays(now, new Date(task.archived_date)) > 60
      );

      if (tasksToDelete.length > 0) {
        await Promise.all(tasksToDelete.map(task => Task.delete(task.id)));
      }

      // Delete old shopping lists (items with shopping_trip_date older than 60 days)
      // Note: This deletes the items that form the shopping lists, but archived products
      // (items without shopping_trip_date) are kept forever for suggestions
      const shoppingListsToDelete = allRelevantItems.filter(item => 
        item.shopping_trip_date && 
        differenceInDays(now, new Date(item.shopping_trip_date)) > 60
      );

      if (shoppingListsToDelete.length > 0) {
        await Promise.all(shoppingListsToDelete.map(item => ShoppingListItem.delete(item.id)));
      }

      // Reload data if anything was deleted
      if (tasksToDelete.length > 0 || shoppingListsToDelete.length > 0) {
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

  const filteredShoppingLists = useMemo(() => {
    if (!searchQuery.trim()) return archivedShoppingLists;
    const query = searchQuery.toLowerCase().trim();
    return archivedShoppingLists.filter(list => {
      // Search in list date or item names
      const dateStr = format(new Date(list.date), 'MMM d, yyyy').toLowerCase();
      const hasMatchingItem = list.items.some(item => 
        item.name.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query))
      );
      return dateStr.includes(query) || hasMatchingItem;
    });
  }, [archivedShoppingLists, searchQuery]);

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
            <Icon name="restore" size={20} color={colors.success} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePermanently(task.id)}
          >
            <Icon name="delete-forever" size={20} color={colors.error} />
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
            <Icon name="restore" size={20} color={colors.success} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteProduct(product.id)}
          >
            <Icon name="delete-forever" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const ShoppingListCard = ({ list }) => (
    <View style={styles.archiveCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <Text style={styles.productName}>
            Shopping List - {format(new Date(list.date), 'MMM d, yyyy')}
          </Text>
          <View style={styles.taskMeta}>
            <Text style={styles.completionDate}>
              {list.purchasedItems} of {list.totalItems} items purchased
            </Text>
            <Text style={styles.completionDate}>
              {list.totalItems} total items
            </Text>
          </View>
          <View style={styles.itemsPreview}>
            {list.items.slice(0, 3).map((item, index) => (
              <Text key={index} style={styles.itemPreviewText}>
                • {item.name} ({item.quantity} {item.unit || 'pcs'})
              </Text>
            ))}
            {list.items.length > 3 && (
              <Text style={styles.moreItemsText}>
                +{list.items.length - 3} more items
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <PremiumScreenShell loading loadingLabel="Loading archived items..." title={i18n.t("navigation.archive")} />
    );
  }

  return (
    <PremiumScreenShell
      title={i18n.t("navigation.archive")}
      subtitle="Tasks and shopping lists are stored for 60 days. Archived products are kept forever."
    >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'tasks' 
                ? "Search tasks..." 
                : activeTab === 'shoppingLists'
                ? "Search shopping lists..."
                : "Search products..."
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textTertiary}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Icon name="close" size={18} color={colors.textTertiary} />
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
            title="Shopping Lists"
            count={searchQuery ? filteredShoppingLists.length : archivedShoppingLists.length}
            isActive={activeTab === 'shoppingLists'}
            onPress={() => {
              setActiveTab('shoppingLists');
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
                    <Icon name={searchQuery ? "search-off" : "check-circle"} size={40} color={colors.textTertiary} />
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
          ) : activeTab === 'shoppingLists' ? (
            <View style={styles.tabContent}>
              {filteredShoppingLists.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Icon name={searchQuery ? "search-off" : "shopping-bag"} size={40} color={colors.textTertiary} />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {searchQuery ? "No shopping lists found" : "No archived shopping lists"}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery 
                      ? `No shopping lists match "${searchQuery}"` 
                      : "Shopping lists from completed shopping trips will appear here."}
                  </Text>
                </View>
              ) : (
                <View style={styles.itemsList}>
                  {filteredShoppingLists.map((list, index) => (
                    <ShoppingListCard key={list.date} list={list} />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              {filteredProducts.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Icon name={searchQuery ? "search-off" : "shopping-cart"} size={40} color={colors.textTertiary} />
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
    </PremiumScreenShell>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
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
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: colors.text,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: COLORS.textInverse,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    ...SHADOWS.sm,
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
    color: colors.text,
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  completionDate: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restoreButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.successMuted,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.errorMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: colors.surface,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.borderLight,
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
  },
  itemsPreview: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemPreviewText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  moreItemsText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
}
