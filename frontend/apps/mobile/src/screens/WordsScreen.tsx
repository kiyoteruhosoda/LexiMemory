import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { Pos } from "../../../../src/api/types";
import type { WordDraft } from "../../../../src/core/word/wordGateway";
import type { MobileWordService } from "../app/mobileServices";

const posOptions: Pos[] = ["noun", "verb", "adj", "adv", "prep", "conj", "pron", "det", "interj", "other"];

const emptyDraft: WordDraft = {
  headword: "",
  pronunciation: "",
  pos: "noun",
  meaningJa: "",
  examples: [],
  tags: [],
  memo: "",
};

export function WordsScreen({ service }: { service: MobileWordService }) {
  const [query, setQuery] = useState("");
  const [selectedPos, setSelectedPos] = useState<Pos | undefined>(undefined);
  const [draft, setDraft] = useState<WordDraft>(emptyDraft);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [words, setWords] = useState<Awaited<ReturnType<typeof service.listWords>>["items"]>([]);

  const selectedWord = useMemo(() => words.find((item) => item.id === selectedWordId) ?? null, [selectedWordId, words]);

  const load = useCallback(async () => {
    const listed = await service.listWords({ q: query, pos: selectedPos });
    setWords(listed.items);
  }, [query, selectedPos, service]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitCreate = async () => {
    if (!draft.headword.trim() || !draft.meaningJa.trim()) {
      return;
    }

    await service.createWord({
      ...draft,
      headword: draft.headword.trim(),
      meaningJa: draft.meaningJa.trim(),
      tags: draft.tags,
      examples: draft.examples,
    });
    setDraft(emptyDraft);
    await load();
  };

  const submitUpdate = async () => {
    if (!selectedWord) {
      return;
    }

    await service.updateWord(selectedWord.id, {
      headword: draft.headword,
      pronunciation: draft.pronunciation,
      pos: draft.pos,
      meaningJa: draft.meaningJa,
      examples: draft.examples,
      tags: draft.tags,
      memo: draft.memo,
    });
    await load();
  };

  useEffect(() => {
    if (!selectedWord) {
      return;
    }

    setDraft({
      headword: selectedWord.headword,
      pronunciation: selectedWord.pronunciation ?? "",
      pos: selectedWord.pos,
      meaningJa: selectedWord.meaningJa,
      examples: selectedWord.examples,
      tags: selectedWord.tags,
      memo: selectedWord.memo ?? "",
    });
  }, [selectedWord]);

  return (
    <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
      <View style={{ display: "flex", gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "600" }}>Browse words</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search headword or meaning"
          style={{ borderWidth: 1, borderColor: "#ced4da", borderRadius: 8, padding: 10, backgroundColor: "#fff" }}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ display: "flex", flexDirection: "row", gap: 8 }}>
            <FilterChip
              label="All"
              active={!selectedPos}
              onPress={() => setSelectedPos(undefined)}
            />
            {posOptions.map((pos) => (
              <FilterChip key={pos} label={pos} active={selectedPos === pos} onPress={() => setSelectedPos(pos)} />
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={{ display: "flex", gap: 8 }}>
        {words.map((word) => (
          <Pressable
            key={word.id}
            onPress={() => setSelectedWordId(word.id)}
            style={{
              borderWidth: 1,
              borderColor: selectedWordId === word.id ? "#0d6efd" : "#dee2e6",
              borderRadius: 8,
              padding: 12,
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontWeight: "700" }}>{word.headword}</Text>
            <Text>{word.meaningJa}</Text>
            <Text style={{ color: "#6c757d" }}>{word.tags.join(", ") || "No tags"}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ display: "flex", gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "600" }}>{selectedWord ? "Edit word" : "Create word"}</Text>
        <TextInput
          value={draft.headword}
          onChangeText={(value) => setDraft((prev) => ({ ...prev, headword: value }))}
          placeholder="Headword"
          style={inputStyle}
        />
        <TextInput
          value={draft.meaningJa}
          onChangeText={(value) => setDraft((prev) => ({ ...prev, meaningJa: value }))}
          placeholder="Meaning (JA)"
          style={inputStyle}
        />
        <TextInput
          value={(draft.tags ?? []).join(",")}
          onChangeText={(value) => setDraft((prev) => ({
            ...prev,
            tags: value.split(",").map((tag) => tag.trim()).filter(Boolean),
          }))}
          placeholder="Tags (comma separated)"
          style={inputStyle}
        />
        <View style={{ display: "flex", flexDirection: "row", gap: 8 }}>
          <ActionButton label="Create" onPress={submitCreate} />
          <ActionButton label="Update" onPress={submitUpdate} disabled={!selectedWord} />
        </View>
      </View>
    </ScrollView>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? "#0d6efd" : "#adb5bd",
        backgroundColor: active ? "#e7f1ff" : "#fff",
      }}
    >
      <Text>{label}</Text>
    </Pressable>
  );
}

function ActionButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: disabled ? "#adb5bd" : "#0d6efd",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ced4da",
  borderRadius: 8,
  padding: 10,
  backgroundColor: "#fff",
} as const;
