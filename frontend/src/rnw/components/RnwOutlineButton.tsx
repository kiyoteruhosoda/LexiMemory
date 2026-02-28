// frontend/src/rnw/components/RnwOutlineButton.tsx

import type { ReactNode } from "react";
import { Pressable, Text } from "../react-native";
import { StyleSheet } from "../stylesheet";

type OutlineVariant = "primary" | "secondary";
type ButtonSize = "md" | "sm";

type RnwOutlineButtonProps = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  testID?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: OutlineVariant;
  size?: ButtonSize; // ★追加（これが抜けてた）
};

const OUTLINE = {
  primary: {
    main: "#0d6efd",
    pressedText: "#fff",
  },
  secondary: {
    main: "#6c757d",
    pressedText: "#fff",
  },
} as const;

const SIZE = {
  md: {
    height: 38,
    paddingInline: 12,
    fontSize: 14,
  },
  sm: {
    height: 30,
    paddingInline: 10,
    fontSize: 13,
  },
} as const;

export function RnwOutlineButton({
  label,
  onPress,
  icon,
  testID,
  disabled = false,
  fullWidth,
  variant = "primary",
  size = "md",
}: RnwOutlineButtonProps) {
  const v = OUTLINE[variant];
  const s = SIZE[size];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      testID={testID}
      style={({ pressed }) => ({
        ...styles.buttonBase,
        ...(fullWidth ? styles.fullWidth : {}),

        // size
        height: s.height,
        paddingInline: s.paddingInline,

        // variant
        borderColor: v.main,
        color: v.main,

        ...(pressed && !disabled
          ? {
              backgroundColor: v.main,
              color: v.pressedText,
            }
          : {}),

        ...(disabled ? styles.buttonDisabled : {}),
      })}
    >
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={{ ...styles.text, fontSize: s.fontSize }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "transparent",
    borderWidth: 1,
    gap: 6,
    cursor: "pointer",
  },

  fullWidth: {
    width: "100%",
  },

  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  // colorは親から継承
  icon: {
    lineHeight: "20px",
    display: "inline-flex",
    alignItems: "center",
  },

  text: {
    fontWeight: 500,
    lineHeight: "20px",
  },
});