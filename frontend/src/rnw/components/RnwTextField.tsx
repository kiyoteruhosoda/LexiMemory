// frontend/src/rnw/components/RnwTextField.tsx

import { Text, TextInput, View } from "../react-native";
import { StyleSheet } from "../stylesheet";
import type { ReactNode } from "react";
import { useState } from "react";

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

const BORDER_COLOR = "#ced4da";
const BORDER_COLOR_FOCUS = "#86b7fe";
const BORDER_WIDTH = 1;
const RADIUS = 6;
const HEIGHT = 40;

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
  const [focused, setFocused] = useState(false);
  const hasIcon = Boolean(icon);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputGroup}>
        {hasIcon ? (
          <View style={{ ...styles.iconSlot, ...(focused ? styles.iconSlotFocus : {}) }}>
            {icon}
          </View>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          type={secureTextEntry ? "password" : "text"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...styles.input,
            ...(hasIcon ? styles.inputWithIcon : styles.inputNoIcon),
            ...(focused ? styles.inputFocus : {}),
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
    flexDirection: "column",
    gap: 4,
    width: "100%",
  },

  label: {
    display: "block", // Text が span なので block 化して間延び回避
    fontSize: 14,
    fontWeight: 400,
    color: "#212529",
    lineHeight: "16px",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },

  iconSlot: {
    minWidth: 46,
    height: HEIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9ecef",
    color: "#495057",
    fontSize: 16,

    borderStyle: "solid",
    borderColor: BORDER_COLOR,
    borderWidth: BORDER_WIDTH,

    // 境界線を icon 側で持つ（RNW変換事故対策で色も明示）
    borderRightWidth: BORDER_WIDTH,
    borderRightColor: BORDER_COLOR,

    borderTopLeftRadius: RADIUS,
    borderBottomLeftRadius: RADIUS,
  },

  input: {
    flex: 1,
    height: HEIGHT,

    borderStyle: "solid",
    borderColor: BORDER_COLOR,
    borderWidth: BORDER_WIDTH,

    paddingInline: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",

    // ★ ブラウザ既定スタイルを殺して radius を確実に効かせる（Bootstrap相当）
    appearance: "none",
    WebkitAppearance: "none",

    outline: "none",
    boxShadow: "none",
  },

  // icon あり：境界線は icon 側に持たせるので input 左は消す
  inputWithIcon: {
    borderLeftWidth: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,

    // ★ 右端を丸く（アイコンと対称）
    borderTopRightRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
  },

  // icon なし：普通の角丸 input
  inputNoIcon: {
    borderRadius: RADIUS,
  },

  inputFocus: {
    borderColor: BORDER_COLOR_FOCUS,
    // Bootstrapっぽい薄いグロー（不要なら消してOK）
    boxShadow: "0 0 0 0.2rem rgba(13,110,253,.25)",
  },

  iconSlotFocus: {
    borderColor: BORDER_COLOR_FOCUS,
    borderRightColor: BORDER_COLOR_FOCUS,
  },
});