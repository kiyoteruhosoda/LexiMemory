import type { ReactNode } from "react";
import { View } from "react-native";

export type RnwPanelCardProps = {
  children: ReactNode;
  testID?: string;
};

const panelStyle = {
  borderColor: "#dee2e6",
  borderWidth: 1,
  borderRadius: 8,
  backgroundColor: "#ffffff",
  boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)",
  padding: 16,
} as const;

export function RnwPanelCard({ children, testID }: RnwPanelCardProps) {
  return (
    <View style={panelStyle} testID={testID}>
      {children}
    </View>
  );
}
