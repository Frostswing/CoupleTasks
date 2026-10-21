import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import i18n from "../../localization/i18n";
import { getStoreDepartmentById } from "../../constants/storeDepartments";
import {
  getShoppingDepartmentOrder,
  saveShoppingDepartmentOrder,
} from "../../services/shoppingDepartmentOrderService";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from "../../constants/theme";

export default function ShoppingDepartmentOrderModal({ visible, onClose }) {
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getShoppingDepartmentOrder()
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [visible]);

  const move = (index, direction) => {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveShoppingDepartmentOrder(order);
      onClose(true);
    } catch (error) {
      console.error("saveShoppingDepartmentOrder:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{i18n.t("shopping.storeLayoutTitle")}</Text>
          <TouchableOpacity onPress={() => onClose(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>{i18n.t("shopping.storeLayoutSubtitle")}</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primary} />
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {order.map((deptId, index) => {
              const dept = getStoreDepartmentById(deptId);
              return (
                <View key={deptId} style={styles.row}>
                  <MaterialIcons name={dept.icon} size={22} color={COLORS.primary} />
                  <Text style={styles.rowLabel}>{i18n.t(`shopping.storeDepartments.${deptId}`)}</Text>
                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      onPress={() => move(index, -1)}
                      disabled={index === 0}
                      style={[styles.iconBtn, index === 0 && styles.iconBtnDisabled]}
                    >
                      <MaterialIcons name="arrow-upward" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => move(index, 1)}
                      disabled={index === order.length - 1}
                      style={[styles.iconBtn, index === order.length - 1 && styles.iconBtnDisabled]}
                    >
                      <MaterialIcons name="arrow-downward" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving || loading}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.textInverse} />
          ) : (
            <Text style={styles.saveBtnText}>{i18n.t("common.save")}</Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.l,
  },
  title: {
    ...TYPOGRAPHY.h2,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.s,
    marginBottom: SPACING.l,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.s,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.l,
    ...SHADOWS.xs,
    gap: SPACING.m,
  },
  rowLabel: {
    ...TYPOGRAPHY.body,
    flex: 1,
  },
  rowActions: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  iconBtn: {
    padding: SPACING.s,
    borderRadius: RADIUS.s,
    backgroundColor: COLORS.borderLight,
  },
  iconBtnDisabled: {
    opacity: 0.35,
  },
  saveBtn: {
    margin: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.m,
    paddingVertical: SPACING.m,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textInverse,
    fontWeight: "600",
  },
});
