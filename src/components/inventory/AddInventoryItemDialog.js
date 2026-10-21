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
import { COLORS, SHADOWS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

const AddInventoryItemDialog = ({ open, onOpenChange, onAddItem }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    current_amount: '0',
    minimum_amount: '1',
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
    // For inventory, we might get shopping suggestions, so adapt them
    setFormData(prev => ({
      ...prev,
      name: suggestion.name,
      category: suggestion.category || autoDetectCategory(suggestion.name),
      unit: suggestion.unit || getDefaultUnitForCategory(suggestion.category || autoDetectCategory(suggestion.name))
    }));
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
        current_amount: parseFloat(formData.current_amount) || 0,
        minimum_amount: parseFloat(formData.minimum_amount) || 1,
      });
      
      // Reset form
      setFormData({
        name: '',
        category: 'other',
        current_amount: '0',
        minimum_amount: '1',
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
      current_amount: '0',
      minimum_amount: '1',
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
            <Text style={styles.title}>הוסף למלאי</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>שם המוצר</Text>
              <AutoCompleteInput
                style={styles.textInput}
                placeholder="איזה מוצר יש לך?"
                value={formData.name}
                onChangeText={handleNameChange}
                onSelectSuggestion={handleSelectSuggestion}
                type="shopping"
                maxSuggestions={6}
                showSmartSuggestions={true}
              />
            </View>

            <View style={styles.rowGroup}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>כמות נוכחית</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  value={formData.current_amount}
                  onChangeText={(value) => handleInputChange('current_amount', value)}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              
              <View style={styles.halfWidth}>
                <Text style={styles.label}>כמות מינימלית</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="1"
                  value={formData.minimum_amount}
                  onChangeText={(value) => handleInputChange('minimum_amount', value)}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.rowGroup}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>יחידת מידה</Text>
                <UnitSelector
                  value={formData.unit}
                  onValueChange={(value) => handleInputChange('unit', value)}
                />
              </View>
              
              <View style={styles.halfWidth}>
                <Text style={styles.label}>קטגוריה</Text>
                <CategorySelector
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                />
              </View>
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
                {isLoading ? 'מוסיף...' : 'הוסף למלאי'}
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
    maxHeight: '90%',
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
  },
  formGroup: {
    marginBottom: 20,
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
    backgroundColor: colors.success,
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

export default AddInventoryItemDialog; 