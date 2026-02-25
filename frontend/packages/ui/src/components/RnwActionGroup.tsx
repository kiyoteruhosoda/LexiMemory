import type { ReactNode } from "react";
import { View } from "react-native";

export type RnwActionGroupProps = {
  children: ReactNode;
  testID?: string;
};

const styles = {
  row: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
} as const;

export function RnwActionGroup({ children, testID }: RnwActionGroupProps) {
  return (
    <View style={styles.row} testID={testID}>
      {children}
    </View>
  );
}
