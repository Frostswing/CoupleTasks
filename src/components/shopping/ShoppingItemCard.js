import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { getCategoryById, getUnitById } from '../../constants/categories';
import { COLORS, SHADOWS } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

const ShoppingItemCard = ({ item, onTogglePurchased, onDelete }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const category = getCategoryById(item.category);
  const unit = getUnitById(item.unit);

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
            <Icon name="check" size={16} color={COLORS.textInverse} />
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
          <View style={[styles.placeholderImage, { backgroundColor: colors.primaryMuted }]}>
            <Icon name={category.icon} size={20} color={colors.primary} />
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
                backgroundColor: colors.primaryMuted,
                borderColor: colors.border,
              }
            ]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>
                {category.name}
              </Text>
            </View>
            
            {item.auto_added && (
              <View style={styles.autoBadge}>
                <Icon name="inventory" size={12} color={colors.primaryLight} />
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
        <Icon name="delete" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
};

function createStyles(colors) {
  return StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.xs,
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
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkedCheckbox: {
    backgroundColor: colors.success,
    borderColor: colors.success,
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
    backgroundColor: colors.borderLight,
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
    color: colors.text,
    marginBottom: 4,
  },
  purchasedItemName: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  quantityText: {
    fontSize: 14,
    color: colors.textSecondary,
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
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  autoText: {
    fontSize: 11,
    color: colors.primaryLight,
    marginLeft: 2,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
}

export default ShoppingItemCard;
