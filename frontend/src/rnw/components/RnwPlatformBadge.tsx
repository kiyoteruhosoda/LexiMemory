import { StyleSheet, Text, View } from "react-native";

export function RnwPlatformBadge() {
  return (
    <View style={styles.badge} testID="rnw-platform-badge">
      <Text style={styles.text}>RNW PoC</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#adb5bd",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    color: "#495057",
    fontSize: 12,
    fontWeight: "600",
  },
});
