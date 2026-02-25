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
      <View style={styles.inputGroup}>
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
    fontWeight: "400",
    color: "#212529",
    lineHeight: "1.5",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "row",
    alignItems: "stretch",
  },
  iconSlot: {
    minWidth: 46,
    borderColor: "#ced4da",
    borderWidth: 1,
    borderRightWidth: 0,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    backgroundColor: "#e9ecef",
    color: "#495057",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
  },
  input: {
    width: "100%",
    minHeight: 40,
    borderColor: "#ced4da",
    borderWidth: 1,
    borderRadius: 6,
    paddingInline: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  inputWithIcon: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
});
