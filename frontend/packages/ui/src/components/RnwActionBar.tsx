import type { ReactNode } from "react";
import { View } from "react-native";

export type RnwActionBarProps = {
  leading: ReactNode;
  trailing?: ReactNode;
  testID?: string;
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  leading: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
} as const;

export function RnwActionBar({ leading, trailing, testID }: RnwActionBarProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.leading}>{leading}</View>
      {trailing ?? null}
    </View>
  );
}
