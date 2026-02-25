import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { Rating } from "../../../../src/api/types";
import { mobileCompositionRoot } from "../app/mobileCompositionRoot";

const ratingOrder: Rating[] = ["again", "hard", "good", "easy"];

export function StudyScreen() {
  const studyService = mobileCompositionRoot.studyService;
  const [card, setCard] = useState<Awaited<ReturnType<typeof studyService.fetchNextCard>>>(null);
  const [message, setMessage] = useState("");

  const loadNext = useCallback(async () => {
    const next = await studyService.fetchNextCard();
    setCard(next);
    setMessage(next ? "" : "No cards available.");
  }, [studyService]);

  useEffect(() => {
    void loadNext();
  }, [loadNext]);

  const grade = async (rating: Rating) => {
    if (!card) {
      return;
    }

    await studyService.gradeCard(card.word.id, rating);
    setMessage(`Rated as ${rating}`);
    await loadNext();
  };

  if (!card) {
    return <Text>{message || "Loading..."}</Text>;
  }

  return (
    <View style={{ display: "flex", gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>{card.word.headword}</Text>
      <Text>{card.word.meaningJa}</Text>
      <Text style={{ color: "#6c757d" }}>Due: {new Date(card.memory.dueAt).toLocaleString()}</Text>
      <View style={{ display: "flex", flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {ratingOrder.map((rating) => (
          <Pressable
            key={rating}
            onPress={() => {
              void grade(rating);
            }}
            style={{
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#adb5bd",
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: "#fff",
            }}
          >
            <Text>{rating}</Text>
          </Pressable>
        ))}
      </View>
      <Text>{message}</Text>
    </View>
  );
}
