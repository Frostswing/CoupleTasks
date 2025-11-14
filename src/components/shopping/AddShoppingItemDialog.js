import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CategorySelector from '../common/CategorySelector';
import UnitSelector from '../common/UnitSelector';
import AutoCompleteInput from '../common/AutoCompleteInput';
import { autoDetectCategory, getDefaultUnitForCategory } from '../../constants/categories';

const AddShoppingItemDialog = ({ open, onOpenChange, onAddItem }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    quantity: '1',
    unit: 'pieces'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNameChange = (name) => {
    const detectedCategory = autoDetectCategory(name);
    const defaultUnit = getDefaultUnitForCategory(detectedCategory);
    
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-update category and unit if they're still default
      category: prev.category === 'other' ? detectedCategory : prev.category,
      unit: prev.unit === 'pieces' ? defaultUnit : prev.unit
    }));
  };

  const handleSelectSuggestion = (suggestion) => {
    // If suggestion has a name property, use it; otherwise it's the typed text
    if (suggestion && suggestion.name) {
      // Auto-fill form with suggestion data
      setFormData(prev => ({
        ...prev,
        name: suggestion.name,
        category: suggestion.category || autoDetectCategory(suggestion.name),
        unit: suggestion.unit || getDefaultUnitForCategory(suggestion.category || autoDetectCategory(suggestion.name)),
        quantity: suggestion.quantity ? suggestion.quantity.toString() : prev.quantity
      }));
    }
    // If no suggestion object, the text was already set by handleNameChange
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('שגיאה', 'אנא הזן שם למוצר');
      return;
    }
    
    setIsLoading(true);
    try {
      await onAddItem({
        ...formData,
        quantity: parseFloat(formData.quantity) || 1,
      });
      
      // Reset form
      setFormData({
        name: '',
        category: 'other',
        quantity: '1',
        unit: 'pieces'
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בהוספת המוצר');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      category: 'other',
      quantity: '1',
      unit: 'pieces'
    });
    onOpenChange(false);
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={() => onOpenChange(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>הוסף לרשימת קניות</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>שם המוצר</Text>
              <View style={styles.inputWrapper}>
                <AutoCompleteInput
                  style={styles.textInput}
                  placeholder="מה צריך לקנות?"
                  value={formData.name}
                  onChangeText={handleNameChange}
                  onSelectSuggestion={handleSelectSuggestion}
                  type="shopping"
                  maxSuggestions={8}
                  showSmartSuggestions={false}
                />
              </View>
            </View>

            <View style={styles.rowGroup}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>כמות</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="1"
                  value={formData.quantity}
                  onChangeText={(value) => handleInputChange('quantity', value)}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.halfWidth}>
                <Text style={styles.label}>יחידת מידה</Text>
                <UnitSelector
                  value={formData.unit}
                  onValueChange={(value) => handleInputChange('unit', value)}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>קטגוריה</Text>
              <CategorySelector
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              />
            </View>
          </ScrollView>


          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>ביטול</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (isLoading || !formData.name.trim()) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={isLoading || !formData.name.trim()}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'מוסיף...' : 'הוסף לרשימה'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    overflow: 'visible', // Allow suggestions dropdown to overflow
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    overflow: 'visible', // Allow suggestions dropdown to overflow
  },
  formGroup: {
    marginBottom: 20,
  },
  inputWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  rowGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
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
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  cancelButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
});

export default AddShoppingItemDialog; 