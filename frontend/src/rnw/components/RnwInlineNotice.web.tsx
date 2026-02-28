import { Text, View } from "../react-native";
import { StyleSheet } from "../stylesheet";
import type { ReactNode } from "react";

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
      testID={`rnw-inline-notice-${tone}`}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={{ ...styles.message, color: palette.color }}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: 8,

    padding: "10px 12px",

    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "20px",
  },
});