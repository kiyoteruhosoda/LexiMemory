import { Text, TextInput, View } from "../react-native";
import { StyleSheet } from "../stylesheet";
import type { ReactNode } from "react";

type RnwTextFieldProps = {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  autoComplete?: string;
  secureTextEntry?: boolean;
  icon?: ReactNode;
  testID?: string;
};

export function RnwTextField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  secureTextEntry,
  icon,
  testID,
}: RnwTextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          type={secureTextEntry ? "password" : "text"}
          style={{
            ...styles.input,
            ...(icon ? styles.inputWithIcon : {}),
          }}
          testID={testID}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#343a40",
  },
  inputWrap: {
    position: "relative",
  },
  iconSlot: {
    position: "absolute",
    top: 9,
    left: 10,
    zIndex: 1,
    color: "#6c757d",
  },
  input: {
    width: "100%",
    minHeight: 40,
    borderColor: "#ced4da",
    borderWidth: 1,
    borderRadius: 8,
    paddingInline: 12,
    fontSize: 14,
    backgroundColor: "#ffffff",
  },
  inputWithIcon: {
    paddingLeft: 34,
  },
});
