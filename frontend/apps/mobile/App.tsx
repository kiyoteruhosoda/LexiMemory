import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import { RnwPageHeader, RnwSurfaceCard } from "../../packages/ui/src";
import { createUnimplementedStoragePort } from "../../packages/core/src/storage";

export default function App() {
  const storagePort = useMemo(() => createUnimplementedStoragePort(), []);
  const [statusMessage, setStatusMessage] = useState("Bootstrapping mobile app...");

  useEffect(() => {
    void (async () => {
      try {
        await storagePort.keys();
        setStatusMessage("Storage port is available.");
      } catch {
        setStatusMessage("Storage port is connected. Provide runtime adapter in composition root.");
      }
    })();
  }, [storagePort]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa", padding: 16 }}>
      <RnwSurfaceCard>
        <RnwPageHeader title="LexiMemory Mobile" />
        <View style={{ display: "flex", gap: 8 }}>
          <Text>Expo scaffold is now runnable.</Text>
          <Text>{statusMessage}</Text>
        </View>
      </RnwSurfaceCard>
    </SafeAreaView>
  );
}
