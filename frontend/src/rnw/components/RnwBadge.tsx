// frontend/src/rnw/components/RnwBadge.tsx

import type * as React from "react";
import { Text } from "../react-native";
import { StyleSheet } from "../stylesheet";
import { buttonTheme } from "../theme/buttonTheme";
import type { RnwButtonTone } from "../theme/tokens";

type RnwBadgeVariant = "default" | "pill" | "level";

type RnwBadgeProps = {
  children: React.ReactNode;
  tone?: RnwButtonTone;
  outline?: boolean;
  variant?: RnwBadgeVariant;
};

export function RnwBadge({
  children,
  tone = "primary",
  outline = false,
  variant = "default",
}: RnwBadgeProps) {
  const palette = outline ? buttonTheme[tone].outline : buttonTheme[tone].solid;

  // level は意味づけの alias（見た目は pill と同じ）
  const resolvedVariant = variant === "level" ? "pill" : variant;
  const baseStyle = resolvedVariant === "pill" ? styles.pill : styles.default;

  return (
    <Text
      style={{
        ...baseStyle,
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
  // ✅ インラインで横並びにできる（Row表示が戻る）
  default: {
    display: "inline-flex",
    flexDirection: "row",
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
    verticalAlign: "middle",
  },

  // ✅ 旧バッジ相当（borderなし・paddingBlockあり）
  pill: {
    display: "inline-flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingInline: 8,
    paddingBlock: 2,

    fontSize: 12,
    fontWeight: 600,

    borderRadius: 999,
    borderWidth: 0,

    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },
});