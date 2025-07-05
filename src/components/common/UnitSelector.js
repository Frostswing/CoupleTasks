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
import { UNITS, getUnitById } from '../../constants/categories';

const UnitSelector = ({ value, onValueChange, placeholder = 'בחר יחידה' }) => {
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
          {selectedUnit ? (
            <View style={styles.selectedContent}>
              <Text style={styles.selectedText}>{selectedUnit.name}</Text>
              <Text style={styles.selectedShort}>({selectedUnit.shortName})</Text>
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
              <Text style={styles.modalTitle}>בחר יחידת מידה</Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
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
  selectedText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  selectedShort: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
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
    backgroundColor: '#F3F4F6',
  },
  unitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unitText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectedUnitText: {
    fontWeight: '600',
    color: '#8B5CF6',
  },
  shortName: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
});

export default UnitSelector; 