import React, { useState, useEffect, useCallback } from "react";
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
import Icon from "react-native-vector-icons/MaterialIcons";
import { ShoppingListItem } from "../entities/ShoppingListItem";
import { InventoryItem } from "../entities/InventoryItem";
import { User } from "../entities/User";
import AutoCompleteInput from "../components/common/AutoCompleteInput";
import { autoDetectCategory, getDefaultUnitForCategory } from "../constants/categories";
import { pickImage, uploadImage } from "../services/imageService";

const { width } = Dimensions.get('window');

export default function ShoppingListScreen({ navigation, route }) {
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

  // Load data when component mounts (with loading indicator)
  useEffect(() => {
    loadData(true); // Show loading on initial mount
    checkAutoAddItems();
    
    // Check if we should auto-open add dialog (from home screen shortcut)
    if (route?.params?.openAddDialog) {
      // Small delay to ensure screen is fully loaded
      setTimeout(() => {
        setShowAddDialog(true);
      }, 300);
    }
  }, [route?.params?.openAddDialog]);

  // Refresh data when screen comes into focus (e.g., after returning from shopping mode)
  // Don't show loading indicator on refresh to avoid flashing
  useFocusEffect(
    useCallback(() => {
      console.log('ShoppingListScreen: Screen focused, refreshing data...');
      loadData(false); // Don't show loading on refresh
    }, [loadData])
  );

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const [user, shoppingItems] = await Promise.all([
        User.me(),
        ShoppingListItem.list('-created_date')
      ]);
      
      setCurrentUser(user);
      
      // Filter items for current user and partner
      const userEmails = [user.email];
      if (user.partner_email) userEmails.push(user.partner_email);
      const filteredItems = shoppingItems.filter(item => 
        !item.is_archived &&
        (userEmails.includes(item.created_by) || userEmails.includes(item.added_by))
      );
      
      // Debug: Log items with images
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

  const checkAutoAddItems = async () => {
    try {
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
            added_by: (await User.me()).email
          });
        }
      }
      
      loadData();
    } catch (error) {
      console.error("Error checking auto-add items:", error);
    }
  };

  const handleNameChange = (name) => {
    const detectedCategory = autoDetectCategory(name);
    const defaultUnit = getDefaultUnitForCategory(detectedCategory);
    
    setNewItemName(name);
    // Auto-update category and unit if they're still default
    if (newItemCategory === "other") {
      setNewItemCategory(detectedCategory);
    }
    if (newItemUnit === "pcs") {
      setNewItemUnit(defaultUnit);
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
      setNewItemUnit("pcs");
      setNewItemImage(null);
      setNewItemImageUrl("");
      setNewItemLink("");
      setNewItemNotes("");
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
              await ShoppingListItem.delete(itemId);
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

  const pendingItems = filteredItems.filter(item => !item.is_purchased);
  const purchasedItems = filteredItems.filter(item => item.is_purchased);

  const handleStartShopping = () => {
    const itemIds = pendingItems.map(item => item.id);
    console.log('ShoppingList: Starting shopping with items:', itemIds);
    console.log('ShoppingList: Pending items:', pendingItems.map(i => ({ id: i.id, name: i.name })));
    
    if (itemIds.length > 0) {
      navigation.navigate('ShoppingMode', { itemIds });
    } else {
      Alert.alert('No Items', 'Add items to your shopping list before starting shopping mode.');
    }
  };

  const ShoppingItemCard = ({ item }) => {
    // Debug logging
    if (item.image_url) {
      console.log('Rendering item with image:', item.name, 'URL:', item.image_url);
    }
    
    return (
    <View style={[styles.itemCard, item.is_purchased && styles.purchasedCard]}>
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => handleTogglePurchased(item)}
      >
        <View style={styles.itemLeft}>
          <Icon
            name={item.is_purchased ? 'check-circle' : 'radio-button-unchecked'}
            size={24}
            color={item.is_purchased ? '#16A34A' : '#9CA3AF'}
          />
          <View style={styles.itemDetails}>
            <Text style={[styles.itemName, item.is_purchased && styles.purchasedText]}>
              {item.name}
            </Text>
            <Text style={styles.itemQuantity}>
              {item.quantity} {item.unit || 'pcs'}
            </Text>
            {item.auto_added && (
              <Text style={styles.autoAddedText}>Auto-added from inventory</Text>
            )}
            {/* Display notes */}
            {item.notes && (
              <Text style={styles.itemNotes} numberOfLines={2}>
                {item.notes}
              </Text>
            )}
            {/* Display image thumbnail */}
            {item.image_url && (
              <TouchableOpacity
                onPress={() => handleViewImage(item.image_url)}
                style={styles.imageThumbnailContainer}
              >
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.imageThumbnail}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                  onError={(error) => {
                    console.error('Image load error:', error);
                    console.error('Image URL:', item.image_url);
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', item.image_url);
                  }}
                />
                <View style={styles.imageOverlay}>
                  <Icon name="zoom-in" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}
            {/* Display link */}
            {item.link && (
              <TouchableOpacity
                onPress={() => handleOpenLink(item.link)}
                style={styles.linkContainer}
              >
                <Icon name="link" size={14} color="#14B8A6" />
                <Text style={styles.linkText} numberOfLines={1}>
                  {item.link}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditItem(item)}
        >
          <Icon name="edit" size={20} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Icon name="delete" size={20} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text style={styles.loadingText}>Loading your shopping list...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Shopping List</Text>
            <Text style={styles.subtitle}>What do you need to buy?</Text>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.shopButton, pendingItems.length === 0 && styles.disabledButton]}
              onPress={handleStartShopping}
              disabled={pendingItems.length === 0}
            >
              <Icon name="play-arrow" size={20} color="#FFFFFF" />
              <Text style={styles.shopButtonText}>Shop</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddDialog(true)}
            >
              <Icon name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FED7AA' }]}>
              <Icon name="shopping-cart" size={20} color="#EA580C" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>To Buy</Text>
              <Text style={styles.statValue}>{pendingItems.length}</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#DCFCE7' }]}>
              <Icon name="check" size={20} color="#16A34A" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Purchased</Text>
              <Text style={styles.statValue}>{purchasedItems.length}</Text>
            </View>
          </View>
        </View>

        {/* Shopping Items */}
        <View style={styles.itemsContainer}>
          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>To Buy</Text>
              {pendingItems.map((item) => (
                <ShoppingItemCard key={item.id} item={item} />
              ))}
            </View>
          )}

          {/* Purchased Items */}
          {purchasedItems.length > 0 && (
            <View style={styles.itemsSection}>
              <Text style={[styles.sectionTitle, styles.purchasedSectionTitle]}>Purchased</Text>
              {purchasedItems.map((item) => (
                <ShoppingItemCard key={item.id} item={item} />
              ))}
            </View>
          )}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Icon name="shopping-cart" size={40} color="#14B8A6" />
              </View>
              <Text style={styles.emptyTitle}>No items yet</Text>
              <Text style={styles.emptySubtitle}>Add items to your shopping list to get started</Text>
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
            <Text style={styles.modalTitle}>Add Item</Text>
            <TouchableOpacity onPress={() => {
              setShowAddDialog(false);
              setNewItemName("");
              setNewItemQuantity("1");
              setNewItemCategory("other");
              setNewItemUnit("pcs");
              setNewItemImage(null);
              setNewItemImageUrl("");
              setNewItemLink("");
              setNewItemNotes("");
            }}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name</Text>
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
                    <ActivityIndicator size="small" color="#14B8A6" />
                  ) : (
                    <>
                      <Icon name="add-photo-alternate" size={20} color="#14B8A6" />
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
          setNewItemUnit("pcs");
          setNewItemImage(null);
          setNewItemImageUrl("");
          setNewItemLink("");
          setNewItemNotes("");
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            <TouchableOpacity onPress={() => {
              setShowEditDialog(false);
              setEditingItem(null);
              setNewItemName("");
              setNewItemQuantity("1");
              setNewItemCategory("other");
              setNewItemUnit("pcs");
              setNewItemImage(null);
              setNewItemImageUrl("");
              setNewItemLink("");
              setNewItemNotes("");
            }}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput
                style={styles.input}
                placeholder="What do you need to buy?"
                value={newItemName}
                onChangeText={setNewItemName}
                placeholderTextColor="#9CA3AF"
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
                    <ActivityIndicator size="small" color="#14B8A6" />
                  ) : (
                    <>
                      <Icon name="add-photo-alternate" size={20} color="#14B8A6" />
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
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
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  autoAddedText: {
    fontSize: 12,
    color: '#14B8A6',
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
    backgroundColor: '#E6FFFA',
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
    backgroundColor: '#14B8A6',
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
    backgroundColor: '#14B8A6',
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
    color: '#14B8A6',
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
    backgroundColor: '#E6FFFA',
    borderRadius: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    color: '#14B8A6',
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
