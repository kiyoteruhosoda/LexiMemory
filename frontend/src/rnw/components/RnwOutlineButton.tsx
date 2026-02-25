import type { ReactNode } from "react";
import { Pressable, Text } from "../react-native";
import { StyleSheet } from "../stylesheet";

type RnwOutlineButtonProps = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  testID?: string;
  disabled?: boolean;
  fullWidth?: boolean;
};

export function RnwOutlineButton({
  label,
  onPress,
  icon,
  testID,
  disabled = false,
  fullWidth,
}: RnwOutlineButtonProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      testID={testID}
      style={({ pressed }) => ({
        ...styles.button,
        ...(pressed ? styles.buttonPressed : {}),
        ...(disabled ? styles.buttonDisabled : {}),
        ...(fullWidth ? styles.fullWidth : {}),
      })}
      accessibilityRole="button"
    >
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    borderRadius: 6,
    backgroundColor: "transparent",
    borderColor: "#6c757d",
    borderWidth: 1,
    paddingInline: 12,
    gap: 6,
    cursor: "pointer",
  },
  fullWidth: {
    width: "100%",
  },
  buttonPressed: {
    backgroundColor: "#f8f9fa",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  icon: {
    color: "#6c757d",
    lineHeight: "20px",
    display: "inline-flex",
    alignItems: "center",
  },
  text: {
    color: "#6c757d",
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "20px",
  },
});
