import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "../react-native";

type RnwOutlineButtonProps = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  testID?: string;
  disabled?: boolean;
};

export function RnwOutlineButton({ label, onPress, icon, testID, disabled = false }: RnwOutlineButtonProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      testID={testID}
      style={({ pressed }) => ({ ...styles.button, ...(pressed ? styles.buttonPressed : {}), ...(disabled ? styles.buttonDisabled : {}) })}
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
    borderColor: "#0d6efd",
    borderWidth: 1,
    paddingInline: 12,
    gap: 6,
    cursor: "pointer",
  },
  buttonPressed: {
    backgroundColor: "#e7f1ff",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  icon: {
    color: "#0d6efd",
    lineHeight: "20px",
    display: "inline-flex",
    alignItems: "center",
  },
  text: {
    color: "#0d6efd",
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "20px",
  },
});
