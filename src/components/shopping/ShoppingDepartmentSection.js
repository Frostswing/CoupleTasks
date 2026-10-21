import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import i18n from "../../localization/i18n";
import { getStoreDepartmentById } from "../../constants/storeDepartments";
import ShoppingListItemRow from "./ShoppingListItemRow";
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from "../../constants/theme";

export default function ShoppingDepartmentSection({
  departmentId,
  items,
  colors,
  collapsed,
  onToggleCollapsed,
  onTogglePurchased,
  onEdit,
  onDelete,
}) {
  const dept = getStoreDepartmentById(departmentId);
  const title = i18n.t(`shopping.storeDepartments.${departmentId}`);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.header}
        onPress={onToggleCollapsed}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
            <Icon name={dept?.icon || "category"} size={16} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>{title}</Text>
          <View style={[styles.countPill, { backgroundColor: colors.borderLight }]}>
            <Text style={[styles.countText, { color: colors.textSecondary }]}>{items.length}</Text>
          </View>
        </View>
        <Icon
          name={collapsed ? "expand-more" : "expand-less"}
          size={22}
          color={colors.textTertiary}
        />
      </TouchableOpacity>

      {!collapsed && (
        <View
          style={[
            styles.card,
            SHADOWS.xs,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {items.map((item, index) => (
            <ShoppingListItemRow
              key={item.id}
              item={item}
              colors={colors}
              onTogglePurchased={onTogglePurchased}
              onEdit={onEdit}
              onDelete={onDelete}
              isLastInGroup={index === items.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SPACING.l,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.s,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
    flex: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...TYPOGRAPHY.overline,
    flex: 1,
  },
  countPill: {
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    minWidth: 24,
    alignItems: "center",
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    marginHorizontal: SPACING.l,
    borderRadius: RADIUS.l,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
