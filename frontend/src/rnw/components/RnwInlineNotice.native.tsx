import { Text, View } from "../react-native";
import type { ReactNode } from "react";

import { StyleSheet } from "../stylesheet";

type NoticeTone = "info" | "error";

type RnwInlineNoticeProps = {
  tone: NoticeTone;
  message: string;
  icon?: ReactNode;
};

const toneStyles: Record<NoticeTone, { backgroundColor: string; borderColor: string; color: string }> = {
  info: {
    backgroundColor: "#e7f1ff",
    borderColor: "#b6d4fe",
    color: "#084298",
  },
  error: {
    backgroundColor: "#f8d7da",
    borderColor: "#f1aeb5",
    color: "#842029",
  },
};

export function RnwInlineNotice({ tone, message, icon }: RnwInlineNoticeProps) {
  const palette = toneStyles[tone];

  return (
    <View
      style={{
        ...styles.base,
        backgroundColor: palette.backgroundColor,
        borderColor: palette.borderColor,
      }}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={{ ...styles.message, color: palette.color }}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    fontSize: 14,
    fontWeight: "500",
  },
});
