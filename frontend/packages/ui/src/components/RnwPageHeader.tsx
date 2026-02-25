import type { ReactNode } from "react";
import { Text, View } from "react-native";

export type RnwPageHeaderProps = {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  testID?: string;
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  titleWrap: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    color: "#212529",
    lineHeight: 1.2,
  },
} as const;

export function RnwPageHeader({ title, icon, action, testID }: RnwPageHeaderProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.titleWrap}>
        {icon}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action}
    </View>
  );
}
