import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "../react-native";

type RnwOutlineButtonProps = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  testID?: string;
};

export function RnwOutlineButton({ label, onPress, icon, testID }: RnwOutlineButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => ({ ...styles.button, ...(pressed ? styles.buttonPressed : {}) })}
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
