import type { MemoryState, WordEntry } from "../../api/types";
import { resolveMemoryLevelTone } from "../../core/word/memoryLevelTonePolicy";
import { Pressable, Text, View } from "../react-native";
import { StyleSheet } from "../stylesheet";

type RnwWordListTableProps = {
  items: WordEntry[];
  memoryMap: Record<string, MemoryState>;
  onSelectWord: (wordId: string) => void;
};

export function RnwWordListTable({ items, memoryMap, onSelectWord }: RnwWordListTableProps) {
  return (
    <View style={styles.container} testID="rnw-word-list-table">
      <View style={styles.headerRow}>
        <Text style={{ ...styles.headerCell, ...styles.wordCell }}>Word</Text>
        <Text style={{ ...styles.headerCell, ...styles.posCell }}>POS</Text>
        <Text style={{ ...styles.headerCell, ...styles.meaningCell }}>Meaning</Text>
        <Text style={{ ...styles.headerCell, ...styles.examplesCell }}>Examples</Text>
        <Text style={{ ...styles.headerCell, ...styles.levelCell }}>Level</Text>
      </View>

      {items.map((word) => {
        const memoryLevel = memoryMap[word.id]?.memoryLevel ?? 0;
        const tone = resolveMemoryLevelTone(memoryLevel);

        return (
          <Pressable
            key={word.id}
            onPress={() => onSelectWord(word.id)}
            style={({ pressed }) => ({
              ...styles.row,
              ...(pressed ? styles.rowPressed : {}),
            })}
            testID={`rnw-word-row-${word.id}`}
          >
            <Text style={{ ...styles.cell, ...styles.wordCell, ...styles.wordText }}>{word.headword}</Text>
            <Text style={{ ...styles.cell, ...styles.posCell }}>
              <Text style={styles.posBadge}>{word.pos}</Text>
            </Text>
            <Text style={{ ...styles.cell, ...styles.meaningCell }}>{word.meaningJa}</Text>
            <Text style={{ ...styles.cell, ...styles.examplesCell }}>{word.examples?.length ?? 0}</Text>
            <Text style={{ ...styles.cell, ...styles.levelCell }}>
              <Text style={{ ...styles.levelBadge, ...toneStyleMap[tone] }}>Lv {memoryLevel}</Text>
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: "#dee2e6",
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  headerRow: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderBottomColor: "#dee2e6",
    borderBottomWidth: 1,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    borderBottomColor: "#dee2e6",
    borderBottomWidth: 1,
    backgroundColor: "#ffffff",
    cursor: "pointer",
  },
  rowPressed: {
    backgroundColor: "#f8f9fa",
  },
  headerCell: {
    paddingInline: 12,
    paddingBlock: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#495057",
  },
  cell: {
    paddingInline: 12,
    paddingBlock: 12,
    fontSize: 14,
    color: "#212529",
    display: "flex",
    alignItems: "center",
  },
  wordCell: {
    width: "20%",
  },
  posCell: {
    width: "10%",
  },
  meaningCell: {
    width: "30%",
  },
  examplesCell: {
    width: "15%",
  },
  levelCell: {
    width: "15%",
  },
  wordText: {
    fontWeight: "600",
  },
  posBadge: {
    backgroundColor: "#6c757d",
    color: "#ffffff",
    borderRadius: 999,
    paddingInline: 8,
    paddingBlock: 2,
    fontSize: 12,
  },
  levelBadge: {
    borderRadius: 999,
    paddingInline: 8,
    paddingBlock: 2,
    fontSize: 12,
    color: "#ffffff",
  },
  levelNeutral: {
    backgroundColor: "#6c757d",
  },
  levelWarning: {
    backgroundColor: "#ffc107",
    color: "#212529",
  },
  levelPrimary: {
    backgroundColor: "#0d6efd",
  },
  levelSuccess: {
    backgroundColor: "#198754",
  },
});

const toneStyleMap = {
  neutral: styles.levelNeutral,
  warning: styles.levelWarning,
  primary: styles.levelPrimary,
  success: styles.levelSuccess,
} as const;
