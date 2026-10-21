import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Alert,
  I18nManager,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { formatQuantity } from "../../utils/formatQuantity";
import i18n from "../../localization/i18n";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import PartnerAvatar from "../premium/PartnerAvatar";
import { usePartnerMode } from "../../context/HouseholdPartnerContext";

export default function ShoppingListItemRow({
  item,
  colors,
  onTogglePurchased,
  onEdit,
  onDelete,
  isLastInGroup,
  disableSwipe,
}) {
  const { isPartnered } = usePartnerMode();
  const scale = useRef(new Animated.Value(1)).current;
  const locale = i18n.locale;

  useEffect(() => {
    if (item.is_purchased) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    }
  }, [item.is_purchased, scale]);

  const confirmDelete = () => {
    Alert.alert(
      i18n.t("shopping.deleteItemTitle"),
      i18n.t("shopping.deleteItemMessage"),
      [
        { text: i18n.t("common.cancel"), style: "cancel" },
        {
          text: i18n.t("common.delete"),
          style: "destructive",
          onPress: () => onDelete(item.id),
        },
      ]
    );
  };

  const renderDeleteAction = () => (
    <TouchableOpacity
      style={[styles.deleteAction, { backgroundColor: colors.error }]}
      onPress={confirmDelete}
      accessibilityRole="button"
      accessibilityLabel={i18n.t("common.delete")}
    >
      <Icon name="delete-outline" size={22} color={COLORS.textInverse} />
    </TouchableOpacity>
  );

  const row = (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => onEdit(item)}
        onLongPress={confirmDelete}
        style={({ pressed }) => [
          styles.row,
          !isLastInGroup && styles.rowDivider,
          { borderBottomColor: colors.borderLight },
          pressed && { backgroundColor: colors.borderLight },
        ]}
        accessibilityRole="button"
      >
        <TouchableOpacity
          style={styles.checkHit}
          onPress={() => onTogglePurchased(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.is_purchased }}
        >
          <View
            style={[
              styles.checkOuter,
              { borderColor: item.is_purchased ? colors.primary : colors.border },
              item.is_purchased && { backgroundColor: colors.primary },
            ]}
          >
            {item.is_purchased ? (
              <Icon name="check" size={18} color={COLORS.textInverse} />
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.body}>
          <Text
            style={[
              styles.name,
              { color: colors.text },
              item.is_purchased && styles.nameDone,
              item.is_purchased && { color: colors.textTertiary },
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.qtyPill, { backgroundColor: colors.primaryMuted }]}>
              <Text style={[styles.qtyText, { color: colors.primary }]}>
                {formatQuantity(item.quantity, item.unit, locale)}
              </Text>
            </View>
            {item.auto_added ? (
              <Text style={[styles.meta, { color: colors.textTertiary }]}>
                {i18n.t("shopping.autoAdded")}
              </Text>
            ) : null}
          </View>
        </View>

        {isPartnered && item.added_by ? (
          <PartnerAvatar email={item.added_by} size={30} variant="partner" />
        ) : null}

        <Icon
          name={I18nManager.isRTL ? "chevron-left" : "chevron-right"}
          size={20}
          color={colors.textTertiary}
        />
      </Pressable>
    </Animated.View>
  );

  if (disableSwipe) {
    return row;
  }

  return (
    <Swipeable
      renderRightActions={I18nManager.isRTL ? undefined : renderDeleteAction}
      renderLeftActions={I18nManager.isRTL ? renderDeleteAction : undefined}
      overshootRight={false}
      friction={2}
    >
      {row}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    minHeight: 52,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkHit: {
    marginRight: SPACING.m,
  },
  checkOuter: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingRight: SPACING.s,
  },
  name: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    fontSize: 16,
  },
  nameDone: {
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
    marginTop: SPACING.xs,
    flexWrap: "wrap",
  },
  qtyPill: {
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  qtyText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
  },
  meta: {
    ...TYPOGRAPHY.caption,
  },
  deleteAction: {
    width: 72,
    justifyContent: "center",
    alignItems: "center",
  },
});
