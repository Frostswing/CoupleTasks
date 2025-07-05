import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CATEGORIES, getCategoryById } from '../../constants/categories';

const CategorySelector = ({ value, onValueChange, placeholder = 'בחר קטגוריה' }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const selectedCategory = getCategoryById(value);

  const handleSelect = (categoryId) => {
    onValueChange(categoryId);
    setIsVisible(false);
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        item.id === value && styles.selectedCategory
      ]}
      onPress={() => handleSelect(item.id)}
    >
      <View style={styles.categoryContent}>
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <Icon name={item.icon} size={24} color={item.color} />
        </View>
        <Text style={[
          styles.categoryText,
          item.id === value && styles.selectedCategoryText
        ]}>
          {item.name}
        </Text>
      </View>
      {item.id === value && (
        <Icon name="check" size={20} color="#8B5CF6" />
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsVisible(true)}
      >
        <View style={styles.selectorContent}>
          {selectedCategory ? (
            <View style={styles.selectedContent}>
              <View style={[
                styles.selectedIcon,
                { backgroundColor: selectedCategory.color + '20' }
              ]}>
                <Icon name={selectedCategory.icon} size={20} color={selectedCategory.color} />
              </View>
              <Text style={styles.selectedText}>{selectedCategory.name}</Text>
            </View>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
          <Icon name="keyboard-arrow-down" size={24} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>בחר קטגוריה</Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={CATEGORIES}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              style={styles.categoriesList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selector: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 56,
    justifyContent: 'center',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  placeholder: {
    fontSize: 16,
    color: '#9CA3AF',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  selectedCategory: {
    backgroundColor: '#F3F4F6',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectedCategoryText: {
    fontWeight: '600',
    color: '#8B5CF6',
  },
});

export default CategorySelector; 