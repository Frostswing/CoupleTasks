import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { ShoppingListItem } from "../entities/ShoppingListItem";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import PremiumScreenShell, { PremiumHeroProgress } from "../components/premium/PremiumScreenShell";
import PremiumCard from "../components/premium/PremiumCard";
import EmptyState from "../components/premium/EmptyState";
import GradientButton from "../components/premium/GradientButton";
import PressableScale from "../components/premium/PressableScale";
import ShoppingDepartmentSection from "../components/shopping/ShoppingDepartmentSection";
import ShoppingListItemRow from "../components/shopping/ShoppingListItemRow";
import i18n from "../localization/i18n";
import { InventoryItem } from "../entities/InventoryItem";
import { handleError, showSuccess } from "../services/errorHandlingService";
import { groupItemsByStoreDepartment } from "../constants/storeDepartments";
import { getShoppingDepartmentOrder } from "../services/shoppingDepartmentOrderService";

const { width } = Dimensions.get('window');

export default function ShoppingModeScreen({ navigation, route }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { itemIds } = route.params || {};
  const [items, setItems] = useState([]);
  const [departmentOrder, setDepartmentOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [collapsedDepartments, setCollapsedDepartments] = useState({});
  const [purchasedCollapsed, setPurchasedCollapsed] = useState(false);

  const toggleDepartmentCollapsed = useCallback((departmentId) => {
    setCollapsedDepartments((prev) => ({ ...prev, [departmentId]: !prev[departmentId] }));
  }, []);

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
    getShoppingDepartmentOrder().then(setDepartmentOrder);
  }, []);

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

  const { toBuyGroups, bought } = useMemo(() => {
    const pending = items.filter((item) => !item.is_purchased);
    const purchased = items.filter((item) => item.is_purchased);
    const groups = groupItemsByStoreDepartment(pending, departmentOrder);
    return { toBuyGroups: groups, bought: purchased };
  }, [items, departmentOrder]);
  const hasBoughtItems = bought.length > 0;
  const tripProgress = items.length > 0 ? bought.length / items.length : 0;

  if (isLoading) {
    return (
      <PremiumScreenShell loading loadingLabel="Loading Shopping Mode..." title={i18n.t("navigation.drawer.shoppingMode")} />
    );
  }

  if (error) {
    return (
      <PremiumScreenShell
        title={i18n.t("navigation.drawer.shoppingMode")}
        subtitle={i18n.t("shopping.groupedByAisle")}
      >
        <EmptyState
          icon="shopping-cart"
          title="No items to shop for"
          message={error}
          actionLabel="Go to shopping list"
          onAction={() => navigation.navigate("ShoppingList")}
        />
      </PremiumScreenShell>
    );
  }

  const heroSlot = (
    <>
      <PremiumHeroProgress
        progress={tripProgress}
        label={`${bought.length} of ${items.length} in cart`}
      />
      <PressableScale onPress={() => setShowCancelDialog(true)} style={styles.cancelChip}>
        <Icon name="close" size={18} color={COLORS.heroText} />
        <Text style={styles.cancelChipText}>Cancel trip</Text>
      </PressableScale>
    </>
  );

  return (
    <>
    <PremiumScreenShell
      noHorizontalPadding
      title={i18n.t("navigation.drawer.shoppingMode")}
      subtitle={i18n.t("shopping.groupedByAisle")}
      heroStats={[
        { label: "To buy", value: String(items.length - bought.length) },
        { label: "In cart", value: String(bought.length) },
      ]}
      heroSlot={heroSlot}
      contentStyle={styles.shellContent}
    >
      <View style={styles.innerPad}>
        {toBuyGroups.length > 0 ? (
          toBuyGroups.map((group) => (
            <ShoppingDepartmentSection
              key={group.departmentId}
              departmentId={group.departmentId}
              items={group.items}
              colors={colors}
              collapsed={!!collapsedDepartments[group.departmentId]}
              onToggleCollapsed={() => toggleDepartmentCollapsed(group.departmentId)}
              onTogglePurchased={handleTogglePurchased}
              onEdit={(item) => handleTogglePurchased(item)}
              onDelete={() => {}}
              disableSwipe
            />
          ))
        ) : (
          <EmptyState
            icon="check-circle"
            title="All items purchased!"
            message="Great job completing your shopping list."
          />
        )}

        {hasBoughtItems && (
          <View style={styles.cartBlock}>
            <TouchableOpacity
              style={styles.cartHeader}
              onPress={() => setPurchasedCollapsed((v) => !v)}
            >
              <Text style={[styles.cartTitle, { color: colors.textSecondary }]}>
                In your cart ({bought.length})
              </Text>
              <Icon
                name={purchasedCollapsed ? "expand-more" : "expand-less"}
                size={22}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
            {!purchasedCollapsed && (
              <PremiumCard padded={false}>
                {bought.map((item, index) => (
                  <ShoppingListItemRow
                    key={item.id}
                    item={item}
                    colors={colors}
                    onTogglePurchased={handleTogglePurchased}
                    onEdit={(it) => handleTogglePurchased(it)}
                    onDelete={() => {}}
                    isLastInGroup={index === bought.length - 1}
                    disableSwipe
                  />
                ))}
              </PremiumCard>
            )}
          </View>
        )}

        {hasBoughtItems && (
          <GradientButton
            label="Finish shopping"
            onPress={() => setShowFinishDialog(true)}
            style={styles.finishCta}
          />
        )}
      </View>
    </PremiumScreenShell>

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
                  <ActivityIndicator size="small" color={COLORS.textInverse} />
                ) : (
                  <Text style={styles.dialogButtonConfirmText}>Yes, Finish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  shellContent: {
    paddingBottom: SPACING.xxxl,
  },
  innerPad: {
    paddingHorizontal: SPACING.l,
  },
  cancelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
    alignSelf: "flex-start",
    marginTop: SPACING.m,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: RADIUS.m,
    backgroundColor: COLORS.overlayOnPrimary,
  },
  cancelChipText: {
    color: COLORS.heroText,
    fontWeight: "600",
    fontSize: 14,
  },
  cartBlock: {
    marginTop: SPACING.l,
  },
  cartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.s,
    marginBottom: SPACING.s,
  },
  cartTitle: {
    ...TYPOGRAPHY.overline,
  },
  finishCta: {
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.s,
  },
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  addItemsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  addItemsButtonText: {
    color: COLORS.textInverse,
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
    backgroundColor: colors.surface,
    ...SHADOWS.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: colors.error,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
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
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  categoryItems: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    ...SHADOWS.sm,
  },
  purchasedCard: {
    opacity: 0.7,
    backgroundColor: colors.successMuted,
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
    color: colors.text,
    marginBottom: 4,
  },
  purchasedText: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  autoAddedText: {
    fontSize: 12,
    color: colors.success,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  imageThumbnailContainer: {
    marginTop: 8,
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  allDoneContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 40,
    ...SHADOWS.sm,
  },
  allDoneTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: 16,
    marginBottom: 8,
  },
  allDoneSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cartSection: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.sm,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  cartItems: {
    gap: 8,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  finishButtonText: {
    color: COLORS.textInverse,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 40,
    maxWidth: 350,
    shadowColor: colors.shadow,
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
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 16,
    color: colors.textSecondary,
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
    backgroundColor: colors.borderLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dialogButtonCancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dialogButtonConfirm: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dialogButtonConfirmText: {
    color: COLORS.textInverse,
    fontWeight: '600',
  },
  dialogButtonDisabled: {
    opacity: 0.6,
  },
});
}
