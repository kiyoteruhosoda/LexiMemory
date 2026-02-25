import type { ReactNode } from "react";
import { View } from "react-native";

export type RnwSurfaceCardProps = {
  children: ReactNode;
  testID?: string;
};

const cardStyle = {
  width: "100%",
  maxWidth: 520,
  borderColor: "#dee2e6",
  borderWidth: 1,
  borderRadius: 8,
  backgroundColor: "#ffffff",
  padding: 24,
  marginInline: "auto",
  boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)",
  display: "flex",
  gap: 12,
} as const;

export function RnwSurfaceCard({ children, testID }: RnwSurfaceCardProps) {
  return (
    <View style={cardStyle} testID={testID}>
      {children}
    </View>
  );
}
