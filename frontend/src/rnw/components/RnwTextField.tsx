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
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "400",
    color: "#212529",
    lineHeight: 21,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  iconSlot: {
    minWidth: 46,
    height: 40,
    borderColor: "#ced4da",
    borderWidth: 1,
    borderRightWidth: 0,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    backgroundColor: "#e9ecef",
    color: "#495057",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: 40,
    boxSizing: "border-box",
    lineHeight: "20px",
    borderColor: "#ced4da",
    borderWidth: 1,
    borderRadius: 6,
    paddingInline: 12,
    paddingBlock: 0,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  inputWithIcon: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
});
