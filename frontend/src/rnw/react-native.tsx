import { useState, type CSSProperties, type ReactNode } from "react";

type PressableStyle = CSSProperties | ((state: { pressed: boolean }) => CSSProperties);

type PressableProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: PressableStyle;
  testID?: string;
  disabled?: boolean;
  accessibilityRole?: "button";
};

type ViewProps = {
  children: ReactNode;
  style?: CSSProperties;
  testID?: string;
};

type TextProps = {
  children: ReactNode;
  style?: CSSProperties;
};

type TextInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: CSSProperties;
  testID?: string;
};

export function Pressable({ children, onPress, style, testID, disabled, accessibilityRole }: PressableProps) {
  const [pressed, setPressed] = useState(false);
  const resolvedStyle = typeof style === "function" ? style({ pressed }) : style;

  return (
    <button
      type="button"
      onClick={onPress}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      data-testid={testID}
      role={accessibilityRole}
      style={resolvedStyle}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function View({ children, style, testID }: ViewProps) {
  return (
    <div style={style} data-testid={testID}>
      {children}
    </div>
  );
}

export function Text({ children, style }: TextProps) {
  return <span style={style}>{children}</span>;
}

export function TextInput({ value, onChangeText, placeholder, autoFocus, style, testID }: TextInputProps) {
  return (
    <input
      value={value}
      onChange={(event) => onChangeText(event.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={style}
      data-testid={testID}
    />
  );
}
