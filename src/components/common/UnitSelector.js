import React, {  useState , useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { UNITS, getUnitById } from '../../constants/categories';
import { COLORS, SHADOWS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

const UnitSelector = ({ value, onValueChange, placeholder = 'בחר יחידה' }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isVisible, setIsVisible] = useState(false);
  
  const selectedUnit = getUnitById(value);

  const handleSelect = (unitId) => {
    onValueChange(unitId);
    setIsVisible(false);
  };

  const renderUnit = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.unitItem,
        item.id === value && styles.selectedUnit
      ]}
      onPress={() => handleSelect(item.id)}
    >
      <View style={styles.unitContent}>
        <Text style={[
          styles.unitText,
          item.id === value && styles.selectedUnitText
        ]}>
          {item.name}
        </Text>
        <Text style={styles.shortName}>({item.shortName})</Text>
      </View>
      {item.id === value && (
        <Icon name="check" size={20} color={colors.primary} />
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
          {selectedUnit ? (
            <View style={styles.selectedContent}>
              <Text style={styles.selectedText}>{selectedUnit.name}</Text>
              <Text style={styles.selectedShort}>({selectedUnit.shortName})</Text>
            </View>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
          <Icon name="keyboard-arrow-down" size={24} color={colors.textTertiary} />
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
              <Text style={styles.modalTitle}>בחר יחידת מידה</Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={UNITS}
              renderItem={renderUnit}
              keyExtractor={(item) => item.id}
              style={styles.unitsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

function createStyles(colors) {
  return StyleSheet.create({
  selector: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
  selectedText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  selectedShort: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  placeholder: {
    fontSize: 16,
    color: colors.textTertiary,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  unitsList: {
    paddingHorizontal: 16,
  },
  unitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  selectedUnit: {
    backgroundColor: colors.borderLight,
  },
  unitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unitText: {
    fontSize: 16,
    color: colors.text,
  },
  selectedUnitText: {
    fontWeight: '600',
    color: colors.primary,
  },
  shortName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
  },
});
}

export default UnitSelector; 