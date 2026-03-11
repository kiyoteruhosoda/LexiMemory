import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { Rating } from "../../../../src/api/types";
import type { MobileStudyService } from "../app/mobileServices";

type Card = Awaited<ReturnType<MobileStudyService["fetchNextCard"]>>;

const RATINGS: { value: Rating; label: string; emoji: string; color: string; bg: string }[] = [
  { value: "again", label: "もう一度", emoji: "🔁", color: "#dc3545", bg: "#fff5f5" },
  { value: "hard", label: "難しい", emoji: "😓", color: "#fd7e14", bg: "#fff8f0" },
  { value: "good", label: "良い", emoji: "👍", color: "#198754", bg: "#f0fff4" },
  { value: "easy", label: "簡単", emoji: "⚡", color: "#0d6efd", bg: "#f0f8ff" },
];

export function StudyScreen({ studyService }: { studyService: MobileStudyService }) {
  const [card, setCard] = useState<Card>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRating, setLastRating] = useState<string | null>(null);

  const loadNext = useCallback(async () => {
    setLoading(true);
    setRevealed(false);
    setLastRating(null);
    try {
      const next = await studyService.fetchNextCard();
      setCard(next);
    } finally {
      setLoading(false);
    }
  }, [studyService]);

  useEffect(() => {
    void loadNext();
  }, [loadNext]);

  const grade = async (rating: Rating) => {
    if (!card) return;
    setLastRating(rating);
    await studyService.gradeCard(card.word.id, rating);
    await loadNext();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa" }}>
        <Text style={{ fontSize: 32 }}>🧠</Text>
        <Text style={{ fontSize: 15, color: "#6c757d", marginTop: 8 }}>読み込み中...</Text>
      </View>
    );
  }

  if (!card) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: "#fff",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: "#e9ecef",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#212529" }}>学習</Text>
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 }}>
          <Text style={{ fontSize: 56 }}>🎉</Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#212529", textAlign: "center" }}>
            お疲れ様でした！
          </Text>
          <Text style={{ fontSize: 15, color: "#6c757d", textAlign: "center" }}>
            学習するカードがありません。新しい単語を追加するか、あとでまた来てください。
          </Text>
          <Pressable
            onPress={() => void loadNext()}
            style={({ pressed }) => ({
              marginTop: 8,
              backgroundColor: pressed ? "#0b5ed7" : "#0d6efd",
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 24,
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>再確認する</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const dueDate = new Date(card.memory.dueAt);
  const isOverdue = dueDate < new Date();

  return (
    <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#e9ecef",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#212529" }}>学習</Text>
        <View
          style={{
            backgroundColor: isOverdue ? "#fff3cd" : "#d1ecf1",
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, color: isOverdue ? "#856404" : "#0c5460" }}>
            {isOverdue ? "⏰ 復習時期" : "📅 予定"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 16, flexGrow: 1 }}
        alwaysBounceVertical={false}
      >
        {/* Flash Card */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 28,
            borderWidth: 1,
            borderColor: "#e9ecef",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
            minHeight: 180,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {/* Headword */}
          <Text style={{ fontSize: 34, fontWeight: "800", color: "#212529", textAlign: "center" }}>
            {card.word.headword}
          </Text>

          {/* Pronunciation */}
          {card.word.pronunciation ? (
            <Text style={{ fontSize: 16, color: "#6c757d", textAlign: "center" }}>
              {card.word.pronunciation}
            </Text>
          ) : null}

          {/* POS Badge */}
          <View
            style={{
              backgroundColor: "#e7f1ff",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#0d6efd" }}>{card.word.pos}</Text>
          </View>

          {/* Divider */}
          <View
            style={{
              width: "60%",
              height: 1,
              backgroundColor: "#e9ecef",
              marginVertical: 8,
            }}
          />

          {/* Answer (revealed or tap to show) */}
          {revealed ? (
            <View style={{ alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 22, fontWeight: "700", color: "#198754", textAlign: "center" }}>
                {card.word.meaningJa}
              </Text>
              {card.word.memo ? (
                <Text style={{ fontSize: 14, color: "#6c757d", textAlign: "center", fontStyle: "italic" }}>
                  {card.word.memo}
                </Text>
              ) : null}
              {card.word.tags.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                  {card.word.tags.map((tag) => (
                    <View
                      key={tag}
                      style={{
                        backgroundColor: "#f1f3f5",
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: "#6c757d" }}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <Pressable
              onPress={() => setRevealed(true)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? "#0b5ed7" : "#0d6efd",
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 32,
                marginTop: 4,
              })}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>答えを見る</Text>
            </Pressable>
          )}
        </View>

        {/* Rating Buttons (only when revealed) */}
        {revealed && (
          <View>
            <Text style={{ fontSize: 13, color: "#6c757d", textAlign: "center", marginBottom: 12 }}>
              どれくらい覚えていましたか？
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {RATINGS.map((r) => (
                <Pressable
                  key={r.value}
                  onPress={() => void grade(r.value)}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: pressed ? r.color : r.bg,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: r.color,
                    paddingVertical: 12,
                    alignItems: "center",
                    gap: 4,
                  })}
                >
                  <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: r.color }}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Info: next due */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: "#e9ecef",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>📊</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: "#6c757d" }}>
              復習予定: {dueDate.toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
