import type { CSSProperties, ReactNode } from "react";

type PressableStyle = CSSProperties | ((state: { pressed: boolean }) => CSSProperties);

type PressableProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: PressableStyle;
  testID?: string;
  accessibilityRole?: "button";
};

export function Pressable({ children, onPress, style, testID, accessibilityRole }: PressableProps) {
  const resolvedStyle = typeof style === "function" ? style({ pressed: false }) : style;
  return (
    <button
      type="button"
      onClick={onPress}
      data-testid={testID}
      role={accessibilityRole}
      style={resolvedStyle}
    >
      {children}
    </button>
  );
}

export function Text({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={style}>{children}</span>;
}

export const StyleSheet = {
  create<T extends Record<string, CSSProperties>>(styles: T): T {
    return styles;
  },
};
