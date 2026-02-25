import type { ReactNode } from "react";
import { Pressable, Text } from "../react-native";
import { StyleSheet } from "../stylesheet";

type RnwPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  testID?: string;
  disabled?: boolean;
};

export function RnwPrimaryButton({ label, onPress, icon, testID, disabled }: RnwPrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      disabled={disabled}
      style={({ pressed }) => ({
        ...styles.button,
        ...(pressed ? styles.buttonPressed : {}),
        ...(disabled ? styles.buttonDisabled : {}),
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
    backgroundColor: "#0d6efd",
    borderColor: "#0d6efd",
    borderWidth: 1,
    paddingInline: 12,
    gap: 6,
    cursor: "pointer",
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  icon: {
    color: "#ffffff",
    lineHeight: "20px",
    display: "inline-flex",
    alignItems: "center",
  },
  text: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
    lineHeight: "20px",
  },
});
