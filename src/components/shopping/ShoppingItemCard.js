import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getCategoryById, getUnitById } from '../../constants/categories';

const categoryColors = {
  produce: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' },
  dairy: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  meat: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
  grains: { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  snacks: { bg: '#E6FFFA', text: '#0D9488', border: '#B2F5EA' },
  beverages: { bg: '#CFFAFE', text: '#0891B2', border: '#A5F3FC' },
  frozen: { bg: '#E6FFFA', text: '#0D9488', border: '#B2F5EA' },
  household: { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
  personal_care: { bg: '#FCE7F3', text: '#BE185D', border: '#F9A8D4' },
  baby: { bg: '#FEFCE8', text: '#CA8A04', border: '#FEF08A' },
  pharmacy: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  other: { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' }
};

const ShoppingItemCard = ({ item, onTogglePurchased, onDelete }) => {
  const category = getCategoryById(item.category);
  const unit = getUnitById(item.unit);
  const colors = categoryColors[item.category] || categoryColors.other;

  return (
    <View style={[
      styles.container,
      item.is_purchased && styles.purchasedContainer
    ]}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => onTogglePurchased(item)}
      >
        <View style={[
          styles.checkbox,
          item.is_purchased && styles.checkedCheckbox
        ]}>
          {item.is_purchased && (
            <Icon name="check" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        {item.icon_url ? (
          <Image 
            source={{ uri: item.icon_url }}
            style={styles.itemImage}
          />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: category.color + '40' }]}>
            <Icon name={category.icon} size={20} color={category.color} />
          </View>
        )}

        <View style={styles.itemInfo}>
          <Text style={[
            styles.itemName,
            item.is_purchased && styles.purchasedItemName
          ]}>
            {item.name}
          </Text>
          
          <View style={styles.itemDetails}>
            <Text style={styles.quantityText}>
              {item.quantity} {unit.shortName}
            </Text>
            
            <View style={[
              styles.categoryBadge,
              { 
                backgroundColor: colors.bg,
                borderColor: colors.border
              }
            ]}>
              <Text style={[styles.categoryText, { color: colors.text }]}>
                {category.name}
              </Text>
            </View>
            
            {item.auto_added && (
              <View style={styles.autoBadge}>
                <Icon name="inventory" size={12} color="#3B82F6" />
                <Text style={styles.autoText}>אוטומטי</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}
      >
        <Icon name="delete" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  purchasedContainer: {
    opacity: 0.6,
  },
  checkboxContainer: {
    marginRight: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkedCheckbox: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  purchasedItemName: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  quantityText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  autoText: {
    fontSize: 11,
    color: '#3B82F6',
    marginLeft: 2,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default ShoppingItemCard; 