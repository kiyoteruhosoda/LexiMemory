import { Text, View } from "../react-native";
import { StyleSheet } from "../stylesheet";
import { RnwIconButton } from "./RnwIconButton";
import { RnwOutlineButton } from "./RnwOutlineButton";
import { RnwPrimaryButton } from "./RnwPrimaryButton";

type RnwTagFilterPanelProps = {
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
};

export function RnwTagFilterPanel({ allTags, selectedTags, onToggleTag, onClose, onClear, onApply }: RnwTagFilterPanelProps) {
  return (
    <View style={styles.container} testID="rnw-study-tag-panel">
      <View style={styles.headerRow}>
        <Text style={styles.title}>Filter by Tags</Text>
        <RnwIconButton
          icon={<i className="fa-solid fa-times" aria-hidden="true" />}
          onPress={onClose}
          title="close"
          testID="rnw-study-tag-close"
        />
      </View>

      <View style={styles.tagList}>
        {allTags.map((tag) => (
          <RnwOutlineButton
            key={tag}
            label={selectedTags.includes(tag) ? `✓ ${tag}` : tag}
            onPress={() => onToggleTag(tag)}
            testID={`rnw-tag-chip-${tag}`}
            disabled={false}
          />
        ))}
      </View>

      <View style={styles.actionRow}>
        <RnwOutlineButton label="Clear" onPress={onClear} testID="rnw-study-tag-clear" />
        <RnwPrimaryButton label="Apply" onPress={onApply} testID="rnw-study-tag-apply" />
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
    gap: 12,
  },
  headerRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontWeight: 600,
    fontSize: 16,
    color: "#212529",
  },
  tagList: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
});
