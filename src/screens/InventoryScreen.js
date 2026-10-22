import React, { useState, useEffect , useMemo} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { InventoryItem } from "../entities/InventoryItem";
import {COLORS, SPACING, screenBackgroundStyle, SHADOWS} from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import { ThemedScreenShell } from "../components/common/ThemedScreenShell";
import PremiumScreenShell from "../components/premium/PremiumScreenShell";
import i18n from "../localization/i18n";
import { ShoppingListItem } from "../entities/ShoppingListItem";
import { getCurrentUser, getUserProfile } from "../services/userService";
import { userEmailSet, emailMatchesUser } from "../utils/email";

const { width } = Dimensions.get('window');

export default function InventoryScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  
  // Add Item Form
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("other");
  const [newItemCurrentAmount, setNewItemCurrentAmount] = useState("0");
  const [newItemMinimumAmount, setNewItemMinimumAmount] = useState("1");
  const [newItemUnit, setNewItemUnit] = useState("pieces");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const authUser = getCurrentUser();
      const inventoryItems = await InventoryItem.list('-updated_date');
      let user = null;
      if (authUser) {
        const result = await getUserProfile(authUser.uid);
        user = result.success
          ? { uid: authUser.uid, email: authUser.email, ...result.profile }
          : { uid: authUser.uid, email: authUser.email, full_name: authUser.displayName || "User" };
      }
      setCurrentUser(user);
      if (!user) return;
      
      const emailSet = userEmailSet(user.email, user.partner_email);
      const filteredItems = inventoryItems.filter(
        (item) =>
          item.created_by === user.uid || emailMatchesUser(item.created_by, emailSet)
      );
      
      setItems(filteredItems);
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert("Error", "Please enter an item name");
      return;
    }

    try {
      await InventoryItem.create({
        name: newItemName.trim(),
        category: newItemCategory,
        current_amount: parseInt(newItemCurrentAmount) || 0,
        minimum_amount: parseInt(newItemMinimumAmount) || 1,
        unit: newItemUnit,
        created_by: currentUser.email
      });
      
      // Reset form
      setNewItemName("");
      setNewItemCategory("other");
      setNewItemCurrentAmount("0");
      setNewItemMinimumAmount("1");
      setNewItemUnit("pieces");
      setShowAddDialog(false);
      loadData();
    } catch (error) {
      console.error("Error adding item:", error);
      Alert.alert("Error", "Failed to add item");
    }
  };

  const handleUpdateAmount = async (itemId, newAmount) => {
    try {
      await InventoryItem.update(itemId, {
        current_amount: newAmount,
        last_purchased: newAmount > 0 ? new Date().toISOString() : null
      });
      loadData();
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleAddToShoppingList = async (item) => {
    try {
      // Check if item already exists in shopping list
      const existingItems = await ShoppingListItem.filter({ 
        name: item.name, 
        is_purchased: false 
      });
      
      if (existingItems.length > 0) {
        Alert.alert("Info", "This item is already in your shopping list");
        return;
      }

      const quantityNeeded = item.minimum_amount - item.current_amount;
      
      await ShoppingListItem.create({
        name: item.name,
        category: item.category,
        quantity: quantityNeeded,
        unit: item.unit,
        auto_added: true,
        added_by: currentUser.email
      });
      
      Alert.alert("Success", `Added ${item.name} to shopping list`);
    } catch (error) {
      console.error("Error adding to shopping list:", error);
      Alert.alert("Error", "Failed to add to shopping list");
    }
  };

  const handleDeleteItem = async (itemId) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await InventoryItem.delete(itemId);
              loadData();
            } catch (error) {
              console.error("Error deleting item:", error);
            }
          }
        }
      ]
    );
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = filteredItems.filter(item => item.current_amount < item.minimum_amount);
  const normalStockItems = filteredItems.filter(item => item.current_amount >= item.minimum_amount);

  const InventoryItemCard = ({ item, isLowStock }) => (
    <View style={[styles.itemCard, isLowStock && styles.lowStockCard]}>
      <View style={styles.itemContent}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
          
          <View style={styles.amountContainer}>
            <TouchableOpacity
              style={styles.amountButton}
              onPress={() => handleUpdateAmount(item.id, Math.max(0, item.current_amount - 1))}
            >
              <Icon name="remove" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <Text style={styles.amountText}>
              {item.current_amount} / {item.minimum_amount} {item.unit}
            </Text>
            
            <TouchableOpacity
              style={styles.amountButton}
              onPress={() => handleUpdateAmount(item.id, item.current_amount + 1)}
            >
              <Icon name="add" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.itemActions}>
          {isLowStock && (
            <TouchableOpacity
              style={styles.addToListButton}
              onPress={() => handleAddToShoppingList(item)}
            >
              <Icon name="add-shopping-cart" size={20} color={COLORS.textInverse} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteItem(item.id)}
          >
            <Icon name="delete" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <PremiumScreenShell loading loadingLabel="Loading your inventory..." title={i18n.t("navigation.inventory")} />
    );
  }

  return (
    <>
    <PremiumScreenShell
      title={i18n.t("navigation.inventory")}
      subtitle="Track what you have at home"
      heroStats={[
        { label: "Items", value: String(filteredItems.length) },
        { label: "Low", value: String(lowStockItems.length) },
      ]}
      fab={{
        icon: "add",
        onPress: () => setShowAddDialog(true),
        accessibilityLabel: "Add inventory item",
      }}
    >
        {/* Search */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search inventory..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.primaryMuted }]}>
              <Icon name="inventory" size={20} color={colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Total Items</Text>
              <Text style={styles.statValue}>{filteredItems.length}</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.errorMuted }]}>
              <Icon name="warning" size={20} color={colors.error} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Low Stock</Text>
              <Text style={styles.statValue}>{lowStockItems.length}</Text>
            </View>
          </View>
        </View>

        {/* Inventory Items */}
        <View style={styles.itemsContainer}>
          {/* Low Stock Items */}
          {lowStockItems.length > 0 && (
            <View style={styles.itemsSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.error }]}>Low Stock</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{lowStockItems.length} items</Text>
                </View>
              </View>
              {lowStockItems.map((item) => (
                <InventoryItemCard key={item.id} item={item} isLowStock={true} />
              ))}
            </View>
          )}

          {/* Normal Stock Items */}
          {normalStockItems.length > 0 && (
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>In Stock</Text>
              {normalStockItems.map((item) => (
                <InventoryItemCard key={item.id} item={item} isLowStock={false} />
              ))}
            </View>
          )}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Icon name="inventory" size={40} color={colors.success} />
              </View>
              <Text style={styles.emptyTitle}>No items in inventory</Text>
              <Text style={styles.emptySubtitle}>Add items to track what you have at home</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddDialog(true)}
              >
                <Icon name="add" size={20} color={COLORS.textInverse} />
                <Text style={styles.emptyButtonText}>Add First Item</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
    </PremiumScreenShell>

      {/* Add Item Modal */}
      <Modal
        visible={showAddDialog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddDialog(false)}
      >
        <SafeAreaView style={[styles.modalContainer, screenBackgroundStyle(colors)]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Inventory Item</Text>
            <TouchableOpacity onPress={() => setShowAddDialog(false)}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput
                style={styles.input}
                placeholder="What item do you want to track?"
                value={newItemName}
                onChangeText={setNewItemName}
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <Text style={styles.inputValue}>{newItemCategory}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={newItemCurrentAmount}
                onChangeText={setNewItemCurrentAmount}
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Minimum Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={newItemMinimumAmount}
                onChangeText={setNewItemMinimumAmount}
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Unit</Text>
              <Text style={styles.inputValue}>{newItemUnit}</Text>
            </View>

            <TouchableOpacity
              style={styles.addItemButton}
              onPress={handleAddItem}
            >
              <Text style={styles.addItemButtonText}>Add to Inventory</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerText: {
    flex: 1,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: COLORS.textInverse,
    fontWeight: '600',
    marginLeft: 8,
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
    paddingVertical: 16,
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.sm,
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
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  itemsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  sectionBadge: {
    backgroundColor: colors.errorMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    ...SHADOWS.sm,
  },
  lowStockCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    minWidth: 80,
    textAlign: 'center',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addToListButton: {
    backgroundColor: colors.success,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.successMuted,
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
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: COLORS.textInverse,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  inputValue: {
    fontSize: 16,
    color: colors.textSecondary,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.borderLight,
    borderRadius: 12,
  },
  addItemButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  addItemButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
}
