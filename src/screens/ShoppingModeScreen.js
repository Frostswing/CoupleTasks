import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { ShoppingListItem } from "../entities/ShoppingListItem";
import { InventoryItem } from "../entities/InventoryItem";
import { handleError, showSuccess } from "../services/errorHandlingService";

const { width } = Dimensions.get('window');

export default function ShoppingModeScreen({ navigation, route }) {
  const { itemIds } = route.params || {};
  const [items, setItems] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      console.log('ShoppingMode: Starting fetch, itemIds:', itemIds);
      
      try {
        // If itemIds are provided, use them; otherwise fetch all pending items
        if (itemIds && itemIds.length > 0) {
          console.log(`ShoppingMode: Fetching ${itemIds.length} specific items`);
          
          const fetchedItems = await Promise.all(
            itemIds.map(async (id) => {
              try {
                const item = await ShoppingListItem.getById(id);
                console.log(`ShoppingMode: Fetched item ${id}:`, item?.name);
                return item;
              } catch (error) {
                console.error(`Failed to fetch item ${id}:`, error);
                return null;
              }
            })
          );
          const validItems = fetchedItems.filter(Boolean);
          
          console.log(`ShoppingMode: Got ${validItems.length} valid items from ${itemIds.length} ids`);
          
          if (validItems.length === 0) {
            setError("No items to shop for.");
          } else {
            setItems(validItems);
          }
        } else {
          // No itemIds provided - fetch all pending shopping items
          console.log('ShoppingMode: No itemIds, fetching all pending items');
          
          const allItems = await ShoppingListItem.filter({ 
            is_purchased: false,
            is_archived: false 
          });
          
          console.log(`ShoppingMode: Found ${allItems.length} pending items`);
          
          if (allItems.length === 0) {
            setError("No items to shop for. Add items to your shopping list first.");
          } else {
            setItems(allItems);
          }
        }
      } catch (err) {
        console.error('ShoppingMode: Error loading items:', err);
        setError("Failed to load shopping items.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, [itemIds]);

  useEffect(() => {
    if (items.length > 0) {
      // Simple category ordering (could be enhanced with AI later)
      const categories = [...new Set(items.map(item => item.category))];
      const optimalOrder = [
        'fruits', 'vegetables', 'dairy', 'meat', 'grains', 
        'snacks', 'beverages', 'household', 'personal_care', 'other'
      ];
      
      const orderedCategories = optimalOrder.filter(cat => categories.includes(cat));
      const remainingCategories = categories.filter(cat => !optimalOrder.includes(cat));
      
      setCategoryOrder([...orderedCategories, ...remainingCategories]);
    }
  }, [items]);

  const handleTogglePurchased = (itemToToggle) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemToToggle.id 
          ? { ...item, is_purchased: !item.is_purchased } 
          : item
      )
    );
  };

  const handleCancelShopping = () => {
    setShowCancelDialog(false);
    navigation.navigate('ShoppingList');
  };

  const handleFinishShopping = async () => {
    if (isFinishing) {
      console.log('ShoppingMode: Already finishing, ignoring duplicate call');
      return; // Prevent multiple clicks
    }
    
    const purchasedItems = items.filter(item => item.is_purchased);
    console.log(`ShoppingMode: Finishing shopping with ${purchasedItems.length} purchased items`);
    
    if (purchasedItems.length === 0) {
      Alert.alert("No Items", "You haven't marked any items as purchased.");
      setShowFinishDialog(false);
      return;
    }

    setIsFinishing(true);
    console.log('ShoppingMode: Starting to process items...');
    
    // Use the same shopping trip date for all items purchased in this trip
    const shoppingTripDate = new Date().toISOString();
    
    try {
      // Process items one by one with error handling
      const processedItems = [];
      const failedItems = [];
      
      for (const item of purchasedItems) {
        console.log(`ShoppingMode: Processing item: ${item.name}`);
        try {
          // Update inventory if item exists
          const existingInventory = await InventoryItem.filter({ name: item.name });
          if (existingInventory.length > 0) {
            console.log(`ShoppingMode: Updating existing inventory for ${item.name}`);
            await InventoryItem.update(existingInventory[0].id, {
              current_amount: (existingInventory[0].current_amount || 0) + item.quantity,
              last_purchased: new Date().toISOString()
            });
          } else {
            console.log(`ShoppingMode: Creating new inventory for ${item.name}`);
            // Create new inventory item if it doesn't exist
            await InventoryItem.create({
              name: item.name,
              category: item.category || 'other',
              current_amount: item.quantity,
              minimum_amount: 0,
              unit: item.unit || 'pieces',
              last_purchased: new Date().toISOString()
            });
          }
          
          // Archive the product/item after purchase (keeps it in archive for suggestions, filters out from active list)
          // Shopping list items represent actual products (e.g., "Milk", "Bread", "Cheese")
          // Archived products won't appear in active shopping list but will be available for suggestions
          // Set shopping_trip_date to group items from the same shopping trip together
          console.log(`ShoppingMode: Archiving product "${item.name}" (id: ${item.id})`);
          const archiveResult = await ShoppingListItem.update(
            item.id, 
            { 
              is_archived: true, 
              is_purchased: true,
              purchased_date: shoppingTripDate,
              shopping_trip_date: shoppingTripDate
            },
            { skipInventoryUpdate: true } // Skip auto inventory update since we handled it manually
          );
          
          // Verify the product was archived
          const archivedItem = await ShoppingListItem.getById(item.id);
          if (archivedItem && archivedItem.is_archived) {
            console.log(`✅ Successfully archived product "${item.name}" - will be available for suggestions when adding new items`);
          } else {
            console.warn(`⚠️ Warning: Product "${item.name}" may not have been archived properly`);
          }
          
          // Save to history for additional suggestions support (non-blocking)
          // Don't await this to prevent hanging if Firestore is slow/unavailable
          import('../services/historyService').then(({ saveShoppingItemToHistory }) => {
            saveShoppingItemToHistory(item).catch(err => {
              console.warn(`ShoppingMode: Failed to save ${item.name} to history (non-critical):`, err);
            });
          }).catch(err => {
            console.warn(`ShoppingMode: Failed to load history service (non-critical):`, err);
          });
          
          processedItems.push(item.name);
          console.log(`ShoppingMode: Successfully processed ${item.name}`);
        } catch (itemError) {
          console.error(`ShoppingMode: Failed to process item ${item.name}:`, itemError);
          failedItems.push(item.name);
        }
      }
      
      console.log(`ShoppingMode: Finished processing. Success: ${processedItems.length}, Failed: ${failedItems.length}`);
      
      // Close dialog first
      setShowFinishDialog(false);
      setIsFinishing(false); // Reset before navigation
      
      // Navigate immediately, show alert after navigation
      navigation.navigate('ShoppingList');
      
      // Show results after navigation
      setTimeout(() => {
        if (failedItems.length === 0) {
          showSuccess(`Shopping completed! ${processedItems.length} items added to inventory.`);
        } else if (processedItems.length > 0) {
          Alert.alert(
            "Partial Success",
            `Processed ${processedItems.length} items. Failed to process: ${failedItems.join(', ')}`
          );
        } else {
          Alert.alert(
            "Error",
            `Failed to process all items: ${failedItems.join(', ')}`
          );
        }
      }, 300);
      
    } catch (err) {
      console.error("ShoppingMode: Failed to finish shopping:", err);
      setShowFinishDialog(false);
      setIsFinishing(false);
      handleError(err, 'finishShopping');
    }
  };

  const { toBuy, bought } = useMemo(() => {
    const toBuy = {};
    const bought = [];
    items.forEach(item => {
      if (item.is_purchased) {
        bought.push(item);
      } else {
        if (!toBuy[item.category]) {
          toBuy[item.category] = [];
        }
        toBuy[item.category].push(item);
      }
    });
    return { toBuy, bought };
  }, [items]);

  const orderedCategories = categoryOrder.filter(cat => toBuy[cat]?.length > 0);
  const hasBoughtItems = bought.length > 0;

  const ShoppingItemCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemCard, item.is_purchased && styles.purchasedCard]}
      onPress={() => handleTogglePurchased(item)}
    >
      <View style={styles.itemContent}>
        <Icon
          name={item.is_purchased ? 'check-circle' : 'radio-button-unchecked'}
          size={24}
          color={item.is_purchased ? '#16A34A' : '#9CA3AF'}
        />
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, item.is_purchased && styles.purchasedText]}>
            {item.name}
          </Text>
          <Text style={styles.itemQuantity}>
            {item.quantity} {item.unit || 'pcs'}
          </Text>
          {item.auto_added && (
            <Text style={styles.autoAddedText}>Auto-added from inventory</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading Shopping Mode...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="shopping-cart" size={60} color="#9CA3AF" />
          <Text style={styles.errorTitle}>No Items to Shop For</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.addItemsButton}
            onPress={() => navigation.navigate('ShoppingList')}
          >
            <Icon name="add-shopping-cart" size={20} color="#FFFFFF" />
            <Text style={styles.addItemsButtonText}>Add Items to Shopping List</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="shopping-bag" size={24} color="#16A34A" />
          <Text style={styles.title}>Shopping Mode</Text>
        </View>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowCancelDialog(true)}
        >
          <Icon name="close" size={20} color="#EF4444" />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Progress */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {bought.length} of {items.length} items purchased
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${items.length > 0 ? (bought.length / items.length) * 100 : 0}%` }
                ]} 
              />
            </View>
          </View>

          {/* Shopping Categories */}
          {orderedCategories.length > 0 ? (
            <View style={styles.categoriesContainer}>
              {orderedCategories.map(category => (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <View style={styles.categoryItems}>
                    {toBuy[category].map(item => (
                      <ShoppingItemCard key={item.id} item={item} />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.allDoneContainer}>
              <Icon name="check-circle" size={80} color="#16A34A" />
              <Text style={styles.allDoneTitle}>All items purchased!</Text>
              <Text style={styles.allDoneSubtitle}>Great job completing your shopping list.</Text>
            </View>
          )}

          {/* Cart Section */}
          {hasBoughtItems && (
            <View style={styles.cartSection}>
              <Text style={styles.cartTitle}>In Your Cart ({bought.length} items)</Text>
              <View style={styles.cartItems}>
                {bought.map(item => (
                  <ShoppingItemCard key={item.id} item={item} />
                ))}
              </View>
            </View>
          )}

          {/* Finish Button */}
          {hasBoughtItems && (
            <TouchableOpacity
              style={styles.finishButton}
              onPress={() => setShowFinishDialog(true)}
            >
              <Icon name="flag" size={24} color="#FFFFFF" />
              <Text style={styles.finishButtonText}>Finish Shopping</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Cancel Dialog */}
      <Modal
        visible={showCancelDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>Cancel Shopping Trip?</Text>
            <Text style={styles.dialogMessage}>
              Any items you've marked as purchased will not be saved.
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.dialogButtonCancel}
                onPress={() => setShowCancelDialog(false)}
              >
                <Text style={styles.dialogButtonCancelText}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogButtonConfirm}
                onPress={handleCancelShopping}
              >
                <Text style={styles.dialogButtonConfirmText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Finish Dialog */}
      <Modal
        visible={showFinishDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFinishDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>Finish Shopping Trip?</Text>
            <Text style={styles.dialogMessage}>
              This will update your inventory with all purchased items and clear your list.
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogButtonCancel, isFinishing && styles.dialogButtonDisabled]}
                onPress={() => !isFinishing && setShowFinishDialog(false)}
                disabled={isFinishing}
              >
                <Text style={styles.dialogButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogButtonConfirm, isFinishing && styles.dialogButtonDisabled]}
                onPress={handleFinishShopping}
                disabled={isFinishing}
              >
                {isFinishing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.dialogButtonConfirmText}>Yes, Finish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  addItemsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  addItemsButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  categoryItems: {
    gap: 8,
  },
  itemCard: {
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
  purchasedCard: {
    opacity: 0.7,
    backgroundColor: '#F0FDF4',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  purchasedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  autoAddedText: {
    fontSize: 12,
    color: '#16A34A',
    fontStyle: 'italic',
    marginTop: 2,
  },
  allDoneContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  allDoneTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16A34A',
    marginTop: 16,
    marginBottom: 8,
  },
  allDoneSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  cartSection: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  cartItems: {
    gap: 8,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 40,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  dialogButtonCancel: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dialogButtonCancelText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  dialogButtonConfirm: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dialogButtonConfirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dialogButtonDisabled: {
    opacity: 0.6,
  },
}); 