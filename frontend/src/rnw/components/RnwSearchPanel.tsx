import { Pressable, Text, TextInput, View } from "../react-native";
import { StyleSheet } from "../stylesheet";

type RnwSearchPanelProps = {
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export function RnwSearchPanel({ value, busy, onChange, onSubmit, onClear }: RnwSearchPanelProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Search (EN/JA)"
          autoFocus
          style={styles.input}
          testID="rnw-search-input"
        />
        <Pressable
          onPress={onSubmit}
          disabled={busy}
          style={({ pressed }) => ({
            ...styles.actionButton,
            ...(pressed ? styles.actionButtonPressed : {}),
            ...(busy ? styles.disabled : {}),
          })}
          testID="rnw-search-apply-button"
        >
          <Text style={styles.actionButtonText}>{busy ? "..." : "Filter"}</Text>
        </Pressable>
        <Pressable
          onPress={onClear}
          style={({ pressed }) => ({
            ...styles.clearButton,
            ...(pressed ? styles.actionButtonPressed : {}),
          })}
          testID="rnw-search-clear-button"
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: "#dee2e6",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    padding: 16,
    boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)",
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    minHeight: 38,
    borderColor: "#ced4da",
    borderWidth: 1,
    borderRadius: 6,
    paddingInline: 12,
    fontSize: 14,
    backgroundColor: "#ffffff",
  },
  actionButton: {
    minHeight: 38,
    borderRadius: 6,
    borderColor: "#0d6efd",
    borderWidth: 1,
    paddingInline: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  actionButtonPressed: {
    opacity: 0.9,
  },
  actionButtonText: {
    color: "#0d6efd",
    fontWeight: "600",
    fontSize: 14,
  },
  clearButton: {
    minHeight: 38,
    borderRadius: 6,
    borderColor: "#6c757d",
    borderWidth: 1,
    paddingInline: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  clearButtonText: {
    color: "#6c757d",
    fontWeight: "500",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
});
