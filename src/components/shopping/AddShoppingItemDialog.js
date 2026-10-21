import React, {  useState , useMemo } from 'react';
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
import { MaterialIcons as Icon } from '@expo/vector-icons';
import CategorySelector from '../common/CategorySelector';
import UnitSelector from '../common/UnitSelector';
import AutoCompleteInput from '../common/AutoCompleteInput';
import { autoDetectCategory, getDefaultUnitForCategory } from '../../constants/categories';
import i18n from '../../localization/i18n';
import { COLORS, SHADOWS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

const AddShoppingItemDialog = ({ open, onOpenChange, onAddItem }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    quantity: '1',
    unit: 'pieces',
    notes: '',
    image_url: ''
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
    console.log('🔍 Suggestion selected:', suggestion);
    // If suggestion has a name property, use it; otherwise it's the typed text
    if (suggestion && suggestion.name) {
      // Auto-fill form with suggestion data
      setFormData(prev => {
        const newFormData = {
          ...prev,
          name: suggestion.name,
          category: suggestion.category || autoDetectCategory(suggestion.name),
          unit: suggestion.unit || getDefaultUnitForCategory(suggestion.category || autoDetectCategory(suggestion.name)),
          quantity: suggestion.quantity ? suggestion.quantity.toString() : prev.quantity,
          notes: suggestion.notes || '',
          image_url: suggestion.image_url || ''
        };
        console.log('📝 Setting form data:', newFormData);
        return newFormData;
      });
    }
    // If no suggestion object, the text was already set by handleNameChange
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert(i18n.t('common.error'), i18n.t('shopping.pleaseEnterItemName'));
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
        unit: 'pieces',
        notes: '',
        image_url: ''
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('shopping.errorAddingItem'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      category: 'other',
      quantity: '1',
      unit: 'pieces',
      notes: '',
      image_url: ''
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
            <Text style={styles.title}>{i18n.t('shopping.addToShoppingList')}</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>{i18n.t('shopping.itemName')}</Text>
              <View style={styles.inputWrapper}>
                <AutoCompleteInput
                  style={styles.textInput}
                  placeholder={i18n.t('shopping.whatToBuy')}
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
                <Text style={styles.label}>{i18n.t('shopping.quantity')}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="1"
                  value={formData.quantity}
                  onChangeText={(value) => handleInputChange('quantity', value)}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              
              <View style={styles.halfWidth}>
                <Text style={styles.label}>{i18n.t('shopping.unit')}</Text>
                <UnitSelector
                  value={formData.unit}
                  onValueChange={(value) => handleInputChange('unit', value)}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{i18n.t('shopping.category')}</Text>
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
              <Text style={styles.cancelButtonText}>{i18n.t('common.cancel')}</Text>
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
                {isLoading ? i18n.t('shopping.adding') : i18n.t('shopping.addToList')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

function createStyles(colors) {
  return StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
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
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
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
    color: colors.text,
    marginBottom: 8,
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
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textInverse,
  },
  disabledButton: {
    backgroundColor: colors.textTertiary,
  },
});
}

export default AddShoppingItemDialog; 