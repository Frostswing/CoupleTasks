import React, { useState, useEffect, useRef } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getShoppingSuggestions, getTaskSuggestions, getSmartSuggestions } from '../../services/historyService';

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
  const [suggestions, setSuggestions] = useState([]);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  // Load smart suggestions on mount
  useEffect(() => {
    if (showSmartSuggestions && !value.trim()) {
      loadSmartSuggestions();
    }
  }, [showSmartSuggestions, type]);

  // Load suggestions when text changes
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (value.trim().length >= 1) {
      setIsLoading(true);
      timeoutRef.current = setTimeout(async () => {
        await loadSuggestions(value.trim());
        setIsLoading(false);
      }, 300);
    } else {
      setSuggestions([]);
      if (showSmartSuggestions) {
        loadSmartSuggestions();
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, type]);

  const loadSuggestions = async (searchText) => {
    try {
      let results = [];
      
      if (type === 'shopping') {
        results = await getShoppingSuggestions(searchText, maxSuggestions);
      } else if (type === 'tasks') {
        results = await getTaskSuggestions(searchText, maxSuggestions);
      }
      
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions([]);
    }
  };

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
    setShowSuggestions(text.trim().length > 0 || showSmartSuggestions);
  };

  const handleSelectSuggestion = (suggestion) => {
    const selectedText = type === 'tasks' ? suggestion.title : suggestion.name;
    
    onChangeText(selectedText);
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    }
    
    // Close keyboard
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleFocus = () => {
    if (value.trim().length > 0 || (showSmartSuggestions && smartSuggestions.length > 0)) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  const renderSuggestion = ({ item, index }) => {
    const isSmartSuggestion = item.isSmartSuggestion;
    const displayText = type === 'tasks' ? item.title : item.name;
    const frequency = item.frequency || 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.suggestionItem,
          isSmartSuggestion && styles.smartSuggestionItem,
          index === 0 && styles.firstSuggestion,
        ]}
        onPress={() => handleSelectSuggestion(item)}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionContent}>
          <View style={styles.suggestionIcon}>
            {isSmartSuggestion ? (
              <Icon name="auto-awesome" size={16} color="#8B5CF6" />
            ) : frequency > 0 ? (
              <Icon name="history" size={16} color="#6B7280" />
            ) : (
              <Icon name="search" size={16} color="#9CA3AF" />
            )}
          </View>
          
          <View style={styles.suggestionTextContainer}>
            <Text style={[
              styles.suggestionText,
              isSmartSuggestion && styles.smartSuggestionText
            ]}>
              {displayText}
            </Text>
            
            {frequency > 0 && (
              <Text style={styles.frequencyText}>
                נוסף {frequency} פעמים
              </Text>
            )}
            
            {isSmartSuggestion && (
              <Text style={styles.smartLabel}>הצעה חכמה</Text>
            )}
          </View>
        </View>
        
        <Icon name="arrow-upward" size={16} color="#9CA3AF" style={styles.insertIcon} />
      </TouchableOpacity>
    );
  };

  const displaySuggestions = value.trim().length > 0 
    ? suggestions 
    : smartSuggestions;

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
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>מחפש...</Text>
        </View>
      )}

      {showSuggestions && displaySuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={displaySuggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `${item.id || index}`}
            style={styles.suggestionsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 56,
  },
  loadingContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1001,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1001,
    maxHeight: 300,
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
    borderBottomColor: '#F3F4F6',
  },
  firstSuggestion: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  smartSuggestionItem: {
    backgroundColor: '#F8FAFF',
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  smartSuggestionText: {
    color: '#8B5CF6',
  },
  frequencyText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  smartLabel: {
    fontSize: 11,
    color: '#8B5CF6',
    marginTop: 2,
    fontWeight: '600',
  },
  insertIcon: {
    transform: [{ rotate: '45deg' }],
    marginLeft: 8,
  },
});

export default AutoCompleteInput; 