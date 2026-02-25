import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { RnwPageHeader, RnwSurfaceCard } from "../../packages/ui/src";
import { createMobileCompositionRoot, type MobileCompositionRoot } from "./src/app/mobileCompositionRoot";
import { WordsScreen } from "./src/screens/WordsScreen";
import { StudyScreen } from "./src/screens/StudyScreen";
import { SyncScreen } from "./src/screens/SyncScreen";

type MobileRoute = "words" | "study" | "sync";

export default function App() {
  const [route, setRoute] = useState<MobileRoute>("words");
  const [compositionRoot, setCompositionRoot] = useState<MobileCompositionRoot | null>(null);

  useEffect(() => {
    void createMobileCompositionRoot().then((root) => {
      setCompositionRoot(root);
    });
  }, []);

  const routeContent = useMemo(() => {
    if (!compositionRoot) {
      return <Text>Initializing mobile services...</Text>;
    }

    if (route === "study") {
      return <StudyScreen studyService={compositionRoot.studyService} />;
    }

    if (route === "sync") {
      return <SyncScreen syncService={compositionRoot.syncService} />;
    }

    return <WordsScreen service={compositionRoot.wordService} />;
  }, [compositionRoot, route]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa", padding: 16 }}>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
        <RnwSurfaceCard>
          <RnwPageHeader title="LexiMemory Mobile" />
          <Text>Phase D prototype: words / study / sync use-cases on Expo.</Text>
          <View style={{ display: "flex", flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <TabButton label="Words" active={route === "words"} onPress={() => setRoute("words")} />
            <TabButton label="Study" active={route === "study"} onPress={() => setRoute("study")} />
            <TabButton label="Sync" active={route === "sync"} onPress={() => setRoute("sync")} />
          </View>
          {routeContent}
        </RnwSurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: active ? "#0d6efd" : "#adb5bd",
        backgroundColor: active ? "#e7f1ff" : "#fff",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
      }}
    >
      <Text style={{ fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}
