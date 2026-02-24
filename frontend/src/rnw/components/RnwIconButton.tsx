import type { ReactNode } from "react";
import { Pressable, Text } from "../react-native";
import { StyleSheet } from "../stylesheet";

type RnwIconButtonVariant = "secondary" | "primary";

type RnwIconButtonProps = {
  icon: ReactNode;
  onPress: () => void;
  testID?: string;
  title?: string;
  disabled?: boolean;
  variant?: RnwIconButtonVariant;
};

export function RnwIconButton({
  icon,
  onPress,
  testID,
  title,
  disabled = false,
  variant = "secondary",
}: RnwIconButtonProps) {
  const tone = variant === "primary" ? styles.primary : styles.secondary;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      testID={testID}
      accessibilityRole="button"
      style={({ pressed }) => ({
        ...styles.button,
        ...tone,
        ...(pressed ? styles.pressed : {}),
        ...(disabled ? styles.disabled : {}),
      })}
    >
      <Text style={styles.icon}>
        <span aria-label={title}>{icon}</span>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: 6,
    borderWidth: 1,
    cursor: "pointer",
  },
  primary: {
    backgroundColor: "#0d6efd",
    borderColor: "#0d6efd",
    color: "#ffffff",
  },
  secondary: {
    backgroundColor: "transparent",
    borderColor: "#6c757d",
    color: "#6c757d",
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  icon: {
    fontSize: 14,
    lineHeight: "20px",
    display: "inline-flex",
    alignItems: "center",
  },
});
