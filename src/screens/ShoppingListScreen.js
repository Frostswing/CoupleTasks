import React, { useState, useEffect, useCallback, useLayoutEffect } from "react";
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
  Linking,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { Image } from 'expo-image';
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { ShoppingListItem } from "../entities/ShoppingListItem";
import { InventoryItem } from "../entities/InventoryItem";
import { getCurrentUser, getUserProfile } from "../services/userService";
import AutoCompleteInput from "../components/common/AutoCompleteInput";
import { autoDetectCategory, getDefaultUnitForCategory } from "../constants/categories";
import {
  autoDetectStoreDepartment,
  groupItemsByStoreDepartment,
  resolveStoreDepartment,
} from "../constants/storeDepartments";
import { pickImage, uploadImage } from "../services/imageService";
import { subscribeShoppingDepartmentOrder } from "../services/shoppingDepartmentOrderService";
import StoreDepartmentPicker from "../components/shopping/StoreDepartmentPicker";
import ShoppingDepartmentOrderModal from "../components/shopping/ShoppingDepartmentOrderModal";
import ShoppingDepartmentSection from "../components/shopping/ShoppingDepartmentSection";
import i18n from "../localization/i18n";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, screenBackgroundStyle } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";

const { width } = Dimensions.get('window');

async function loadCurrentUserProfile() {
  const authUser = getCurrentUser();
  if (!authUser) return null;
  const result = await getUserProfile(authUser.uid);
  if (!result.success) {
    return { uid: authUser.uid, email: authUser.email, full_name: authUser.displayName || "User" };
  }
  return { uid: authUser.uid, email: authUser.email, ...result.profile };
}

export default function ShoppingListScreen({ navigation, route }) {
  const { colors } = useAppTheme();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemCategory, setNewItemCategory] = useState("other");
  const [newItemUnit, setNewItemUnit] = useState("pcs");
  const [newItemImage, setNewItemImage] = useState(null);
  const [newItemImageUrl, setNewItemImageUrl] = useState("");
  const [newItemLink, setNewItemLink] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState("");
  const [newItemStoreDepartment, setNewItemStoreDepartment] = useState("other");
  const [departmentOrder, setDepartmentOrder] = useState(null);
  const [showStoreLayoutModal, setShowStoreLayoutModal] = useState(false);
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddBusy, setQuickAddBusy] = useState(false);
  const [purchasedCollapsed, setPurchasedCollapsed] = useState(true);
  const [collapsedDepartments, setCollapsedDepartments] = useState({});

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const [user, shoppingItems] = await Promise.all([
        loadCurrentUserProfile(),
        ShoppingListItem.list('-created_date')
      ]);

      if (!user) {
        setItems([]);
        return;
      }

      setCurrentUser(user);

      // Filter items for current user and partner
      const userEmails = [user.email];
      if (user.partner_email) userEmails.push(user.partner_email);
      const filteredItems = shoppingItems.filter(item =>
        !item.is_archived &&
        (userEmails.includes(item.created_by) || userEmails.includes(item.added_by))
      );

      filteredItems.forEach(item => {
        if (item.image_url) {
          console.log('Item with image:', item.name, 'image_url:', item.image_url);
        }
      });

      setItems(filteredItems);
    } catch (error) {
      console.error("Error loading shopping list:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkAutoAddItems = useCallback(async () => {
    try {
      const user = await loadCurrentUserProfile();
      if (!user?.email) return;

      const inventoryItems = await InventoryItem.list();
      const lowStockItems = inventoryItems.filter(item =>
        item.current_amount < item.minimum_amount
      );

      for (const item of lowStockItems) {
        const existingItem = await ShoppingListItem.filter({
          name: item.name,
          is_purchased: false
        });

        if (existingItem.length === 0) {
          await ShoppingListItem.create({
            name: item.name,
            category: item.category,
            quantity: item.minimum_amount - item.current_amount,
            unit: item.unit,
            auto_added: true,
            added_by: user.email
          });
        }
      }

      loadData();
    } catch (error) {
      console.error("Error checking auto-add items:", error);
    }
  }, [loadData]);

  // Load data when component mounts (with loading indicator)
  useEffect(() => {
    loadData(true);
    checkAutoAddItems();

    if (route?.params?.openAddDialog) {
      setTimeout(() => setShowAddDialog(true), 300);
    }
  }, [route?.params?.openAddDialog, loadData, checkAutoAddItems]);

  useEffect(() => {
    const unsubscribe = subscribeShoppingDepartmentOrder((order) => {
      setDepartmentOrder(order);
    });
    return unsubscribe;
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('ShoppingListScreen: Screen focused, refreshing data...');
      loadData(false);
    }, [loadData])
  );

  const handleNameChange = (name) => {
    const detectedCategory = autoDetectCategory(name);
    const defaultUnit = getDefaultUnitForCategory(detectedCategory);
    const detectedDepartment = autoDetectStoreDepartment(name);
    
    setNewItemName(name);
    // Auto-update category and unit if they're still default
    if (newItemCategory === "other") {
      setNewItemCategory(detectedCategory);
    }
    if (newItemUnit === "pcs") {
      setNewItemUnit(defaultUnit);
    }
    if (newItemStoreDepartment === "other" && detectedDepartment !== "other") {
      setNewItemStoreDepartment(detectedDepartment);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    // Auto-fill form with suggestion data from archive
    if (suggestion && suggestion.name) {
      setNewItemName(suggestion.name);
      setNewItemCategory(suggestion.category || autoDetectCategory(suggestion.name));
      setNewItemUnit(suggestion.unit || getDefaultUnitForCategory(suggestion.category || autoDetectCategory(suggestion.name)));
      if (suggestion.quantity) {
        setNewItemQuantity(suggestion.quantity.toString());
      }
      // Auto-fill image and link from archived item if available
      if (suggestion.image_url) {
        setNewItemImageUrl(suggestion.image_url);
      }
      if (suggestion.link) {
        setNewItemLink(suggestion.link);
      }
      if (suggestion.store_department) {
        setNewItemStoreDepartment(suggestion.store_department);
      } else {
        setNewItemStoreDepartment(autoDetectStoreDepartment(suggestion.name));
      }
    }
  };

  const handlePickImage = async (source) => {
    try {
      const result = await pickImage(source);
      if (result.success && result.uri) {
        setNewItemImage(result.uri);
        setUploadingImage(true);
        
        // Upload image to Firebase Storage
        const uploadResult = await uploadImage(result.uri);
        setUploadingImage(false);
        
        if (uploadResult.success && uploadResult.url) {
          console.log('Image uploaded successfully, URL:', uploadResult.url);
          setNewItemImageUrl(uploadResult.url);
        } else {
          console.error('Upload failed:', uploadResult);
          Alert.alert("Error", uploadResult.error || "Failed to upload image");
          setNewItemImage(null);
          setNewItemImageUrl("");
        }
      }
    } catch (error) {
      setUploadingImage(false);
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
      setNewItemImage(null);
      setNewItemImageUrl("");
    }
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handlePickImage('camera');
          } else if (buttonIndex === 2) {
            handlePickImage('library');
          }
        }
      );
    } else {
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => handlePickImage('camera') },
          { text: 'Choose from Library', onPress: () => handlePickImage('library') },
        ]
      );
    }
  };

  const handleRemoveImage = () => {
    setNewItemImage(null);
    setNewItemImageUrl("");
  };

  const handleViewImage = (imageUrl) => {
    setViewingImageUrl(imageUrl);
    setShowImageModal(true);
  };

  const handleOpenLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this URL");
      }
    } catch (error) {
      console.error("Error opening link:", error);
      Alert.alert("Error", "Failed to open link");
    }
  };

  const handleQuickAdd = async () => {
    const name = quickAddName.trim();
    if (!name || !currentUser?.email) return;
    setQuickAddBusy(true);
    try {
      const category = autoDetectCategory(name);
      await ShoppingListItem.create({
        name,
        quantity: 1,
        category,
        store_department: autoDetectStoreDepartment(name),
        unit: getDefaultUnitForCategory(category),
        added_by: currentUser.email,
      });
      setQuickAddName("");
      loadData(false);
    } catch (error) {
      console.error("Quick add failed:", error);
      Alert.alert(i18n.t("common.error"), i18n.t("shopping.errorAddingItem"));
    } finally {
      setQuickAddBusy(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert("Error", "Please enter an item name");
      return;
    }

    // If image is still uploading, wait for it
    if (uploadingImage) {
      Alert.alert("Please wait", "Image is still uploading. Please wait a moment and try again.");
      return;
    }

    try {
      console.log('Creating item with image_url:', newItemImageUrl);
      console.log('newItemImage state:', newItemImage);
      console.log('newItemImageUrl state:', newItemImageUrl);
      
      const createdItem = await ShoppingListItem.create({
        name: newItemName.trim(),
        quantity: parseInt(newItemQuantity) || 1,
        category: newItemCategory,
        store_department: newItemStoreDepartment,
        unit: newItemUnit,
        image_url: newItemImageUrl || "",
        link: newItemLink.trim() || "",
        notes: newItemNotes.trim() || "",
        added_by: currentUser.email
      });
      
      console.log('Created item:', createdItem);
      console.log('Created item image_url:', createdItem.image_url);
      
      setNewItemName("");
      setNewItemQuantity("1");
      setNewItemCategory("other");
      setNewItemStoreDepartment("other");
      setNewItemUnit("pcs");
      setNewItemImage(null);
      setNewItemImageUrl("");
      setNewItemLink("");
      setNewItemNotes("");
      setNewItemStoreDepartment("other");
      setShowAddDialog(false);
      loadData();
    } catch (error) {
      console.error("Error adding item:", error);
      Alert.alert("Error", "Failed to add item");
    }
  };

  const handleTogglePurchased = async (item) => {
    try {
      await ShoppingListItem.update(item.id, {
        is_purchased: !item.is_purchased
      });
      
      if (!item.is_purchased) {
        // Item being marked as purchased - update inventory
        const existingInventory = await InventoryItem.filter({ name: item.name });
        if (existingInventory.length > 0) {
          await InventoryItem.update(existingInventory[0].id, {
            current_amount: existingInventory[0].current_amount + item.quantity,
            last_purchased: new Date().toISOString()
          });
        }
      }
      
      loadData();
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemQuantity(item.quantity.toString());
    setNewItemStoreDepartment(resolveStoreDepartment(item));
    setNewItemImageUrl(item.image_url || "");
    setNewItemLink(item.link || "");
    setNewItemNotes(item.notes || "");
    setNewItemImage(item.image_url || null);
    setShowEditDialog(true);
  };

  const handleUpdateItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert("Error", "Please enter an item name");
      return;
    }

    try {
      await ShoppingListItem.update(editingItem.id, {
        name: newItemName.trim(),
        quantity: parseInt(newItemQuantity) || 1,
        store_department: newItemStoreDepartment,
        image_url: newItemImageUrl || "",
        link: newItemLink.trim() || "",
        notes: newItemNotes.trim() || "",
      });
      
      setEditingItem(null);
      setNewItemName("");
      setNewItemQuantity("1");
      setNewItemImage(null);
      setNewItemImageUrl("");
      setNewItemLink("");
      setNewItemNotes("");
      setShowEditDialog(false);
      loadData();
    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", "Failed to update item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await ShoppingListItem.delete(itemId);
      loadData(false);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const toggleDepartmentCollapsed = (departmentId) => {
    setCollapsedDepartments((prev) => ({
      ...prev,
      [departmentId]: !prev[departmentId],
    }));
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingItems = filteredItems.filter((item) => !item.is_purchased);
  const purchasedItems = filteredItems.filter((item) => item.is_purchased);
  const pendingGroups = groupItemsByStoreDepartment(pendingItems, departmentOrder);
  const purchasedGroups = groupItemsByStoreDepartment(purchasedItems, departmentOrder);
  const totalCount = pendingItems.length + purchasedItems.length;
  const progress = totalCount > 0 ? purchasedItems.length / totalCount : 0;

  const handleStartShopping = useCallback(() => {
    const itemIds = pendingItems.map((item) => item.id);
    if (itemIds.length > 0) {
      navigation.navigate("ShoppingMode", { itemIds });
    }
  }, [navigation, pendingItems]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowStoreLayoutModal(true)}
            style={styles.headerIconBtn}
            accessibilityLabel={i18n.t("shopping.storeLayoutTitle")}
          >
            <Icon name="storefront" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleStartShopping}
            disabled={pendingItems.length === 0}
            style={[styles.headerIconBtn, pendingItems.length === 0 && styles.headerIconDisabled]}
            accessibilityLabel={i18n.t("shopping.shopMode")}
          >
            <Icon name="shopping-bag" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, colors, pendingItems.length, handleStartShopping]);

  const renderGroups = (groups) =>
    groups.map((group) => (
      <ShoppingDepartmentSection
        key={group.departmentId}
        departmentId={group.departmentId}
        items={group.items}
        colors={colors}
        collapsed={!!collapsedDepartments[group.departmentId]}
        onToggleCollapsed={() => toggleDepartmentCollapsed(group.departmentId)}
        onTogglePurchased={handleTogglePurchased}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
      />
    ));

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, screenBackgroundStyle(colors)]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {i18n.t("common.loading")}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, screenBackgroundStyle(colors)]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.aisleHint, { color: colors.textTertiary }]}>
          {i18n.t("shopping.groupedByAisle")}
        </Text>

        {totalCount > 0 && (
          <View style={styles.progressRow}>
            <View style={[styles.progressTrack, { backgroundColor: colors.borderLight }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progress * 100)}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              {purchasedItems.length}/{totalCount}
            </Text>
          </View>
        )}

        <View style={[styles.quickAddBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.quickAddInput, { color: colors.text }]}
            placeholder={i18n.t("shopping.quickAddPlaceholder")}
            placeholderTextColor={colors.textTertiary}
            value={quickAddName}
            onChangeText={setQuickAddName}
            onSubmitEditing={handleQuickAdd}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={handleQuickAdd}
            disabled={!quickAddName.trim() || quickAddBusy}
            style={[
              styles.quickAddBtn,
              { backgroundColor: colors.primary },
              (!quickAddName.trim() || quickAddBusy) && styles.quickAddBtnDisabled,
            ]}
          >
            {quickAddBusy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="add" size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setShowAddDialog(true)} style={styles.moreDetailsLink}>
          <Text style={{ color: colors.primary, fontWeight: "600" }}>
            {i18n.t("shopping.moreDetails")}
          </Text>
        </TouchableOpacity>

        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={i18n.t("shopping.searchPlaceholder")}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.itemsContainer}>
          {pendingItems.length > 0 && renderGroups(pendingGroups)}

          {purchasedItems.length > 0 && (
            <View style={styles.purchasedBlock}>
              <TouchableOpacity
                style={styles.purchasedHeader}
                onPress={() => setPurchasedCollapsed((v) => !v)}
              >
                <Text style={[styles.purchasedTitle, { color: colors.textSecondary }]}>
                  {i18n.t("shopping.purchasedSection")} ({purchasedItems.length})
                </Text>
                <Icon
                  name={purchasedCollapsed ? "expand-more" : "expand-less"}
                  size={22}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
              {!purchasedCollapsed && renderGroups(purchasedGroups)}
            </View>
          )}

          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="shopping-cart" size={48} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{i18n.t("shopping.emptyTitle")}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {i18n.t("shopping.emptySubtitle")}
              </Text>
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
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Item</Text>
            <TouchableOpacity onPress={() => {
              setShowAddDialog(false);
              setNewItemName("");
              setNewItemQuantity("1");
              setNewItemCategory("other");
              setNewItemStoreDepartment("other");
              setNewItemUnit("pcs");
              setNewItemImage(null);
              setNewItemImageUrl("");
              setNewItemLink("");
              setNewItemNotes("");
            }}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Item Name</Text>
              <View style={styles.inputWrapper}>
                <AutoCompleteInput
                  placeholder="What do you need to buy?"
                  value={newItemName}
                  onChangeText={handleNameChange}
                  onSelectSuggestion={handleSelectSuggestion}
                  type="shopping"
                  maxSuggestions={8}
                  showSmartSuggestions={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{i18n.t("shopping.storeDepartment")}</Text>
              <StoreDepartmentPicker
                value={newItemStoreDepartment}
                onChange={setNewItemStoreDepartment}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            {/* Image Attachment */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Image</Text>
              {newItemImageUrl || newItemImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: newItemImage || newItemImageUrl }}
                    style={styles.imagePreview}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}
                  >
                    <Icon name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.attachButton}
                  onPress={showImagePickerOptions}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <>
                      <Icon name="add-photo-alternate" size={20} color="#2563EB" />
                      <Text style={styles.attachButtonText}>Attach Image</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Link Attachment */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Link (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                value={newItemLink}
                onChangeText={setNewItemLink}
                placeholderTextColor="#9CA3AF"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Add any additional notes..."
                value={newItemNotes}
                onChangeText={setNewItemNotes}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.addItemButton}
              onPress={handleAddItem}
            >
              <Text style={styles.addItemButtonText}>Add Item</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        visible={showEditDialog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowEditDialog(false);
          setEditingItem(null);
          setNewItemName("");
          setNewItemQuantity("1");
          setNewItemCategory("other");
          setNewItemStoreDepartment("other");
          setNewItemUnit("pcs");
          setNewItemImage(null);
          setNewItemImageUrl("");
          setNewItemLink("");
          setNewItemNotes("");
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            <TouchableOpacity onPress={() => {
              setShowEditDialog(false);
              setEditingItem(null);
              setNewItemName("");
              setNewItemQuantity("1");
              setNewItemCategory("other");
              setNewItemStoreDepartment("other");
              setNewItemUnit("pcs");
              setNewItemImage(null);
              setNewItemImageUrl("");
              setNewItemLink("");
              setNewItemNotes("");
            }}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Item Name</Text>
              <TextInput
                style={styles.input}
                placeholder="What do you need to buy?"
                value={newItemName}
                onChangeText={setNewItemName}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{i18n.t("shopping.storeDepartment")}</Text>
              <StoreDepartmentPicker
                value={newItemStoreDepartment}
                onChange={setNewItemStoreDepartment}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            {/* Image Attachment */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Image</Text>
              {newItemImageUrl || newItemImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: newItemImage || newItemImageUrl }}
                    style={styles.imagePreview}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}
                  >
                    <Icon name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.attachButton}
                  onPress={showImagePickerOptions}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <>
                      <Icon name="add-photo-alternate" size={20} color="#2563EB" />
                      <Text style={styles.attachButtonText}>Attach Image</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Link Attachment */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Link (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                value={newItemLink}
                onChangeText={setNewItemLink}
                placeholderTextColor="#9CA3AF"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Add any additional notes..."
                value={newItemNotes}
                onChangeText={setNewItemNotes}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.addItemButton}
              onPress={handleUpdateItem}
            >
              <Text style={styles.addItemButtonText}>Update Item</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={() => setShowImageModal(false)}
          >
            <Icon name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Image
            source={{ uri: viewingImageUrl }}
            style={styles.imageModalImage}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={200}
          />
        </View>
      </Modal>

      <ShoppingDepartmentOrderModal
        visible={showStoreLayoutModal}
        onClose={() => setShowStoreLayoutModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: SPACING.l,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: SPACING.m,
    gap: SPACING.xs,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconDisabled: {
    opacity: 0.35,
  },
  aisleHint: {
    ...TYPOGRAPHY.caption,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.s,
    paddingBottom: SPACING.s,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
    gap: SPACING.m,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: RADIUS.full,
  },
  progressLabel: {
    ...TYPOGRAPHY.caption,
    minWidth: 36,
    textAlign: "right",
  },
  quickAddBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.l,
    marginBottom: SPACING.s,
    borderRadius: RADIUS.l,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: SPACING.l,
    paddingRight: SPACING.s,
    minHeight: 48,
  },
  quickAddInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: SPACING.m,
  },
  quickAddBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAddBtnDisabled: {
    opacity: 0.45,
  },
  moreDetailsLink: {
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.m,
    marginHorizontal: SPACING.l,
    marginBottom: SPACING.l,
    paddingHorizontal: SPACING.l,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: SPACING.m,
  },
  itemsContainer: {
    paddingBottom: SPACING.xxl,
  },
  purchasedBlock: {
    marginTop: SPACING.l,
  },
  purchasedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
  },
  purchasedTitle: {
    ...TYPOGRAPHY.overline,
  },
  itemsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  purchasedSectionTitle: {
    color: '#9CA3AF',
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
  purchasedCard: {
    opacity: 0.7,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDetails: {
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
  itemDepartment: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  autoAddedText: {
    fontSize: 12,
    color: '#2563EB',
    fontStyle: 'italic',
  },
  itemNotes: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
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
    backgroundColor: '#DBEAFE',
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
    backgroundColor: '#2563EB',
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
  inputWrapper: {
    position: 'relative',
    zIndex: 1000,
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
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addItemButton: {
    backgroundColor: '#2563EB',
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
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  attachButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageThumbnailContainer: {
    position: 'relative',
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    width: 80,
    height: 80,
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 4,
    alignItems: 'center',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    color: '#2563EB',
    marginLeft: 6,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalImage: {
    width: width - 40,
    height: '80%',
  },
});
