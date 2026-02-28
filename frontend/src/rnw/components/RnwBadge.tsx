// frontend/src/rnw/components/RnwBadge.tsx

import { Text } from "../react-native";
import { StyleSheet } from "../stylesheet";
import { buttonTheme } from "../theme/buttonTheme";
import type { RnwButtonTone } from "../theme/tokens";

type RnwBadgeProps = {
  children: React.ReactNode;
  tone?: RnwButtonTone;
  outline?: boolean;
};

export function RnwBadge({
  children,
  tone = "primary",
  outline = false,
}: RnwBadgeProps) {
  const palette = outline
    ? buttonTheme[tone].outline
    : buttonTheme[tone].solid;

  return (
    <Text
      style={{
        ...styles.base,
        backgroundColor: palette.bg,
        borderColor: palette.border,
        color: palette.text,
      }}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",

    paddingInline: 8,
    height: 20,

    fontSize: 12,
    fontWeight: 600,
    borderRadius: 999,

    borderWidth: 1,
    lineHeight: "20px",
    whiteSpace: "nowrap",
  },
});