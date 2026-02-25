import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export type RnwWarningButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  testID?: string;
};

const styles = {
  button: {
    borderWidth: 1,
    borderColor: "#ffc107",
    backgroundColor: "#ffc107",
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
    color: "#212529",
    fontWeight: 600,
    fontSize: 14,
  },
} as const;

export function RnwWarningButton({ label, onPress, disabled, icon, testID }: RnwWarningButtonProps) {
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
