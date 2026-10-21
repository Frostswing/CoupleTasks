import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { RADIUS, SPACING } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";

export function SkeletonLine({ width = "100%", height = 14, style }) {
  const { colors } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: RADIUS.s,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonList({ rows = 4 }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SkeletonLine width={40} height={40} style={{ borderRadius: RADIUS.m }} />
          <View style={styles.col}>
            <SkeletonLine width="70%" height={16} />
            <SkeletonLine width="40%" height={12} style={{ marginTop: SPACING.s }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACING.m, paddingHorizontal: SPACING.l },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.l,
    borderRadius: RADIUS.l,
    borderWidth: StyleSheet.hairlineWidth,
    gap: SPACING.m,
  },
  col: { flex: 1 },
});
