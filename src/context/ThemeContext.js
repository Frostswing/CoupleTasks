import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { COLORS } from "../constants/theme";

const ThemeContext = createContext({
  isDark: false,
  colors: COLORS,
});

export function buildThemeColors(scheme) {
  const isDark = scheme === "dark";
  if (!isDark) {
    return { isDark: false, colors: COLORS };
  }
  return {
    isDark: true,
    colors: {
      ...COLORS,
      background: COLORS.dark.background,
      surface: COLORS.dark.surface,
      surfaceElevated: COLORS.dark.surfaceElevated,
      text: COLORS.dark.text,
      textSecondary: COLORS.dark.textSecondary,
      textTertiary: COLORS.dark.textTertiary,
      border: COLORS.dark.border,
      borderLight: COLORS.dark.borderLight,
      divider: COLORS.dark.border,
      primaryMuted: "#1E3A5F",
    },
  };
}

export function ThemeProvider({ children, forcedScheme }) {
  const systemScheme = useColorScheme();
  const scheme = forcedScheme || systemScheme || "light";
  const value = useMemo(() => buildThemeColors(scheme), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
