import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Keyboard,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { getShoppingSuggestions, getTaskSuggestions, getSmartSuggestions } from '../../services/historyService';
import { getCurrentUser, getUserProfile } from '../../services/userService';
import { ShoppingListItem } from '../../entities/ShoppingListItem';
import { COLORS, SHADOWS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import { buildHouseholdEmailSet, shoppingItemBelongsToHousehold } from '../../utils/taskFilters';

const AutoCompleteInput = ({ 
  value, 
  onChangeText, 
  onSelectSuggestion,
  placeholder = 'התחל לכתוב...',
  type = 'shopping', // 'shopping' or 'tasks'
  style,
  inputStyle,
  maxSuggestions = 8,
  showSmartSuggestions = true,
  ...props 
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [suggestions, setSuggestions] = useState([]);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [archivedItems, setArchivedItems] = useState([]); // Cache of all archived items
  const [archivedItemsLoaded, setArchivedItemsLoaded] = useState(false);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  // Load archived items once on mount (for shopping type only)
  useEffect(() => {
    if (type === 'shopping' && !archivedItemsLoaded) {
      loadArchivedItems();
    }
  }, [type, archivedItemsLoaded]);

  // Load smart suggestions on mount
  useEffect(() => {
    if (showSmartSuggestions && !value.trim()) {
      loadSmartSuggestions();
    }
  }, [showSmartSuggestions, type]);

  // Filter archived items client-side when text changes (instant, no debounce)
  useEffect(() => {
    if (value.trim().length >= 1) {
      setShowSuggestions(true);
      setIsLoading(false); // No loading needed for client-side filtering
    } else {
      // Field is empty - clear everything and hide loading
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      if (showSmartSuggestions) {
        loadSmartSuggestions();
      }
    }
  }, [value, type]);

  // Load archived items once (similar to ArchiveScreen)
  const loadArchivedItems = async () => {
    try {
      const authUser = getCurrentUser();
      if (!authUser) return;
      const profileResult = await getUserProfile(authUser.uid);
      const profile = profileResult.success ? profileResult.profile : {};

      const emailSet = buildHouseholdEmailSet(authUser.email, profile.partner_email);

      const allArchivedItems = await ShoppingListItem.filter({ is_archived: true }, '-purchased_date');
      const relevantProducts = allArchivedItems.filter((item) =>
        shoppingItemBelongsToHousehold(item, emailSet, { userUids: [authUser.uid] })
      );
      
      // Use a Map to avoid duplicates (group by product name, case-insensitive)
      // Keep the most recent purchase for each product
      const productsMap = new Map();
      
      relevantProducts.forEach(product => {
        const productKey = product.name.toLowerCase().trim();
        const existingProduct = productsMap.get(productKey);
        
        if (!existingProduct) {
          productsMap.set(productKey, product);
        } else {
          // Keep the one with the most recent purchase date
          const existingDate = existingProduct.purchased_date 
            ? new Date(existingProduct.purchased_date).getTime() 
            : 0;
          const currentDate = product.purchased_date 
            ? new Date(product.purchased_date).getTime() 
            : 0;
          
          if (currentDate > existingDate) {
            productsMap.set(productKey, product);
          }
        }
      });
      
      // Convert to array and format for suggestions
      const formattedItems = Array.from(productsMap.values()).map(item => ({
        id: item.id,
        name: item.name.trim(),
        category: item.category || 'other',
        unit: item.unit || 'pieces',
        quantity: item.quantity || 1,
        notes: item.notes || '',
        image_url: item.image_url || '',
        isFromArchive: true
      }));
      
      setArchivedItems(formattedItems);
      setArchivedItemsLoaded(true);
      console.log(`📦 Loaded ${formattedItems.length} archived items for autocomplete`);
    } catch (error) {
      console.error('Error loading archived items:', error);
      setArchivedItemsLoaded(true); // Mark as loaded even on error to prevent retries
    }
  };

  // Filter archived items client-side (instant, no API calls)
  const filteredArchivedItems = useMemo(() => {
    if (!value.trim() || archivedItems.length === 0) return [];
    
    const searchTerm = value.toLowerCase().trim();
    const filtered = archivedItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm)
    );
    
    // Sort: items starting with search term first, then alphabetically
    return filtered.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(searchTerm);
      const bStarts = b.name.toLowerCase().startsWith(searchTerm);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    }).slice(0, maxSuggestions);
  }, [value, archivedItems, maxSuggestions]);

  // Update suggestions when filtered archived items change
  useEffect(() => {
    if (type === 'shopping' && value.trim().length > 0) {
      setSuggestions(filteredArchivedItems);
    }
  }, [filteredArchivedItems, type, value]);

  const loadSmartSuggestions = async () => {
    try {
      const smart = await getSmartSuggestions({ type });
      setSmartSuggestions(smart);
    } catch (error) {
      console.error('Error loading smart suggestions:', error);
      setSmartSuggestions([]);
    }
  };

  const handleTextChange = (text) => {
    onChangeText(text);
    // Only show suggestions when there's text - don't show when empty
    setShowSuggestions(text.trim().length > 0);
  };

  const handleSelectSuggestion = (suggestion) => {
    console.log('🎯 AutoComplete: Suggestion clicked:', suggestion);
    const selectedText = type === 'tasks' ? suggestion.title : suggestion.name;
    
    onChangeText(selectedText);
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (onSelectSuggestion) {
      console.log('📤 AutoComplete: Calling parent onSelectSuggestion');
      onSelectSuggestion(suggestion);
    } else {
      console.warn('⚠️ AutoComplete: No onSelectSuggestion handler provided');
    }
    
    // Close keyboard
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleFocus = () => {
    // Only show suggestions dropdown when focused if there's text
    // Don't show suggestions when field is empty to avoid hiding other form fields
    if (value.trim().length > 0) {
      setShowSuggestions(true);
    }
    // Don't show smart suggestions on focus - only show when user starts typing
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  const handleAddTypedText = () => {
    // Fill the form with the exact text they typed
    // The text is already in the input, so we just need to close suggestions
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Close keyboard
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const renderSuggestion = ({ item, index }) => {
    const isSmartSuggestion = item.isSmartSuggestion;
    const displayText = type === 'tasks' ? item.title : item.name;
    const frequency = item.frequency || 0;
    const isFromArchive = item.isFromArchive;
    
    return (
      <TouchableOpacity
        style={[
          styles.suggestionItem,
          isSmartSuggestion && styles.smartSuggestionItem,
          isFromArchive && styles.archiveSuggestionItem,
          index === 0 && styles.firstSuggestion,
        ]}
        onPress={() => {
          handleSelectSuggestion(item);
          setShowSuggestions(false);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionContent}>
          <View style={styles.suggestionIcon}>
            {isSmartSuggestion ? (
              <Icon name="auto-awesome" size={16} color={colors.primary} />
            ) : isFromArchive ? (
              <Icon name="archive" size={16} color={colors.primary} />
            ) : frequency > 0 ? (
              <Icon name="history" size={16} color={colors.textSecondary} />
            ) : (
              <Icon name="search" size={16} color={colors.textTertiary} />
            )}
          </View>
          
          <View style={styles.suggestionTextContainer}>
            <Text style={[
              styles.suggestionText,
              isSmartSuggestion && styles.smartSuggestionText,
              isFromArchive && styles.archiveSuggestionText
            ]}>
              {displayText}
            </Text>
            
            {frequency > 0 && (
              <Text style={styles.frequencyText}>
                נוסף {frequency} פעמים
              </Text>
            )}
            
            {isFromArchive && (
              <Text style={styles.archiveLabel}>מהארכיון</Text>
            )}
            
            {isSmartSuggestion && (
              <Text style={styles.smartLabel}>הצעה חכמה</Text>
            )}
          </View>
        </View>
        
        <Icon name="arrow-upward" size={16} color={colors.textTertiary} style={styles.insertIcon} />
      </TouchableOpacity>
    );
  };

  const displaySuggestions = value.trim().length > 0 
    ? suggestions 
    : smartSuggestions;
  
  // Always show "Add '[text]'" option at the top when there's text (like Google search)
  const showAddTypedOption = value.trim().length > 0;
  
  // Debug logging
  console.log('🔍 AutoComplete Render:', {
    showSuggestions,
    showAddTypedOption,
    value: value.trim(),
    suggestionsCount: displaySuggestions.length,
    suggestionsArray: suggestions,
    isLoading
  });

  return (
    <View style={[styles.container, style]}>
      <TextInput
        ref={inputRef}
        style={[styles.textInput, inputStyle]}
        value={value}
        onChangeText={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        {...props}
      />
      
      {/* Only show loading indicator when there's text being searched */}
      {isLoading && value.trim().length > 0 && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>מחפש...</Text>
        </View>
      )}

      {/* Suggestions dropdown - absolute positioned to render above ScrollView */}
      {/* Only show when there's text typed (value.trim().length > 0) */}
      {showSuggestions && showAddTypedOption && value.trim().length > 0 && (
        <View style={styles.suggestionsContainer}>
          {/* "Add '[text]'" option at the top - always shown when typing */}
          <TouchableOpacity
            style={[styles.suggestionItem, styles.addTypedOption, styles.firstSuggestion]}
            onPress={() => {
              handleAddTypedText();
              setShowSuggestions(false);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.suggestionContent}>
              <View style={[styles.suggestionIcon, { backgroundColor: colors.primaryMuted }]}>
                <Icon name="add-circle" size={16} color={colors.primaryLight} />
              </View>
              <View style={styles.suggestionTextContainer}>
                <Text style={[styles.suggestionText, { color: colors.primaryLight, fontWeight: '600' }]}>
                  Add '{value.trim()}'
                </Text>
                <Text style={styles.frequencyText}>Add new item</Text>
              </View>
            </View>
            <Icon name="arrow-upward" size={16} color={colors.primaryLight} style={styles.insertIcon} />
          </TouchableOpacity>
          
          {/* Search results from archive and history */}
          {displaySuggestions.length > 0 && (
            <View style={styles.suggestionsList}>
              {displaySuggestions.map((item, index) => (
                <View key={item.id || item.name || index}>
                  {renderSuggestion({ item, index })}
                </View>
              ))}
            </View>
          )}
          
          {/* Show message if no results found */}
          {displaySuggestions.length === 0 && value.trim().length > 0 && !isLoading && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No matching products found</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Don't show smart suggestions when input is empty - this was causing the dropdown to show */}
      {/* Smart suggestions removed to prevent dropdown from showing when field is empty */}
    </View>
  );
};

function createStyles(colors) {
  return StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 56,
  },
  loadingContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1001,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 9999,
    maxHeight: 400,
    overflow: 'hidden',
  },
  suggestionsList: {
    paddingVertical: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  firstSuggestion: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  smartSuggestionItem: {
    backgroundColor: colors.primaryMuted,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  smartSuggestionText: {
    color: colors.primary,
  },
  archiveSuggestionItem: {
    backgroundColor: colors.primaryMuted,
  },
  archiveSuggestionText: {
    color: colors.primary,
  },
  addTypedOption: {
    backgroundColor: colors.primaryMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryMuted,
  },
  frequencyText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  archiveLabel: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  smartLabel: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  insertIcon: {
    transform: [{ rotate: '45deg' }],
    marginLeft: 8,
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
});
}

export default AutoCompleteInput; 