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

const { width } = Dimensions.get('window');

export default function ShoppingModeScreen({ navigation, route }) {
  const { itemIds } = route.params || {};
  const [items, setItems] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      if (!itemIds || itemIds.length === 0) {
        setError("No items to shop for.");
        setIsLoading(false);
        return;
      }

      try {
        const fetchedItems = await Promise.all(
          itemIds.map(async (id) => {
            try {
              return await ShoppingListItem.getById(id);
            } catch (error) {
              console.error(`Failed to fetch item ${id}:`, error);
              return null;
            }
          })
        );
        setItems(fetchedItems.filter(Boolean));
      } catch (err) {
        setError("Failed to load shopping items.");
        console.error(err);
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
    const purchasedItems = items.filter(item => item.is_purchased);
    if (purchasedItems.length === 0) {
      Alert.alert("No Items", "You haven't marked any items as purchased.");
      return;
    }

    try {
      for (const item of purchasedItems) {
        // Update inventory
        const existingInventory = await InventoryItem.filter({ name: item.name });
        if (existingInventory.length > 0) {
          await InventoryItem.update(existingInventory[0].id, {
            current_amount: (existingInventory[0].current_amount || 0) + item.quantity,
            last_purchased: new Date().toISOString()
          });
        }
        // Archive shopping list item
        await ShoppingListItem.update(item.id, { 
          is_archived: true, 
          is_purchased: true 
        });
      }
      
      setShowFinishDialog(false);
      navigation.navigate('ShoppingList');
      Alert.alert("Success", "Shopping completed! Your inventory has been updated.");
    } catch (err) {
      console.error("Failed to finish shopping:", err);
      Alert.alert("Error", "There was an error finishing your shopping trip. Please try again.");
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
          <Icon name="error" size={60} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.backToListButton}
            onPress={() => navigation.navigate('ShoppingList')}
          >
            <Text style={styles.backToListButtonText}>Back to Shopping List</Text>
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
                style={styles.dialogButtonCancel}
                onPress={() => setShowFinishDialog(false)}
              >
                <Text style={styles.dialogButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogButtonConfirm}
                onPress={handleFinishShopping}
              >
                <Text style={styles.dialogButtonConfirmText}>Yes, Finish</Text>
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
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 20,
  },
  backToListButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backToListButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
}); 