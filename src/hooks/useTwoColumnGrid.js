import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { SPACING } from "../constants/theme";
import { twoColumnCardWidth } from "../utils/displayName";

export function useTwoColumnGrid(horizontalPadding = SPACING.l, gap = SPACING.s) {
  const { width } = useWindowDimensions();
  return useMemo(() => {
    const cardWidth = twoColumnCardWidth(width, horizontalPadding, gap);
    return {
      cardWidth,
      gap,
      containerStyle: {
        flexDirection: "row",
        flexWrap: "wrap",
        width: "100%",
        gap,
      },
    };
  }, [width, horizontalPadding, gap]);
}
