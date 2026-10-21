import React, { useRef } from "react";
import { Animated, Pressable } from "react-native";

export default function PressableScale({
  children,
  onPress,
  onLongPress,
  disabled,
  scaleTo = 0.97,
  style,
  accessibilityRole,
  accessibilityLabel,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (to) => {
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 28,
      bounciness: 0,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={() => animate(scaleTo)}
      onPressOut={() => animate(1)}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      <Animated.View style={[{ width: "100%" }, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
