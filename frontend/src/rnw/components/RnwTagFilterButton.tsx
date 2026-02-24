import { Pressable, StyleSheet, Text } from "../react-native";

type RnwTagFilterButtonProps = {
  activeCount?: number;
  onPress: () => void;
  testID?: string;
};

export function RnwTagFilterButton({ activeCount = 0, onPress, testID }: RnwTagFilterButtonProps) {
  const isActive = activeCount > 0;

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => ({
        ...styles.button,
        ...(isActive ? styles.buttonActive : styles.buttonInactive),
        ...(pressed ? styles.buttonPressed : {}),
      })}
      accessibilityRole="button"
    >
      <Text style={{ ...styles.icon, ...(isActive ? styles.iconActive : styles.iconInactive) }}>
        <i className="fa-solid fa-tag" aria-hidden="true" />
      </Text>
      <Text style={{ ...styles.text, ...(isActive ? styles.textActive : styles.textInactive) }}>
        {isActive ? String(activeCount) : "Tags"}
      </Text>
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
    borderWidth: 1,
    paddingInline: 12,
    gap: 6,
    cursor: "pointer",
  },
  buttonActive: {
    backgroundColor: "#0d6efd",
    borderColor: "#0d6efd",
  },
  buttonInactive: {
    backgroundColor: "transparent",
    borderColor: "#6c757d",
  },
  buttonPressed: {
    opacity: 0.9,
  },
  icon: {
    lineHeight: "20px",
    display: "inline-flex",
    alignItems: "center",
  },
  iconActive: {
    color: "#ffffff",
  },
  iconInactive: {
    color: "#6c757d",
  },
  text: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "20px",
  },
  textActive: {
    color: "#ffffff",
  },
  textInactive: {
    color: "#6c757d",
  },
});
