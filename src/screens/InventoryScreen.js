import React, { useState, useEffect } from "react";
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
import Icon from "react-native-vector-icons/MaterialIcons";
import { InventoryItem } from "../entities/InventoryItem";
import { ShoppingListItem } from "../entities/ShoppingListItem";
import { User } from "../entities/User";

const { width } = Dimensions.get('window');

export default function InventoryScreen({ navigation }) {
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
      const [user, inventoryItems] = await Promise.all([
        User.me(),
        InventoryItem.list('-updated_date')
      ]);
      
      setCurrentUser(user);
      
      // Filter items for current user and partner
      const userEmails = [user.email];
      if (user.partner_email) userEmails.push(user.partner_email);
      const filteredItems = inventoryItems.filter(item => 
        userEmails.includes(item.created_by)
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

  const handleAddAllLowStockToShoppingList = async () => {
    if (lowStockItems.length === 0) return;
    try {
      for (const item of lowStockItems) {
        const existingItems = await ShoppingListItem.filter({ name: item.name, is_purchased: false });
        if (existingItems.length === 0) {
          const quantityNeeded = item.minimum_amount - item.current_amount;
          await ShoppingListItem.create({
            name: item.name,
            category: item.category,
            quantity: quantityNeeded,
            unit: item.unit,
            auto_added: true,
            added_by: currentUser.email
          });
        }
      }
      Alert.alert('Success', 'All low stock items were added to the shopping list');
    } catch (e) {
      console.error('Bulk add low stock failed:', e);
      Alert.alert('Error', 'Failed adding some items');
    }
  };

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
              <Icon name="remove" size={20} color="#6B7280" />
            </TouchableOpacity>
            
            <Text style={styles.amountText}>
              {item.current_amount} / {item.minimum_amount} {item.unit}
            </Text>
            
            <TouchableOpacity
              style={styles.amountButton}
              onPress={() => handleUpdateAmount(item.id, item.current_amount + 1)}
            >
              <Icon name="add" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.itemActions}>
          {isLowStock && (
            <TouchableOpacity
              style={styles.addToListButton}
              onPress={() => handleAddToShoppingList(item)}
            >
              <Icon name="add-shopping-cart" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteItem(item.id)}
          >
            <Icon name="delete" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading your inventory...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Home Inventory</Text>
            <Text style={styles.subtitle}>Track what you have at home</Text>
          </View>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddDialog(true)}
          >
            <Icon name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search inventory..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
              <Icon name="inventory" size={20} color="#2563EB" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Total Items</Text>
              <Text style={styles.statValue}>{filteredItems.length}</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
              <Icon name="warning" size={20} color="#DC2626" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Low Stock</Text>
              <Text style={styles.statValue}>{lowStockItems.length}</Text>
            </View>
          </View>
          {lowStockItems.length > 0 && (
            <TouchableOpacity style={[styles.statCard, styles.bulkAddCard]} onPress={handleAddAllLowStockToShoppingList}>
              <View style={[styles.statIcon, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="playlist-add" size={20} color="#16A34A" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Add All Low Stock</Text>
                <Text style={styles.statSubLabel}>to Shopping List</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Inventory Items */}
        <View style={styles.itemsContainer}>
          {/* Low Stock Items */}
          {lowStockItems.length > 0 && (
            <View style={styles.itemsSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>Low Stock</Text>
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
                <Icon name="inventory" size={40} color="#10B981" />
              </View>
              <Text style={styles.emptyTitle}>No items in inventory</Text>
              <Text style={styles.emptySubtitle}>Add items to track what you have at home</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddDialog(true)}
              >
                <Icon name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Add First Item</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Item Modal */}
      <Modal
        visible={showAddDialog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddDialog(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Inventory Item</Text>
            <TouchableOpacity onPress={() => setShowAddDialog(false)}>
              <Icon name="close" size={24} color="#6B7280" />
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
                placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
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
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
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
    paddingVertical: 16,
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  bulkAddCard: {
    flex: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    marginLeft: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statSubLabel: {
    fontSize: 12,
    color: '#6B7280',
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
    color: '#1F2937',
    marginRight: 8,
  },
  sectionBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lowStockCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
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
    color: '#1F2937',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#6B7280',
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 80,
    textAlign: 'center',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addToListButton: {
    backgroundColor: '#10B981',
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
    backgroundColor: '#D1FAE5',
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
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
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
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  inputValue: {
    fontSize: 16,
    color: '#6B7280',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  addItemButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  addItemButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 