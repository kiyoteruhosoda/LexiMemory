import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export type RnwDangerButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  testID?: string;
};

const styles = {
  button: {
    borderWidth: 1,
    borderColor: "#dc3545",
    backgroundColor: "#dc3545",
    borderRadius: 6,
    minHeight: 38,
    paddingInline: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.65,
  },
  content: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    color: "#ffffff",
    fontWeight: 600,
    fontSize: 14,
  },
} as const;

export function RnwDangerButton({ label, onPress, disabled, icon, testID }: RnwDangerButtonProps) {
  return (
    <Pressable
      style={disabled ? { ...styles.button, ...styles.disabled } : styles.button}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <View style={styles.content}>
        {icon}
        <Text style={styles.text}>{label}</Text>
      </View>
    </Pressable>
  );
}
